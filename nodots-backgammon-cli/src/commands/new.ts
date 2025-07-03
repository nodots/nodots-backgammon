import chalk from 'chalk'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { ApiService } from '../services/api'
import { CliConfig } from '../types'

export class NewCommand extends Command {
  constructor() {
    super('new')
    this.description('Create a new backgammon game').action(
      this.execute.bind(this)
    )
  }

  private async execute(): Promise<void> {
    try {
      const config: CliConfig = {
        apiUrl: process.env.NODOTS_API_URL || 'http://localhost:3000',
        userId: process.env.NODOTS_USER_ID,
        apiKey: process.env.NODOTS_API_KEY,
      }

      const apiService = new ApiService(config)

      // Get available users
      const usersResponse = await apiService.getUsers()
      if (!usersResponse.success) {
        console.error(chalk.red('Failed to fetch users:', usersResponse.error))
        return
      }

      const users = usersResponse.data || []
      if (users.length < 2) {
        console.error(chalk.red('Need at least 2 users to create a game'))
        return
      }

      // Prompt for player selection
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'player1Id',
          message: 'Select first player:',
          choices: users.map((user: any) => ({
            name: user.name,
            value: user.id,
          })),
        },
        {
          type: 'list',
          name: 'player2Id',
          message: 'Select second player:',
          choices: users.map((user: any) => ({
            name: user.name,
            value: user.id,
          })),
          filter: (input: string) => input,
        },
      ])

      if (answers.player1Id === answers.player2Id) {
        console.error(chalk.red('Players must be different'))
        return
      }

      // Create the game
      const gameResponse = await apiService.createGame(
        answers.player1Id,
        answers.player2Id
      )
      if (!gameResponse.success) {
        console.error(chalk.red('Failed to create game:', gameResponse.error))
        return
      }

      const game = gameResponse.data
      console.log(chalk.green('Game created successfully!'))
      console.log(chalk.cyan(`Game ID: ${game?.id}`))

      if (game && 'players' in game) {
        const players = (game as any).players
        if (players && players.length >= 2) {
          console.log(
            chalk.yellow(
              `Players: ${players[0]?.name || 'Unknown'} vs ${
                players[1]?.name || 'Unknown'
              }`
            )
          )
        }
      }

      if (game && 'status' in game) {
        console.log(chalk.blue(`Status: ${(game as any).status}`))
      }
    } catch (error) {
      console.error(chalk.red('Error creating game:'), error)
    }
  }
}
