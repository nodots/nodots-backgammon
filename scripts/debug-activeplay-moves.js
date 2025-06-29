const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api/v1'

// Helper function to make API calls
async function apiCall(method, endpoint, body = null) {
  const url = `${API_BASE}${endpoint}`
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) options.body = JSON.stringify(body)

  const response = await fetch(url, options)
  return response.json()
}

async function debugActivePlayMoves() {
  console.log('🔍 DEBUGGING ACTIVEPLAY.MOVES STATE')
  console.log('=====================================')

  try {
    // Create a new game for clean testing
    const user1 = await apiCall('POST', '/users', { user_type: 'robot' })
    const user2 = await apiCall('POST', '/users', { user_type: 'robot' })

    const game = await apiCall('POST', '/games', {
      players: [{ userId: user1.id }, { userId: user2.id }],
    })

    console.log(`✅ Created game: ${game.id}`)
    console.log(`   Initial state: ${game.stateKind}`)

    // Roll for start
    let currentGame = await apiCall('POST', `/games/${game.id}/roll-for-start`)
    console.log(`   After roll-for-start: ${currentGame.stateKind}`)

    // Roll dice
    currentGame = await apiCall('POST', `/games/${currentGame.id}/roll`)
    const dice = currentGame.activePlayer?.dice?.currentRoll || []
    console.log(`   After roll: ${currentGame.stateKind}`)
    console.log(`   Dice: [${dice.join(', ')}]`)

    // Examine initial activePlay.moves
    console.log(`\n📊 INITIAL ACTIVEPLAY.MOVES STATE`)
    console.log(`   Active play ID: ${currentGame.activePlay?.id}`)
    console.log(`   Active play state: ${currentGame.activePlay?.stateKind}`)

    if (currentGame.activePlay?.moves) {
      const movesArray = Array.from(currentGame.activePlay.moves)
      console.log(`   Moves count: ${movesArray.length}`)
      movesArray.forEach((move, i) => {
        console.log(
          `   Move ${i + 1}: die ${move.dieValue}, state: ${
            move.stateKind
          }, possibleMoves: ${move.possibleMoves?.length || 0}`
        )
      })
    }

    // Get possible moves before first move
    const initialPossibleMoves = await apiCall(
      'GET',
      `/games/${currentGame.id}/possible-moves`
    )
    console.log(
      `\n🎯 INITIAL POSSIBLE MOVES: ${
        initialPossibleMoves.possibleMoves?.length || 0
      }`
    )

    if (initialPossibleMoves.possibleMoves?.length > 0) {
      // Make first move
      const firstMove = initialPossibleMoves.possibleMoves[0]
      const checkerId =
        firstMove.origin.checkers[firstMove.origin.checkers.length - 1].id

      console.log(`\n🔄 MAKING FIRST MOVE`)
      console.log(`   Die: ${firstMove.dieValue}`)
      console.log(`   From: point ${firstMove.origin.position.clockwise}`)
      console.log(
        `   To: point ${firstMove.destination.position?.clockwise || 'off'}`
      )
      console.log(`   Checker: ${checkerId}`)

      const moveResult = await apiCall(
        'POST',
        `/games/${currentGame.id}/move`,
        { checkerId }
      )

      if (moveResult.error) {
        console.log(`❌ Move failed: ${moveResult.error}`)
        return
      }

      currentGame = moveResult
      console.log(`   ✅ Move successful, new state: ${currentGame.stateKind}`)

      // CRITICAL: Examine activePlay.moves state after first move
      console.log(`\n📊 ACTIVEPLAY.MOVES STATE AFTER FIRST MOVE`)
      console.log(`   Active play ID: ${currentGame.activePlay?.id}`)
      console.log(`   Active play state: ${currentGame.activePlay?.stateKind}`)

      if (currentGame.activePlay?.moves) {
        const movesArray = Array.from(currentGame.activePlay.moves)
        console.log(`   Moves count: ${movesArray.length}`)
        movesArray.forEach((move, i) => {
          console.log(`   Move ${i + 1}:`)
          console.log(`     Die value: ${move.dieValue}`)
          console.log(`     State: ${move.stateKind}`)
          console.log(`     Move kind: ${move.moveKind}`)
          console.log(`     Possible moves: ${move.possibleMoves?.length || 0}`)
          console.log(`     Origin: ${move.origin?.kind || 'undefined'}`)
          console.log(
            `     Destination: ${move.destination?.kind || 'undefined'}`
          )
        })
      }

      // Get possible moves after first move - this should only show unused dice
      const afterFirstMovePossibleMoves = await apiCall(
        'GET',
        `/games/${currentGame.id}/possible-moves`
      )
      console.log(
        `\n🎯 POSSIBLE MOVES AFTER FIRST MOVE: ${
          afterFirstMovePossibleMoves.possibleMoves?.length || 0
        }`
      )

      if (afterFirstMovePossibleMoves.possibleMoves?.length > 0) {
        console.log(
          `   Expected: Only die value ${dice.find(
            (d) => d !== firstMove.dieValue
          )} moves`
        )
        console.log(`   Actual moves:`)
        afterFirstMovePossibleMoves.possibleMoves
          .slice(0, 3)
          .forEach((move, i) => {
            console.log(
              `     ${i + 1}: die ${move.dieValue}, ${
                move.origin.position.clockwise
              } → ${move.destination.position?.clockwise || 'off'}`
            )
          })

        // Check if bug still exists
        const hasBuggyMoves = afterFirstMovePossibleMoves.possibleMoves.some(
          (move) => move.dieValue === firstMove.dieValue
        )

        if (hasBuggyMoves) {
          console.log(
            `\n🐛 BUG STILL EXISTS: Found moves for consumed die value ${firstMove.dieValue}`
          )
        } else {
          console.log(
            `\n✅ BUG FIXED: No moves found for consumed die value ${firstMove.dieValue}`
          )
        }
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

debugActivePlayMoves()
