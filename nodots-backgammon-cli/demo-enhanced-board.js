const chalk = require('chalk')

// Mock game data based on the API structure we saw earlier
const mockGameData = {
  id: 'demo-game-12345678-abcd-ef90-1234-567890abcdef',
  stateKind: 'rolled',
  activeColor: 'black',
  players: [
    {
      color: 'white',
      pipCount: 142,
      dice: {
        currentRoll: [4, 5],
        total: 9,
      },
    },
    {
      color: 'black',
      pipCount: 158,
      dice: {
        currentRoll: [5, 2],
        total: 7,
      },
    },
  ],
  board: {
    points: [
      // Point 1 (0-indexed) - 11 black checkers
      {
        position: { clockwise: 1, counterclockwise: 24 },
        checkers: [
          { color: 'black' },
          { color: 'black' },
          { color: 'black' },
          { color: 'black' },
          { color: 'black' },
          { color: 'black' },
          { color: 'black' },
          { color: 'black' },
          { color: 'black' },
          { color: 'black' },
          { color: 'black' },
        ],
      },
      // Point 2 - 4 black checkers
      {
        position: { clockwise: 2, counterclockwise: 23 },
        checkers: [
          { color: 'black' },
          { color: 'black' },
          { color: 'black' },
          { color: 'black' },
        ],
      },
      // Points 3-19 - empty
      ...Array.from({ length: 17 }, (_, i) => ({
        position: { clockwise: i + 3, counterclockwise: 22 - i },
        checkers: [],
      })),
      // Point 20 - 1 white checker
      {
        position: { clockwise: 20, counterclockwise: 5 },
        checkers: [{ color: 'white' }],
      },
      // Point 21 - 6 white checkers
      {
        position: { clockwise: 21, counterclockwise: 4 },
        checkers: [
          { color: 'white' },
          { color: 'white' },
          { color: 'white' },
          { color: 'white' },
          { color: 'white' },
          { color: 'white' },
        ],
      },
      // Point 22 - 2 white checkers
      {
        position: { clockwise: 22, counterclockwise: 3 },
        checkers: [{ color: 'white' }, { color: 'white' }],
      },
      // Point 23 - 1 white checker
      {
        position: { clockwise: 23, counterclockwise: 2 },
        checkers: [{ color: 'white' }],
      },
      // Point 24 - 2 white checkers
      {
        position: { clockwise: 24, counterclockwise: 1 },
        checkers: [{ color: 'white' }, { color: 'white' }],
      },
    ],
    bar: {
      clockwise: { checkers: [] },
      counterclockwise: { checkers: [] },
    },
    off: {
      clockwise: {
        checkers: [{ color: 'white' }, { color: 'white' }, { color: 'white' }],
      },
      counterclockwise: { checkers: [] },
    },
  },
}

// Simple enhanced board renderer (simplified version of the TypeScript class)
function renderEnhancedBoard(game) {
  let output = '\n'

  // Enhanced header with game info
  output += renderGameHeader(game)
  output += '\n'

  // Beautiful board with Unicode box drawing
  output += renderBeautifulBoard(game)
  output += '\n'

  // Enhanced game status
  output += renderGameStatus(game)

  return output
}

function renderGameHeader(game) {
  let output = ''

  // Top border with game info
  output += chalk.cyan(
    '╔══════════════════════════════════════════════════════════════════════╗\n'
  )
  output +=
    chalk.cyan('║') +
    chalk.bold.white(
      ` NODOTS BACKGAMMON - Game ${game.id.substring(0, 8)}...`.padEnd(70)
    ) +
    chalk.cyan('║\n')

  // Players and scores
  const player1 = game.players[0]
  const player2 = game.players[1]

  const p1Name = 'Robot Alpha'.substring(0, 15).padEnd(15)
  const p2Name = 'Robot Beta'.substring(0, 15).padEnd(15)

  const p1Pip = String(player1.pipCount || 167).padStart(3)
  const p2Pip = String(player2.pipCount || 167).padStart(3)

  output +=
    chalk.cyan('║') +
    chalk.white(' ') +
    chalk.bold.white('●') +
    ` ${p1Name} (${p1Pip})` +
    chalk.gray(' vs ') +
    chalk.bold.white('○') +
    ` ${p2Name} (${p2Pip})`.padEnd(35) +
    chalk.cyan('║\n')

  // Current player and dice
  if (game.activeColor && game.players) {
    const activePlayer = game.activeColor === 'white' ? player1 : player2
    const dice = activePlayer.dice?.currentRoll || []
    const diceStr =
      dice.length > 0 ? `Dice: [${dice.join(', ')}]` : 'Ready to roll'

    output +=
      chalk.cyan('║') +
      chalk.yellow(
        ` Current: ${game.activeColor.toUpperCase()} Player `.padEnd(30)
      ) +
      chalk.magenta(diceStr.padEnd(40)) +
      chalk.cyan('║\n')
  }

  output += chalk.cyan(
    '╚══════════════════════════════════════════════════════════════════════╝\n'
  )

  return output
}

