import chalk from 'chalk'
import { AuthService } from '../services/auth'
import { GameService } from '../services/game'

export async function statusCommand(gameId: string) {
  console.log(chalk.blue(`📊 Game Status: ${gameId}`))

  const authService = new AuthService()
  const gameService = new GameService()

  try {
    const token = await authService.requireAuth()
    const game = await gameService.getGame(gameId, token)

    console.log(chalk.white(`\n🎮 Game: ${game.id}`))
    console.log(chalk.white(`🎲 State: ${game.stateKind}`))
    console.log(chalk.white(`🎯 Active Color: ${game.activeColor}`))
    
    if (game.lastRoll) {
      console.log(chalk.white(`🎲 Last Roll: [${game.lastRoll.join(', ')}]`))
    }
    
    if (game.lastMove) {
      console.log(chalk.white(`📍 Last Move: ${game.lastMove.from} → ${game.lastMove.to}`))
    }

    console.log(chalk.cyan('\n👥 Players:'))
    game.players.forEach((player: any) => {
      const isActive = player.color === game.activeColor
      const isHuman = player.email !== 'robot@nodots.com'
      const icon = isHuman ? '👤' : '🤖'
      const type = isHuman ? 'Human' : 'Robot'
      const activeIndicator = isActive ? chalk.green(' ← ACTIVE') : ''
      
      console.log(`${icon} ${type}: ${player.color.toUpperCase()} (${player.direction})${activeIndicator}`)
    })

    console.log(chalk.yellow('\n🎯 Available actions:'))
    if (game.stateKind === 'rolling' || game.stateKind === 'rolling-for-start') {
      console.log(chalk.gray(`• Roll dice: backgammon roll ${gameId}`))
    }
    if (game.stateKind === 'rolled') {
      console.log(chalk.gray(`• Make move: backgammon play ${gameId}`))
    }
    console.log(chalk.gray(`• Interactive play: backgammon play ${gameId}`))

  } catch (error) {
    console.error(chalk.red(`❌ Failed to get game status: ${error}`))
    process.exit(1)
  }
}