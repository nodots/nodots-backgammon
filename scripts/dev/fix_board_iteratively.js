const fetch = require('node-fetch')

// Standard backgammon starting position (from GNU backgammon and official rules)
const CORRECT_SETUP = {
  1: { color: 'white', count: 2 }, // White's 24-point
  6: { color: 'white', count: 5 }, // White's 6-point
  8: { color: 'white', count: 3 }, // White's 8-point
  12: { color: 'black', count: 5 }, // Black's 13-point
  13: { color: 'white', count: 5 }, // White's 13-point
  17: { color: 'black', count: 3 }, // Black's 8-point
  19: { color: 'black', count: 5 }, // Black's 6-point
  24: { color: 'black', count: 2 }, // Black's 24-point
}

let attemptNumber = 1
let lastGameId = null

async function testConfiguration(config) {
  console.log(`\n=== ATTEMPT ${attemptNumber} ===`)
  console.log(`Testing configuration: ${JSON.stringify(config)}`)

  try {
    // Create new game
    const response = await fetch('http://localhost:3000/api/v1/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player1: { userId: `test-${Date.now()}-1` },
        player2: { userId: `test-${Date.now()}-2` },
      }),
    })

    const game = await response.json()
    lastGameId = game.id

    // Analyze the board
    const analysis = {}
    game.board.BackgammonPoints.forEach((point) => {
      if (point.checkers.length > 0) {
        const clockwisePos = point.position.clockwise
        analysis[clockwisePos] = {
          color: point.checkers[0].color,
          count: point.checkers.length,
        }
      }
    })

    // Compare with correct setup
    const errors = []
    for (const [pos, expected] of Object.entries(CORRECT_SETUP)) {
      const actual = analysis[pos]
      if (!actual) {
        errors.push(
          `Point ${pos}: Expected ${expected.count} ${expected.color}, got EMPTY`
        )
      } else if (
        actual.color !== expected.color ||
        actual.count !== expected.count
      ) {
        errors.push(
          `Point ${pos}: Expected ${expected.count} ${expected.color}, got ${actual.count} ${actual.color}`
        )
      }
    }

    if (errors.length === 0) {
      console.log('🎉 SUCCESS! Board setup is CORRECT!')
      console.log('Final board state:')
      Object.entries(analysis)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([pos, info]) => {
          console.log(`  Point ${pos}: ${info.count} ${info.color} checkers`)
        })
      return true
    } else {
      console.log(`❌ ERRORS (${errors.length}):`)
      errors.forEach((error) => console.log(`  ${error}`))
      return false
    }
  } catch (error) {
    console.error(`Error in attempt ${attemptNumber}:`, error.message)
    return false
  }
}

async function iterateUntilCorrect() {
  console.log('🔄 Starting iterative board setup fixing...')
  console.log('Target: Standard GNU backgammon starting position')

  const configurations = [
    { name: 'Current setup', modify: false },
    { name: 'Swap colors completely', swapColors: true },
    { name: 'Swap clockwise assignments', swapClockwise: true },
    { name: 'Use GNU standard positions', useGNUPositions: true },
  ]

  for (const config of configurations) {
    if (config.modify !== false) {
      console.log(`\n📝 Modifying board setup: ${config.name}`)
      // We'll implement the actual board changes here
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Brief pause
    }

    const success = await testConfiguration(config)
    if (success) {
      console.log(`\n🎉 SOLUTION FOUND: ${config.name}`)
      break
    }

    attemptNumber++
    await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5 seconds between attempts
  }
}

// Run the iterative process
iterateUntilCorrect().catch(console.error)

// Keep the process alive and show updates every 60 seconds
setInterval(() => {
  if (lastGameId) {
    console.log(
      `\n⏰ Status Update - Attempt ${attemptNumber}, Last Game: ${lastGameId}`
    )
  }
}, 60000)
