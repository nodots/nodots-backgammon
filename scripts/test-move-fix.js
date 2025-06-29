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

async function testMoveFix() {
  console.log('🔍 TESTING PLAY.MOVE FIX')
  console.log('========================')

  try {
    // Create robot users
    console.log('Creating robot users...')
    const user1 = await apiCall('POST', '/users', { user_type: 'robot' })
    const user2 = await apiCall('POST', '/users', { user_type: 'robot' })

    console.log(`User 1 ID: ${user1.id}`)
    console.log(`User 2 ID: ${user2.id}`)

    // Create game
    console.log('\\nCreating game...')
    const game = await apiCall('POST', '/games', {
      players: [{ userId: user1.id }, { userId: user2.id }],
    })

    console.log(`Game ID: ${game.id}`)
    console.log(`Initial state: ${game.stateKind}`)

    // Roll for start
    console.log('\\nRolling for start...')
    let currentGame = await apiCall('POST', `/games/${game.id}/roll-for-start`)
    console.log(`After roll-for-start: ${currentGame.stateKind}`)

    // Roll dice
    console.log('\\nRolling dice...')
    currentGame = await apiCall('POST', `/games/${game.id}/roll`)
    const dice = currentGame.activePlayer?.dice?.currentRoll || []
    console.log(`After roll: ${currentGame.stateKind}`)
    console.log(`Dice: [${dice.join(', ')}]`)
    console.log(`Active player: ${currentGame.activeColor}`)

    // Check initial activePlay.moves state
    console.log('\\n📊 INITIAL ACTIVEPLAY.MOVES STATE')
    if (currentGame.activePlay?.moves) {
      const initialMoves = Array.isArray(currentGame.activePlay.moves)
        ? currentGame.activePlay.moves
        : Array.from(currentGame.activePlay.moves)
      console.log(`   Moves count: ${initialMoves.length}`)
      initialMoves.forEach((move, i) => {
        console.log(
          `   Move ${i + 1}: die ${move.dieValue}, state: ${move.stateKind}`
        )
      })
    } else {
      console.log('   No initial moves found!')
    }

    // Get possible moves and make first move
    console.log('\\n🎯 GETTING POSSIBLE MOVES')
    const possibleMoves = await apiCall(
      'GET',
      `/games/${game.id}/possible-moves`
    )
    console.log(`   Count: ${possibleMoves.possibleMoves?.length || 0}`)

    if (possibleMoves.possibleMoves?.length > 0) {
      const firstMove = possibleMoves.possibleMoves[0]
      const checkerId =
        firstMove.origin.checkers[firstMove.origin.checkers.length - 1].id

      console.log(`\\n🔄 MAKING FIRST MOVE`)
      console.log(`   Die: ${firstMove.dieValue}`)
      console.log(`   Checker: ${checkerId}`)

      const moveResult = await apiCall('POST', `/games/${game.id}/move`, {
        checkerId,
      })

      if (moveResult.error) {
        console.log(`❌ Move failed: ${moveResult.error}`)
        return
      }

      console.log(`   ✅ Move successful`)
      currentGame = moveResult

      // Check activePlay.moves state after first move
      console.log(`\\n📊 ACTIVEPLAY.MOVES AFTER FIRST MOVE`)
      if (currentGame.activePlay?.moves) {
        const afterMoves = Array.isArray(currentGame.activePlay.moves)
          ? currentGame.activePlay.moves
          : Array.from(currentGame.activePlay.moves)

        console.log(`   Moves count: ${afterMoves.length}`)
        afterMoves.forEach((move, i) => {
          console.log(
            `   Move ${i + 1}: die ${move.dieValue}, state: ${move.stateKind}`
          )
        })

        const completedMoves = afterMoves.filter(
          (m) => m.stateKind === 'completed'
        )
        const readyMoves = afterMoves.filter((m) => m.stateKind === 'ready')

        console.log(`\\n   📈 ANALYSIS:`)
        console.log(`     Completed moves: ${completedMoves.length}`)
        console.log(`     Ready moves: ${readyMoves.length}`)

        if (completedMoves.length === 1 && readyMoves.length === 1) {
          console.log(`     ✅ FIX WORKING: Correct move states`)
        } else {
          console.log(`     ❌ FIX NOT WORKING: Incorrect move counts`)
        }
      } else {
        console.log(`   ❌ NO ACTIVEPLAY.MOVES FOUND!`)
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testMoveFix()
