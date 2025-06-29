const http = require('http')
const { Board } = require('./nodots-backgammon-core/dist/Board')

// Game ID from the most recent game created
const gameId = 'ed5eeef7-fd43-4d64-91a7-b564ebc965f5'

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/v1/games/${gameId}/roll`,
  method: 'POST',
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
      const game = JSON.parse(data)
      console.log('Dice rolled successfully!')
      console.log('Game state:', game.stateKind)
      console.log('Active player:', game.activePlayer.color)

      // Display dice information
      if (
        game.activePlayer.dice &&
        game.activePlayer.dice.stateKind === 'active'
      ) {
        console.log('Dice values:', game.activePlayer.dice.values)
      }

      // Display ASCII board
      const asciiBoard = Board.getAsciiGameBoard(
        game.board,
        game.players,
        game.activeColor,
        game.stateKind
      )
      console.log(asciiBoard)
    } catch (e) {
      console.log('Raw response:', data)
    }
  })
})

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`)
})

req.end()
