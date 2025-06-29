const fetch = require('node-fetch')
const fs = require('fs').promises

const API_BASE = 'http://localhost:3000/api/v1'

// Helper function to make API calls
async function apiCall(method, endpoint, body = null) {
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

  const response = await fetch(url, options)
  const data = await response.json()

  if (!response.ok) {
    console.error(`API Error (${response.status}):`, data)
    throw new Error(`API call failed: ${method} ${endpoint}`)
  }

  return data
}

// Helper function to create or get robot users
async function ensureRobotUsers() {
  try {
    // Try to create robot users (they might already exist)
    const robot1 = await apiCall('POST', '/users', {
      source: 'system',
      externalId: 'robot-1',
      email: 'robot1@nodots.com',
      given_name: 'Robot',
      family_name: 'Player 1',
      userType: 'robot',
      locale: 'en-US',
    }).catch(() => null) // Ignore if already exists

    const robot2 = await apiCall('POST', '/users', {
      source: 'system',
      externalId: 'robot-2',
      email: 'robot2@nodots.com',
      given_name: 'Robot',
      family_name: 'Player 2',
      userType: 'robot',
      locale: 'en-US',
    }).catch(() => null) // Ignore if already exists

    return {
      robot1Id: robot1?.id || 'system|robot-1',
      robot2Id: robot2?.id || 'system|robot-2',
    }
  } catch (error) {
    console.error('Error creating robot users:', error)
    // Return IDs anyway, they might already exist
    return {
      robot1Id: 'system|robot-1',
      robot2Id: 'system|robot-2',
    }
  }
}

// Helper function to get ASCII board representation
function getAsciiBoard(game) {
  // Use the core library to get ASCII representation
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
    return `Game State: ${game.stateKind}\nBoard data available but ASCII conversion failed\n`
  }
}

// Handle robot making moves in their turn
async function handleRobotTurn(gameId, currentGame, log) {
  let workingGame = currentGame
  let movesInTurn = 0
  const maxMovesPerTurn = 4 // Max moves per turn (doubles)

  log(`🤖 Robot turn started: ${workingGame.activePlayer.color}`)
  log(`Initial dice: [${workingGame.activePlayer.dice.currentRoll}]`)
  log(`Initial state: ${workingGame.stateKind}`)

  // Keep making moves until no more moves are possible or turn is complete
  while (
    (workingGame.stateKind === 'rolled' ||
      workingGame.stateKind === 'moving') &&
    movesInTurn < maxMovesPerTurn
  ) {
    try {
      if (workingGame.stateKind === 'rolled') {
        // Get possible moves for current dice state
        const possibleMovesResponse = await apiCall(
          'GET',
          `/games/${gameId}/possible-moves`
        )

        if (
          !possibleMovesResponse.possibleMoves ||
          possibleMovesResponse.possibleMoves.length === 0
        ) {
          log(`No possible moves available, ending turn`)
          break
        }

        // Select first available move (robot strategy)
        const firstMove = possibleMovesResponse.possibleMoves[0]

        log(
          `🎯 Robot selecting move: die ${firstMove.dieValue}, from point ${firstMove.origin.position.clockwise} to point ${firstMove.destination.position.clockwise}`
        )

        // Execute the move - get the top checker from the origin
        const topChecker =
          firstMove.origin.checkers[firstMove.origin.checkers.length - 1]
        const moveResponse = await apiCall('POST', `/games/${gameId}/move`, {
          checkerId: topChecker.id,
        })

        if (moveResponse.success) {
          workingGame = moveResponse.game
          movesInTurn++
          log(
            `✅ Move ${movesInTurn} completed, new state: ${workingGame.stateKind}`
          )

          // If game is completed, break
          if (workingGame.stateKind === 'completed') {
            log(`🏆 Game completed! Winner: ${workingGame.winner?.color}`)
            break
          }

          // If turn is complete (moved to next player), break
          if (
            workingGame.stateKind === 'rolling' ||
            workingGame.stateKind === 'rolled-for-start'
          ) {
            log(`🔄 Turn completed, switching to next player`)
            break
          }
        } else {
          log(`❌ Move failed: ${moveResponse.error}`)
          break
        }
      } else if (workingGame.stateKind === 'moving') {
        // This shouldn't happen with the new API, but handle it gracefully
        log(`⚠️  Game in moving state, getting fresh game state`)
        const freshGame = await apiCall('GET', `/games/${gameId}`)
        if (freshGame.success) {
          workingGame = freshGame.game
        } else {
          log(`❌ Failed to get fresh game state`)
          break
        }
      } else {
        log(`Unexpected game state: ${workingGame.stateKind}`)
        break
      }
    } catch (error) {
      log(`❌ Error during robot turn: ${error.message}`)
      break
    }
  }

  log(
    `🤖 Robot turn ended after ${movesInTurn} moves, final state: ${workingGame.stateKind}`
  )
  return workingGame
}

