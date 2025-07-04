import { BackgammonBoard, BackgammonGame } from '@nodots-llc/backgammon-types'
import chalk from 'chalk'

export class BoardDisplay {
  static renderBoard(game: BackgammonGame): string {
    const board = game.board
    let output = '\n'

    // Top section (positions 13-24)
    output += this.renderTopSection(board)
    output += '\n'

    // Middle bar
    output += this.renderBar(board)
    output += '\n'

    // Bottom section (positions 1-12)
    output += this.renderBottomSection(board)
    output += '\n'

    // Game info
    output += this.renderGameInfo(game)

    return output
  }

  private static renderTopSection(board: BackgammonBoard): string {
    let output = '  13 14 15 16 17 18    19 20 21 22 23 24\n'
    output += ' ┌─────────────────┐ ┌─────────────────┐\n'

    // Render checkers for positions 13-24
    for (let row = 0; row < 5; row++) {
      output += ' │'

      // Left side (13-18)
      for (let pos = 13; pos <= 18; pos++) {
        const point = board.points.find((p: any) => p.clockwise === pos)
        const checkerCount = point?.checkers.length || 0

        if (row < checkerCount) {
          const checker = point?.checkers[row]
          output += checker?.color === 'white' ? ' ○' : ' ●'
        } else {
          output += '  '
        }
      }

      output += ' │ │'

      // Right side (19-24)
      for (let pos = 19; pos <= 24; pos++) {
        const point = board.points.find((p: any) => p.clockwise === pos)
        const checkerCount = point?.checkers.length || 0

        if (row < checkerCount) {
          const checker = point?.checkers[row]
          output += checker?.color === 'white' ? ' ○' : ' ●'
        } else {
          output += '  '
        }
      }

      output += ' │\n'
    }

    output += ' └─────────────────┘ └─────────────────┘'
    return output
  }

  private static renderBar(board: BackgammonBoard): string {
    let output = '                    │ BAR │                    \n'
    output += '                    └─────┘                    \n'

    // Show checkers on bar
    const whiteOnBar = (board.bar as any).white || 0
    const blackOnBar = (board.bar as any).black || 0

    if (whiteOnBar > 0 || blackOnBar > 0) {
      output += '                    '
      for (let i = 0; i < whiteOnBar; i++) {
        output += ' ○'
      }
      for (let i = 0; i < blackOnBar; i++) {
        output += ' ●'
      }
      output += '\n'
    }

    return output
  }

  private static renderBottomSection(board: BackgammonBoard): string {
    let output = ' ┌─────────────────┐ ┌─────────────────┐\n'

    // Render checkers for positions 1-12
    for (let row = 4; row >= 0; row--) {
      output += ' │'

      // Left side (7-12)
      for (let pos = 7; pos <= 12; pos++) {
        const point = board.points.find((p: any) => p.clockwise === pos)
        const checkerCount = point?.checkers.length || 0

        if (row < checkerCount) {
          const checker = point?.checkers[row]
          output += checker?.color === 'white' ? ' ○' : ' ●'
        } else {
          output += '  '
        }
      }

      output += ' │ │'

      // Right side (1-6)
      for (let pos = 1; pos <= 6; pos++) {
        const point = board.points.find((p: any) => p.clockwise === pos)
        const checkerCount = point?.checkers.length || 0

        if (row < checkerCount) {
          const checker = point?.checkers[row]
          output += checker?.color === 'white' ? ' ○' : ' ●'
        } else {
          output += '  '
        }
      }

      output += ' │\n'
    }

    output += ' └─────────────────┘ └─────────────────┘\n'
    output += '   7  8  9 10 11 12     1  2  3  4  5  6'
    return output
  }

  private static renderGameInfo(game: BackgammonGame): string {
    let output = '\n'
    output += chalk.cyan(`Game ID: ${game.id}\n`)

    // Handle different game states
    if ('currentPlayer' in game) {
      output += chalk.yellow(
        `Current Player: ${(game as any).currentPlayer.name}\n`
      )
    }

    if ('status' in game) {
      output += chalk.green(`Status: ${(game as any).status}\n`)
    }

    if ('dice' in game && (game as any).dice && (game as any).dice.length > 0) {
      output += chalk.magenta(`Dice: ${(game as any).dice.join(', ')}\n`)
    }

    return output
  }

  static renderPossibleMoves(
    moves: Array<{ from: number; to: number; dieValue: number }>
  ): string {
    if (moves.length === 0) {
      return chalk.red('No possible moves available.\n')
    }

    let output = chalk.green('\nPossible moves:\n')
    moves.forEach((move, index) => {
      output += `${index + 1}. ${move.from} → ${move.to} (die: ${
        move.dieValue
      })\n`
    })

    return output
  }
}
