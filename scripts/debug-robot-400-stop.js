const fetch = require('node-fetch')
const fs = require('fs').promises
const crypto = require('crypto')

const API_BASE = 'http://localhost:3000/api/v1'

// Helper function to make API calls with 400 error detection
async function apiCall(method, endpoint, body = null, retries = 3) {
  const url = `${API_BASE}${endpoint}`
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options)
      const data = await response.json()

      // 🚨 STOP ON 400 ERROR
      if (response.status === 400) {
        console.error(`🛑 400 ERROR DETECTED! Stopping simulation immediately.`)
        console.error(`   Endpoint: ${method} ${endpoint}`)
        console.error(`   Request body:`, JSON.stringify(body, null, 2))
        console.error(`   Response:`, JSON.stringify(data, null, 2))
        console.error(`   Status: ${response.status}`)
        process.exit(1)
      }

      if (!response.ok) {
        console.error(`API Error (${response.status}):`, data)
        if (attempt === retries) {
          throw new Error(
            `API call failed: ${method} ${endpoint} - ${response.status}`
          )
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
        continue
      }

      return data
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      console.log(`API call attempt ${attempt} failed, retrying...`)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }
}

// Helper function to create robot users with unique IDs
async function createRobotUsers() {
  const timestamp = Date.now()
  const randomId1 = crypto.randomBytes(4).toString('hex')
  const randomId2 = crypto.randomBytes(4).toString('hex')

  try {
    const robot1 = await apiCall('POST', '/users', {
      source: 'system',
      externalId: `robot-sim-${randomId1}-${timestamp}`,
      email: `robot-sim-${randomId1}@nodots.com`,
      given_name: 'Robot',
      family_name: `Player ${randomId1}`,
      userType: 'robot',
      locale: 'en-US',
    })

    const robot2 = await apiCall('POST', '/users', {
      source: 'system',
      externalId: `robot-sim-${randomId2}-${timestamp}`,
      email: `robot-sim-${randomId2}@nodots.com`,
      given_name: 'Robot',
      family_name: `Player ${randomId2}`,
      userType: 'robot',
      locale: 'en-US',
    })

    return {
      robot1Id: robot1.id,
      robot2Id: robot2.id,
      robot1Name: `Robot ${randomId1}`,
      robot2Name: `Robot ${randomId2}`,
    }
  } catch (error) {
    console.error('Error creating robot users:', error)
    throw error
  }
}

// Helper function to get ASCII board representation
function getAsciiBoard(game) {
  try {
    const { Board } = require('./nodots-backgammon-core/dist/Board/index.js')
    return Board.getAsciiGameBoard(
      game.board,
      game.players,
      game.activeColor,
      game.stateKind
    )
  } catch (error) {
    console.error('Error getting ASCII board:', error)
    return `Game State: ${game.stateKind}\nActive Player: ${game.activeColor}\nBoard data available but ASCII conversion failed\n`
  }
}

