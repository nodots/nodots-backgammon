import chalk from 'chalk'
import inquirer from 'inquirer'
import { AuthService } from '../services/auth'
import { GameService } from '../services/game'

export async function playCommand(gameId: string) {
  console.log(chalk.blue(`🎮 Interactive Play: ${gameId}`))

  const authService = new AuthService()
  const gameService = new GameService()

  try {
    const token = await authService.requireAuth()
    
    while (true) {
      // Get current game state
      const game = await gameService.getGame(gameId, token)
      
      console.log(chalk.cyan(`\n📊 Game State: ${game.stateKind}`))
      console.log(chalk.white(`🎯 Active Color: ${game.activeColor}`))
      
      // Check if it's the human player's turn
      const humanPlayer = game.players.find((p: any) => p.email !== 'robot@nodots.com')
      const isHumanTurn = humanPlayer && humanPlayer.color === game.activeColor
      
      if (!isHumanTurn) {
        console.log(chalk.yellow('⏳ Waiting for robot player...'))
        // Wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }

      console.log(chalk.green('🎯 Your turn!'))
      
      // Show available actions based on game state
      const actions: string[] = []
      
      if (game.stateKind === 'rolling' || game.stateKind === 'rolling-for-start') {
        actions.push('Roll dice')
      }
      
      if (game.stateKind === 'rolled') {
        actions.push('Make move')
        actions.push('End turn')
      }
      
      actions.push('Show status')
      actions.push('Exit')

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: actions
        }
      ])

      switch (action) {
        case 'Roll dice':
          try {
            const rollResult = await gameService.rollDice(gameId, token)
            console.log(chalk.green(`🎲 Rolled: [${rollResult.roll?.join(', ')}]`))
          } catch (error) {
            console.error(chalk.red(`❌ Roll failed: ${error}`))
          }
          break

        case 'Make move':
          const { from, to } = await inquirer.prompt([
            {
              type: 'number',
              name: 'from',
              message: 'Move from point (1-24):',
              validate: (value) => value >= 1 && value <= 24
            },
            {
              type: 'number',
              name: 'to',
              message: 'Move to point (1-24):',
              validate: (value) => value >= 1 && value <= 24
            }
          ])
          
          try {
            const moveResult = await gameService.makeMove(gameId, from, to, token)
            console.log(chalk.green(`✅ ${moveResult.message}`))
          } catch (error) {
            console.error(chalk.red(`❌ Move failed: ${error}`))
          }
          break

        case 'End turn':
          try {
            const playResult = await gameService.endTurn(gameId, token)
            console.log(chalk.green(`✅ ${playResult.message}`))
          } catch (error) {
            console.error(chalk.red(`❌ End turn failed: ${error}`))
          }
          break

        case 'Show status':
          console.log(chalk.cyan('\n📊 Current Status:'))
          if (game.lastRoll) {
            console.log(chalk.white(`🎲 Last Roll: [${game.lastRoll.join(', ')}]`))
          }
          if (game.lastMove) {
            console.log(chalk.white(`📍 Last Move: ${game.lastMove.from} → ${game.lastMove.to}`))
          }
          break

        case 'Exit':
          console.log(chalk.yellow('👋 Exiting game session'))
          console.log(chalk.gray(`To resume: backgammon play ${gameId}`))
          return
      }
    }

  } catch (error) {
    console.error(chalk.red(`❌ Game play error: ${error}`))
    process.exit(1)
  }
}