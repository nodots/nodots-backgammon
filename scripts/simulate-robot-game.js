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
  const { Board } = require('./nodots-backgammon-core/dist/Board/index.js')
  try {
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

// Main simulation function
async function simulateGame() {
  let logContent = ''
  let gameId = ''

  function log(message) {
    console.log(message)
    logContent += message + '\n'
  }

  try {
    log('=== Starting Robot Game Simulation ===\n')

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
    let moveCount = 0
    const maxMoves = 50 // Reasonable limit for testing

    // Game loop
    while (currentGame.stateKind !== 'completed' && moveCount < maxMoves) {
      moveCount++
      log(`--- Move ${moveCount} ---`)
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
              log(`Dice rolled: ${activePlayer.dice.currentRoll.join(', ')}`)
            }
          }
        } else if (currentGame.stateKind === 'rolled') {
          // Get fresh possible moves for current game state
          log('Getting possible moves...')
          const possibleMovesResponse = await apiCall(
            'GET',
            `/games/${gameId}/possible-moves`
          )

          if (
            possibleMovesResponse.possibleMoves &&
            possibleMovesResponse.possibleMoves.length > 0
          ) {
            log(
              `Found ${possibleMovesResponse.possibleMoves.length} possible moves`
            )

            // Debug: Show the first few possible moves to understand structure
            log(
              `Sample moves: ${JSON.stringify(
                possibleMovesResponse.possibleMoves.slice(0, 2),
                null,
                2
              )}`
            )

            // Try moves in order until one succeeds
            let moveSucceeded = false
            for (
              let i = 0;
              i < possibleMovesResponse.possibleMoves.length && !moveSucceeded;
              i++
            ) {
              const move = possibleMovesResponse.possibleMoves[i]
              if (
                move &&
                move.origin &&
                move.origin.checkers &&
                move.origin.checkers.length > 0
              ) {
                // Get the top checker (last one in the array) from the origin point
                const topChecker =
                  move.origin.checkers[move.origin.checkers.length - 1]
                const checkerId = topChecker.id

                log(
                  `Attempting move ${i + 1}/${
                    possibleMovesResponse.possibleMoves.length
                  }: checker ${checkerId} from position ${
                    move.origin.position.clockwise
                  } to ${move.destination.position?.clockwise || 'off'}`
                )

                try {
                  const moveResponse = await apiCall(
                    'POST',
                    `/games/${gameId}/move`,
                    {
                      checkerId: checkerId,
                    }
                  )

                  if (
                    moveResponse.possibleMoves &&
                    moveResponse.possibleMoves.length > 0
                  ) {
                    // Multiple moves possible - for robots, auto-select the first move
                    const selectedMove = moveResponse.possibleMoves[0]
                    log(
                      `Robot auto-selecting first of ${moveResponse.possibleMoves.length} moves: die ${selectedMove.dieValue}`
                    )

                    // For robot players, we need to simulate executing the first move
                    // Since there's no API to execute a specific move, we'll try a different approach:
                    // Use a different checker that has only one possible move
                    log(
                      `Will try alternative checkers to avoid multiple-move scenario`
                    )
                    moveSucceeded = false // Continue trying other checkers
                  } else {
                    // Single move was made successfully
                    currentGame = moveResponse
                    log('Move completed successfully')
                    moveSucceeded = true
                  }
                } catch (error) {
                  log(`Move attempt ${i + 1} failed: ${error.message}`)
                  if (i === possibleMovesResponse.possibleMoves.length - 1) {
                    log(
                      'All move attempts failed - this may indicate a game state issue'
                    )
                    break
                  }
                  // Continue to next move attempt
                }
              }
            }

            if (!moveSucceeded) {
              log(
                'No single-move checkers found - all checkers have multiple dice options'
              )
              log(
                'For robot simulation, this indicates we need to force a move selection'
              )

              // Force execute the first available move by trying to use all possible moves from first position
              const firstPossibleMove = possibleMovesResponse.possibleMoves[0]
              if (
                firstPossibleMove &&
                firstPossibleMove.origin &&
                firstPossibleMove.origin.checkers.length > 0
              ) {
                const topChecker =
                  firstPossibleMove.origin.checkers[
                    firstPossibleMove.origin.checkers.length - 1
                  ]
                log(
                  `Forcing move execution for robot with checker ${topChecker.id}`
                )

                try {
                  // Get the checker move response again
                  const forcedMoveResponse = await apiCall(
                    'POST',
                    `/games/${gameId}/move`,
                    {
                      checkerId: topChecker.id,
                    }
                  )

                  if (
                    forcedMoveResponse.possibleMoves &&
                    forcedMoveResponse.possibleMoves.length > 0
                  ) {
                    // Robot logic: accept that one die was used, update game state
                    log(
                      'Robot accepting partial move completion - updating game state'
                    )
                    currentGame = forcedMoveResponse.game || currentGame
                    moveSucceeded = true
                  }
                } catch (error) {
                  log(`Forced move attempt failed: ${error.message}`)
                  break
                }
              }

              if (!moveSucceeded) {
                log('All move attempts exhausted - ending turn')
                break
              }
            }
          } else {
            log('No possible moves available - passing turn')
            // Force next turn by rolling again
            currentGame = await apiCall('POST', `/games/${gameId}/roll`)
          }
        } else {
          log(`Unexpected game state: ${currentGame.stateKind}`)
          break
        }

        // Show board after each move attempt to debug issues
        log('\n=== BOARD STATE AFTER MOVE ATTEMPT ===')
        log(getAsciiBoard(currentGame))
        log('=====================================\n')

        // Small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        log(`Error during move ${moveCount}: ${error.message}`)
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
        `\nGame ended after ${moveCount} moves (max moves reached or error occurred)`
      )
      log(`Final state: ${currentGame.stateKind}`)
    }

    log('\n=== Game Simulation Complete ===')
  } catch (error) {
    log(`\nError during simulation: ${error.message}`)
    console.error('Full error:', error)
  }

  // Write log to file
  const filename = `game-${gameId || 'unknown'}.txt`
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
