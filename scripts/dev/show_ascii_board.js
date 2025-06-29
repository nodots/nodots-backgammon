console.log('DEBUG: Script started')
const fetch = require('node-fetch')

function createAsciiBoard(board, players) {
  const points = board.BackgammonPoints
  const bar = board.bar

  // Enhanced legend for player symbols, color, and direction
  let boardDisplay = ''
  if (players && players.length === 2) {
    const getSymbol = (color) => (color === 'black' ? 'X' : 'O')
    boardDisplay += 'LEGEND:'
    for (const player of players) {
      boardDisplay += ` ${player.color.toUpperCase()} (${getSymbol(
        player.color
      )}) [${player.direction}] `
    }
    boardDisplay += '\n'
  } else {
    boardDisplay += 'LEGEND: BLACK (X), WHITE (O)\n'
  }
  boardDisplay += ' +-13-14-15-16-17-18--------19-20-21-22-23-24-+ \n'

  // Find points by their position numbers
  const findPointByClockwise = (pos) =>
    points.find((p) => p.position.clockwise === pos)
  const findPointByCounterclockwise = (pos) =>
    points.find((p) => p.position.counterclockwise === pos)

  const displayPoint = (point, row) => {
    if (!point) return '   '
    const checkers = point.checkers
    const checker = checkers[row]
    if (!checker) return '   '
    const color = checker.color
    const symbol = color === 'black' ? ' X ' : ' O '
    return symbol
  }

  const displayBar = (bar, row) => {
    const checkers = bar.checkers
    const checker = checkers[row]
    if (!checker) return ' '
    const color = checker.color
    const symbol = color === 'black' ? 'X' : 'O'
    return symbol
  }

  // Top half of board (positions 13-18 and 19-24)
  // For visual display, we use clockwise positions for the top half
  for (let row = 0; row < 5; row++) {
    boardDisplay += ' |'
    // Left side: visual positions 13-18 (clockwise positions)
    for (let visualPos = 13; visualPos <= 18; visualPos++) {
      const point = findPointByClockwise(visualPos)
      boardDisplay += displayPoint(point, row)
    }
    boardDisplay += ' | '
    // Display bar checkers
    boardDisplay += displayBar(bar.clockwise, row)
    boardDisplay += ' | '
    // Right side: visual positions 19-24 (clockwise positions)
    for (let visualPos = 19; visualPos <= 24; visualPos++) {
      const point = findPointByClockwise(visualPos)
      boardDisplay += displayPoint(point, row)
    }
    boardDisplay += ' |\n'
  }

  boardDisplay += 'v|                   |BAR|                    |\n'

  // Bottom half of board (positions 12-7 and 6-1)
  // For visual display, we use counterclockwise positions for the bottom half
  for (let row = 4; row >= 0; row--) {
    boardDisplay += ' |'
    // Left side: visual positions 12 down to 7 (counterclockwise positions)
    for (let visualPos = 12; visualPos >= 7; visualPos--) {
      const point = findPointByCounterclockwise(visualPos)
      boardDisplay += displayPoint(point, row)
    }
    boardDisplay += ' | '
    // Display bar checkers
    boardDisplay += displayBar(bar.counterclockwise, row)
    boardDisplay += ' | '
    // Right side: visual positions 6 down to 1 (counterclockwise positions)
    for (let visualPos = 6; visualPos >= 1; visualPos--) {
      const point = findPointByCounterclockwise(visualPos)
      boardDisplay += displayPoint(point, row)
    }
    boardDisplay += ' |\n'
  }

  boardDisplay += ' +-12-11-10--9-8--7--------6--5--4--3--2--1--+ \n'

  // Count checkers by color
  const blackBarCount =
    board.bar.clockwise.checkers.filter((c) => c.color === 'black').length +
    board.bar.counterclockwise.checkers.filter((c) => c.color === 'black')
      .length
  const whiteBarCount =
    board.bar.clockwise.checkers.filter((c) => c.color === 'white').length +
    board.bar.counterclockwise.checkers.filter((c) => c.color === 'white')
      .length
  const blackOffCount =
    board.off.clockwise.checkers.filter((c) => c.color === 'black').length +
    board.off.counterclockwise.checkers.filter((c) => c.color === 'black')
      .length
  const whiteOffCount =
    board.off.clockwise.checkers.filter((c) => c.color === 'white').length +
    board.off.counterclockwise.checkers.filter((c) => c.color === 'white')
      .length

  boardDisplay += `       BLACK BAR: ${blackBarCount}          WHITE BAR: ${whiteBarCount}\n`
  boardDisplay += `       BLACK OFF: ${blackOffCount}          WHITE OFF: ${whiteOffCount}\n`
  return boardDisplay
}

async function showAsciiBoard() {
  try {
    const gameId = process.argv[2]
    if (!gameId) {
      console.error('Usage: node show_ascii_board.js <gameId>')
      process.exit(1)
    }
    // Fetch the game
    console.log('DEBUG: Before fetch')
    const gameResponse = await fetch(
      `http://localhost:3000/api/v1/games/${gameId}`
    )
    console.log('DEBUG: After fetch')
    const game = await gameResponse.json()
    console.log('DEBUG: fetched game:', JSON.stringify(game, null, 2))

    console.log('Game ID:', game.id)
    console.log('State:', game.stateKind)
    console.log('Active Color:', game.activeColor)

    console.log('\nPlayers:')
    game.players.forEach((player) => {
      console.log(
        `- ${player.color} (${player.direction}): ${player.userId} (${
          player.isRobot ? 'Robot' : 'Human'
        })`
      )
    })

    console.log('\nASCII Board (CORRECTED):')
    console.log(createAsciiBoard(game.board, game.players))
  } catch (error) {
    console.error('Error:', error.message)
  }
}

showAsciiBoard()
