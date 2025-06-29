const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api/v1'

async function apiCall(method, endpoint, body = null) {
  const url = `${API_BASE}${endpoint}`
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) options.body = JSON.stringify(body)

  const response = await fetch(url, options)
  const data = await response.json()
  if (!response.ok) throw new Error(`API call failed: ${method} ${endpoint}`)
  return data
}

async function simpleRobotDemo() {
  try {
    console.log('🎮 Simple Robot Demo - Nodots Backgammon\n')

    // Create fresh robot users
    console.log('Creating robot players...')
    const robot1 = await apiCall('POST', '/users', {
      source: 'system',
      externalId: `demo-robot-1-${Date.now()}`,
      email: `demo-robot-1@nodots.com`,
      given_name: 'Demo Robot',
      family_name: 'Player 1',
      userType: 'robot',
      locale: 'en-US',
    })

    const robot2 = await apiCall('POST', '/users', {
      source: 'system',
      externalId: `demo-robot-2-${Date.now()}`,
      email: `demo-robot-2@nodots.com`,
      given_name: 'Demo Robot',
      family_name: 'Player 2',
      userType: 'robot',
      locale: 'en-US',
    })

    console.log(`✅ Robot 1: ${robot1.given_name} ${robot1.family_name}`)
    console.log(`✅ Robot 2: ${robot2.given_name} ${robot2.family_name}`)

    // Create a new game
    console.log('\nCreating new game...')
    const game = await apiCall('POST', '/games', {
      player1Id: robot1.id,
      player2Id: robot2.id,
      autoRollForStart: true,
    })

    console.log(`✅ Game created: ${game.id}`)
    console.log(`🎲 Starting player: ${game.activeColor}`)
    console.log(`🎯 Game state: ${game.stateKind}`)

    // Try a few moves to demonstrate basic functionality
    let currentGame = game
    let moveCount = 0
    const maxMoves = 5

    while (moveCount < maxMoves && currentGame.stateKind !== 'completed') {
      console.log(`\n=== Move ${moveCount + 1} ===`)
      console.log(`Active player: ${currentGame.activeColor}`)
      console.log(`Game state: ${currentGame.stateKind}`)

      if (currentGame.stateKind === 'rolled-for-start') {
        // Roll for the first turn
        console.log('Rolling dice for first turn...')
        currentGame = await apiCall('POST', `/games/${currentGame.id}/roll`)
        console.log(`🎲 Rolled: [${currentGame.activePlayer.dice.currentRoll}]`)
      } else if (currentGame.stateKind === 'rolled') {
        // Try to get possible moves
        try {
          const possibleMoves = await apiCall(
            'GET',
            `/games/${currentGame.id}/possible-moves`
          )

          if (
            possibleMoves.possibleMoves &&
            possibleMoves.possibleMoves.length > 0
          ) {
            // Make the first available move
            const firstMove = possibleMoves.possibleMoves[0]
            const topChecker =
              firstMove.origin.checkers[firstMove.origin.checkers.length - 1]

            console.log(
              `🎯 Making move: ${firstMove.origin.position.clockwise} → ${firstMove.destination.position.clockwise} (die: ${firstMove.dieValue})`
            )

            const moveResult = await apiCall(
              'POST',
              `/games/${currentGame.id}/move`,
              {
                checkerId: topChecker.id,
              }
            )

            if (moveResult.success) {
              currentGame = moveResult.game
              console.log(
                `✅ Move successful, new state: ${currentGame.stateKind}`
              )
            } else {
              console.log(`❌ Move failed: ${moveResult.error}`)
              break
            }
          } else {
            console.log(
              '❌ No possible moves available (API bug) - ending demo'
            )
            break
          }
        } catch (error) {
          console.log(`❌ Error getting possible moves: ${error.message}`)
          break
        }
      } else if (currentGame.stateKind === 'moving') {
        // Continue with more moves if available
        console.log('🔄 Game in moving state, trying to continue...')
        // For demo purposes, get fresh game state
        currentGame = await apiCall('GET', `/games/${currentGame.id}`)
      } else {
        console.log(`ℹ️  Game in ${currentGame.stateKind} state - ending demo`)
        break
      }

      moveCount++
    }

    console.log('\n🎮 Demo completed!')
    console.log(`Final game state: ${currentGame.stateKind}`)
    console.log(`Moves attempted: ${moveCount}`)

    return {
      success: true,
      gameId: currentGame.id,
      finalState: currentGame.stateKind,
      movesAttempted: moveCount,
    }
  } catch (error) {
    console.error('❌ Demo failed:', error.message)
    return { success: false, error: error.message }
  }
}

// Run the demo
simpleRobotDemo()
  .then((result) => {
    if (result.success) {
      console.log('\n✅ Simple Robot Demo completed successfully!')
    } else {
      console.log('\n❌ Simple Robot Demo failed')
    }
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
  })