// Main simulation function
async function simulateGame() {
  let logContent = ''
  let gameId = ''

  function log(message) {
    console.log(message)
    logContent += message + '\n'
  }

  try {
    log('=== Starting Fixed Robot Game Simulation ===\n')

    // Ensure robot users exist
    log('Creating robot users...')
    const { robot1Id, robot2Id } = await ensureRobotUsers()
    log(`Robot users: ${robot1Id} vs ${robot2Id}\n`)

    // Create a new game
    log('Creating new game...')
    const game = await apiCall('POST', '/games', {
      player1: { userId: robot1Id },
      player2: { userId: robot2Id },
    })

    gameId = game.id
    log(`Game created with ID: ${gameId}`)
    log(`Initial state: ${game.stateKind}\n`)

    // Add initial board state
    log('=== INITIAL BOARD ===')
    log(getAsciiBoard(game))
    log('=====================\n')

    let currentGame = game
    let turnCount = 0
    const maxTurns = 50 // Reasonable limit for testing

    // Game loop
    while (currentGame.stateKind !== 'completed' && turnCount < maxTurns) {
      turnCount++
      log(`\n=== TURN ${turnCount} ===`)
      log(`Current state: ${currentGame.stateKind}`)

      if (currentGame.activeColor) {
        const activePlayer = currentGame.players.find(
          (p) => p.color === currentGame.activeColor
        )
        log(
          `Active player: ${activePlayer?.id || 'unknown'} (${
            currentGame.activeColor
          })`
        )
      }

      try {
        if (currentGame.stateKind === 'new') {
          // Roll for start
          log('Rolling for start...')
          currentGame = await apiCall('POST', `/games/${gameId}/roll-for-start`)
          log(`After roll for start: ${currentGame.stateKind}`)
        } else if (
          currentGame.stateKind === 'rolled-for-start' ||
          currentGame.stateKind === 'moved'
        ) {
          // Roll dice
          log('Rolling dice...')
          currentGame = await apiCall('POST', `/games/${gameId}/roll`)
          log(`After roll: ${currentGame.stateKind}`)

          if (currentGame.activeColor) {
            const activePlayer = currentGame.players.find(
              (p) => p.color === currentGame.activeColor
            )
            if (activePlayer?.dice?.currentRoll) {
              log(`Dice rolled: [${activePlayer.dice.currentRoll.join(', ')}]`)
            }
          }
        } else if (currentGame.stateKind === 'rolled') {
          // Handle robot turn with multiple moves
          currentGame = await handleRobotTurn(gameId, currentGame, log)
        } else if (currentGame.stateKind === 'moving') {
          // Continue robot turn if still in moving state (more moves to make)
          log('Continuing robot turn in moving state...')
          currentGame = await handleRobotTurn(gameId, currentGame, log)
        } else {
          log(`Unexpected game state: ${currentGame.stateKind}`)
          break
        }

        // Show board after each turn
        log('\n=== BOARD STATE AFTER TURN ===')
        log(getAsciiBoard(currentGame))
        log('===============================\n')

        // Small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (error) {
        log(`Error during turn ${turnCount}: ${error.message}`)
        break
      }
    }

    if (currentGame.stateKind === 'completed') {
      log(`\n🎉 GAME COMPLETED! 🎉`)
      if (currentGame.winner) {
        log(`Winner: ${currentGame.winner.id} (${currentGame.winner.color})`)
      }
      log('\n=== FINAL BOARD ===')
      log(getAsciiBoard(currentGame))
      log('===================')
    } else {
      log(
        `\nGame ended after ${turnCount} turns (max turns reached or error occurred)`
      )
      log(`Final state: ${currentGame.stateKind}`)
    }

    log('\n=== Fixed Robot Game Simulation Complete ===')
  } catch (error) {
    log(`\nError during simulation: ${error.message}`)
    console.error('Full error:', error)
  }

  // Write log to file
  const filename = `robot-game-${gameId || 'unknown'}.txt`
  try {
    await fs.writeFile(filename, logContent)
    console.log(`\nGame log written to: ${filename}`)
  } catch (error) {
    console.error('Error writing log file:', error)
  }
}

// Check if we're running this script directly
if (require.main === module) {
  simulateGame().catch(console.error)
}

module.exports = { simulateGame }
