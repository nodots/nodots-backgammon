import chalk from 'chalk'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { ApiService } from '../services/api'
import { CliConfig } from '../types'
import { BoardDisplay } from '../utils/board-display'

export class PlayCommand extends Command {
  constructor() {
    super('play')
    this.description('Start interactive game session')
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

      console.log(chalk.blue('Starting interactive game session...'))
      console.log(chalk.cyan(`Game ID: ${gameId}`))

      // Main game loop
      while (true) {
        // Get current game state
        const gameResponse = await apiService.getGame(gameId)
        if (!gameResponse.success) {
          console.error(chalk.red('Failed to fetch game:', gameResponse.error))
          break
        }

        const game = gameResponse.data
        if (!game) {
          console.error(chalk.red('Game not found'))
          break
        }

        // Display board
        console.clear()
        console.log(BoardDisplay.renderBoard(game))

        // Check if game is over
        if ('status' in game && (game as any).status === 'completed') {
          console.log(chalk.green('Game completed!'))
          break
        }

        // Check if it's the current player's turn
        const currentPlayerId =
          'currentPlayer' in game ? (game as any).currentPlayer?.id : null
        if (currentPlayerId !== config.userId) {
          console.log(chalk.yellow('Waiting for opponent...'))
          await new Promise((resolve) => setTimeout(resolve, 2000))
          continue
        }

        // Show available actions
        const action = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: 'Roll dice', value: 'roll' },
              { name: 'Make a move', value: 'move' },
              { name: 'View possible moves', value: 'moves' },
              { name: 'Quit', value: 'quit' },
            ],
          },
        ])

        switch (action.action) {
          case 'roll':
            await this.handleRoll(apiService, gameId)
            break
          case 'move':
            await this.handleMove(apiService, gameId)
            break
          case 'moves':
            // This would need to be implemented based on the API
            console.log(
              chalk.yellow('Possible moves feature not yet implemented')
            )
            break
          case 'quit':
            console.log(chalk.blue('Goodbye!'))
            return
        }
      }
    } catch (error) {
      console.error(chalk.red('Error in game session:'), error)
    }
  }

  private async handleRoll(
    apiService: ApiService,
    gameId: string
  ): Promise<void> {
    try {
      const gameResponse = await apiService.rollDice(gameId)
      if (!gameResponse.success) {
        console.error(chalk.red('Failed to roll dice:', gameResponse.error))
        return
      }

      console.log(chalk.green('Dice rolled successfully!'))
    } catch (error) {
      console.error(chalk.red('Error rolling dice:'), error)
    }
  }

  private async handleMove(
    apiService: ApiService,
    gameId: string
  ): Promise<void> {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'from',
          message: 'From position:',
          validate: (input: string) => {
            const num = parseInt(input, 10)
            return !isNaN(num) && num >= 1 && num <= 24
              ? true
              : 'Please enter a valid position (1-24)'
          },
        },
        {
          type: 'input',
          name: 'to',
          message: 'To position:',
          validate: (input: string) => {
            const num = parseInt(input, 10)
            return !isNaN(num) && num >= 0 && num <= 25
              ? true
              : 'Please enter a valid position (0-25)'
          },
        },
      ])

      const fromPos = parseInt(answers.from, 10)
      const toPos = parseInt(answers.to, 10)

      const gameResponse = await apiService.makeMove(gameId, fromPos, toPos)
      if (!gameResponse.success) {
        console.error(chalk.red('Failed to make move:', gameResponse.error))
        return
      }

      console.log(chalk.green('Move made successfully!'))
    } catch (error) {
      console.error(chalk.red('Error making move:'), error)
    }
  }
}
