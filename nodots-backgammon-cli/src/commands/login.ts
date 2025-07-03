import chalk from 'chalk'
import { AuthService } from '../services/auth'

export async function loginCommand() {
  console.log(chalk.blue('🔐 Nodots Backgammon CLI Login'))
  console.log(chalk.gray('Connecting to local API server...\n'))

  const authService = new AuthService()
  
  try {
    const success = await authService.login()
    
    if (success) {
      console.log(chalk.green('\n✅ Login successful!'))
      console.log(chalk.yellow('You can now create and play games.'))
      console.log(chalk.gray('Try: backgammon create-game'))
    } else {
      console.error(chalk.red('\n❌ Login failed'))
      process.exit(1)
    }
  } catch (error) {
    console.error(chalk.red(`\n❌ Login error: ${error}`))
    process.exit(1)
  }
}