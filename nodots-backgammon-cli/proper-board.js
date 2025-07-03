const axios = require('axios')

const GAME_ID = '7653ef37-d462-42d5-8fcf-a5d3adcdfe52'
const API_URL = process.env.NODOTS_API_URL || 'http://localhost:3000'

async function showBoard() {
  try {
    console.log(`Fetching game state for: ${GAME_ID}`)

    const response = await axios.get(`${API_URL}/api/v1/games/${GAME_ID}`)
    const game = response.data

    console.log('\n=== Game Status ===')
    console.log(`Game ID: ${game.id}`)
    console.log(`State: ${game.stateKind}`)
    console.log(
      `Active Player: ${game.activeColor} (${game.activePlayer.direction})`
    )

    // Dice information
    console.log('\n=== Dice ===')
    console.log(
      `White Player Dice: [${game.players[0].dice.currentRoll.join(
        ', '
      )}] (Total: ${game.players[0].dice.total})`
    )
    console.log(
      `Black Player Dice: [${game.players[1].dice.currentRoll.join(
        ', '
      )}] (Total: ${game.players[1].dice.total})`
    )

    // Player information
    console.log('\n=== Players ===')
    console.log(
      `White Player (Clockwise): Pip Count ${game.players[0].pipCount}`
    )
    console.log(
      `Black Player (Counterclockwise): Pip Count ${game.players[1].pipCount}`
    )

    // Bar and off information
    const whiteBar = game.board.bar.clockwise.checkers.length
    const blackBar = game.board.bar.counterclockwise.checkers.length
    const whiteOff = game.board.off.clockwise.checkers.length
    const blackOff = game.board.off.counterclockwise.checkers.length

    console.log(`White: ${whiteBar} on bar, ${whiteOff} borne off`)
    console.log(`Black: ${blackBar} on bar, ${blackOff} borne off`)

    // Board state
    console.log('\n=== ASCII Board ===')
    console.log(renderBackgammonBoard(game))
  } catch (error) {
    console.error('Error fetching game:', error.response?.data || error.message)
  }
}

function renderBackgammonBoard(game) {
  const board = game.board
  let output = '\n'

  // Prepare point data - convert to simple array for easier processing
  const points = new Array(24)
  board.points.forEach((point) => {
    const clockwisePos = point.position.clockwise - 1 // Convert to 0-based
    points[clockwisePos] = {
      checkers: point.checkers.length,
      color: point.checkers.length > 0 ? point.checkers[0].color : null,
    }
  })

  // Get bar and off info
  const whiteBar = board.bar.clockwise.checkers.length
  const blackBar = board.bar.counterclockwise.checkers.length
  const whiteOff = board.off.clockwise.checkers.length
  const blackOff = board.off.counterclockwise.checkers.length

  // Top border
  output +=
    '┌─────────────────────────────────────────────────────────────────┐\n'

  // Upper board labels (points 13-24, but we display 12-17 and 18-23)
  output += '│ 13  14  15  16  17  18      BAR      19  20  21  22  23  24 │\n'
  output +=
    '├─────────────────────────────────────────────────────────────────┤\n'

  // Upper checkers (5 rows max)
  for (let row = 0; row < 5; row++) {
    output += '│ '

    // Points 12-17 (indexes 12-17)
    for (let point = 12; point <= 17; point++) {
      const pointData = points[point] || { checkers: 0, color: null }
      if (pointData.checkers > row) {
        const symbol = pointData.color === 'white' ? '○' : '●'
        output += ` ${symbol}  `
      } else {
        if (row === 4) {
          // Show point numbers on bottom row
          output += `${String(point + 1).padStart(2)} `
        } else {
          output += '    '
        }
      }
    }

    // Bar area
    if (row === 0) {
      output += `│W:${whiteBar}|B:${blackBar}│`
    } else if (row === 1) {
      output += '│ BAR │'
    } else {
      output += '│     │'
    }

    // Points 18-23 (indexes 18-23)
    for (let point = 18; point <= 23; point++) {
      const pointData = points[point] || { checkers: 0, color: null }
      if (pointData.checkers > row) {
        const symbol = pointData.color === 'white' ? '○' : '●'
        output += ` ${symbol}  `
      } else {
        if (row === 4) {
          // Show point numbers on bottom row
          output += `${String(point + 1).padStart(2)} `
        } else {
          output += '    '
        }
      }
    }

    output += ' │\n'
  }

  // Middle separator
  output +=
    '├─────────────────────────────────────────────────────────────────┤\n'

  // Lower checkers (5 rows max, reversed)
  for (let row = 4; row >= 0; row--) {
    output += '│ '

    // Points 11-6 (indexes 11-6, reverse order)
    for (let point = 11; point >= 6; point--) {
      const pointData = points[point] || { checkers: 0, color: null }
      if (pointData.checkers > row) {
        const symbol = pointData.color === 'white' ? '○' : '●'
        output += ` ${symbol}  `
      } else {
        if (row === 0) {
          // Show point numbers on top row
          output += `${String(point + 1).padStart(2)} `
        } else {
          output += '    '
        }
      }
    }

    // Home area
    if (row === 4) {
      output += `│W:${whiteOff}|B:${blackOff}│`
    } else if (row === 3) {
      output += '│HOME │'
    } else {
      output += '│     │'
    }

    // Points 5-0 (indexes 5-0, reverse order)
    for (let point = 5; point >= 0; point--) {
      const pointData = points[point] || { checkers: 0, color: null }
      if (pointData.checkers > row) {
        const symbol = pointData.color === 'white' ? '○' : '●'
        output += ` ${symbol}  `
      } else {
        if (row === 0) {
          // Show point numbers on top row
          output += `${String(point + 1).padStart(2)} `
        } else {
          output += '    '
        }
      }
    }

    output += ' │\n'
  }

  // Lower board labels
  output +=
    '├─────────────────────────────────────────────────────────────────┤\n'
  output += '│ 12  11  10   9   8   7     HOME      6   5   4   3   2   1 │\n'
  output +=
    '└─────────────────────────────────────────────────────────────────┘\n'

  // Legend and current state
  output += '\nLegend: ● = Black checkers, ○ = White checkers\n'
  output +=
    'BAR = Hit checkers waiting to re-enter, HOME = Borne off checkers\n'
  output += `\nCurrent Turn: ${game.activeColor.toUpperCase()} player\n`

  // Show checker counts per point
  output += '\nChecker positions:\n'
  for (let i = 0; i < 24; i++) {
    const pointData = points[i]
    if (pointData && pointData.checkers > 0) {
      output += `Point ${i + 1}: ${pointData.checkers} ${
        pointData.color
      } checker${pointData.checkers > 1 ? 's' : ''}\n`
    }
  }

  return output
}

showBoard()
