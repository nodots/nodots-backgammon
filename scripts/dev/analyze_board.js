console.log('DEBUG: analyze_board.js started')
const fetch = require('node-fetch')

// Standard backgammon opening positions
const STANDARD_OPENING = {
  // Both players start with these positions (from their perspective)
  1: 2, // 2 checkers on point 1
  6: 5, // 5 checkers on point 6
  8: 3, // 3 checkers on point 8
  13: 5, // 5 checkers on point 13
  17: 3, // 3 checkers on point 17
  19: 5, // 5 checkers on point 19
  24: 2, // 2 checkers on point 24
}

async function analyzeBoard(gameId) {
  console.log('DEBUG: analyzeBoard called with gameId:', gameId)
  const url = `http://localhost:3000/api/v1/games/${gameId}`
  console.log('DEBUG: fetching from URL:', url)
  const res = await fetch(url)
  console.log('DEBUG: fetch completed, status:', res.status)
  const game = await res.json()
  console.log('DEBUG: game data parsed')
  const board = game.board
  const points = board.BackgammonPoints

  console.log(`\n=== BOARD ANALYSIS FOR GAME ${gameId} ===\n`)

  // Create a map of current positions
  const currentPositions = {}
  points.forEach((pt) => {
    const cw = pt.position.clockwise
    const ccw = pt.position.counterclockwise
    const count = pt.checkers.length
    const colors = pt.checkers.map((c) => c.color[0].toUpperCase()).join('')

    currentPositions[cw] = { count, colors, ccw }
    currentPositions[ccw] = { count, colors, cw }
  })

  console.log('CURRENT BOARD STATE:')
  console.log('Pos | Count | Colors | Dual Pos')
  console.log('----|-------|--------|---------')
  for (let pos = 1; pos <= 24; pos++) {
    const data = currentPositions[pos] || { count: 0, colors: '', ccw: pos }
    console.log(
      `${String(pos).padStart(3)} | ${String(data.count).padStart(
        5
      )} | ${data.colors.padStart(6)} | ${data.ccw || pos}`
    )
  }

  console.log('\n=== STANDARD OPENING POSITIONS ===')
  console.log('Both players should have:')
  Object.entries(STANDARD_OPENING).forEach(([pos, count]) => {
    console.log(`  Point ${pos}: ${count} checkers`)
  })

  console.log('\n=== DISCREPANCIES ===')
  let hasErrors = false

  // Check each standard position
  Object.entries(STANDARD_OPENING).forEach(([pos, expectedCount]) => {
    const current = currentPositions[pos] || { count: 0, colors: '' }
    if (current.count !== expectedCount) {
      console.log(
        `❌ Point ${pos}: Expected ${expectedCount}, got ${current.count} (${current.colors})`
      )
      hasErrors = true
    } else {
      console.log(
        `✅ Point ${pos}: ${expectedCount} checkers (${current.colors})`
      )
    }
  })

  // Check for unexpected checkers
  console.log('\n=== UNEXPECTED CHECKERS ===')
  for (let pos = 1; pos <= 24; pos++) {
    const current = currentPositions[pos] || { count: 0, colors: '' }
    const expected = STANDARD_OPENING[pos] || 0
    if (current.count > 0 && expected === 0) {
      console.log(
        `❌ Point ${pos}: ${current.count} unexpected checkers (${current.colors})`
      )
      hasErrors = true
    }
  }

  if (!hasErrors) {
    console.log('\n✅ Board appears to match standard opening positions!')
  } else {
    console.log('\n❌ Board has discrepancies from standard opening positions.')
  }

  // Show total checker counts
  const totalCheckers = points.reduce((sum, pt) => sum + pt.checkers.length, 0)
  console.log(`\nTotal checkers on board: ${totalCheckers} (should be 30)`)
}

analyzeBoard(process.argv[2])
