#!/usr/bin/env node
import chalk from 'chalk'
import { Command } from 'commander'
import 'dotenv/config'
import inquirer from 'inquirer'
import { version } from '../package.json'
import { AuthService } from './services/auth'

// Authentication commands
import { LoginCommand } from './commands/login'
import { LogoutCommand } from './commands/logout'

// TODO: Create command classes and import them
// import { JoinCommand } from './commands/join'
// import { MoveCommand } from './commands/move'
// import { NewCommand } from './commands/new'
// import { PlayCommand } from './commands/play'
// import { RollCommand } from './commands/roll'
// import { StatusCommand } from './commands/status'

// Robot simulation commands
import { RobotBatchCommand } from './commands/robot-batch'
import { RobotBoardCommand } from './commands/robot-board'
import { RobotListCommand } from './commands/robot-list'
import { RobotPauseCommand } from './commands/robot-pause'
import { RobotSimulateCommand } from './commands/robot-simulate'
import { RobotSpeedCommand } from './commands/robot-speed'
import { RobotStatusCommand } from './commands/robot-status'
import { RobotStopCommand } from './commands/robot-stop'

// Human vs Robot game commands
import { HumanVsRobotCommand } from './commands/human-vs-robot'
import { GameStatusCommand } from './commands/game-status'
import { GameRollCommand } from './commands/game-roll'

async function checkAuthenticationAndPrompt(): Promise<void> {
  const authService = new AuthService()

  // Skip auth check if running login/logout commands
  const args = process.argv.slice(2)
  const command = args[0]

  if (
    command === 'login' ||
    command === 'logout' ||
    command === '--help' ||
    command === '-h' ||
    command === '--version' ||
    command === '-V'
  ) {
    return
  }

  // Check if user is logged in
  if (!authService.isLoggedIn()) {
    console.log(chalk.cyan('Welcome to Nodots Backgammon CLI!'))
    console.log(chalk.yellow('You need to login to use this CLI.'))
    console.log()

    const { shouldLogin } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldLogin',
        message: 'Would you like to login now?',
        default: true,
      },
    ])

    if (shouldLogin) {
      // Execute login command
      const loginCommand = new LoginCommand()
      await loginCommand.execute()
      console.log()
    } else {
      console.log(
        chalk.gray('You can login later using: nodots-backgammon login')
      )
      process.exit(0)
    }
  } else {
    // User is logged in, show a brief welcome
    const currentUser = authService.getCurrentUser()
    const userDisplay = currentUser?.email || currentUser?.firstName || 'User'
    console.log(chalk.green(`Welcome back, ${userDisplay}!`))
  }
}

const program = new Command()

program
  .name('nodots-backgammon')
  .description('Command-line interface for Nodots Backgammon')
  .version(version)

// Add authentication commands
program.addCommand(new LoginCommand())
program.addCommand(new LogoutCommand())

// Add commands
// program.addCommand(new NewCommand())
// program.addCommand(new JoinCommand())
// program.addCommand(new StatusCommand())
// program.addCommand(new MoveCommand())
// program.addCommand(new RollCommand())
// program.addCommand(new PlayCommand())

// Add human vs robot game commands
program.addCommand(new HumanVsRobotCommand())
program.addCommand(new GameStatusCommand())
program.addCommand(new GameRollCommand())

// Add robot simulation commands
program.addCommand(new RobotListCommand())
program.addCommand(new RobotSimulateCommand())
program.addCommand(new RobotStatusCommand())
program.addCommand(new RobotPauseCommand())
program.addCommand(new RobotStopCommand())
program.addCommand(new RobotSpeedCommand())
program.addCommand(new RobotBatchCommand())
program.addCommand(new RobotBoardCommand())

// Global error handler
program.exitOverride()

async function main() {
  try {
    // Check authentication before processing commands
    await checkAuthenticationAndPrompt()

    // Parse and execute commands
    program.parse()
  } catch (err) {
    if (err instanceof Error) {
      console.error(chalk.red('Error:'), err.message)
    } else {
      console.error(chalk.red('An unexpected error occurred'))
    }
    process.exit(1)
  }
}

// Run the main function
main()
