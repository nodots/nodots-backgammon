const fetch = require('node-fetch')

async function showTabularBoard(gameId) {
  if (!gameId) {
    console.error('Usage: node show_board_tabular.js <gameId>')
    process.exit(1)
  }
  const url = `http://localhost:3000/api/v1/games/${gameId}`
  const res = await fetch(url)
  if (!res.ok) {
    console.error('Failed to fetch game:', await res.text())
    process.exit(1)
  }
  const game = await res.json()
  console.log('DEBUG: fetched game:', JSON.stringify(game, null, 2))
  if (!game || !game.board || !game.board.BackgammonPoints) {
    console.error('Malformed game data:', JSON.stringify(game, null, 2))
    process.exit(1)
  }
  const board = game.board
  const points = board.BackgammonPoints

  console.log(`Game ID: ${gameId}`)
  console.log('PosCW | PosCCW | #Checkers | Colors')
  console.log('--------------------------------------')
  points
    .sort((a, b) => a.position.clockwise - b.position.clockwise)
    .forEach((pt) => {
      const n = pt.checkers.length
      const colors = pt.checkers.map((c) => c.color[0].toUpperCase()).join('')
      console.log(
        `${String(pt.position.clockwise).padStart(5)} | ${String(
          pt.position.counterclockwise
        ).padStart(6)} | ${String(n).padStart(9)} | ${colors}`
      )
    })
}

showTabularBoard(process.argv[2])