function renderBeautifulBoard(game) {
  const board = game.board
  let output = ''

  // Prepare point data
  const points = parsePointData(board)
  const barData = parseBarData(board)
  const offData = parseOffData(board)

  // Top border
  output += chalk.cyan(
    '╔══════════════════════════════════════╤═════╤══════════════════════════════════════╗\n'
  )

  // Point numbers (top)
  output +=
    chalk.cyan('║') +
    chalk.bold.gray(' 13  14  15  16  17  18 ') +
    chalk.cyan('│') +
    chalk.bold.yellow(' BAR ') +
    chalk.cyan('│') +
    chalk.bold.gray(' 19  20  21  22  23  24 ') +
    chalk.cyan('║\n')

  output += chalk.cyan(
    '╠══════════════════════════════════════╪═════╪══════════════════════════════════════╣\n'
  )

  // Upper board (5 rows)
  for (let row = 0; row < 5; row++) {
    output += chalk.cyan('║')

    // Points 13-18
    for (let point = 12; point <= 17; point++) {
      const pointData = points[point]
      output += renderPointCell(pointData, row, point + 1)
    }

    // Bar section
    output += chalk.cyan('│')
    if (row === 0) {
      const whiteBar = barData.white || 0
      const blackBar = barData.black || 0
      output +=
        chalk.gray(` ${whiteBar}`) +
        chalk.yellow('│') +
        chalk.gray(`${blackBar} `)
    } else if (row === 1) {
      output += chalk.yellow(' ■│■ ')
    } else if (row === 2) {
      output += chalk.bold.yellow(' BAR ')
    } else {
      output += '     '
    }
    output += chalk.cyan('│')

    // Points 19-24
    for (let point = 18; point <= 23; point++) {
      const pointData = points[point]
      output += renderPointCell(pointData, row, point + 1)
    }

    output += chalk.cyan('║\n')
  }

  // Middle separator
  output += chalk.cyan(
    '╠══════════════════════════════════════╪═════╪══════════════════════════════════════╣\n'
  )

  // Lower board (5 rows, reversed)
  for (let row = 4; row >= 0; row--) {
    output += chalk.cyan('║')

    // Points 12-7 (reverse order)
    for (let point = 11; point >= 6; point--) {
      const pointData = points[point]
      output += renderPointCell(pointData, row, point + 1)
    }

    // Home section
    output += chalk.cyan('│')
    if (row === 4) {
      const whiteOff = offData.white || 0
      const blackOff = offData.black || 0
      output +=
        chalk.gray(` ${whiteOff}`) +
        chalk.green('│') +
        chalk.gray(`${blackOff} `)
    } else if (row === 3) {
      output += chalk.green(' ■│■ ')
    } else if (row === 2) {
      output += chalk.bold.green('HOME ')
    } else {
      output += '     '
    }
    output += chalk.cyan('│')

    // Points 6-1 (reverse order)
    for (let point = 5; point >= 0; point--) {
      const pointData = points[point]
      output += renderPointCell(pointData, row, point + 1)
    }

    output += chalk.cyan('║\n')
  }

  // Bottom border with point numbers
  output += chalk.cyan(
    '╠══════════════════════════════════════╪═════╪══════════════════════════════════════╣\n'
  )
  output +=
    chalk.cyan('║') +
    chalk.bold.gray(' 12  11  10   9   8   7 ') +
    chalk.cyan('│') +
    chalk.bold.green('HOME ') +
    chalk.cyan('│') +
    chalk.bold.gray('  6   5   4   3   2   1 ') +
    chalk.cyan('║\n')

  output += chalk.cyan(
    '╚══════════════════════════════════════╧═════╧══════════════════════════════════════╝\n'
  )

  return output
}

function renderPointCell(pointData, row, pointNum) {
  const checkerCount = pointData?.checkers || 0
  const color = pointData?.color || null

  if (checkerCount > row) {
    // Show checker
    if (color === 'white') {
      return chalk.bold.white(' ○ ')
    } else if (color === 'black') {
      return chalk.bold.black(' ● ')
    } else {
      return chalk.gray(' ? ')
    }
  } else if (row === 4) {
    // Show point number on bottom row
    return chalk.dim.gray(String(pointNum).padStart(2) + ' ')
  } else if (row === 0 && checkerCount > 5) {
    // Show count for stacked checkers
    return chalk.yellow(String(checkerCount).padStart(2) + '+')
  } else {
    // Empty space
    return '   '
  }
}

