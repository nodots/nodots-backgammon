const fetch = require('node-fetch')
const crypto = require('crypto')

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

// Helper function to create robot users with unique IDs
async function createRobotUsers() {
  const timestamp = Date.now()
  const randomId1 = crypto.randomBytes(4).toString('hex')
  const randomId2 = crypto.randomBytes(4).toString('hex')

  try {
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

    return {
      robot1Id: robot1.id,
      robot2Id: robot2.id,
    }
  } catch (error) {
    console.error('Error creating robot users:', error)
    throw error
  }
}

async function testDoublesRobot() {
  try {
    console.log('=== Testing Robot with Doubles Roll (ActivePlay Bug) ===\n')

    // Create fresh robot users for this test
    console.log('1. Creating robot players...')
    const { robot1Id, robot2Id } = await createRobotUsers()
    console.log(`✅ Robot 1: ${robot1Id}`)
    console.log(`✅ Robot 2: ${robot2Id}`)

    console.log('\n2. Creating game with robot players...')
    const game = await apiCall('POST', '/games', {
      player1: { userId: robot1Id },
      player2: { userId: robot2Id },
    })

    console.log(`✅ Game created: ${game.id}`)

    // Setup game to rolled state
    console.log('\n3. Setting up game...')
    let currentGame = await apiCall('POST', `/games/${game.id}/roll-for-start`)
    currentGame = await apiCall('POST', `/games/${game.id}/roll`)

    console.log(`Game state: ${currentGame.stateKind}`)
    console.log(`Active color: ${currentGame.activeColor}`)

    const activePlayer = currentGame.players.find(
      (p) => p.color === currentGame.activeColor
    )
    console.log(`Dice rolled: [${activePlayer.dice.currentRoll.join(', ')}]`)
    console.log(`Is robot: ${activePlayer.isRobot}`)

    // Check if this is a doubles roll
    const [die1, die2] = activePlayer.dice.currentRoll
    const isDoubles = die1 === die2

    console.log(`\n4. Roll analysis:`)
    console.log(`  Dies: [${die1}, ${die2}]`)
    console.log(`  Is doubles: ${isDoubles}`)
    console.log(`  Expected moves: ${isDoubles ? 4 : 2}`)

    // If not doubles, keep rolling until we get doubles
    if (!isDoubles) {
      console.log('\n5. Not doubles - rolling again until we get doubles...')
      let attempts = 0
      while (!isDoubles && attempts < 10) {
        attempts++
        console.log(`  Attempt ${attempts}: Rolling...`)

        // Switch to next player and roll
        if (currentGame.stateKind === 'rolling') {
          currentGame = await apiCall('POST', `/games/${game.id}/roll`)
        } else {
          // End current turn and start next
          currentGame = await apiCall('POST', `/games/${game.id}/end-turn`)
          if (currentGame.stateKind === 'rolling') {
            currentGame = await apiCall('POST', `/games/${game.id}/roll`)
          }
        }

        const newActivePlayer = currentGame.players.find(
          (p) => p.color === currentGame.activeColor
        )
        const [newDie1, newDie2] = newActivePlayer.dice.currentRoll
        const newIsDoubles = newDie1 === newDie2

        console.log(
          `    Result: [${newDie1}, ${newDie2}] - Doubles: ${newIsDoubles}`
        )

        if (newIsDoubles) {
          console.log(`  🎯 DOUBLES FOUND! [${newDie1}, ${newDie2}]`)
          break
        }
      }

      if (attempts >= 10) {
        console.log(
          '  ⚠️ Could not get doubles after 10 attempts - proceeding with current roll'
        )
      }
    } else {
      console.log('  🎯 DOUBLES DETECTED ON FIRST ROLL!')
    }

    // Get possible moves
    console.log('\n6. Getting possible moves...')
    const possibleMoves = await apiCall(
      'GET',
      `/games/${game.id}/possible-moves`
    )
    console.log(`Found ${possibleMoves.possibleMoves.length} possible moves`)

    if (possibleMoves.possibleMoves.length > 0) {
      const firstMove = possibleMoves.possibleMoves[0]
      if (firstMove.origin.checkers.length > 0) {
        const topChecker =
          firstMove.origin.checkers[firstMove.origin.checkers.length - 1]

        console.log(`\n7. Testing robot move execution...`)
        console.log(`Attempting move with checker: ${topChecker.id}`)
        console.log(
          `Move: die ${firstMove.dieValue}, from ${
            firstMove.origin.position?.clockwise || 'bar'
          } to ${firstMove.destination.position?.clockwise || 'off'}`
        )

        const moveResult = await apiCall('POST', `/games/${game.id}/move`, {
          checkerId: topChecker.id,
        })

        console.log('\n8. Move result analysis:')
        if (moveResult.possibleMoves) {
          console.log(
            `  ❌ BUG CONFIRMED: Got possibleMoves back (${moveResult.possibleMoves.length} moves)`
          )
          console.log(`  Message: ${moveResult.message || 'No message'}`)
          console.log(
            `  Game state: ${moveResult.game?.stateKind || 'unknown'}`
          )
          console.log(`  🔍 This indicates the ACTIVEPLAY BUG`)
          console.log(
            `  🔍 Robot should auto-execute moves but got multiple options back`
          )
          console.log(`  🔍 This will cause infinite loops in robot simulation`)

          // Check for activePlay
          if (moveResult.game?.activePlay) {
            console.log(
              `  🔍 ActivePlay detected: ${JSON.stringify(
                moveResult.game.activePlay
              )}`
            )
          }

          return { bugFound: true, gameId: game.id, moveResult }
        } else if (moveResult.id || moveResult.stateKind) {
          console.log(`  ✅ SUCCESS: Move executed`)
          console.log(`  Game state: ${moveResult.stateKind}`)
          console.log(`  Active color: ${moveResult.activeColor}`)
          console.log(`  🎯 No bug detected with this roll`)

          return { bugFound: false, gameId: game.id, moveResult }
        } else {
          console.log(`  ❌ UNEXPECTED RESPONSE: ${JSON.stringify(moveResult)}`)
          return { bugFound: true, gameId: game.id, moveResult }
        }
      }
    } else {
      console.log('  ⚠️ No possible moves found - cannot test bug')
      return { bugFound: false, gameId: game.id, reason: 'No possible moves' }
    }

    console.log('\n=== Test Complete ===')
  } catch (error) {
    console.error('Test failed:', error)
    return { bugFound: false, error: error.message }
  }
}

// Run the test
testDoublesRobot()
  .then((result) => {
    console.log('\n🎯 FINAL RESULT:')
    if (result.bugFound) {
      console.log('  🐛 BUG CONFIRMED: ActivePlay bug reproduced!')
      console.log(
        '  📝 This bug causes robot simulations to hang in infinite loops'
      )
      console.log('  🔧 Needs to be fixed in the robot move execution logic')
    } else {
      console.log('  ✅ No bug detected in this test run')
      if (result.reason) {
        console.log(`  📝 Reason: ${result.reason}`)
      }
    }
    if (result.gameId) {
      console.log(`  🎮 Game ID: ${result.gameId}`)
    }
  })
  .catch(console.error)
