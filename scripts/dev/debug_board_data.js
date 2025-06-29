const fetch = require('node-fetch')

async function debugBoardData() {
  try {
    // Fetch the game
    const gameResponse = await fetch(
      'http://localhost:3000/api/v1/games/c94b17cf-41c4-41be-a150-03f0ea6a2617'
    )
    const game = await gameResponse.json()

    console.log('=== GAME INFO ===')
    console.log('Game ID:', game.id)
    console.log('State:', game.stateKind)
    console.log('Active Color:', game.activeColor)

    console.log('\n=== PLAYERS ===')
    game.players.forEach((player) => {
      console.log(
        `${player.color} (${player.direction}): ${player.userId} (${
          player.isRobot ? 'Robot' : 'Human'
        })`
      )
    })

    console.log('\n=== BOARD POINTS ===')
    const points = game.board.BackgammonPoints
    points.forEach((point, index) => {
      console.log(`Point ${index}:`)
      console.log(`  Clockwise position: ${point.position.clockwise}`)
      console.log(
        `  Counterclockwise position: ${point.position.counterclockwise}`
      )
      console.log(
        `  Checkers:`,
        point.checkers.map((c) => `${c.color} (${c.playerId})`)
      )
      console.log('')
    })

    console.log('\n=== BAR ===')
    console.log(
      'Clockwise bar:',
      game.board.bar.clockwise.checkers.map((c) => `${c.color} (${c.playerId})`)
    )
    console.log(
      'Counterclockwise bar:',
      game.board.bar.counterclockwise.checkers.map(
        (c) => `${c.color} (${c.playerId})`
      )
    )

    console.log('\n=== OFF ===')
    console.log(
      'Clockwise off:',
      game.board.off.clockwise.checkers.map((c) => `${c.color} (${c.playerId})`)
    )
    console.log(
      'Counterclockwise off:',
      game.board.off.counterclockwise.checkers.map(
        (c) => `${c.color} (${c.playerId})`
      )
    )
  } catch (error) {
    console.error('Error:', error.message)
  }
}

debugBoardData()
