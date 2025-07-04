import chalk from 'chalk'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { ApiService } from '../services/api'
import { CliConfig } from '../types'

interface BatchScenario {
  robot1Difficulty: string
  robot2Difficulty: string
  speed?: number
  name?: string
}

interface BatchResult {
  scenario: BatchScenario
  simulationId?: string
  result?: any
  error?: string
  duration?: number
}

export class RobotBatchCommand extends Command {
  constructor() {
    super('robot-batch')
    this.description('Run multiple robot simulations in batch')
      .option(
        '-c, --concurrent <number>',
        'Maximum concurrent simulations',
        '3'
      )
      .option('-s, --speed <milliseconds>', 'Speed for all simulations', '200')
      .option(
        '-p, --preset <name>',
        'Use preset scenarios (all|difficulty-test|speed-test)'
      )
      .option('-f, --file <path>', 'Load scenarios from JSON file')
      .option('-o, --output <path>', 'Save results to JSON file')
      .option('-i, --interactive', 'Interactive scenario configuration')
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

      // Check robots availability
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
          chalk.red('Need at least 2 robot users for batch simulations')
        )
        return
      }

      console.log(chalk.blue(`Found ${robots.length} robot users available`))

      let scenarios: BatchScenario[] = []

      // Determine scenarios
      if (options.preset) {
        scenarios = this.getPresetScenarios(
          options.preset,
          parseInt(options.speed)
        )
      } else if (options.file) {
        scenarios = await this.loadScenariosFromFile(options.file)
      } else if (options.interactive) {
        scenarios = await this.getInteractiveScenarios(parseInt(options.speed))
      } else {
        // Default scenario
        scenarios = [
          {
            name: 'Beginner vs Intermediate',
            robot1Difficulty: 'beginner',
            robot2Difficulty: 'intermediate',
            speed: parseInt(options.speed),
          },
        ]
      }

      if (scenarios.length === 0) {
        console.error(chalk.red('No scenarios to run'))
        return
      }

      console.log(
        chalk.yellow(`\nRunning ${scenarios.length} simulation scenarios...`)
      )
      console.log(chalk.cyan(`Max concurrent: ${options.concurrent}`))
      console.log(chalk.cyan(`Default speed: ${options.speed}ms\n`))

      // Run batch simulations
      const runner = new BatchSimulationRunner(apiService, {
        maxConcurrent: parseInt(options.concurrent),
        defaultSpeed: parseInt(options.speed),
      })

      const results = await runner.runBatch(scenarios)

      // Display results
      this.displayResults(results)

      // Save results if requested
      if (options.output) {
        await this.saveResults(results, options.output)
      }
    } catch (error) {
      console.error(chalk.red('Error running batch simulations:'), error)
    }
  }

  private getPresetScenarios(
    preset: string,
    defaultSpeed: number
  ): BatchScenario[] {
    switch (preset) {
      case 'all':
        return [
          {
            name: 'Beginner vs Beginner',
            robot1Difficulty: 'beginner',
            robot2Difficulty: 'beginner',
            speed: defaultSpeed,
          },
          {
            name: 'Beginner vs Intermediate',
            robot1Difficulty: 'beginner',
            robot2Difficulty: 'intermediate',
            speed: defaultSpeed,
          },
          {
            name: 'Beginner vs Advanced',
            robot1Difficulty: 'beginner',
            robot2Difficulty: 'advanced',
            speed: defaultSpeed,
          },
          {
            name: 'Intermediate vs Intermediate',
            robot1Difficulty: 'intermediate',
            robot2Difficulty: 'intermediate',
            speed: defaultSpeed,
          },
          {
            name: 'Intermediate vs Advanced',
            robot1Difficulty: 'intermediate',
            robot2Difficulty: 'advanced',
            speed: defaultSpeed,
          },
          {
            name: 'Advanced vs Advanced',
            robot1Difficulty: 'advanced',
            robot2Difficulty: 'advanced',
            speed: defaultSpeed,
          },
        ]

      case 'difficulty-test':
        return [
          {
            name: 'Beginner vs Advanced (3 rounds)',
            robot1Difficulty: 'beginner',
            robot2Difficulty: 'advanced',
            speed: defaultSpeed,
          },
          {
            name: 'Beginner vs Advanced (3 rounds)',
            robot1Difficulty: 'beginner',
            robot2Difficulty: 'advanced',
            speed: defaultSpeed,
          },
          {
            name: 'Beginner vs Advanced (3 rounds)',
            robot1Difficulty: 'beginner',
            robot2Difficulty: 'advanced',
            speed: defaultSpeed,
          },
        ]

      case 'speed-test':
        return [
          {
            name: 'Fast Speed Test',
            robot1Difficulty: 'intermediate',
            robot2Difficulty: 'intermediate',
            speed: 100,
          },
          {
            name: 'Normal Speed Test',
            robot1Difficulty: 'intermediate',
            robot2Difficulty: 'intermediate',
            speed: 1000,
          },
          {
            name: 'Slow Speed Test',
            robot1Difficulty: 'intermediate',
            robot2Difficulty: 'intermediate',
            speed: 3000,
          },
        ]

      default:
        console.error(
          chalk.red(
            `Unknown preset: ${preset}. Available: all, difficulty-test, speed-test`
          )
        )
        return []
    }
  }

  private async getInteractiveScenarios(
    defaultSpeed: number
  ): Promise<BatchScenario[]> {
    const scenarios: BatchScenario[] = []

    while (true) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Scenario name (optional):',
        },
        {
          type: 'list',
          name: 'robot1Difficulty',
          message: 'Robot 1 difficulty:',
          choices: ['beginner', 'intermediate', 'advanced'],
        },
        {
          type: 'list',
          name: 'robot2Difficulty',
          message: 'Robot 2 difficulty:',
          choices: ['beginner', 'intermediate', 'advanced'],
        },
        {
          type: 'number',
          name: 'speed',
          message: 'Speed (ms):',
          default: defaultSpeed,
        },
        {
          type: 'confirm',
          name: 'addMore',
          message: 'Add another scenario?',
          default: false,
        },
      ])

      scenarios.push({
        name:
          answers.name ||
          `${answers.robot1Difficulty} vs ${answers.robot2Difficulty}`,
        robot1Difficulty: answers.robot1Difficulty,
        robot2Difficulty: answers.robot2Difficulty,
        speed: answers.speed,
      })

      if (!answers.addMore) break
    }

    return scenarios
  }

  private async loadScenariosFromFile(
    filePath: string
  ): Promise<BatchScenario[]> {
    try {
      const fs = await import('fs/promises')
      const content = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      console.error(
        chalk.red(`Failed to load scenarios from ${filePath}:`, error)
      )
      return []
    }
  }

  private displayResults(results: BatchResult[]): void {
    console.log(chalk.blue('\n=== Batch Simulation Results ==='))

    const completed = results.filter((r) => r.result && !r.error)
    const failed = results.filter((r) => r.error)

    console.log(chalk.cyan(`Total scenarios: ${results.length}`))
    console.log(chalk.green(`Completed: ${completed.length}`))
    console.log(chalk.red(`Failed: ${failed.length}`))

    if (completed.length > 0) {
      const avgDuration =
        completed.reduce((sum, r) => sum + (r.duration || 0), 0) /
        completed.length
      console.log(
        chalk.cyan(`Average duration: ${Math.round(avgDuration / 1000)}s`)
      )
    }

    console.log(chalk.yellow('\n--- Individual Results ---'))
    results.forEach((result, index) => {
      const scenario = result.scenario
      const name = scenario.name || `Scenario ${index + 1}`

      console.log(chalk.white(`${index + 1}. ${name}`))
      console.log(
        chalk.gray(
          `   ${scenario.robot1Difficulty} vs ${scenario.robot2Difficulty} @ ${scenario.speed}ms`
        )
      )

      if (result.error) {
        console.log(chalk.red(`   ❌ Error: ${result.error}`))
      } else if (result.result) {
        const status = result.result.status === 'completed' ? '✅' : '⚠️'
        console.log(chalk.green(`   ${status} ${result.result.status}`))

        if (result.result.result && result.result.result.winner) {
          console.log(chalk.gray(`   Winner: ${result.result.result.winner}`))
        }

        if (result.duration) {
          console.log(
            chalk.gray(`   Duration: ${Math.round(result.duration / 1000)}s`)
          )
        }
      }
      console.log()
    })
  }

  private async saveResults(
    results: BatchResult[],
    outputPath: string
  ): Promise<void> {
    try {
      const fs = await import('fs/promises')
      await fs.writeFile(outputPath, JSON.stringify(results, null, 2))
      console.log(chalk.green(`Results saved to ${outputPath}`))
    } catch (error) {
      console.error(
        chalk.red(`Failed to save results to ${outputPath}:`, error)
      )
    }
  }
}

