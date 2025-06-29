const http = require('http')
const { Board } = require('./nodots-backgammon-core/dist/Board')

// Game ID from the most recent game created
const gameId = '737c6d68-dd26-4b3c-b7c8-f6cf2386e842'

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
      console.log('')

      // Always present the board as white moving clockwise, black counterclockwise
      const asciiBoard = Board.getAsciiBoard(gameData.board, gameData.players)
      // Patch: Replace legend and player info with unified presentation
      const unifiedLegend =
        'LEGEND: BLACK (X) [clockwise]  WHITE (O) [counterclockwise]'
      const asciiBoardPatched = asciiBoard.replace(
        /LEGEND:.*\n/, // replace the legend line
        unifiedLegend + '\n'
      )
      console.log(asciiBoardPatched)

      console.log('')
      console.log('=== PLAYER INFO (Unified Presentation) ===')
      console.log('BLACK: clockwise (as seen by user)')
      console.log('WHITE: counterclockwise (as seen by user)')
    } catch (error) {
      console.error('Error parsing response:', error)
      console.log('Raw response:', data)
    }
  })
})

req.on('error', (error) => {
  console.error('Error making request:', error)
})

req.end()
