import chalk from 'chalk'
import { Command } from 'commander'
import { ApiService } from '../services/api'
import { CliConfig } from '../types'

export class RobotPauseCommand extends Command {
  constructor() {
    super('robot-pause')
    this.description('Pause or resume a robot simulation')
      .argument('<simulationId>', 'ID of the simulation to pause/resume')
      .action(this.execute.bind(this))
  }

  private async execute(simulationId: string): Promise<void> {
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

      const currentStatus = statusResponse.data.status
      console.log(chalk.blue(`Current simulation status: ${currentStatus}`))

      // Pause/resume the simulation
      const response = await apiService.pauseSimulation(simulationId)
      if (!response.success) {
        console.error(
          chalk.red('Failed to pause/resume simulation:', response.error)
        )
        return
      }

      const action = currentStatus === 'running' ? 'paused' : 'resumed'
      console.log(chalk.green(`✓ Simulation ${action} successfully`))

      if (action === 'paused') {
        console.log(
          chalk.yellow(
            'The simulation is now paused. Run this command again to resume.'
          )
        )
      } else {
        console.log(
          chalk.yellow('The simulation has been resumed and will continue.')
        )
      }

      console.log(
        chalk.gray(
          `Use "nodots-backgammon robot-status ${simulationId}" to check the current status`
        )
      )
    } catch (error) {
      console.error(chalk.red('Error toggling simulation pause:'), error)
    }
  }
}
