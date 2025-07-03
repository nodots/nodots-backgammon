import chalk from 'chalk'
import { AuthService } from '../services/auth'
import { GameService } from '../services/game'

export async function rollCommand(gameId: string) {
  console.log(chalk.blue(`🎲 Rolling dice for game: ${gameId}`))

  const authService = new AuthService()
  const gameService = new GameService()

  try {
    const token = await authService.requireAuth()
    const result = await gameService.rollDice(gameId, token)

    console.log(chalk.green('✅ Dice rolled!'))
    
    if (result.roll) {
      console.log(chalk.yellow(`🎲 Roll: [${result.roll.join(', ')}]`))
    }
    
    console.log(chalk.white(`🎯 New State: ${result.stateKind}`))
    console.log(chalk.white(`🎮 Active Color: ${result.activeColor}`))
    
    if (result.message) {
      console.log(chalk.cyan(`💬 ${result.message}`))
    }

    console.log(chalk.yellow('\n🎯 Next steps:'))
    if (result.stateKind === 'rolled') {
      console.log(chalk.gray(`• Make moves: backgammon play ${gameId}`))
    }
    console.log(chalk.gray(`• Check status: backgammon status ${gameId}`))

  } catch (error) {
    console.error(chalk.red(`❌ Failed to roll dice: ${error}`))
    process.exit(1)
  }
}