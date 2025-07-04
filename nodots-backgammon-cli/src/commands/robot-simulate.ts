import chalk from 'chalk'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { ApiService } from '../services/api'
import { CliConfig } from '../types'

export class RobotSimulateCommand extends Command {
  constructor() {
    super('robot-simulate')
    this.description('Start a robot vs robot simulation')
      .option(
        '-s, --speed <speed>',
        'Speed between moves in milliseconds',
        '1000'
      )
      .option(
        '-r1, --robot1-difficulty <difficulty>',
        'Robot 1 difficulty (beginner|intermediate|advanced)'
      )
      .option(
        '-r2, --robot2-difficulty <difficulty>',
        'Robot 2 difficulty (beginner|intermediate|advanced)'
      )
      .option('-i, --interactive', 'Interactive mode for configuration')
      .action(this.execute.bind(this))
  }

  private async execute(options: any): Promise<void> {
    try {
      const config: CliConfig = {
        apiUrl: process.env.NODOTS_API_URL || 'http://localhost:3000',
        userId: process.env.NODOTS_USER_ID,
        apiKey: process.env.NODOTS_API_KEY,
      }

      const apiService = new ApiService(config)

      // Check if robots are available
      const robotsResponse = await apiService.getRobots()
      if (!robotsResponse.success) {
        console.error(
          chalk.red('Failed to fetch robots:', robotsResponse.error)
        )
        return
      }

      const robots = robotsResponse.data || []
      if (robots.length < 2) {
        console.error(
          chalk.red('Need at least 2 robot users to start a simulation')
        )
        return
      }

      console.log(chalk.blue(`Found ${robots.length} robot users available`))

      let simulationConfig = {
        speed: parseInt(options.speed) || 1000,
        robot1Difficulty: options.robot1Difficulty || 'beginner',
        robot2Difficulty: options.robot2Difficulty || 'beginner',
      }

      // Interactive mode
      if (options.interactive) {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'robot1Difficulty',
            message: 'Select Robot 1 difficulty:',
            choices: [
              { name: 'Beginner - Basic move selection', value: 'beginner' },
              {
                name: 'Intermediate - Balanced strategy',
                value: 'intermediate',
              },
              {
                name: 'Advanced - Sophisticated algorithms',
                value: 'advanced',
              },
            ],
            default: simulationConfig.robot1Difficulty,
          },
          {
            type: 'list',
            name: 'robot2Difficulty',
            message: 'Select Robot 2 difficulty:',
            choices: [
              { name: 'Beginner - Basic move selection', value: 'beginner' },
              {
                name: 'Intermediate - Balanced strategy',
                value: 'intermediate',
              },
              {
                name: 'Advanced - Sophisticated algorithms',
                value: 'advanced',
              },
            ],
            default: simulationConfig.robot2Difficulty,
          },
          {
            type: 'list',
            name: 'speed',
            message: 'Select simulation speed:',
            choices: [
              { name: 'Very Fast (100ms) - For testing', value: 100 },
              { name: 'Fast (500ms) - Quick games', value: 500 },
              { name: 'Normal (1000ms) - Standard speed', value: 1000 },
              { name: 'Slow (2000ms) - For observation', value: 2000 },
              { name: 'Very Slow (5000ms) - For learning', value: 5000 },
            ],
            default: simulationConfig.speed,
          },
        ])

        simulationConfig = { ...simulationConfig, ...answers }
      }

      // Validate configuration
      const validDifficulties = ['beginner', 'intermediate', 'advanced']
      if (!validDifficulties.includes(simulationConfig.robot1Difficulty)) {
        console.error(
          chalk.red(
            'Invalid robot1 difficulty. Use: beginner, intermediate, or advanced'
          )
        )
        return
      }
      if (!validDifficulties.includes(simulationConfig.robot2Difficulty)) {
        console.error(
          chalk.red(
            'Invalid robot2 difficulty. Use: beginner, intermediate, or advanced'
          )
        )
        return
      }

      if (simulationConfig.speed < 100 || simulationConfig.speed > 30000) {
        console.error(chalk.red('Speed must be between 100ms and 30000ms'))
        return
      }

      console.log(chalk.yellow('Starting simulation with configuration:'))
      console.log(chalk.cyan(`  Robot 1: ${simulationConfig.robot1Difficulty}`))
      console.log(chalk.cyan(`  Robot 2: ${simulationConfig.robot2Difficulty}`))
      console.log(
        chalk.cyan(`  Speed: ${simulationConfig.speed}ms between moves`)
      )

      // Start the simulation
      const simulationResponse = await apiService.startSimulation(
        simulationConfig
      )
      if (!simulationResponse.success) {
        console.error(
          chalk.red('Failed to start simulation:', simulationResponse.error)
        )
        return
      }

      const simulation = simulationResponse.data
      console.log(chalk.green('✓ Simulation started successfully!'))
      console.log(chalk.cyan(`Simulation ID: ${simulation.id}`))
      console.log(chalk.cyan(`Game ID: ${simulation.gameId}`))

      console.log(
        chalk.yellow('\nUse the following commands to monitor the simulation:')
      )
      console.log(
        chalk.white(`  nodots-backgammon robot-status ${simulation.id}`)
      )
      console.log(
        chalk.white(`  nodots-backgammon robot-pause ${simulation.id}`)
      )
      console.log(
        chalk.white(`  nodots-backgammon robot-stop ${simulation.id}`)
      )
    } catch (error) {
      console.error(chalk.red('Error starting simulation:'), error)
    }
  }
}
