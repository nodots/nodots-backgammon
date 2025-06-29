const http = require('http')

const gameId = 'b287e77b-9595-4ef2-bc39-3c317d93beff'

async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = ''
      res.on('data', (chunk) => {
        responseData += chunk
      })
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData)
          resolve({ status: res.statusCode, data: parsedData })
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (data) {
      req.write(data)
    }
    req.end()
  })
}

async function testPossibleMoves() {
  try {
    console.log('=== TESTING POSSIBLE MOVES GENERATION ===')

    // First, get the current game state
    const gameOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/games/${gameId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const gameResponse = await makeRequest(gameOptions)

    if (gameResponse.status !== 200) {
      console.log('❌ Failed to get game:', gameResponse.data)
      return
    }

    const game = gameResponse.data
    console.log('Game State:', game.stateKind)
    console.log('Active Color:', game.activeColor)

    // Find the active player
    const activePlayer = game.players.find((p) => p.color === game.activeColor)
    if (activePlayer && activePlayer.dice && activePlayer.dice.currentRoll) {
      console.log('Dice Roll:', activePlayer.dice.currentRoll)
      console.log('Player Direction:', activePlayer.direction)
    }

    // Check the activePlay moves
    if (game.activePlay && game.activePlay.moves) {
      console.log('\\n=== ACTIVE PLAY MOVES ===')
      console.log('Active Play ID:', game.activePlay.id)
      console.log(
        'Active Play Moves Count:',
        game.activePlay.moves.size || Array.from(game.activePlay.moves).length
      )

      const movesArray = Array.from(game.activePlay.moves)
      movesArray.forEach((move, index) => {
        console.log(`\\nMove ${index + 1}:`)
        console.log('  Die Value:', move.dieValue)
        console.log('  State:', move.stateKind)
        console.log('  Move Kind:', move.moveKind)
        console.log(
          '  Possible Moves Count:',
          move.possibleMoves ? move.possibleMoves.length : 0
        )

        if (move.possibleMoves && move.possibleMoves.length > 0) {
          console.log('  Possible Moves:')
          move.possibleMoves.forEach((pm, pmIndex) => {
            const originStr =
              pm.origin.kind === 'point'
                ? `point-${pm.origin.position.clockwise}`
                : pm.origin.kind
            const destStr =
              pm.destination.kind === 'point'
                ? `point-${pm.destination.position.clockwise}`
                : pm.destination.kind
            console.log(`    ${pmIndex + 1}: ${originStr} → ${destStr}`)
          })
        }
      })
    }

    // Also check the possible moves endpoint
    console.log('\\n=== API POSSIBLE MOVES ENDPOINT ===')
    const possibleMovesOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/games/${gameId}/possible-moves`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const possibleMovesResponse = await makeRequest(possibleMovesOptions)
    console.log('Possible Moves Response Status:', possibleMovesResponse.status)

    if (possibleMovesResponse.status === 200) {
      const pmData = possibleMovesResponse.data
      console.log('Player ID:', pmData.playerId)
      console.log('Player Color:', pmData.playerColor)
      console.log(
        'Possible Moves Count:',
        pmData.possibleMoves ? pmData.possibleMoves.length : 0
      )

      if (pmData.possibleMoves && pmData.possibleMoves.length > 0) {
        console.log('Possible Moves:')
        pmData.possibleMoves.forEach((pm, index) => {
          const originStr =
            pm.origin.kind === 'point'
              ? `point-${pm.origin.position[pm.direction]}`
              : pm.origin.kind
          const destStr =
            pm.destination.kind === 'point'
              ? `point-${pm.destination.position[pm.direction]}`
              : pm.destination.kind
          console.log(
            `  ${index + 1}: Die ${pm.dieValue} - ${originStr} → ${destStr} (${
              pm.direction
            })`
          )
        })
      }
    } else {
      console.log(
        '❌ Failed to get possible moves:',
        possibleMovesResponse.data
      )
    }
  } catch (error) {
    console.error('Error during test:', error)
  }
}

console.log('🔍 Testing possible moves generation...\\n')
testPossibleMoves()
