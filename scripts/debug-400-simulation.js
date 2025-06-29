const fetch = require('node-fetch')
const crypto = require('crypto')

const API_BASE = 'http://localhost:3000/api/v1'

// Helper function to make API calls with 400 monitoring
async function apiCall(method, endpoint, body = null, currentGame = null) {
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

  console.log(`🔄 API CALL: ${method} ${endpoint}`)
  if (body) {
    console.log(`   Body: ${JSON.stringify(body, null, 2)}`)
  }

  try {
    const response = await fetch(url, options)
    const data = await response.json()

    console.log(`📊 RESPONSE: ${response.status}`)

    if (response.status === 400) {
      console.log('\n🚨 400 ERROR DETECTED!')
      console.log('===================')
      console.log(`Endpoint: ${method} ${endpoint}`)
      console.log(
        `Request body: ${body ? JSON.stringify(body, null, 2) : 'None'}`
      )
      console.log(`Error response: ${JSON.stringify(data, null, 2)}`)

      if (currentGame) {
        console.log('\n📋 CURRENT GAME STATE BEFORE 400 ERROR:')
        console.log('=========================================')
        console.log(`Game ID: ${currentGame.id}`)
        console.log(`State: ${currentGame.stateKind}`)
        console.log(`Active Color: ${currentGame.activeColor}`)

        if (currentGame.activePlay) {
          console.log('\n🎯 ACTIVE PLAY STATE:')
          console.log(`   Play ID: ${currentGame.activePlay.id}`)
          console.log(`   Play State: ${currentGame.activePlay.stateKind}`)

          if (currentGame.activePlay.moves) {
            const movesArray = Array.isArray(currentGame.activePlay.moves)
              ? currentGame.activePlay.moves
              : Array.from(currentGame.activePlay.moves)
            console.log(`   Moves Count: ${movesArray.length}`)
            movesArray.forEach((move, idx) => {
              console.log(
                `   Move ${idx + 1}: die ${move.dieValue}, state ${
                  move.stateKind
                }, kind ${move.moveKind}`
              )
            })
          }
        }

        // Display ASCII board
        console.log('\n📋 ASCII BOARD STATE:')
        console.log('====================')
        try {
          const {
            Board,
          } = require('./nodots-backgammon-core/dist/Board/index.js')
          const asciiBoard = Board.getAsciiGameBoard(
            currentGame.board,
            currentGame.players,
            currentGame.activeColor,
            currentGame.stateKind
          )
          console.log(asciiBoard)
        } catch (error) {
          console.log('❌ Could not generate ASCII board:', error.message)
          console.log('\n📊 RAW BOARD DATA:')
          console.log(JSON.stringify(currentGame.board, null, 2))
        }
      }

      console.log('\n💥 EXITING ON 400 ERROR AS REQUESTED')
      process.exit(1)
    }

    if (!response.ok) {
      console.error(`❌ API Error (${response.status}):`, data)
      throw new Error(
        `API call failed: ${method} ${endpoint} - ${response.status}`
      )
    }

    return data
  } catch (error) {
    console.error(`💥 API call exception:`, error.message)
    throw error
  }
}

// Helper function to create robot users
async function createRobotUsers() {
  const timestamp = Date.now()
  const randomId1 = crypto.randomBytes(4).toString('hex')
  const randomId2 = crypto.randomBytes(4).toString('hex')

  console.log('🤖 Creating robot users...')

  const robot1 = await apiCall('POST', '/users', {
    source: 'system',
    externalId: `robot-debug-${randomId1}-${timestamp}`,
    email: `robot-debug-${randomId1}@nodots.com`,
    given_name: 'Debug Robot',
    family_name: `Player ${randomId1}`,
    userType: 'robot',
    locale: 'en-US',
  })

  const robot2 = await apiCall('POST', '/users', {
    source: 'system',
    externalId: `robot-debug-${randomId2}-${timestamp}`,
    email: `robot-debug-${randomId2}@nodots.com`,
    given_name: 'Debug Robot',
    family_name: `Player ${randomId2}`,
    userType: 'robot',
    locale: 'en-US',
  })

  console.log(`✅ Created robot users:`)
  console.log(`   Robot 1: ${robot1.id}`)
  console.log(`   Robot 2: ${robot2.id}`)

  return {
    robot1Id: robot1.id,
    robot2Id: robot2.id,
  }
}

