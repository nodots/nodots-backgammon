const fetch = require('node-fetch')

async function checkBoardSetup() {
  try {
    const response = await fetch(
      'http://localhost:3000/api/v1/games/9a64f4d0-01e9-41a1-bd1e-db1483f1b465'
    )
    const game = await response.json()

    console.log('=== BOARD ANALYSIS ===')
    console.log(`Game ID: ${game.id}`)
    console.log(`Game State: ${game.stateKind}`)
    console.log(`Active Color: ${game.activeColor}`)

    console.log('\n=== POINTS WITH CHECKERS ===')
    game.board.BackgammonPoints.forEach((point) => {
      if (point.checkers.length > 0) {
        const color = point.checkers[0].color
        const count = point.checkers.length
        console.log(
          `Point ${point.position.clockwise}/${point.position.counterclockwise}: ${count} ${color} checkers`
        )
      }
    })

    console.log('\n=== WHAT STANDARD BACKGAMMON SHOULD LOOK LIKE ===')
    console.log('Point 1: 2 white checkers')
    console.log('Point 6: 5 white checkers')
    console.log('Point 8: 3 white checkers')
    console.log('Point 12: 5 black checkers')
    console.log('Point 13: 5 white checkers')
    console.log('Point 17: 3 black checkers')
    console.log('Point 19: 5 black checkers')
    console.log('Point 24: 2 black checkers')

    // Count total checkers
    let blackCount = 0,
      whiteCount = 0
    game.board.BackgammonPoints.forEach((point) => {
      point.checkers.forEach((checker) => {
        if (checker.color === 'black') blackCount++
        else whiteCount++
      })
    })

    console.log(`\n=== CHECKER TOTALS ===`)
    console.log(`Black checkers: ${blackCount}`)
    console.log(`White checkers: ${whiteCount}`)
  } catch (error) {
    console.error('Error:', error)
  }
}

checkBoardSetup()
