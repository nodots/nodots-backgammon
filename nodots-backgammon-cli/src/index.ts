#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { loginCommand } from './commands/login'
import { createGameCommand } from './commands/createGame'
import { statusCommand } from './commands/status'
import { rollCommand } from './commands/roll'
import { playCommand } from './commands/play'
import { listGamesCommand } from './commands/listGames'

const program = new Command()

program
  .name('backgammon')
  .description('Nodots Backgammon CLI - Play backgammon against AI')
  .version('1.0.0')

// Authentication commands
program
  .command('login')
  .description('Authenticate with Auth0 for API access')
  .action(loginCommand)

// Game management commands
program
  .command('create-game')
  .description('Create a new game against a robot')
  .action(createGameCommand)

program
  .command('list')
  .description('List your active games')
  .action(listGamesCommand)

program
  .command('status <gameId>')
  .description('Show current game status')
  .action(statusCommand)

// Gameplay commands
program
  .command('roll <gameId>')
  .description('Roll dice for your turn')
  .action(rollCommand)

program
  .command('play <gameId>')
  .description('Interactive game play session')
  .action(playCommand)

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`))
  console.log('Run `backgammon --help` for available commands')
  process.exit(1)
})

// Parse command line arguments
program.parse()

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}