const fetch = require('node-fetch')

async function debugPositions() {
  try {
    const gameResponse = await fetch(
      'http://localhost:3000/api/v1/games/c94b17cf-41c4-41be-a150-03f0ea6a2617'
    )
    const game = await gameResponse.json()

    console.log('=== BOARD POSITION DEBUG ===\n')

    console.log('Players:')
    game.players.forEach((player) => {
      console.log(`- ${player.color} (${player.direction}): ${player.userId}`)
    })

    console.log('\n=== POINT POSITIONS ===')
    game.board.BackgammonPoints.forEach((point, index) => {
      if (point.checkers.length > 0) {
        console.log(`Point ${index + 1}:`)
        console.log(`  Clockwise position: ${point.position.clockwise}`)
        console.log(
          `  Counterclockwise position: ${point.position.counterclockwise}`
        )
        console.log(
          `  Checkers: ${point.checkers.length} (${point.checkers
            .map((c) => c.color)
            .join(', ')})`
        )
        console.log('')
      }
    })

    console.log('=== EXPECTED vs ACTUAL ===')
    console.log('Expected clockwise player (white) positions: 24, 13, 8, 6')
    console.log(
      'Expected counterclockwise player (black) positions: 1, 12, 17, 19'
    )
    console.log('')

    // Check what's actually on each expected position
    const expectedWhitePositions = [24, 13, 8, 6]
    const expectedBlackPositions = [1, 12, 17, 19]

    console.log('Checking clockwise positions (should be white):')
    expectedWhitePositions.forEach((pos) => {
      const point = game.board.BackgammonPoints.find(
        (p) => p.position.clockwise === pos
      )
      if (point && point.checkers.length > 0) {
        console.log(
          `  Position ${pos}: ${point.checkers[0].color} (${point.checkers.length} checkers)`
        )
      } else {
        console.log(`  Position ${pos}: empty`)
      }
    })

    console.log('\nChecking counterclockwise positions (should be black):')
    expectedBlackPositions.forEach((pos) => {
      const point = game.board.BackgammonPoints.find(
        (p) => p.position.counterclockwise === pos
      )
      if (point && point.checkers.length > 0) {
        console.log(
          `  Position ${pos}: ${point.checkers[0].color} (${point.checkers.length} checkers)`
        )
      } else {
        console.log(`  Position ${pos}: empty`)
      }
    })
  } catch (error) {
    console.error('Error:', error.message)
  }
}

debugPositions()
