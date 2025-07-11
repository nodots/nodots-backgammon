const fetch = require('node-fetch')
const fs = require('fs').promises
const crypto = require('crypto')

const API_BASE = 'https://localhost:3443/api/v3.2'

// Helper function to make API calls with retry logic
async function apiCall(
  method,
  endpoint,
  body = null,
  retries = 3,
  gameId = null
) {
  const url = `${API_BASE}${endpoint}`
  const https = require('https')
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    agent: new https.Agent({
      rejectUnauthorized: false, // Ignore SSL certificate errors for development
    }),
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options)
      const data = await response.json()

      if (!response.ok) {
        console.error(`API Error (${response.status}):`, data)

        // CRITICAL: Stop immediately on 400 errors and report the problem
        if (response.status === 400) {
          console.error('\n🚨 400 BAD REQUEST ERROR DETECTED 🚨')
          console.error('='.repeat(50))
          console.error(`Endpoint: ${method} ${endpoint}`)
          console.error(
            'Request Body:',
            body ? JSON.stringify(body, null, 2) : 'None'
          )
          console.error('Response Status:', response.status)
          console.error('Response Body:', JSON.stringify(data, null, 2))
          console.error('='.repeat(50))

          // NEW: If we have a gameId, fetch the current game state and show board
          if (gameId) {
            try {
              console.error('\n🔍 FETCHING GAME STATE FOR DEBUGGING...')
              const debugResponse = await fetch(`${API_BASE}/games/${gameId}`, {
                agent: new https.Agent({
                  rejectUnauthorized: false,
                }),
              })
              const debugGame = await debugResponse.json()

              console.error('\n📋 CURRENT GAME STATE CAUSING 400 ERROR:')
              console.error('='.repeat(60))
              console.error(`Game ID: ${gameId}`)
              console.error(`State Kind: ${debugGame.stateKind}`)
              console.error(`Active Color: ${debugGame.activeColor}`)
              console.error(
                `Active Player: ${JSON.stringify(
                  debugGame.activePlayer,
                  null,
                  2
                )}`
              )

              if (debugGame.activePlay) {
                console.error(
                  `Active Play State: ${debugGame.activePlay.stateKind}`
                )
                if (debugGame.activePlay.moves) {
                  const movesArray = Array.isArray(debugGame.activePlay.moves)
                    ? debugGame.activePlay.moves
                    : Array.from(debugGame.activePlay.moves)
                  console.error(`Active Play Moves: ${movesArray.length}`)
                  movesArray.forEach((move, idx) => {
                    console.error(
                      `  Move ${idx}: ${move.stateKind}, die: ${move.dieValue}`
                    )
                  })
                }
              }

              console.error('\n📋 CURRENT BOARD STATE:')
              console.error(getAsciiBoard(debugGame))
              console.error('='.repeat(60))
            } catch (debugError) {
              console.error(
                '❌ Could not fetch game state for debugging:',
                debugError.message
              )
            }
          }

          console.error('\n🛑 STOPPING SIMULATION DUE TO 400 ERROR')
          console.error('='.repeat(50))

          // Don't retry on 400 errors - throw immediately
          throw new Error(
            `400 BAD REQUEST - SIMULATION STOPPED: ${
              data.message || data.error || 'Unknown error'
            }`
          )
        }

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
    const { Board } = require('../nodots-backgammon-core/dist/Board/index.js')
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

// Enhanced robot turn handler with detailed board logging after every move
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
  const maxConsecutiveEmptyMoves = 3 // Safety limit for no-move situations

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
        `/games/${gameId}/possible-moves`,
        null,
        3,
        gameId
      )

      if (
        !possibleMovesResponse.possibleMoves ||
        possibleMovesResponse.possibleMoves.length === 0
      ) {
        consecutiveEmptyMoves++
        log(`❌ No possible moves available (attempt ${consecutiveEmptyMoves})`)

        if (consecutiveEmptyMoves >= maxConsecutiveEmptyMoves) {
          log(
            `🔧 BUG WORKAROUND: Game stuck in ${workingGame.stateKind} state with no moves`
          )
          log(`   This indicates the activePlay bug - forcing turn completion`)

          // WORKAROUND: Since there's no end-turn endpoint, we'll try to force a state transition
          try {
            const currentGameState = await apiCall(
              'GET',
              `/games/${gameId}`,
              null,
              3,
              gameId
            )
            if (currentGameState.stateKind !== workingGame.stateKind) {
              log(
                `✅ Game state changed externally: ${currentGameState.stateKind}`
              )
              workingGame = currentGameState
              break
            }
          } catch (error) {
            log(`❌ Could not fetch current game state: ${error.message}`)
          }

          log(
            `⚠️  SAFETY BREAK: Preventing infinite loop due to activePlay bug`
          )
          log(`   Game ID: ${gameId}`)
          log(`   Current state: ${workingGame.stateKind}`)
          log(`   This game may need manual intervention`)
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

      // Log first few moves for debugging
      const sampleMoves = possibleMovesResponse.possibleMoves.slice(
        0,
        Math.min(3, possibleMovesResponse.possibleMoves.length)
      )
      sampleMoves.forEach((move, idx) => {
        const from = move.origin?.position?.clockwise || 'bar'
        const to = move.destination?.position?.clockwise || 'off'
        log(`   Option ${idx + 1}: die ${move.dieValue}, ${from} → ${to}`)
      })

      // Robot strategy: Select first available move
      const selectedMove = possibleMovesResponse.possibleMoves[0]

      // CRITICAL FIX: Use the exact checker that can make this move
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

      // Execute the move with the correct checker
      const moveResponse = await apiCall(
        'POST',
        `/games/${gameId}/move`,
        {
          checkerId: correctChecker.id,
        },
        3,
        gameId
      )

      // Handle move response
      if (moveResponse.possibleMoves && moveResponse.possibleMoves.length > 0) {
        log(`⚠️  Multiple moves returned - this shouldn't happen for robots`)
        log(
          `   Robot should auto-execute moves, but got ${moveResponse.possibleMoves.length} options`
        )
        log(`   This indicates the activePlay bug in robot move execution`)

        // BUG DETECTED: This is the activePlay bug where robots get multiple moves
        log(
          `🐛 ACTIVEPLAY BUG DETECTED: Robot got multiple moves instead of auto-execution`
        )
        log(`   This will cause infinite loops in robot simulation`)
        log(`   Game ID: ${gameId}`)

        // Force break to prevent infinite loop
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

        // Check if turn is complete (switched to next player)
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

// Main simulation function with enhanced board logging
async function simulateCompleteGame() {
  let logContent = ''
  let gameId = ''
  let robot1Name = ''
  let robot2Name = ''
  let currentGame = null
  let turnNumber = 0

  function log(message) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    const logLine = `[${timestamp}] ${message}`
    console.log(logLine)
    logContent += logLine + '\n'
  }

  try {
    log('🎮 ENHANCED ROBOT BACKGAMMON SIMULATION')
    log('=====================================')
    log('   📋 Board states will be shown after every move')
    log('   🎯 Visual game progression included')
    log('=====================================')

    // Create fresh robot users for this simulation
    log('🤖 Creating robot players...')
    const {
      robot1Id,
      robot2Id,
      robot1Name: r1Name,
      robot2Name: r2Name,
    } = await createRobotUsers()
    robot1Name = r1Name
    robot2Name = r2Name

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
    log(`   Players: ${game.players.length}`)

    game.players.forEach((player, idx) => {
      log(
        `   Player ${idx + 1}: ${player.color} (${player.direction}) - Robot: ${
          player.isRobot
        }`
      )
    })

    // Display initial board
    log('\n📋 INITIAL BOARD STATE')
    log('═══════════════════════')
    log(getAsciiBoard(game))
    log('═══════════════════════')

    // Initialize game state
    currentGame = game
    turnNumber = 0
    const maxTurns = 100 // Reduced for better logging
    const gameStartTime = Date.now()

    // GAME LOOP
    log('\n🎯 STARTING ENHANCED GAME LOOP')
    log('=============================')

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
              `/games/${gameId}/roll-for-start`,
              null,
              3,
              gameId
            )
            log(`   Result: ${currentGame.stateKind}`)

            // Show board after roll-for-start
            log('\n📋 BOARD AFTER ROLL-FOR-START')
            log('════════════════════════════')
            log(getAsciiBoard(currentGame))
            log('════════════════════════════')
            break

          case 'rolled-for-start':
            log('   Action: Rolling dice to begin...')
            currentGame = await apiCall(
              'POST',
              `/games/${gameId}/roll`,
              null,
              3,
              gameId
            )
            log(`   Result: ${currentGame.stateKind}`)

            const activePlayer = currentGame.players.find(
              (p) => p.color === currentGame.activeColor
            )
            if (activePlayer?.dice?.currentRoll) {
              log(
                `   Dice rolled: [${activePlayer.dice.currentRoll.join(', ')}]`
              )
            }

            // Show board after first dice roll
            log('\n📋 BOARD AFTER FIRST ROLL')
            log('═════════════════════════')
            log(getAsciiBoard(currentGame))
            log('═════════════════════════')
            break

          case 'rolling':
            log('   Action: Rolling dice...')
            currentGame = await apiCall(
              'POST',
              `/games/${gameId}/roll`,
              null,
              3,
              gameId
            )
            log(`   Result: ${currentGame.stateKind}`)

            const rollingPlayer = currentGame.players.find(
              (p) => p.color === currentGame.activeColor
            )
            if (rollingPlayer?.dice?.currentRoll) {
              log(
                `   Dice rolled: [${rollingPlayer.dice.currentRoll.join(', ')}]`
              )
            }

            // Show board after dice roll (though it shouldn't change)
            log('\n📋 BOARD AFTER DICE ROLL')
            log('════════════════════════')
            log(getAsciiBoard(currentGame))
            log('════════════════════════')
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
        log(`   Error details: ${error.stack}`)
        break
      }
    }

    // Game completion summary
    const gameEndTime = Date.now()
    const totalDuration = gameEndTime - gameStartTime

    log('\n🏁 ENHANCED GAME SIMULATION COMPLETE')
    log('===================================')

    if (currentGame.stateKind === 'completed') {
      log(`🏆 WINNER: ${currentGame.winner?.color}`)
      log(`   Winner ID: ${currentGame.winner?.id}`)
      log(`   Game completed in ${turnNumber} turns`)
      log(`   Total duration: ${(totalDuration / 1000).toFixed(2)} seconds`)

      // Final board state
      log('\n📋 FINAL BOARD STATE')
      log('════════════════════')
      log(getAsciiBoard(currentGame))
      log('════════════════════')
    } else {
      log(`⚠️  Game ended without completion after ${turnNumber} turns`)
      log(`   Final state: ${currentGame.stateKind}`)
      log(`   Max turns limit: ${maxTurns}`)
      log(`   This may indicate a bug or infinite loop`)
    }

    // Game statistics
    log('\n📊 GAME STATISTICS')
    log('==================')
    log(`   Game ID: ${gameId}`)
    log(`   Robot 1: ${robot1Name} (${robot1Id})`)
    log(`   Robot 2: ${robot2Name} (${robot2Id})`)
    log(`   Total turns: ${turnNumber}`)
    log(`   Duration: ${(totalDuration / 1000).toFixed(2)} seconds`)
    log(`   Avg time per turn: ${(totalDuration / turnNumber).toFixed(0)}ms`)
    log(`   Final state: ${currentGame.stateKind}`)
    if (currentGame.winner) {
      log(`   Winner: ${currentGame.winner.color}`)
    }
  } catch (error) {
    log(`\n💥 SIMULATION FAILED: ${error.message}`)
    log(`   Error details: ${error.stack}`)
    log(`   Game ID: ${gameId || 'unknown'}`)
  }

  // Write detailed log to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  const timeStr = new Date()
    .toISOString()
    .split('T')[1]
    .split('.')[0]
    .replace(/:/g, '-')
  const filename = `enhanced-game-${
    gameId || 'failed'
  }-${timestamp}-${timeStr}.txt`

  try {
    await fs.writeFile(filename, logContent)
    console.log(`\n📝 Enhanced game log saved to: ${filename}`)
    console.log(`   Log size: ${logContent.length} characters`)
    console.log(`   Game ID: ${gameId}`)
    console.log(`   📋 Contains board state after every move`)

    return {
      gameId,
      filename,
      success: currentGame?.stateKind === 'completed',
      winner: currentGame?.winner?.color,
      turns: turnNumber,
      logFile: filename,
    }
  } catch (error) {
    console.error('❌ Error writing log file:', error)
    return {
      gameId,
      filename: null,
      success: false,
      error: error.message,
    }
  }
}

// Check if running directly
if (require.main === module) {
  console.log('🚀 Starting Complete Robot Backgammon Simulation...')

  simulateCompleteGame()
    .then((result) => {
      console.log('\n🎉 Simulation completed!')
      console.log(`   Success: ${result.success}`)
      console.log(`   Game ID: ${result.gameId}`)
      console.log(`   Log file: ${result.logFile}`)
      if (result.winner) {
        console.log(`   Winner: ${result.winner}`)
      }
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Simulation failed:', error)
      process.exit(1)
    })
}

module.exports = { simulateCompleteGame }