class BatchSimulationRunner {
  private running: Map<string, BatchResult> = new Map()
  private queue: BatchScenario[] = []
  private results: BatchResult[] = []

  constructor(
    private apiService: ApiService,
    private config: { maxConcurrent: number; defaultSpeed: number }
  ) {}

  async runBatch(scenarios: BatchScenario[]): Promise<BatchResult[]> {
    this.queue = [...scenarios]
    this.results = []

    while (this.queue.length > 0 || this.running.size > 0) {
      // Start new simulations up to max concurrent
      while (
        this.running.size < this.config.maxConcurrent &&
        this.queue.length > 0
      ) {
        const scenario = this.queue.shift()!
        await this.startScenario(scenario)
      }

      // Check for completed simulations
      await this.checkRunningSimulations()

      // Wait before next check
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    return this.results
  }

  private async startScenario(scenario: BatchScenario): Promise<void> {
    try {
      const simulationResponse = await this.apiService.startSimulation({
        speed: scenario.speed || this.config.defaultSpeed,
        robot1Difficulty: scenario.robot1Difficulty,
        robot2Difficulty: scenario.robot2Difficulty,
      })

      if (!simulationResponse.success) {
        this.results.push({
          scenario,
          error: simulationResponse.error,
        })
        return
      }

      const simulation = simulationResponse.data
      const result: BatchResult = {
        scenario,
        simulationId: simulation.id,
      }

      this.running.set(simulation.id, result)
      console.log(
        chalk.gray(
          `Started: ${scenario.name || 'Unnamed scenario'} (${simulation.id})`
        )
      )
    } catch (error) {
      this.results.push({
        scenario,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  private async checkRunningSimulations(): Promise<void> {
    const promises = Array.from(this.running.keys()).map(
      async (simulationId) => {
        try {
          const statusResponse = await this.apiService.getSimulationStatus(
            simulationId
          )
          if (!statusResponse.success) return

          const status = statusResponse.data
          const result = this.running.get(simulationId)!

          if (status.status === 'completed' || status.status === 'error') {
            result.result = status
            result.duration = status.duration
            this.results.push(result)
            this.running.delete(simulationId)

            const scenarioName = result.scenario.name || 'Unnamed scenario'
            const statusIcon = status.status === 'completed' ? '✅' : '❌'
            console.log(
              chalk.gray(
                `${statusIcon} Finished: ${scenarioName} (${simulationId})`
              )
            )
          }
        } catch (error) {
          // Handle individual simulation check errors
          const result = this.running.get(simulationId)!
          result.error =
            error instanceof Error ? error.message : 'Status check failed'
          this.results.push(result)
          this.running.delete(simulationId)
        }
      }
    )

    await Promise.all(promises)
  }
}