function parsePointData(board) {
  const points = new Array(24)

  if (board.points && Array.isArray(board.points)) {
    board.points.forEach((point) => {
      if (point.position && point.position.clockwise) {
        const index = point.position.clockwise - 1
        points[index] = {
          checkers: point.checkers?.length || 0,
          color: point.checkers?.[0]?.color || null,
        }
      }
    })
  }

  // Fill empty points
  for (let i = 0; i < 24; i++) {
    if (!points[i]) {
      points[i] = { checkers: 0, color: null }
    }
  }

  return points
}

function parseBarData(board) {
  if (board.bar?.clockwise && board.bar?.counterclockwise) {
    return {
      white: board.bar.clockwise.checkers?.length || 0,
      black: board.bar.counterclockwise.checkers?.length || 0,
    }
  }

  return {
    white: board.bar?.white || 0,
    black: board.bar?.black || 0,
  }
}

function parseOffData(board) {
  if (board.off?.clockwise && board.off?.counterclockwise) {
    return {
      white: board.off.clockwise.checkers?.length || 0,
      black: board.off.counterclockwise.checkers?.length || 0,
    }
  }

  return {
    white: board.off?.white || 0,
    black: board.off?.black || 0,
  }
}

function renderGameStatus(game) {
  let output = ''

  // Status box
  output +=
    chalk.blue('┌─ GAME STATUS ') +
    chalk.blue('─'.repeat(55)) +
    chalk.blue('┐\n')

  // Game state
  const state = game.stateKind || game.status || 'unknown'
  output +=
    chalk.blue('│ ') +
    chalk.yellow('State: ') +
    chalk.white(state.toUpperCase().padEnd(63)) +
    chalk.blue('│\n')

  // Active player
  if (game.activeColor) {
    const activeMsg = `${game.activeColor.toUpperCase()} player's turn`
    output +=
      chalk.blue('│ ') +
      chalk.yellow('Turn:  ') +
      chalk.white(activeMsg.padEnd(63)) +
      chalk.blue('│\n')
  }

  // Dice information
  if (game.players) {
    game.players.forEach((player, index) => {
      const dice = player.dice?.currentRoll || []
      const color = player.color || (index === 0 ? 'white' : 'black')
      const symbol = color === 'white' ? '○' : '●'

      if (dice.length > 0) {
        const diceStr = `${symbol} Dice: [${dice.join(', ')}] (Total: ${
          player.dice?.total || dice.reduce((a, b) => a + b, 0)
        })`
        output +=
          chalk.blue('│ ') + chalk.cyan(diceStr.padEnd(69)) + chalk.blue('│\n')
      }
    })
  }

  output += chalk.blue('└') + chalk.blue('─'.repeat(70)) + chalk.blue('┘\n')

  // Legend
  output += '\n' + chalk.dim('Legend: ● = Black checkers, ○ = White checkers\n')
  output += chalk.dim('        BAR = Hit checkers, HOME = Borne off checkers\n')

  return output
}

// Display the demo
console.log(chalk.bold.green('🎲 ENHANCED BACKGAMMON BOARD DEMO 🎲\n'))
console.log(chalk.yellow('This is what the enhanced ASCII board looks like:'))
console.log(renderEnhancedBoard(mockGameData))

console.log(chalk.bold.cyan('\n📋 FEATURES DEMONSTRATED:'))
console.log(chalk.white('✅ Unicode box drawing characters for crisp borders'))
console.log(chalk.white('✅ Color-coded checkers (● black, ○ white)'))
console.log(chalk.white('✅ Clear point numbering and section labels'))
console.log(chalk.white('✅ Comprehensive game status information'))
console.log(chalk.white('✅ Bar and home area indicators'))
console.log(chalk.white('✅ Dice roll display'))
console.log(chalk.white('✅ Player information and pip counts'))

console.log(chalk.bold.yellow('\n🚀 USAGE EXAMPLES:'))
console.log(chalk.gray('When API server is running:'))
console.log(chalk.white('  nodots-backgammon robot-board <simulation-id>'))
console.log(
  chalk.white('  nodots-backgammon robot-board <simulation-id> --raw')
)
console.log(chalk.white('  nodots-backgammon robot-board --game-id <game-id>'))

console.log(
  chalk.dim('\nThis enhanced board uses the same API structure but provides')
)
console.log(
  chalk.dim('much prettier visual presentation than the standard output.')
)
