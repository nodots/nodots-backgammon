const https = require('http')
const { Board } = require('./nodots-backgammon-core/dist/Board')

const gameData = {
  player1: {
    userId: 'cae217aa-44a5-40c2-bd5b-775c51c3b2bc',
  },
  player2: {
    userId: '29ec9420-e628-4b0c-a56f-38b32d8dad10',
  },
}

const postData = JSON.stringify(gameData)

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/games',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
}

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`)

  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    try {
      const game = JSON.parse(data)
      console.log('Game created successfully:')
      console.log(JSON.stringify(game, null, 2))
      // Display ASCII board
      const asciiBoard = Board.getAsciiGameBoard(
        game.board,
        game.players,
        game.activeColor,
        game.stateKind
      )
      console.log(asciiBoard)
    } catch (e) {
      console.error('Error parsing game data or displaying board:', e)
      console.log('Raw response:', data)
    }
  })
})

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`)
})

req.write(postData)
req.end()
