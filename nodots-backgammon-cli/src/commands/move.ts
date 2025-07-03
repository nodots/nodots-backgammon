import chalk from 'chalk'
import { Command } from 'commander'
import { ApiService } from '../services/api'
import { CliConfig } from '../types'
import { BoardDisplay } from '../utils/board-display'

export class MoveCommand extends Command {
  constructor() {
    super('move')
    this.description('Make a move')
      .argument('<game-id>', 'Game ID')
      .argument('<from>', 'From position')
      .argument('<to>', 'To position')
      .action(this.execute.bind(this))
  }

  private async execute(
    gameId: string,
    from: string,
    to: string
  ): Promise<void> {
    try {
      const config: CliConfig = {
        apiUrl: process.env.NODOTS_API_URL || 'http://localhost:3000',
        userId: process.env.NODOTS_USER_ID,
        apiKey: process.env.NODOTS_API_KEY,
      }

      const apiService = new ApiService(config)

      const fromPos = parseInt(from, 10)
      const toPos = parseInt(to, 10)

      if (isNaN(fromPos) || isNaN(toPos)) {
        console.error(chalk.red('Invalid positions. Must be numbers.'))
        return
      }

      // Make the move
      const gameResponse = await apiService.makeMove(gameId, fromPos, toPos)
      if (!gameResponse.success) {
        console.error(chalk.red('Failed to make move:', gameResponse.error))
        return
      }

      const game = gameResponse.data
      if (!game) {
        console.error(chalk.red('Game not found'))
        return
      }

      console.log(chalk.green('Move made successfully!'))
      console.log(BoardDisplay.renderBoard(game))
    } catch (error) {
      console.error(chalk.red('Error making move:'), error)
    }
  }
}
