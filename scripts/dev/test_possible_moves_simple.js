const http = require('http')

// Test the possible moves endpoint
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
    console.log('Response:', data)

    if (res.statusCode === 200) {
      try {
        const result = JSON.parse(data)
        console.log('\n=== SUCCESS ===')
        console.log('Game ID:', result.gameId)
        console.log('Player ID:', result.playerId)
        console.log('Player Color:', result.playerColor)
        console.log(
          'Possible Moves Count:',
          result.possibleMoves ? result.possibleMoves.length : 0
        )

        if (result.possibleMoves && result.possibleMoves.length > 0) {
          console.log('\nPossible Moves:')
          result.possibleMoves.forEach((move, index) => {
            const originStr =
              move.origin.kind === 'point'
                ? `point-${move.origin.position.clockwise}`
                : move.origin.kind
            const destStr =
              move.destination.kind === 'point'
                ? `point-${move.destination.position.clockwise}`
                : move.destination.kind
            console.log(
              `  ${index + 1}: Die ${move.dieValue} - ${originStr} → ${destStr}`
            )
          })
        } else {
          console.log('No possible moves found')
        }
      } catch (e) {
        console.error('Error parsing response:', e)
      }
    } else {
      console.log('\n=== ERROR ===')
      console.log('Server returned error status:', res.statusCode)
    }
  })
})

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`)
})

req.end()