// Robot turn handler that stops on 400 errors
async function executeRobotTurn(gameId, currentGame, log) {
  let workingGame = { ...currentGame }
  let moveCount = 0
  const startTime = Date.now()

  const activePlayer = workingGame.players.find(
    (p) => p.color === workingGame.activeColor
  )
  const diceRoll = activePlayer?.dice?.currentRoll || []
  const isDoubles = diceRoll.length >= 2 && diceRoll[0] === diceRoll[1]
  const expectedMoves = isDoubles ? 4 : 2

  log(`🤖 ROBOT TURN START`)
  log(`   Player: ${activePlayer?.id} (${workingGame.activeColor})`)
  log(`   Dice: [${diceRoll.join(', ')}] ${isDoubles ? '(DOUBLES!)' : ''}`)
  log(`   Expected moves: ${expectedMoves}`)
  log(`   Initial state: ${workingGame.stateKind}`)

  // Show board state before any moves
  log(`\n📋 BOARD BEFORE ROBOT TURN`)
  log(`═══════════════════════════`)
  log(getAsciiBoard(workingGame))
  log(`═══════════════════════════`)

  let consecutiveEmptyMoves = 0
  const maxConsecutiveEmptyMoves = 3

  // Continue making moves until the turn is complete
  while (
    workingGame.stateKind === 'rolled' ||
    workingGame.stateKind === 'moving'
  ) {
    try {
      log(`\n🎯 MOVE ${moveCount + 1} ATTEMPT`)
      log(`   Current game state: ${workingGame.stateKind}`)
      log(`   Active player: ${workingGame.activeColor}`)

      // Get current possible moves
      const possibleMovesResponse = await apiCall(
        'GET',
        `/games/${gameId}/possible-moves`
      )

      if (
        !possibleMovesResponse.possibleMoves ||
        possibleMovesResponse.possibleMoves.length === 0
      ) {
        consecutiveEmptyMoves++
        log(`❌ No possible moves available (attempt ${consecutiveEmptyMoves})`)

        if (consecutiveEmptyMoves >= maxConsecutiveEmptyMoves) {
          log(
            `⚠️  SAFETY BREAK: Game stuck in ${workingGame.stateKind} state with no moves`
          )
          break
        }

        // Small delay before retrying
        await new Promise((resolve) => setTimeout(resolve, 500))
        continue
      }

      // Reset consecutive empty moves counter
      consecutiveEmptyMoves = 0

      log(
        `✅ Found ${possibleMovesResponse.possibleMoves.length} possible moves`
      )

      // Log all possible moves for debugging
      possibleMovesResponse.possibleMoves.forEach((move, idx) => {
        const from = move.origin?.position?.clockwise || 'bar'
        const to = move.destination?.position?.clockwise || 'off'
        const checkerCount = move.origin?.checkers?.length || 0
        log(
          `   Option ${idx + 1}: die ${
            move.dieValue
          }, ${from} → ${to} (${checkerCount} checkers available)`
        )
      })

      // Robot strategy: Select first available move
      const selectedMove = possibleMovesResponse.possibleMoves[0]

      // Find a checker of the correct color in the origin container
      const correctChecker = selectedMove.origin.checkers.find(
        (checker) => checker.color === workingGame.activeColor
      )

      if (!correctChecker) {
        log(`❌ No valid checker found for selected move`)
        log(`   Origin: ${selectedMove.origin.position?.clockwise || 'bar'}`)
        log(`   Available checkers: ${selectedMove.origin.checkers.length}`)
        log(`   Active color: ${workingGame.activeColor}`)
        break
      }

      log(`🎯 ROBOT SELECTS MOVE ${moveCount + 1}:`)
      log(`   Die: ${selectedMove.dieValue}`)
      log(`   From: point ${selectedMove.origin.position?.clockwise || 'bar'}`)
      log(
        `   To: point ${selectedMove.destination.position?.clockwise || 'off'}`
      )
      log(`   Checker ID: ${correctChecker.id}`)
      log(`   Checker color: ${correctChecker.color}`)

      // 🚨 This is where 400 errors typically occur - the apiCall will stop the program
      log(`🔍 ATTEMPTING MOVE API CALL...`)
      const moveResponse = await apiCall('POST', `/games/${gameId}/move`, {
        checkerId: correctChecker.id,
      })

      // If we get here, the move was successful
      log(`✅ MOVE API CALL SUCCESSFUL`)

      // Handle move response
      if (moveResponse.possibleMoves && moveResponse.possibleMoves.length > 0) {
        log(`⚠️  Multiple moves returned - this shouldn't happen for robots`)
        break
      } else if (moveResponse.id || moveResponse.stateKind) {
        // Successful single move
        workingGame = moveResponse
        moveCount++
        log(`✅ MOVE ${moveCount} COMPLETED SUCCESSFULLY`)
        log(`   New game state: ${workingGame.stateKind}`)
        log(`   Active player: ${workingGame.activeColor}`)

        // Show board state after this move
        log(`\n📋 BOARD AFTER MOVE ${moveCount}`)
        log(`════════════════════════════`)
        log(getAsciiBoard(workingGame))
        log(`════════════════════════════`)

        // Check if game is completed
        if (workingGame.stateKind === 'completed') {
          log(`🏆 GAME COMPLETED! Winner: ${workingGame.winner?.color}`)
          break
        }

        // Check if turn is complete
        if (
          workingGame.stateKind === 'rolling' ||
          workingGame.activeColor !== activePlayer.color
        ) {
          log(`🔄 TURN COMPLETED - switching to next player`)
          break
        }
      } else {
        log(`❌ MOVE FAILED: ${moveResponse.error || 'Unknown error'}`)
        log(`   Response: ${JSON.stringify(moveResponse, null, 2)}`)
        break
      }

      // Safety check - prevent infinite loops
      if (moveCount >= 6) {
        log(`⚠️  SAFETY BREAK: Too many moves in one turn (${moveCount})`)
        break
      }

      // Small delay between moves
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      log(`❌ ERROR during move ${moveCount + 1}: ${error.message}`)
      break
    }
  }

  const endTime = Date.now()
  const duration = endTime - startTime

  log(`\n🤖 ROBOT TURN COMPLETE`)
  log(`   Moves completed: ${moveCount}/${expectedMoves}`)
  log(`   Final state: ${workingGame.stateKind}`)
  log(`   Duration: ${duration}ms`)
  log(`   Next player: ${workingGame.activeColor}`)

  return workingGame
}

