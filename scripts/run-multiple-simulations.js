const { Game, Robot, generateId } = require('./dist/index.js')
const fs = require('fs')
const path = require('path')

// Create results directory if it doesn't exist
const resultsDir = path.join(__dirname, 'simulation-results')
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true })
}

// Function to run a single simulation
async function runSingleSimulation(simulationNumber) {
  console.log(`\n🎲 **[SIMULATION ${simulationNumber}] STARTING**`)
  console.log(
    `🕒 **[${new Date().toLocaleTimeString()}] Starting simulation ${simulationNumber}`
  )

  // Generate unique IDs for players
  const player1Id = generateId()
  const player2Id = generateId()

  console.log(`- Player 1 (${player1Id}): Advanced Robot`)
  console.log(`- Player 2 (${player2Id}): Beginner Robot`)

  // Create game with two robot players
  let game = Game.createNewGame(
    { userId: player1Id, isRobot: true },
    { userId: player2Id, isRobot: true }
  )

  console.log(`🎮 Game created with ID: ${game.id}`)

  // Game simulation variables
  let moveCount = 0
  let maxMoves = 300 // Reasonable limit
  let gameLog = []
  let errors = []
  let winner = null
  let completed = false

  // Helper functions
  function getRobotDifficulty(playerId) {
    return playerId === player1Id ? 'advanced' : 'beginner'
  }

  function getPlayerDescription(playerId) {
    return playerId === player1Id ? 'Advanced Robot' : 'Beginner Robot'
  }

  // Main simulation loop
  while (game && game.stateKind !== 'completed' && moveCount < maxMoves) {
    try {
      moveCount++

      // Status update every 25 moves
      if (moveCount % 25 === 0) {
        console.log(`🕒 Move ${moveCount}: Game state is ${game.stateKind}`)
      }

      // Check if there's an active player who is a robot
      if (game.activePlayer?.isRobot) {
        const difficulty = getRobotDifficulty(game.activePlayer.userId)
        const playerDescription = getPlayerDescription(game.activePlayer.userId)

        // Let the robot make its move
        const robotResult = await Robot.makeOptimalMove(game, difficulty)

        if (robotResult.success && robotResult.game) {
          game = robotResult.game

          // Log significant moves
          if (moveCount % 20 === 0) {
            gameLog.push({
              moveNumber: moveCount,
              player: playerDescription,
              difficulty: difficulty,
              gameState: game.stateKind,
              message: robotResult.message || 'Move executed successfully',
            })
          }

          // Check for completion
          if (game.stateKind === 'completed') {
            completed = true
            break
          }
        } else {
          errors.push({
            moveNumber: moveCount,
            error: robotResult.error,
            gameState: game.stateKind,
          })

          // If too many errors, break
          if (errors.length > 10) {
            break
          }
        }
      } else {
        // No robot player active
        break
      }

      // Small delay to prevent overwhelming
      await new Promise((resolve) => setTimeout(resolve, 10))
    } catch (error) {
      errors.push({
        moveNumber: moveCount,
        error: error.message,
        gameState: game?.stateKind || 'unknown',
      })
      break
    }
  }

  // Determine winner (simplified)
  if (completed && game.stateKind === 'completed') {
    // Try to determine winner based on final state
    const player1 = game.players.find((p) => p.userId === player1Id)
    const player2 = game.players.find((p) => p.userId === player2Id)

    if (player1 && player2) {
      // Simple heuristic: player with lower pip count or completed game
      if (game.activePlayer) {
        winner =
          game.activePlayer.color === player1.color
            ? 'Advanced Robot'
            : 'Beginner Robot'
      } else {
        winner = 'Game completed'
      }
    }
  }

  const result = {
    simulationNumber,
    gameId: game?.id || 'unknown',
    completed,
    winner,
    totalMoves: moveCount,
    totalErrors: errors.length,
    gameLog,
    errors: errors.slice(0, 5), // Keep only first 5 errors
    finalState: game?.stateKind || 'unknown',
    duration: 'N/A',
  }

  console.log(`✅ **[SIMULATION ${simulationNumber}] COMPLETED**`)
  console.log(
    `📊 Result: ${winner || 'Incomplete'} | Moves: ${moveCount} | Errors: ${
      errors.length
    }`
  )

  return result
}

