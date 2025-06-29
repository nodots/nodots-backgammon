const http = require('http')

// Let me first check if there's an endpoint to get possible moves
// Or try to understand why no moves are working

console.log('=== DEBUGGING MOVE ISSUES ===')

// Game ID from the most recent game created
const gameId = '9684dd41-7702-4518-bd46-91baa1364ce7'

// Let's get the current game state and analyze it
const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/v1/games/${gameId}`,
  method: 'GET',
}

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`)

  let responseData = ''
  res.on('data', (chunk) => {
    responseData += chunk
  })

  res.on('end', () => {
    try {
      const game = JSON.parse(responseData)

      console.log('\n=== GAME ANALYSIS ===')
      console.log('Game State:', game.stateKind)
      console.log('Active Player:', game.activeColor)

      // Find active player and their dice
      const activePlayer = game.players.find(
        (p) => p.color === game.activeColor
      )
      if (activePlayer) {
        console.log('Active Player Details:')
        console.log('  Color:', activePlayer.color)
        console.log('  Direction:', activePlayer.direction)
        console.log('  State:', activePlayer.stateKind)
        if (activePlayer.dice) {
          console.log('  Dice State:', activePlayer.dice.stateKind)
          console.log('  Current Roll:', activePlayer.dice.currentRoll)
          console.log('  Total:', activePlayer.dice.total)
        }
      }

      // Check white checkers and their positions
      console.log('\nWhite Checker Positions:')
      let whiteCheckerCount = 0
      game.board.BackgammonPoints.forEach((point) => {
        const whiteCheckers = point.checkers.filter((c) => c.color === 'white')
        if (whiteCheckers.length > 0) {
          console.log(
            `  Point ${point.position.clockwise}: ${whiteCheckers.length} checkers`
          )
          whiteCheckerCount += whiteCheckers.length
        }
      })
      console.log(`Total white checkers: ${whiteCheckerCount}`)

      // Check for blockers that might prevent movement
      console.log('\nBlack Checker Positions (potential blockers):')
      game.board.BackgammonPoints.forEach((point) => {
        const blackCheckers = point.checkers.filter((c) => c.color === 'black')
        if (blackCheckers.length >= 2) {
          // Point is blocked if 2+ checkers
          console.log(
            `  Point ${point.position.clockwise} BLOCKED: ${blackCheckers.length} black checkers`
          )
        }
      })

      console.log('========================\n')
    } catch (e) {
      console.log('Raw response:', responseData)
    }
  })
})

req.on('error', (error) => {
  console.error('Error:', error)
})

req.end()