// Main simulation function with 400 error detection
async function simulateRobotGame() {
  let logContent = ''
  let gameId = ''
  let currentGame = null
  let turnNumber = 0

  function log(message) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    const logLine = `[${timestamp}] ${message}`
    console.log(logLine)
    logContent += logLine + '\n'
  }

  try {
    log('🚨 ROBOT SIMULATION WITH 400 ERROR DETECTION')
    log('===========================================')
    log('   Will STOP immediately on first 400 error')
    log('===========================================')

    // Create fresh robot users
    log('🤖 Creating robot players...')
    const { robot1Id, robot2Id, robot1Name, robot2Name } =
      await createRobotUsers()

    log(`✅ Created robot players:`)
    log(`   Robot 1: ${robot1Id} (${robot1Name})`)
    log(`   Robot 2: ${robot2Id} (${robot2Name})`)

    // Create new game
    log('\n🎲 Creating new game...')
    const game = await apiCall('POST', '/games', {
      player1: { userId: robot1Id },
      player2: { userId: robot2Id },
    })

    gameId = game.id
    log(`✅ Game created: ${gameId}`)
    log(`   Initial state: ${game.stateKind}`)

    // Display initial board
    log('\n📋 INITIAL BOARD STATE')
    log('═══════════════════════')
    log(getAsciiBoard(game))
    log('═══════════════════════')

    // Initialize game state
    currentGame = game
    turnNumber = 0
    const maxTurns = 20 // Reduced for easier debugging

    // GAME LOOP
    log('\n🎯 STARTING GAME LOOP WITH 400 DETECTION')
    log('========================================')

    while (currentGame.stateKind !== 'completed' && turnNumber < maxTurns) {
      turnNumber++

      log(`\n🎯 TURN ${turnNumber}`)
      log(`   Current state: ${currentGame.stateKind}`)
      log(`   Active player: ${currentGame.activeColor}`)

      try {
        // Handle different game states
        switch (currentGame.stateKind) {
          case 'new':
            log('   Action: Rolling for start...')
            currentGame = await apiCall(
              'POST',
              `/games/${gameId}/roll-for-start`
            )
            log(`   Result: ${currentGame.stateKind}`)
            break

          case 'rolled-for-start':
            log('   Action: Rolling dice to begin...')
            currentGame = await apiCall('POST', `/games/${gameId}/roll`)
            log(`   Result: ${currentGame.stateKind}`)

            const activePlayer = currentGame.players.find(
              (p) => p.color === currentGame.activeColor
            )
            if (activePlayer?.dice?.currentRoll) {
              log(
                `   Dice rolled: [${activePlayer.dice.currentRoll.join(', ')}]`
              )
            }
            break

          case 'rolling':
            log('   Action: Rolling dice...')
            currentGame = await apiCall('POST', `/games/${gameId}/roll`)
            log(`   Result: ${currentGame.stateKind}`)

            const rollingPlayer = currentGame.players.find(
              (p) => p.color === currentGame.activeColor
            )
            if (rollingPlayer?.dice?.currentRoll) {
              log(
                `   Dice rolled: [${rollingPlayer.dice.currentRoll.join(', ')}]`
              )
            }
            break

          case 'rolled':
          case 'moving':
            log('   Action: Executing robot moves...')
            currentGame = await executeRobotTurn(gameId, currentGame, log)
            break

          default:
            log(`   ❌ UNEXPECTED STATE: ${currentGame.stateKind}`)
            throw new Error(`Unexpected game state: ${currentGame.stateKind}`)
        }

        // Small delay between turns
        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (error) {
        log(`❌ ERROR in turn ${turnNumber}: ${error.message}`)
        log(`   Current state: ${currentGame.stateKind}`)
        break
      }
    }

    log('\n🏁 SIMULATION COMPLETE')
    log('====================')

    if (currentGame.stateKind === 'completed') {
      log(`🏆 WINNER: ${currentGame.winner?.color}`)
      log(`   Game completed in ${turnNumber} turns`)
    } else {
      log(`⚠️  Game ended without completion after ${turnNumber} turns`)
      log(`   Final state: ${currentGame.stateKind}`)
    }

    // Save detailed log
    await fs.writeFile('robot-400-debug.log', logContent)
    log(`📝 Detailed log saved to: robot-400-debug.log`)
  } catch (error) {
    log(`💥 FATAL ERROR: ${error.message}`)
    log(`   Stack: ${error.stack}`)

    // Save error log
    await fs.writeFile('robot-400-debug.log', logContent)
    log(`📝 Error log saved to: robot-400-debug.log`)

    process.exit(1)
  }
}

// Run the simulation
if (require.main === module) {
  console.log('🚀 Starting Robot Simulation with 400 Error Detection...')
  simulateRobotGame()
    .then(() => {
      console.log('✅ Simulation completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Simulation failed:', error.message)
      process.exit(1)
    })
}

module.exports = { simulateRobotGame }
