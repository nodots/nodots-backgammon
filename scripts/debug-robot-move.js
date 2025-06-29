const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api/v1'

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
    throw new Error(
      `API call failed: ${method} ${endpoint} - ${JSON.stringify(data)}`
    )
  }

  return data
}

async function debugRobotMove() {
  try {
    console.log('=== Robot Move Debug Session ===\n')

    // Use known robot user IDs from simulation
    const robot1Id = '4bd26bd3-b35a-44b5-9f8e-6d45060a1eac'
    const robot2Id = '4581085b-bc24-4ecb-99b7-76f42717d1a1'

    console.log('1. Using known robot user IDs...')
    console.log(`  Robot 1: ${robot1Id}`)
    console.log(`  Robot 2: ${robot2Id}`)

    // Create game
    console.log('\n2. Creating game...')
    const game = await apiCall('POST', '/games', {
      player1: { userId: robot1Id },
      player2: { userId: robot2Id },
    })

    console.log(`Game created: ${game.id}`)
    console.log(`Initial state: ${game.stateKind}`)
    console.log(`Players:`)
    game.players.forEach((p, i) => {
      console.log(
        `  Player ${i + 1}: ${p.id} (${p.color}) - Robot: ${
          p.isRobot
        } - UserID: ${p.userId}`
      )
    })

    // Roll for start
    console.log('\n3. Rolling for start...')
    let currentGame = await apiCall('POST', `/games/${game.id}/roll-for-start`)
    console.log(`State after roll for start: ${currentGame.stateKind}`)
    console.log(`Active color: ${currentGame.activeColor}`)

    // Roll dice
    console.log('\n4. Rolling dice...')
    currentGame = await apiCall('POST', `/games/${game.id}/roll`)
    console.log(`State after roll: ${currentGame.stateKind}`)

    const activePlayer = currentGame.players.find(
      (p) => p.color === currentGame.activeColor
    )
    console.log(`Active player details:`)
    console.log(`  ID: ${activePlayer.id}`)
    console.log(`  Color: ${activePlayer.color}`)
    console.log(`  Is Robot: ${activePlayer.isRobot}`)
    console.log(`  User ID: ${activePlayer.userId}`)
    console.log(`  Dice: ${JSON.stringify(activePlayer.dice.currentRoll)}`)

    // Get possible moves
    console.log('\n5. Getting possible moves...')
    const possibleMoves = await apiCall(
      'GET',
      `/games/${game.id}/possible-moves`
    )
    console.log(`Found ${possibleMoves.possibleMoves.length} possible moves`)

    if (possibleMoves.possibleMoves.length > 0) {
      const firstMove = possibleMoves.possibleMoves[0]
      console.log(`\nFirst possible move:`)
      console.log(
        `  Origin: ${
          firstMove.origin.kind === 'point'
            ? `point-${firstMove.origin.position.clockwise}`
            : firstMove.origin.kind
        }`
      )
      console.log(
        `  Destination: ${
          firstMove.destination.kind === 'point'
            ? `point-${firstMove.destination.position.clockwise}`
            : firstMove.destination.kind
        }`
      )
      console.log(`  Die value: ${firstMove.dieValue}`)
      console.log(`  Origin has ${firstMove.origin.checkers.length} checkers`)

      if (firstMove.origin.checkers.length > 0) {
        const topChecker =
          firstMove.origin.checkers[firstMove.origin.checkers.length - 1]
        console.log(`  Top checker ID: ${topChecker.id}`)
        console.log(`  Top checker color: ${topChecker.color}`)

        // Test the move
        console.log('\n6. Testing move with robot player...')
        console.log(`Making move request with checkerId: ${topChecker.id}`)

        try {
          const moveResult = await apiCall('POST', `/games/${game.id}/move`, {
            checkerId: topChecker.id,
          })

          console.log('\nMove result:')
          console.log(`  Success: true`)

          if (moveResult.possibleMoves) {
            console.log(
              `  ❌ ISSUE: Got possibleMoves back (length: ${moveResult.possibleMoves.length})`
            )
            console.log(`  This means robot move execution failed!`)
            console.log(`  Message: ${moveResult.message || 'No message'}`)

            // Show the actual possible moves returned
            console.log(`  \nReturned possible moves:`)
            moveResult.possibleMoves.forEach((pm, i) => {
              console.log(`    ${i + 1}. Die ${pm.dieValue}: ${pm.stateKind}`)
            })

            // Check if the game state was updated
            if (moveResult.game) {
              console.log(
                `  \nGame state in response: ${moveResult.game.stateKind}`
              )
              console.log(
                `  Active color in response: ${moveResult.game.activeColor}`
              )

              const responseActivePlayer = moveResult.game.players.find(
                (p) => p.color === moveResult.game.activeColor
              )
              if (responseActivePlayer && responseActivePlayer.dice) {
                console.log(
                  `  Dice in response: ${JSON.stringify(
                    responseActivePlayer.dice.currentRoll
                  )}`
                )
                console.log(
                  `  Is robot in response: ${responseActivePlayer.isRobot}`
                )
              }
            }
          } else if (moveResult.id || moveResult.stateKind) {
            console.log(
              `  ✅ SUCCESS: Move executed, game state: ${moveResult.stateKind}`
            )
            console.log(`  Active color: ${moveResult.activeColor}`)
          } else {
            console.log(`  ❓ UNKNOWN: Unexpected response structure`)
            console.log(`  Keys: ${Object.keys(moveResult)}`)
          }
        } catch (error) {
          console.log(`  ❌ ERROR: Move failed - ${error.message}`)
        }
      }
    }

    console.log('\n=== Debug Session Complete ===')
  } catch (error) {
    console.error('Debug session failed:', error)
  }
}

debugRobotMove().catch(console.error)
