const http = require('http')

// Game ID from the most recent game created
const gameId = '9684dd41-7702-4518-bd46-91baa1364ce7'
// Active player ID (white player)
const playerId = 'cae217aa-44a5-40c2-bd5b-775c51c3b2bc'

const data = JSON.stringify({
  playerId: playerId,
})

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/v1/games/${gameId}/roll`,
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
      const gameData = JSON.parse(responseData)
      console.log('\n=== DICE ROLLED ===')
      console.log('Game State:', gameData.stateKind)
      console.log('Active Player:', gameData.activeColor)

      // Find the active player and show their dice
      const activePlayer = gameData.players.find(
        (p) => p.color === gameData.activeColor
      )
      if (activePlayer && activePlayer.dice && activePlayer.dice.currentRoll) {
        console.log('Dice Roll:', activePlayer.dice.currentRoll)
        console.log('Total:', activePlayer.dice.total)
      }

      // Show ASCII board if available
      if (gameData.ascii) {
        console.log('\nBoard after roll:')
        console.log(gameData.ascii)
      }
      console.log('==================\n')
    } catch (e) {
      console.log('Response:', responseData)
    }
  })
})

req.on('error', (error) => {
  console.error('Error:', error)
})

req.write(data)
req.end()
