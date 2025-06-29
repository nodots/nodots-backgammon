const fetch = require('node-fetch')

async function showPossibleMoves(gameId) {
  if (!gameId) {
    console.error('Usage: node show_possible_moves.js <gameId>')
    process.exit(1)
  }

  const url = `http://localhost:3000/api/v1/games/${gameId}/possible-moves`
  const res = await fetch(url)
  const data = await res.json()

  console.log(`\n=== POSSIBLE MOVES FOR GAME ${gameId} ===`)
  console.log(`Player: ${data.playerColor} (${data.playerId})`)
  console.log(`\nPossible Moves:`)
  console.log('Origin Point | Dest Point | Die Value | Direction')
  console.log('-------------|------------|-----------|-----------')

  data.possibleMoves.forEach((move, index) => {
    const originPos = move.origin.position.counterclockwise
    const destPos = move.destination.position.counterclockwise
    const dieValue = move.dieValue
    const direction = move.direction

    console.log(
      `${originPos.toString().padStart(11)} | ${destPos
        .toString()
        .padStart(10)} | ${dieValue.toString().padStart(9)} | ${direction}`
    )
  })

  console.log(`\nTotal possible moves: ${data.possibleMoves.length}`)
}

// Execute the function
const gameId = process.argv[2]
showPossibleMoves(gameId).catch(console.error)
