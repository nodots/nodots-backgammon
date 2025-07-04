import chalk from 'chalk'
import { Command } from 'commander'
import { ApiService } from '../services/api'
import { CliConfig } from '../types'
import { BoardDisplay } from '../utils/board-display'

export class JoinCommand extends Command {
  constructor() {
    super('join')
    this.description('Join an existing game')
      .argument('<game-id>', 'Game ID')
      .action(this.execute.bind(this))
  }

  private async execute(gameId: string): Promise<void> {
    try {
      const config: CliConfig = {
        apiUrl: process.env.NODOTS_API_URL || 'http://localhost:3000',
        userId: process.env.NODOTS_USER_ID,
        apiKey: process.env.NODOTS_API_KEY,
      }

      const apiService = new ApiService(config)

      // Get game status
      const gameResponse = await apiService.getGame(gameId)
      if (!gameResponse.success) {
        console.error(chalk.red('Failed to fetch game:', gameResponse.error))
        return
      }

      const game = gameResponse.data
      if (!game) {
        console.error(chalk.red('Game not found'))
        return
      }

      console.log(chalk.green('Joined game successfully!'))
      console.log(BoardDisplay.renderBoard(game))
    } catch (error) {
      console.error(chalk.red('Error joining game:'), error)
    }
  }
}
