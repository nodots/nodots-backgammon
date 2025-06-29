const http = require('http')

// Game ID from the current game
const gameId = 'bd766bee-253f-40dd-8746-7d27ec5164db'

// Use one of the checker IDs from the possible moves
// Let's move the checker from point-1 (position 24) to point-3 (position 22) using die value 2
const checkerId = '4b1234f1-7f7d-4d8a-ac42-42b773c38870' // Black checker on point-1

const postData = JSON.stringify({
  playerId: '94d93860-09fd-48d5-818a-d3901b9f72f6', // Black player ID
  checkerId: checkerId,
})

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/v1/games/${gameId}/move`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
}

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`)
  console.log(`Headers: ${JSON.stringify(res.headers)}`)

  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    console.log('=== MOVE RESPONSE ===')
    console.log('Response:', data)

    if (res.statusCode === 200) {
      try {
        const result = JSON.parse(data)
        console.log('\n=== SUCCESS ===')
        console.log('Game ID:', result.gameId)
        console.log('Game State:', result.stateKind)
        console.log('Active Color:', result.activeColor)
        console.log('Move executed successfully!')

        if (result.activePlay) {
          console.log(
            'Remaining moves in play:',
            result.activePlay.movesCount || 'unknown'
          )
        }

        // Display the new board state
        if (result.board) {
          console.log('\n=== NEW BOARD STATE ===')
          const { Board } = require('./nodots-backgammon-core/dist/Board')
          const board = new Board(result.board)
          console.log(board.toAscii())
        }
      } catch (e) {
        console.log('Error parsing response:', e.message)
      }
    } else {
      console.log('Move failed with status:', res.statusCode)
    }
  })
})

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`)
})

req.write(postData)
req.end()
