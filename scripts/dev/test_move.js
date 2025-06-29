const http = require('http')

// Game ID from the most recent game created
const gameId = '9684dd41-7702-4518-bd46-91baa1364ce7'
// Active player ID (white player)
const playerId = 'cae217aa-44a5-40c2-bd5b-775c51c3b2bc'

// From the board data, let's try to move one of white's checkers from point 8
// We need a specific checker ID - let's use one from point 8
const checkerId = '87155863-579d-4173-8bbe-7e229868146f' // One of white's checkers on point 8

const data = JSON.stringify({
  checkerId: checkerId,
  playerId: playerId,
})

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/v1/games/${gameId}/move`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
}

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`)

  let responseData = ''
  res.on('data', (chunk) => {
    responseData += chunk
  })

  res.on('end', () => {
    try {
      const response = JSON.parse(responseData)
      console.log('\n=== MOVE ATTEMPTED ===')

      if (response.possibleMoves) {
        console.log('Multiple moves possible:')
        response.possibleMoves.forEach((move, index) => {
          console.log(
            `  ${index + 1}. From ${move.from} to ${move.to} (die: ${
              move.dieValue
            })`
          )
        })
      } else if (response.stateKind) {
        console.log('Move completed successfully!')
        console.log('Game State:', response.stateKind)
        console.log('Active Player:', response.activeColor)

        // Show ASCII board if available
        if (response.ascii) {
          console.log('\nBoard after move:')
          console.log(response.ascii)
        }
      } else if (response.error) {
        console.log('Move failed:', response.error)
      }

      console.log('======================\n')
    } catch (e) {
      console.log('Raw response:', responseData)
    }
  })
})

req.on('error', (error) => {
  console.error('Error:', error)
})

req.write(data)
req.end()
