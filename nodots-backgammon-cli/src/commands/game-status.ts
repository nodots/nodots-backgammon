import chalk from 'chalk'
import { Command } from 'commander'
import axios from 'axios'
import { AuthService } from '../services/auth'

export class GameStatusCommand extends Command {
  constructor() {
    super('game-status')
    this.description('Show current game status')
    .argument('<gameId>', 'ID of the game to check')
    .action(this.execute.bind(this))
  }

  private async execute(gameId: string): Promise<void> {
    try {
      console.log(chalk.blue(`📊 Game Status: ${gameId}`))

      const authService = new AuthService()
      const apiConfig = authService.getApiConfig()
      
      if (!apiConfig.apiKey) {
        console.log(chalk.red('❌ Not authenticated. Please run: nodots-backgammon login'))
        return
      }

      const apiUrl = process.env.NODOTS_API_URL || 'http://localhost:3000'

      const response = await axios.get(
        `${apiUrl}/api/v1/games/${gameId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiConfig.apiKey}`
          }
        }
      )

      const game = response.data

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
        console.log(chalk.gray(`• Roll dice: nodots-backgammon game-roll ${gameId}`))
      }
      if (game.stateKind === 'rolled') {
        console.log(chalk.gray(`• Interactive play: nodots-backgammon game-play ${gameId}`))
      }

      // Show ASCII board if available
      if (game.ascii) {
        console.log(chalk.cyan('\n📋 Board:'))
        console.log(game.ascii)
      }

    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error(chalk.red('❌ Authentication failed. Please run: nodots-backgammon login'))
      } else if (error.response?.status === 404) {
        console.error(chalk.red('❌ Game not found'))
      } else {
        console.error(chalk.red(`❌ Failed to get game status: ${error.response?.data?.error || error.message}`))
      }
    }
  }
}