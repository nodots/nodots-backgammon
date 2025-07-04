import chalk from 'chalk'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { ApiService } from '../services/api'
import { CliConfig } from '../types'

export class RobotSpeedCommand extends Command {
  constructor() {
    super('robot-speed')
    this.description('Change the speed of a robot simulation')
      .argument('<simulationId>', 'ID of the simulation to modify')
      .option(
        '-s, --speed <milliseconds>',
        'New speed in milliseconds between moves'
      )
      .option('-i, --interactive', 'Interactive mode for speed selection')
      .action(this.execute.bind(this))
  }

  private async execute(simulationId: string, options: any): Promise<void> {
    try {
      const config: CliConfig = {
        apiUrl: process.env.NODOTS_API_URL || 'http://localhost:3000',
        userId: process.env.NODOTS_USER_ID,
        apiKey: process.env.NODOTS_API_KEY,
      }

      const apiService = new ApiService(config)

      // First check current status
      const statusResponse = await apiService.getSimulationStatus(simulationId)
      if (!statusResponse.success) {
        console.error(
          chalk.red('Failed to get simulation status:', statusResponse.error)
        )
        return
      }

      const status = statusResponse.data
      console.log(chalk.blue(`Current simulation status: ${status.status}`))

      if (status.status === 'completed') {
        console.error(chalk.red('Cannot change speed of completed simulation'))
        return
      }

      if (status.status === 'error') {
        console.error(chalk.red('Cannot change speed of failed simulation'))
        return
      }

      if (status.speed) {
        console.log(
          chalk.cyan(`Current speed: ${status.speed}ms between moves`)
        )
      }

      let newSpeed: number

      if (options.interactive) {
        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'speed',
            message: 'Select new simulation speed:',
            choices: [
              { name: 'Very Fast (100ms) - For testing', value: 100 },
              { name: 'Fast (500ms) - Quick games', value: 500 },
              { name: 'Normal (1000ms) - Standard speed', value: 1000 },
              { name: 'Slow (2000ms) - For observation', value: 2000 },
              { name: 'Very Slow (5000ms) - For learning', value: 5000 },
              { name: 'Custom...', value: 'custom' },
            ],
          },
        ])

        if (answer.speed === 'custom') {
          const customAnswer = await inquirer.prompt([
            {
              type: 'number',
              name: 'customSpeed',
              message: 'Enter custom speed in milliseconds (100-30000):',
              validate: (input: number) => {
                if (input < 100 || input > 30000) {
                  return 'Speed must be between 100ms and 30000ms'
                }
                return true
              },
            },
          ])
          newSpeed = customAnswer.customSpeed
        } else {
          newSpeed = answer.speed
        }
      } else if (options.speed) {
        newSpeed = parseInt(options.speed)
        if (isNaN(newSpeed) || newSpeed < 100 || newSpeed > 30000) {
          console.error(
            chalk.red('Speed must be a number between 100ms and 30000ms')
          )
          return
        }
      } else {
        console.error(
          chalk.red(
            'Either provide --speed <milliseconds> or use --interactive mode'
          )
        )
        return
      }

      // Change the speed
      const response = await apiService.changeSimulationSpeed(
        simulationId,
        newSpeed
      )
      if (!response.success) {
        console.error(
          chalk.red('Failed to change simulation speed:', response.error)
        )
        return
      }

      console.log(
        chalk.green(`✓ Simulation speed changed to ${newSpeed}ms between moves`)
      )

      // Show speed comparison
      if (status.speed && status.speed !== newSpeed) {
        const change = newSpeed > status.speed ? 'slower' : 'faster'
        const ratio =
          Math.round(
            (Math.max(newSpeed, status.speed) /
              Math.min(newSpeed, status.speed)) *
              10
          ) / 10
        console.log(
          chalk.yellow(`Simulation is now ${ratio}x ${change} than before`)
        )
      }

      console.log(
        chalk.gray(
          `Use "nodots-backgammon robot-status ${simulationId}" to monitor the simulation`
        )
      )
    } catch (error) {
      console.error(chalk.red('Error changing simulation speed:'), error)
    }
  }
}
