import { BackgammonGame } from '@nodots-llc/backgammon-types'
import chalk from 'chalk'

interface PointData {
  checkers: number
  color: 'white' | 'black' | null
}

interface BoardData {
  points: PointData[]
  bar: { white: number; black: number }
  off: { white: number; black: number }
}

export class EnhancedBoardDisplay {
  /**
   * Renders a proper traditional backgammon board
   */
  static renderBoard(game: BackgammonGame): string {
    let output = '\n'

    // Simple header
    output += this.renderGameHeader(game)
    output += '\n'

    // Traditional board layout
    output += this.renderTraditionalBoard(game)
    output += '\n'

    // Game status
    output += this.renderGameStatus(game)

    return output
  }

  private static renderGameHeader(game: BackgammonGame): string {
    const player1 = game.players?.[0] || ({} as any)
    const player2 = game.players?.[1] || ({} as any)

    const p1Name = ((player1 as any).name || 'Player 1')
      .substring(0, 10)
      .padEnd(10)
    const p2Name = ((player2 as any).name || 'Player 2')
      .substring(0, 10)
      .padEnd(10)
    const p1Pip = String((player1 as any).pipCount || 167).padStart(3)
    const p2Pip = String((player2 as any).pipCount || 167).padStart(3)

    let output = ''
    output += chalk.yellow(`● ${p1Name} (${p1Pip}) vs ○ ${p2Name} (${p2Pip})\n`)

    if (game.activeColor) {
      const activePlayer = game.activeColor === 'white' ? player1 : player2
      const dice = (activePlayer as any).dice?.currentRoll || []
      if (dice.length > 0) {
        output += chalk.magenta(
          `${game.activeColor.toUpperCase()}: [${dice.join(' ')}]\n`
        )
      }
    }

    return output
  }

  private static renderTraditionalBoard(game: BackgammonGame): string {
    const boardData = this.parseAllBoardData(game.board)
    let output = ''

    // Top border
    output += '+13-14-15-16-17-18-------19-20-21-22-23-24+\n'

    // Upper half (5 rows)
    for (let row = 0; row < 5; row++) {
      output += '|'

      // Points 13-18
      for (let point = 12; point <= 17; point++) {
        output += this.renderChecker(boardData.points[point], row)
      }

      output += '|'

      // Bar section - simplified
      if (row === 5) {
        // This won't happen since row < 5, but keeping for clarity
        output += 'BAR'
      } else {
        output += '   '
      }

      output += '|'

      // Points 19-24
      for (let point = 18; point <= 23; point++) {
        output += this.renderChecker(boardData.points[point], row)
      }

      output += '|\n'
    }

    // Middle separator with BAR label
    output += '|                  |BAR|                  |\n'

    // Lower half (6 rows to match the correct format)
    for (let row = 0; row < 6; row++) {
      output += '|'

      // Points 12-7 (reversed)
      for (let point = 11; point >= 6; point--) {
        output += this.renderChecker(boardData.points[point], 5 - row)
      }

      output += '|'

      // Bar section - just empty space
      output += '   '

      output += '|'

      // Points 6-1 (reversed)
      for (let point = 5; point >= 0; point--) {
        output += this.renderChecker(boardData.points[point], 5 - row)
      }

      output += '|\n'
    }

    // Bottom border
    output += '+12-11-10--9--8--7-------6--5--4--3--2--1-+\n'

    return output
  }

  private static renderChecker(pointData: PointData, row: number): string {
    const { checkers, color } = pointData

    if (row >= checkers) {
      return '   ' // Empty space - 3 characters
    }

    if (row === 0 && checkers > 5) {
      // Show count for stacked checkers - center in 3-char space
      const count = checkers.toString()
      return chalk.yellow(` ${count} `.substring(0, 3))
    }

    // Show checker - format: " ● " or " ○ " (3 characters)
    if (color === 'white') {
      return chalk.bold.white(' ○ ')
    } else if (color === 'black') {
      return chalk.bold.black(' ● ')
    }

    return '   '
  }

  private static parseAllBoardData(board: any): BoardData {
    const points: PointData[] = new Array(24).fill(null).map(() => ({
      checkers: 0,
      color: null,
    }))

    // Parse points from API response
    if (board.points && Array.isArray(board.points)) {
      board.points.forEach((point: any) => {
        if (point.position?.clockwise) {
          const index = point.position.clockwise - 1 // Convert to 0-based
          if (index >= 0 && index < 24) {
            const checkerCount = point.checkers?.length || 0
            const checkerColor = point.checkers?.[0]?.color || null

            points[index] = {
              checkers: checkerCount,
              color: checkerColor as 'white' | 'black' | null,
            }
          }
        }
      })
    }

    // Parse bar data
    const bar = {
      white: board.bar?.clockwise?.checkers?.length || 0,
      black: board.bar?.counterclockwise?.checkers?.length || 0,
    }

    // Parse off (home) data
    const off = {
      white: board.off?.clockwise?.checkers?.length || 0,
      black: board.off?.counterclockwise?.checkers?.length || 0,
    }

    return { points, bar, off }
  }

  private static renderGameStatus(game: BackgammonGame): string {
    let output = ''

    const state = (game as any).stateKind || (game as any).status || 'unknown'
    output += chalk.blue(`State: ${state.toUpperCase()} `)

    if (game.activeColor) {
      output += chalk.yellow(`| Turn: ${game.activeColor.toUpperCase()}\n`)
    } else {
      output += '\n'
    }

    output += chalk.dim('● = Black, ○ = White | BAR = Hit | OFF = Borne off\n')

    return output
  }

  static async renderFromAPI(
    gameId: string,
    apiUrl: string = 'http://localhost:3000'
  ): Promise<string> {
    try {
      const axios = await import('axios')
      const response = await axios.default.get(
        `${apiUrl}/api/v1/games/${gameId}`
      )
      const game = response.data

      return this.renderBoard(game)
    } catch (error) {
      return chalk.red(
        `Error rendering board from API: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  static renderPossibleMoves(
    moves: Array<{ from: number; to: number; dieValue: number }>
  ): string {
    if (moves.length === 0) {
      return chalk.red('No legal moves available.\n')
    }

    let output = chalk.green('Possible moves:\n')
    moves.forEach((move, index) => {
      output += chalk.white(
        `${index + 1}. ${move.from}→${move.to} (${move.dieValue})\n`
      )
    })

    return output
  }
}