// Enhanced robot turn handler
async function executeRobotTurn(gameId, currentGame) {
  let workingGame = { ...currentGame }
  let moveCount = 0

  const activePlayer = workingGame.players.find(
    (p) => p.color === workingGame.activeColor
  )
  const diceRoll = activePlayer?.dice?.currentRoll || []

  console.log(`🤖 ROBOT TURN START`)
  console.log(`   Player: ${activePlayer?.id} (${workingGame.activeColor})`)
  console.log(`   Dice: [${diceRoll.join(', ')}]`)
  console.log(`   State: ${workingGame.stateKind}`)

  // Continue making moves until the turn is complete
  while (
    workingGame.stateKind === 'rolled' ||
    workingGame.stateKind === 'moving'
  ) {
    console.log(`\n🎯 MOVE ${moveCount + 1} ATTEMPT`)

    // Get current possible moves
    const possibleMovesResponse = await apiCall(
      'GET',
      `/games/${gameId}/possible-moves`,
      null,
      workingGame
    )

    if (
      !possibleMovesResponse.possibleMoves ||
      possibleMovesResponse.possibleMoves.length === 0
    ) {
      console.log(`❌ No possible moves available`)
      break
    }

    console.log(
      `✅ Found ${possibleMovesResponse.possibleMoves.length} possible moves`
    )

    // Robot strategy: Select first available move
    const selectedMove = possibleMovesResponse.possibleMoves[0]
    const correctChecker = selectedMove.origin.checkers.find(
      (checker) => checker.color === workingGame.activeColor
    )

    if (!correctChecker) {
      console.log(`❌ No valid checker found for selected move`)
      break
    }

    console.log(`🎯 ROBOT SELECTS MOVE:`)
    console.log(`   Die: ${selectedMove.dieValue}`)
    console.log(
      `   From: point ${selectedMove.origin.position?.clockwise || 'bar'}`
    )
    console.log(
      `   To: point ${selectedMove.destination.position?.clockwise || 'off'}`
    )
    console.log(`   Checker ID: ${correctChecker.id}`)

    // Execute the move - THIS IS WHERE 400s OFTEN OCCUR
    const moveResponse = await apiCall(
      'POST',
      `/games/${gameId}/move`,
      {
        checkerId: correctChecker.id,
      },
      workingGame
    )

    // Handle move response
    if (moveResponse.possibleMoves && moveResponse.possibleMoves.length > 0) {
      console.log(`⚠️  Multiple moves returned - robot bug detected`)
      break
    } else if (moveResponse.id || moveResponse.stateKind) {
      // Successful single move
      workingGame = moveResponse
      moveCount++
      console.log(`✅ MOVE ${moveCount} COMPLETED`)
      console.log(`   New state: ${workingGame.stateKind}`)

      // Check if game is completed
      if (workingGame.stateKind === 'completed') {
        console.log(`🏆 GAME COMPLETED!`)
        break
      }

      // Check if turn is complete
      if (
        workingGame.stateKind === 'rolling' ||
        workingGame.activeColor !== activePlayer.color
      ) {
        console.log(`🔄 TURN COMPLETED`)
        break
      }
    } else {
      console.log(`❌ MOVE FAILED`)
      break
    }

    // Safety check
    if (moveCount >= 6) {
      console.log(`⚠️  SAFETY BREAK: Too many moves`)
      break
    }

    // Small delay between moves
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return workingGame
}

// Main simulation function
async function simulate400Debug() {
  let currentGame = null
  let turnNumber = 0

  try {
    console.log('🎮 400 ERROR DEBUG SIMULATION')
    console.log('=============================')
    console.log('Will exit on first 400 error and show ASCII board')
    console.log('=============================')

    // Wait for server to be ready
    console.log('⏳ Waiting for API server to be ready...')
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Create robot users
    const { robot1Id, robot2Id } = await createRobotUsers()

    // Create new game
    console.log('\n🎲 Creating new game...')
    const game = await apiCall('POST', '/games', {
      player1: { userId: robot1Id },
      player2: { userId: robot2Id },
    })

    console.log(`✅ Game created: ${game.id}`)
    currentGame = game
    turnNumber = 0

    // Game loop
    console.log('\n🎯 STARTING GAME LOOP')
    console.log('====================')

    while (currentGame.stateKind !== 'completed' && turnNumber < 50) {
      turnNumber++

      console.log(`\n🎯 TURN ${turnNumber}`)
      console.log(`   State: ${currentGame.stateKind}`)
      console.log(`   Active: ${currentGame.activeColor}`)

      // Handle different game states
      switch (currentGame.stateKind) {
        case 'new':
          console.log('   Action: Rolling for start...')
          currentGame = await apiCall(
            'POST',
            `/games/${currentGame.id}/roll-for-start`,
            null,
            currentGame
          )
          break

        case 'rolled-for-start':
          console.log('   Action: Rolling dice to begin...')
          currentGame = await apiCall(
            'POST',
            `/games/${currentGame.id}/roll`,
            null,
            currentGame
          )
          break

        case 'rolling':
          console.log('   Action: Rolling dice...')
          currentGame = await apiCall(
            'POST',
            `/games/${currentGame.id}/roll`,
            null,
            currentGame
          )
          break

        case 'rolled':
        case 'moving':
          console.log('   Action: Executing robot moves...')
          currentGame = await executeRobotTurn(currentGame.id, currentGame)
          break

        default:
          console.log(`   ❌ UNEXPECTED STATE: ${currentGame.stateKind}`)
          throw new Error(`Unexpected game state: ${currentGame.stateKind}`)
      }

      // Small delay between turns
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    console.log('\n🏁 SIMULATION COMPLETE')
    console.log('======================')
    if (currentGame.stateKind === 'completed') {
      console.log(`🏆 WINNER: ${currentGame.winner?.color}`)
    } else {
      console.log(`⚠️  Simulation ended without completion`)
    }
  } catch (error) {
    console.log(`\n💥 SIMULATION FAILED: ${error.message}`)
    if (currentGame) {
      console.log(`   Game ID: ${currentGame.id}`)
      console.log(`   Last state: ${currentGame.stateKind}`)
    }
  }
}

// Run the simulation
if (require.main === module) {
  console.log('🚀 Starting 400 Debug Simulation...')
  simulate400Debug()
    .then(() => {
      console.log('\n🎉 Simulation completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Simulation failed:', error)
      process.exit(1)
    })
}

module.exports = { simulate400Debug }
