const http = require('http')
const { Board } = require('./nodots-backgammon-core/dist/Board')

// Game ID from the most recent game
const gameId = 'bd766bee-253f-40dd-8746-7d27ec5164db'

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/v1/games/${gameId}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
}

const req = http.request(options, (res) => {
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    try {
      const gameData = JSON.parse(data)
      console.log('=== ACTIVE PLAY DEBUG ===')
      console.log('Game State:', gameData.stateKind)
      console.log('Active Color:', gameData.activeColor)
      console.log('Has Active Play:', !!gameData.activePlay)

      if (gameData.activePlay) {
        console.log('Active Play ID:', gameData.activePlay.id)
        console.log('Active Play State:', gameData.activePlay.stateKind)
        console.log('Has Moves:', !!gameData.activePlay.moves)
        console.log(
          'Moves Count:',
          gameData.activePlay.moves ? gameData.activePlay.moves.length : 0
        )

        if (gameData.activePlay.moves) {
          console.log('\n=== MOVES IN ACTIVE PLAY ===')
          const movesArray = Array.from(gameData.activePlay.moves)
          movesArray.forEach((move, index) => {
            console.log(`\nMove ${index + 1}:`)
            console.log(`  ID: ${move.id}`)
            console.log(`  Die Value: ${move.dieValue}`)
            console.log(`  State: ${move.stateKind}`)
            console.log(`  Move Kind: ${move.moveKind}`)
            console.log(
              `  Origin: ${move.origin ? move.origin.kind : 'undefined'}`
            )
            console.log(
              `  Possible Moves Count: ${
                move.possibleMoves ? move.possibleMoves.length : 0
              }`
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
            } else {
              console.log('  No possible moves stored')
            }
          })
        }
      } else {
        console.log('No active play found')
      }
    } catch (e) {
      console.error('Error parsing game data:', e)
      console.log('Raw response:', data)
    }
  })
})

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`)
})

req.end()
