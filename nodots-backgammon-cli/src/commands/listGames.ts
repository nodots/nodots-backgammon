import chalk from 'chalk'
import Table from 'cli-table3'
import { AuthService } from '../services/auth'
import { GameService } from '../services/game'

export async function listGamesCommand() {
  console.log(chalk.blue('📋 Your Backgammon Games'))

  const authService = new AuthService()
  const gameService = new GameService()

  try {
    const token = await authService.requireAuth()
    const response = await gameService.listGames(token)

    if (response.games.length === 0) {
      console.log(chalk.yellow('\n📭 No games found'))
      console.log(chalk.gray('Create a new game: backgammon create-game'))
      return
    }

    const table = new Table({
      head: ['Game ID', 'State', 'Active Color', 'Created'],
      colWidths: [20, 15, 12, 20]
    })

    response.games.forEach((game: any) => {
      table.push([
        game.id.substring(0, 8) + '...',
        game.stateKind,
        game.activeColor,
        new Date(game.createdAt).toLocaleDateString()
      ])
    })

    console.log('\n' + table.toString())

    console.log(chalk.yellow('\n🎯 Available commands:'))
    console.log(chalk.gray('• backgammon status <gameId>  - Show game details'))
    console.log(chalk.gray('• backgammon play <gameId>    - Start interactive play'))
    console.log(chalk.gray('• backgammon create-game      - Create new game'))

  } catch (error) {
    console.error(chalk.red(`❌ Failed to list games: ${error}`))
    process.exit(1)
  }
}