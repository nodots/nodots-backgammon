import chalk from 'chalk'
import { Command } from 'commander'
import { ApiService } from '../services/api'
import { CliConfig } from '../types'

export class RobotListCommand extends Command {
  constructor() {
    super('robot-list')
    this.description('List available robot users')
      .alias('robots')
      .action(this.execute.bind(this))
  }

  private async execute(): Promise<void> {
    try {
      const config: CliConfig = {
        apiUrl: process.env.NODOTS_API_URL || 'http://localhost:3000',
        userId: process.env.NODOTS_USER_ID,
        apiKey: process.env.NODOTS_API_KEY,
      }

      const apiService = new ApiService(config)

      const response = await apiService.getRobots()
      if (!response.success) {
        console.error(chalk.red('Failed to fetch robots:', response.error))
        return
      }

      const robots = response.data || []

      if (robots.length === 0) {
        console.log(chalk.yellow('No robot users found.'))
        console.log(chalk.gray('Robot users are required to run simulations.'))
        return
      }

      console.log(
        chalk.blue(
          `Found ${robots.length} robot user${robots.length === 1 ? '' : 's'}:`
        )
      )
      console.log()

      robots.forEach((robot: any, index: number) => {
        console.log(chalk.cyan(`${index + 1}. ${robot.name || robot.id}`))
        if (robot.difficulty) {
          console.log(chalk.gray(`   Default Difficulty: ${robot.difficulty}`))
        }
        if (robot.description) {
          console.log(chalk.gray(`   Description: ${robot.description}`))
        }
        if (robot.isActive !== undefined) {
          const status = robot.isActive
            ? chalk.green('Active')
            : chalk.red('Inactive')
          console.log(chalk.gray(`   Status: ${status}`))
        }
        console.log()
      })

      console.log(chalk.yellow('Available difficulty levels:'))
      console.log(
        chalk.white('  • beginner    - Basic move selection, good for testing')
      )
      console.log(
        chalk.white(
          '  • intermediate - Balanced strategy with position evaluation'
        )
      )
      console.log(
        chalk.white(
          '  • advanced     - Sophisticated algorithms, competitive play'
        )
      )
      console.log()
      console.log(
        chalk.gray(
          'Use "nodots-backgammon robot-simulate --interactive" to start a simulation'
        )
      )
    } catch (error) {
      console.error(chalk.red('Error fetching robots:'), error)
    }
  }
}
