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

async function findDoublesAndTest() {
  const robot1Id = '4bd26bd3-b35a-44b5-9f8e-6d45060a1eac'
  const robot2Id = '4581085b-bc24-4ecb-99b7-76f42717d1a1'

  console.log('🎲 Searching for doubles roll to test robot bug...\n')

  let attempts = 0
  const maxAttempts = 20 // Try up to 20 games to find doubles

  while (attempts < maxAttempts) {
    attempts++

    try {
      // Create new game
      const game = await apiCall('POST', '/games', {
        player1: { userId: robot1Id },
        player2: { userId: robot2Id },
      })

      // Setup to rolled state
      let currentGame = await apiCall(
        'POST',
        `/games/${game.id}/roll-for-start`
      )
      currentGame = await apiCall('POST', `/games/${game.id}/roll`)

      const activePlayer = currentGame.players.find(
        (p) => p.color === currentGame.activeColor
      )
      const [die1, die2] = activePlayer.dice.currentRoll
      const isDoubles = die1 === die2

      console.log(
        `Attempt ${attempts}: [${die1}, ${die2}] ${
          isDoubles ? '🎯 DOUBLES!' : ''
        }`
      )

      if (isDoubles) {
        console.log(
          `\n🎯 Found doubles roll [${die1}, ${die2}] on attempt ${attempts}!`
        )
        console.log(`Game ID: ${game.id}`)
        console.log(
          `Active player: ${activePlayer.color} (robot: ${activePlayer.isRobot})`
        )

        // Test the robot behavior with doubles
        console.log('\nTesting robot move execution with doubles...')

        const possibleMoves = await apiCall(
          'GET',
          `/games/${game.id}/possible-moves`
        )
        console.log(
          `Found ${possibleMoves.possibleMoves.length} possible moves`
        )

        if (possibleMoves.possibleMoves.length > 0) {
          const firstMove = possibleMoves.possibleMoves[0]
          const topChecker =
            firstMove.origin.checkers[firstMove.origin.checkers.length - 1]

          console.log(`Attempting move with checker: ${topChecker.id}`)

          const moveResult = await apiCall('POST', `/games/${game.id}/move`, {
            checkerId: topChecker.id,
          })

          console.log('\n📊 DOUBLES TEST RESULT:')
          if (moveResult.possibleMoves) {
            console.log(
              `❌ BUG CONFIRMED! Robot with doubles [${die1}, ${die2}] got multiple moves back`
            )
            console.log(
              `   - Got ${moveResult.possibleMoves.length} possible moves instead of auto-execution`
            )
            console.log(`   - Message: ${moveResult.message}`)
            console.log(
              `   - Game state unchanged: ${moveResult.game?.stateKind}`
            )
            console.log('\n🔍 This proves the doubles roll bug exists!')

            // Show the specific moves that were returned
            console.log('\nPossible moves returned:')
            moveResult.possibleMoves.forEach((pm, i) => {
              console.log(`  ${i + 1}. Die ${pm.dieValue}: ${pm.stateKind}`)
            })
          } else if (moveResult.id || moveResult.stateKind) {
            console.log(`✅ UNEXPECTED: Doubles worked correctly!`)
            console.log(`   - Game state: ${moveResult.stateKind}`)
            console.log(`   - This doubles roll somehow succeeded`)
          }
        }

        console.log('\n=== Doubles Test Complete ===')
        return // Found and tested doubles, exit
      }
    } catch (error) {
      console.log(`Attempt ${attempts} failed: ${error.message}`)
    }
  }

  console.log(`\n⚠️ Could not find doubles roll in ${maxAttempts} attempts`)
  console.log(
    'The probability of this is very low (~0.00001%), try running again'
  )
}

findDoublesAndTest().catch(console.error)
