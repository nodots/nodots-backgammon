const http = require('http')
const { Board } = require('./nodots-backgammon-core/dist/Board')

// Game ID from the most recent game
const gameId = 'bd766bee-253f-40dd-8746-7d27ec5164db'

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/v1/games/${gameId}/possible-moves`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
}

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`)

  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    console.log('=== POSSIBLE MOVES RESPONSE ===')
    console.log('Response:', data)

    try {
      const movesData = JSON.parse(data)

      if (movesData.error) {
        console.log('Error:', movesData.error)
        return
      }

      console.log('\n=== GAME INFO ===')
      console.log('Game ID:', movesData.gameId)
      console.log('Player ID:', movesData.playerId)
      console.log('Player Color:', movesData.playerColor)

      console.log('\n=== POSSIBLE MOVES ===')
      if (movesData.possibleMoves && movesData.possibleMoves.length > 0) {
        movesData.possibleMoves.forEach((move, index) => {
          console.log(`Move ${index + 1}:`)
          console.log(`  Die Value: ${move.dieValue}`)
          console.log(`  Direction: ${move.direction}`)
          console.log(`  Origin: ${move.origin}`)
          console.log(`  Destination: ${move.destination}`)
          if (move.checkerId) {
            console.log(`  Checker ID: ${move.checkerId}`)
          }
        })

        console.log(`\nTotal possible moves: ${movesData.possibleMoves.length}`)
      } else {
        console.log('No possible moves available')
      }
    } catch (e) {
      console.error('Error parsing moves data:', e)
      console.log('Raw response:', data)
    }
  })
})

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`)
})

req.end()
