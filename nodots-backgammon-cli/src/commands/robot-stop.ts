import chalk from 'chalk'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { ApiService } from '../services/api'
import { CliConfig } from '../types'

export class RobotStopCommand extends Command {
  constructor() {
    super('robot-stop')
    this.description('Stop a robot simulation')
      .argument('<simulationId>', 'ID of the simulation to stop')
      .option('-f, --force', 'Force stop without confirmation')
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
      console.log(chalk.blue(`Simulation Status: ${status.status}`))

      if (status.status === 'completed') {
        console.log(chalk.yellow('Simulation is already completed.'))
        return
      }

      if (status.status === 'error') {
        console.log(chalk.yellow('Simulation already stopped due to error.'))
        return
      }

      // Confirmation unless forced
      if (!options.force) {
        const answer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to stop simulation ${simulationId}?`,
            default: false,
          },
        ])

        if (!answer.confirm) {
          console.log(chalk.yellow('Stop cancelled.'))
          return
        }
      }

      // Stop the simulation
      const response = await apiService.stopSimulation(simulationId)
      if (!response.success) {
        console.error(chalk.red('Failed to stop simulation:', response.error))
        return
      }

      console.log(chalk.green('✓ Simulation stopped successfully'))

      if (status.currentTurn) {
        console.log(
          chalk.gray(`Simulation was stopped at turn ${status.currentTurn}`)
        )
      }

      if (status.totalMoves) {
        console.log(chalk.gray(`Total moves completed: ${status.totalMoves}`))
      }

      if (status.duration) {
        const durationSeconds = Math.floor(status.duration / 1000)
        console.log(chalk.gray(`Duration: ${durationSeconds} seconds`))
      }
    } catch (error) {
      console.error(chalk.red('Error stopping simulation:'), error)
    }
  }
}
