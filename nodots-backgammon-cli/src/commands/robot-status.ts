import chalk from 'chalk'
import { Command } from 'commander'
import { ApiService } from '../services/api'
import { CliConfig } from '../types'

export class RobotStatusCommand extends Command {
  constructor() {
    super('robot-status')
    this.description('Check the status of a robot simulation')
      .argument('<simulationId>', 'ID of the simulation to check')
      .option('-w, --watch', 'Watch simulation progress in real-time')
      .option(
        '-i, --interval <seconds>',
        'Update interval in seconds for watch mode',
        '2'
      )
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

      if (options.watch) {
        await this.watchSimulation(
          apiService,
          simulationId,
          parseInt(options.interval)
        )
      } else {
        await this.checkOnce(apiService, simulationId)
      }
    } catch (error) {
      console.error(chalk.red('Error checking simulation status:'), error)
    }
  }

  private async checkOnce(
    apiService: ApiService,
    simulationId: string
  ): Promise<void> {
    const response = await apiService.getSimulationStatus(simulationId)
    if (!response.success) {
      console.error(
        chalk.red('Failed to get simulation status:', response.error)
      )
      return
    }

    this.displayStatus(response.data)
  }

  private async watchSimulation(
    apiService: ApiService,
    simulationId: string,
    intervalSeconds: number
  ): Promise<void> {
    console.log(
      chalk.blue(`Watching simulation ${simulationId} (press Ctrl+C to stop)`)
    )
    console.log(chalk.gray(`Update interval: ${intervalSeconds} seconds\n`))

    let isFirstUpdate = true
    const interval = setInterval(async () => {
      try {
        const response = await apiService.getSimulationStatus(simulationId)
        if (!response.success) {
          console.error(
            chalk.red('Failed to get simulation status:', response.error)
          )
          clearInterval(interval)
          return
        }

        // Clear previous output on subsequent updates
        if (!isFirstUpdate) {
          process.stdout.write('\x1B[2J\x1B[0f') // Clear screen and move to top
        }
        isFirstUpdate = false

        this.displayStatus(response.data)

        // Stop watching if simulation is completed or errored
        if (
          response.data.status === 'completed' ||
          response.data.status === 'error'
        ) {
          clearInterval(interval)
          console.log(
            chalk.yellow('\nSimulation finished. Stopping watch mode.')
          )
        }
      } catch (error) {
        console.error(chalk.red('Error during watch:'), error)
        clearInterval(interval)
      }
    }, intervalSeconds * 1000)

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(interval)
      console.log(chalk.yellow('\nWatch mode stopped.'))
      process.exit(0)
    })
  }

  private displayStatus(status: any): void {
    console.log(chalk.blue('=== Simulation Status ==='))
    console.log(chalk.cyan(`Simulation ID: ${status.id}`))
    console.log(chalk.cyan(`Game ID: ${status.gameId}`))
    console.log(chalk.cyan(`Status: ${this.formatStatus(status.status)}`))

    if (status.currentTurn) {
      console.log(chalk.cyan(`Current Turn: ${status.currentTurn}`))
    }

    if (status.totalMoves) {
      console.log(chalk.cyan(`Total Moves: ${status.totalMoves}`))
    }

    if (status.duration) {
      console.log(
        chalk.cyan(`Duration: ${this.formatDuration(status.duration)}`)
      )
    }

    if (status.speed) {
      console.log(chalk.cyan(`Speed: ${status.speed}ms between moves`))
    }

    // Robot information
    if (status.robot1Name || status.robot1Difficulty) {
      console.log(
        chalk.yellow(
          `Robot 1: ${status.robot1Name || 'Unknown'} (${
            status.robot1Difficulty || 'Unknown'
          })`
        )
      )
    }

    if (status.robot2Name || status.robot2Difficulty) {
      console.log(
        chalk.yellow(
          `Robot 2: ${status.robot2Name || 'Unknown'} (${
            status.robot2Difficulty || 'Unknown'
          })`
        )
      )
    }

    // Error information
    if (status.error) {
      console.log(chalk.red(`Error: ${status.error}`))
    }

    // Recent logs
    if (status.logs && status.logs.length > 0) {
      console.log(chalk.gray('\n--- Recent Activity ---'))
      const recentLogs = status.logs.slice(-5) // Show last 5 log entries
      recentLogs.forEach((log: any) => {
        console.log(chalk.gray(`${log.timestamp}: ${log.message}`))
      })
    }

    // Final result if completed
    if (status.status === 'completed' && status.result) {
      console.log(chalk.green('\n--- Final Result ---'))
      console.log(chalk.green(`Winner: ${status.result.winner || 'Unknown'}`))
      if (status.result.score) {
        console.log(chalk.green(`Score: ${status.result.score}`))
      }
    }
  }

  private formatStatus(status: string): string {
    switch (status) {
      case 'running':
        return chalk.green(status.toUpperCase())
      case 'paused':
        return chalk.yellow(status.toUpperCase())
      case 'completed':
        return chalk.blue(status.toUpperCase())
      case 'error':
        return chalk.red(status.toUpperCase())
      default:
        return status.toUpperCase()
    }
  }

  private formatDuration(durationMs: number): string {
    const seconds = Math.floor(durationMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }
}
