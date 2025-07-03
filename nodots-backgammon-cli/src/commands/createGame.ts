import chalk from 'chalk'
import { AuthService } from '../services/auth'
import { GameService } from '../services/game'

export async function createGameCommand() {
  console.log(chalk.blue('🎮 Creating new backgammon game...'))

  const authService = new AuthService()
  const gameService = new GameService()

  try {
    const token = await authService.requireAuth()
    const game = await gameService.createGame(token)

    console.log(chalk.green('✅ Game created successfully!'))
    console.log(chalk.yellow(`🆔 Game ID: ${game.id}`))
    console.log(chalk.white(`🎲 State: ${game.stateKind}`))
    console.log(chalk.white(`🎯 Active Color: ${game.activeColor}`))
    
    console.log(chalk.cyan('\n👥 Players:'))
    game.players.forEach((player: any) => {
      const isHuman = player.email !== 'robot@nodots.com'
      const icon = isHuman ? '👤' : '🤖'
      const type = isHuman ? 'Human' : 'Robot'
      console.log(`${icon} ${type}: ${player.color.toUpperCase()} (${player.direction})`)
    })

    console.log(chalk.yellow('\n🎯 Next steps:'))
    console.log(chalk.gray(`• Check status: backgammon status ${game.id}`))
    console.log(chalk.gray(`• Start playing: backgammon play ${game.id}`))

  } catch (error) {
    console.error(chalk.red(`❌ Failed to create game: ${error}`))
    process.exit(1)
  }
}