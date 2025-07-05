import chalk from 'chalk'
import { Command } from 'commander'
import axios from 'axios'
import https from 'https'
import { AuthService } from '../services/auth'

export class GameRollCommand extends Command {
  constructor() {
    super('game-roll')
    this.description('Roll dice for your turn')
    .argument('<gameId>', 'ID of the game to roll dice for')
    .action(this.execute.bind(this))
  }

  private async execute(gameId: string): Promise<void> {
    try {
      console.log(chalk.blue(`🎲 Rolling dice for game: ${gameId}`))

      const authService = new AuthService()
      const apiConfig = authService.getApiConfig()
      
      if (!apiConfig.apiKey) {
        console.log(chalk.red('❌ Not authenticated. Please run: nodots-backgammon login'))
        return
      }

      const apiUrl = process.env.NODOTS_API_URL || 'https://localhost:3443'

      // Create HTTPS agent for self-signed certificates
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false
      })

      const response = await axios.post(
        `${apiUrl}/api/v3.2/games/${gameId}/roll`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${apiConfig.apiKey}`,
            'Content-Type': 'application/json'
          },
          httpsAgent
        }
      )

      const result = response.data

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
        console.log(chalk.gray(`• Interactive play: nodots-backgammon game-play ${gameId}`))
      }
      console.log(chalk.gray(`• Check status: nodots-backgammon game-status ${gameId}`))

    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error(chalk.red('❌ Authentication failed. Please run: nodots-backgammon login'))
      } else if (error.response?.status === 404) {
        console.error(chalk.red('❌ Game not found'))
      } else {
        console.error(chalk.red(`❌ Failed to roll dice: ${error.response?.data?.error || error.message}`))
      }
    }
  }
}