// Main function to run all simulations
async function runAllSimulations() {
  console.log('🚀 **[STARTING BATCH OF 5 ROBOT SIMULATIONS]**')
  console.log('🤖 Advanced Robot vs Beginner Robot')
  console.log('Using only nodots-backgammon-core library\n')

  const allResults = []
  const startTime = Date.now()

  // Run 5 simulations
  for (let i = 1; i <= 5; i++) {
    try {
      const result = await runSingleSimulation(i)
      allResults.push(result)

      // Brief pause between simulations
      if (i < 5) {
        console.log(`⏱️ Pausing 2 seconds before next simulation...\n`)
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    } catch (error) {
      console.error(`❌ Simulation ${i} failed:`, error.message)
      allResults.push({
        simulationNumber: i,
        error: error.message,
        completed: false,
        winner: null,
        totalMoves: 0,
        totalErrors: 1,
      })
    }
  }

  const totalTime = Date.now() - startTime

  // Generate summary
  const summary = {
    totalSimulations: 5,
    completed: allResults.filter((r) => r.completed).length,
    totalMoves: allResults.reduce((sum, r) => sum + (r.totalMoves || 0), 0),
    totalErrors: allResults.reduce((sum, r) => sum + (r.totalErrors || 0), 0),
    winners: {
      'Advanced Robot': allResults.filter((r) => r.winner === 'Advanced Robot')
        .length,
      'Beginner Robot': allResults.filter((r) => r.winner === 'Beginner Robot')
        .length,
      Incomplete: allResults.filter(
        (r) => !r.winner || r.winner === 'Incomplete'
      ).length,
    },
    totalDuration: totalTime,
    averageMovesPerGame: Math.round(
      allResults.reduce((sum, r) => sum + (r.totalMoves || 0), 0) /
        allResults.length
    ),
    results: allResults,
  }

  console.log('\n🏁 **[ALL SIMULATIONS COMPLETED]**')
  console.log('='.repeat(50))
  console.log(`📊 **SUMMARY RESULTS**`)
  console.log(`Total Simulations: ${summary.totalSimulations}`)
  console.log(`Completed Games: ${summary.completed}`)
  console.log(`Total Moves: ${summary.totalMoves}`)
  console.log(`Average Moves per Game: ${summary.averageMovesPerGame}`)
  console.log(`Total Errors: ${summary.totalErrors}`)
  console.log(
    `Total Duration: ${(summary.totalDuration / 1000).toFixed(2)} seconds`
  )
  console.log('')
  console.log('🏆 **WINNERS:**')
  console.log(`- Advanced Robot: ${summary.winners['Advanced Robot']}`)
  console.log(`- Beginner Robot: ${summary.winners['Beginner Robot']}`)
  console.log(`- Incomplete: ${summary.winners['Incomplete']}`)
  console.log('')

  // Detailed results
  console.log('📋 **DETAILED RESULTS:**')
  allResults.forEach((result, index) => {
    console.log(
      `${index + 1}. Simulation ${result.simulationNumber}: ${
        result.winner || 'Incomplete'
      } (${result.totalMoves} moves, ${result.totalErrors} errors)`
    )
  })

  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const resultFile = path.join(resultsDir, `batch-simulation-${timestamp}.json`)
  fs.writeFileSync(resultFile, JSON.stringify(summary, null, 2))

  console.log(`\n💾 Full results saved to: ${resultFile}`)
  console.log('✅ **BATCH SIMULATION COMPLETE**')

  return summary
}

// Run the batch simulation
runAllSimulations().catch((error) => {
  console.error('💥 Batch simulation failed:', error)
  process.exit(1)
})
