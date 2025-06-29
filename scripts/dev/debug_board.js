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
      console.log('=== BOARD DEBUG ===')
      console.log('Game State:', gameData.stateKind)
      console.log('Active Color:', gameData.activeColor)
      console.log('Dice:', gameData.activePlayer?.dice?.currentRoll)

      // Debug board positions
      console.log('\n=== BOARD POSITIONS ===')
      gameData.board.BackgammonPoints.forEach((point, index) => {
        if (point.checkers.length > 0) {
          console.log(`Point ${index + 1}:`)
          console.log(`  Clockwise position: ${point.position.clockwise}`)
          console.log(
            `  Counterclockwise position: ${point.position.counterclockwise}`
          )
          console.log(
            `  Checkers: ${point.checkers.length} ${point.checkers[0].color}`
          )
        }
      })

      // Debug black checkers specifically
      console.log('\n=== BLACK CHECKERS ===')
      const blackCheckers = []
      gameData.board.BackgammonPoints.forEach((point, index) => {
        if (point.checkers.length > 0 && point.checkers[0].color === 'black') {
          blackCheckers.push({
            pointIndex: index + 1,
            clockwisePos: point.position.clockwise,
            counterclockwisePos: point.position.counterclockwise,
            checkerCount: point.checkers.length,
          })
        }
      })
      blackCheckers.forEach((checker) => {
        console.log(
          `Point ${checker.pointIndex}: ${checker.checkerCount} checkers at clockwise=${checker.clockwisePos}, counterclockwise=${checker.counterclockwisePos}`
        )
      })

      // Test possible moves for each die value
      console.log('\n=== TESTING POSSIBLE MOVES ===')
      const dice = gameData.activePlayer?.dice?.currentRoll || [2, 4]
      dice.forEach((dieValue) => {
        console.log(`\nTesting die value ${dieValue}:`)

        // Get possible moves using the core library
        const possibleMoves = Board.getPossibleMoves(
          gameData.board,
          gameData.activePlayer,
          dieValue
        )

        console.log(
          `  Core library found ${possibleMoves.length} possible moves`
        )
        possibleMoves.forEach((move, index) => {
          const originStr =
            move.origin.kind === 'point'
              ? `point-${move.origin.position.clockwise}`
              : move.origin.kind
          const destStr =
            move.destination.kind === 'point'
              ? `point-${move.destination.position.clockwise}`
              : move.destination.kind
          console.log(`    ${index + 1}: ${originStr} → ${destStr}`)
        })
      })
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
