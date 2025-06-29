const http = require('http')
const { Board } = require('./nodots-backgammon-core/dist/Board')

// Game ID from the most recent game created
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
  console.log(`Status: ${res.statusCode}`)

  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    try {
      const gameData = JSON.parse(data)
      console.log('=== CURRENT GAME STATE ===')
      console.log('Game ID:', gameData.id)
      console.log('Game State:', gameData.stateKind)
      console.log('Active Color:', gameData.activeColor)

      // Show both players and their dice
      gameData.players.forEach((player, index) => {
        console.log(`\nPlayer ${index + 1} (${player.color}):`)
        console.log('  ID:', player.id)
        console.log('  User ID:', player.userId)
        console.log('  Direction:', player.direction)
        console.log('  State:', player.stateKind)
        console.log('  Dice State:', player.dice.stateKind)
        if (player.dice.currentRoll) {
          console.log('  Dice Roll:', player.dice.currentRoll)
          console.log('  Total:', player.dice.total)
        }
      })

      // Display ASCII board
      const asciiBoard = Board.getAsciiGameBoard(
        gameData.board,
        gameData.players,
        gameData.activeColor,
        gameData.stateKind
      )
      console.log('\n' + asciiBoard)
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
