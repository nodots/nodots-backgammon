import chalk from 'chalk'
import { Command } from 'commander'
import axios from 'axios'
import { AuthService } from '../services/auth'

export class HumanVsRobotCommand extends Command {
  constructor() {
    super('human-vs-robot')
    this.description('Create a new human vs robot backgammon game')
    .action(this.execute.bind(this))
  }

  private async execute(): Promise<void> {
    try {
      console.log(chalk.blue('🎮 Creating new human vs robot game...'))

      const authService = new AuthService()
      const apiConfig = authService.getApiConfig()
      
      if (!apiConfig.apiKey) {
        console.log(chalk.red('❌ Not authenticated. Please run: nodots-backgammon login'))
        return
      }

      const apiUrl = process.env.NODOTS_API_URL || 'http://localhost:3000'

      // Create game using the human vs robot API
      const response = await axios.post(
        `${apiUrl}/api/v1/games`,
        { opponent: 'robot' },
        {
          headers: {
            'Authorization': `Bearer ${apiConfig.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const game = response.data

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
      console.log(chalk.gray(`• Check status: nodots-backgammon game-status ${game.id}`))
      console.log(chalk.gray(`• Roll dice: nodots-backgammon game-roll ${game.id}`))
      console.log(chalk.gray(`• Interactive play: nodots-backgammon game-play ${game.id}`))

    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error(chalk.red('❌ Authentication failed. Please run: nodots-backgammon login'))
      } else {
        console.error(chalk.red(`❌ Failed to create game: ${error.response?.data?.error || error.message}`))
      }
    }
  }
}