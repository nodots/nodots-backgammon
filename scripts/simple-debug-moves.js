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
  return response.json()
}

async function debugExistingGame() {
  // Use the newest failed game from our latest test
  const gameId = 'b39aa5f6-81d3-4ec4-a811-55abfabc80e7'

  console.log('🔍 EXAMINING EXISTING GAME ACTIVEPLAY.MOVES')
  console.log('==========================================')

  try {
    // Get current game state
    const game = await apiCall('GET', `/games/${gameId}`)

    console.log(`Game ID: ${gameId}`)
    console.log(`Game state: ${game.stateKind}`)
    console.log(`Active color: ${game.activeColor}`)

    if (game.activePlayer?.dice?.currentRoll) {
      console.log(`Dice: [${game.activePlayer.dice.currentRoll.join(', ')}]`)
    }

    // Examine activePlay.moves in detail
    if (game.activePlay) {
      console.log(`\n📊 ACTIVEPLAY STATE`)
      console.log(`   Play ID: ${game.activePlay.id}`)
      console.log(`   Play state: ${game.activePlay.stateKind}`)

      if (game.activePlay.moves) {
        const movesArray = Array.isArray(game.activePlay.moves)
          ? game.activePlay.moves
          : Array.from(game.activePlay.moves)

        console.log(`   Moves count: ${movesArray.length}`)

        movesArray.forEach((move, i) => {
          console.log(`\n   📋 Move ${i + 1}:`)
          console.log(`      ID: ${move.id}`)
          console.log(`      Die value: ${move.dieValue}`)
          console.log(`      State: ${move.stateKind}`)
          console.log(`      Move kind: ${move.moveKind}`)
          console.log(
            `      Possible moves count: ${move.possibleMoves?.length || 0}`
          )
          console.log(`      Origin: ${move.origin?.kind || 'undefined'}`)
          console.log(
            `      Destination: ${move.destination?.kind || 'undefined'}`
          )
        })
      }
    }

    // Test possible-moves endpoint
    console.log(`\n🎯 POSSIBLE MOVES ENDPOINT`)
    const possibleMoves = await apiCall(
      'GET',
      `/games/${gameId}/possible-moves`
    )

    if (possibleMoves.error) {
      console.log(`   Error: ${possibleMoves.error}`)
    } else {
      console.log(`   Count: ${possibleMoves.possibleMoves?.length || 0}`)

      if (possibleMoves.possibleMoves?.length > 0) {
        console.log(`   Sample moves:`)
        possibleMoves.possibleMoves.slice(0, 3).forEach((move, i) => {
          console.log(
            `     ${i + 1}: die ${move.dieValue}, ${
              move.origin.position.clockwise
            } → ${move.destination.position?.clockwise || 'off'}`
          )
        })

        // Group by die value to see the issue
        const movesByDie = {}
        possibleMoves.possibleMoves.forEach((move) => {
          if (!movesByDie[move.dieValue]) {
            movesByDie[move.dieValue] = 0
          }
          movesByDie[move.dieValue]++
        })

        console.log(`   Moves by die value:`)
        Object.entries(movesByDie).forEach(([die, count]) => {
          console.log(`     Die ${die}: ${count} moves`)
        })
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

debugExistingGame()
