const { Game, Player, Robot, Board } = require('./nodots-backgammon-core/dist')
const fs = require('fs')
const path = require('path')

// GNU vs Nodots AI Configuration
const AI_CONFIGS = {
  GNU: {
    difficulty: 'advanced',
    aiPlugin: 'basic-ai',
    name: 'GNU Bot',
    description: 'GNU Backgammon-style AI (Advanced difficulty)',
  },
  NODOTS: {
    difficulty: 'intermediate',
    aiPlugin: 'basic-ai',
    name: 'Nodots Bot',
    description: 'Nodots-style AI (Intermediate difficulty)',
  },
}

function checkWinCondition(board) {
  if (!board?.off?.clockwise || !board?.off?.counterclockwise) {
    return null
  }

  let whiteCheckersOff = 0
  let blackCheckersOff = 0

  try {
    // White (GNU) plays clockwise -> only check board.off.clockwise
    if (board.off.clockwise?.checkers) {
      whiteCheckersOff = board.off.clockwise.checkers.filter(
        (c) => c.color === 'white'
      ).length
    }

    // Black (NODOTS) plays counterclockwise -> only check board.off.counterclockwise
    if (board.off.counterclockwise?.checkers) {
      blackCheckersOff = board.off.counterclockwise.checkers.filter(
        (c) => c.color === 'black'
      ).length
    }
  } catch (error) {
    console.error('Error counting checkers off:', error)
    return null
  }

  if (whiteCheckersOff === 15) return 'GNU'
  if (blackCheckersOff === 15) return 'NODOTS'
  return null
}

function getBotTypeFromColor(color) {
  return color === 'white' ? 'GNU' : 'NODOTS'
}

function saveFailureData(game, gameNumber, turnNumber, reason, error) {
  const timestamp = new Date().toISOString()
  const dumpDir = path.join(process.cwd(), 'simulation-failures')

  // Create failure dump directory
  if (!fs.existsSync(dumpDir)) {
    fs.mkdirSync(dumpDir, { recursive: true })
  }

  const dumpFile = path.join(
    dumpDir,
    `quick-failure-game-${gameNumber}-turn-${turnNumber}-${timestamp.replace(
      /[:.]/g,
      '-'
    )}.json`
  )

  const dump = {
    failureInfo: {
      gameNumber,
      turnNumber,
      reason,
      error: error?.message || error,
      timestamp,
      testType: 'quick-10-simulation',
    },
    gameState: {
      id: game.id,
      stateKind: game.stateKind,
      activeColor: game.activeColor,
      activePlayer: game.activePlayer
        ? {
            id: game.activePlayer.id,
            color: game.activePlayer.color,
            direction: game.activePlayer.direction,
            stateKind: game.activePlayer.stateKind,
            dice: game.activePlayer.dice,
          }
        : null,
    },
    boardState: {
      gnuPositionId: game.gnuPositionId,
    },
  }

  fs.writeFileSync(dumpFile, JSON.stringify(dump, null, 2))
  console.log(`   💾 Failure dump saved to: ${dumpFile}`)

  return dumpFile
}

async function runSingleSimulation(gameNumber) {
  const gameStartTime = Date.now()

  console.log(`\n🎮 Starting Game ${gameNumber}/10`)
  console.log('='.repeat(30))

  // Initialize players
  const gnuPlayer = Player.initialize(
    'white',
    'clockwise',
    undefined,
    'GNU-Bot',
    'inactive',
    true
  )

  const nodotsPlayer = Player.initialize(
    'black',
    'counterclockwise',
    undefined,
    'Nodots-Bot',
    'inactive',
    true
  )

  const players = [gnuPlayer, nodotsPlayer]

  // Initialize game
  let game = Game.initialize(players)
  let turnCount = 0
  let gnuMoves = 0
  let nodotsMoves = 0
  const gameId = game.id

  console.log(`Game ID: ${gameId}`)
  console.log(`O | ${AI_CONFIGS.GNU.description} | clockwise >`)
  console.log(`X | ${AI_CONFIGS.NODOTS.description} | counterclockwise >`)

  // Roll for start
  let currentGame = Game.rollForStart(game)

  const maxTurns = 200 // Reasonable limit for quick testing
  let winner = null
  let gameResult = {
    gameNumber,
    gameId,
    winner: null,
    turnCount: 0,
    gnuMoves: 0,
    nodotsMoves: 0,
    duration: 0,
    status: 'completed', // 'completed', 'failed', 'timeout'
    failureReason: null,
    failureTurn: null,
  }

  while (!winner && turnCount < maxTurns) {
    turnCount++
    const activeBot = getBotTypeFromColor(currentGame.activeColor)
    const botConfig = AI_CONFIGS[activeBot]

    console.log(`\nTurn ${turnCount}: ${activeBot} Bot`)

    try {
      // Handle the robot's turn
      let turnCompleted = false
      let moveCount = 0
      const maxMovesPerTurn = 10

      while (!turnCompleted && moveCount < maxMovesPerTurn) {
        const robotResult = await Robot.makeOptimalMove(
          currentGame,
          botConfig.difficulty,
          botConfig.aiPlugin
        )

        if (!robotResult.success) {
          // Check for specific failure types
          if (
            robotResult.error?.includes('no legal moves') ||
            robotResult.error?.includes('passed turn')
          ) {
            console.log(`  ⏭️  ${activeBot}: ${robotResult.error}`)
            turnCompleted = true
          } else {
            // This is a failure - save and report it
            console.log(`  ❌ ${activeBot}: FAILURE - ${robotResult.error}`)

            saveFailureData(
              currentGame,
              gameNumber,
              turnCount,
              `Robot execution error: ${activeBot}`,
              robotResult.error
            )

            gameResult.status = 'failed'
            gameResult.failureReason = robotResult.error
            gameResult.failureTurn = turnCount

            // Try to force turn completion to continue
            if (currentGame.stateKind === 'moving') {
              try {
                currentGame = Game.checkAndCompleteTurn(currentGame)
                turnCompleted = true
                console.log(
                  `  🔄 Forced turn completion to continue simulation`
                )
              } catch (forceError) {
                console.log(`  🛑 Cannot recover from failure, ending game`)
                gameResult.turnCount = turnCount
                gameResult.gnuMoves = gnuMoves
                gameResult.nodotsMoves = nodotsMoves
                gameResult.duration = Date.now() - gameStartTime
                return gameResult
              }
            } else {
              console.log(`  🛑 Game cannot continue, ending`)
              gameResult.turnCount = turnCount
              gameResult.gnuMoves = gnuMoves
              gameResult.nodotsMoves = nodotsMoves
              gameResult.duration = Date.now() - gameStartTime
              return gameResult
            }
          }
        } else {
          // Move executed successfully
          currentGame = robotResult.game
          moveCount++

          if (activeBot === 'GNU') {
            gnuMoves++
          } else {
            nodotsMoves++
          }

          console.log(`  ✅ ${activeBot}: Move ${moveCount} completed`)

          // Check if turn completed (active player changed)
          const newActiveBot = getBotTypeFromColor(currentGame.activeColor)
          if (newActiveBot !== activeBot) {
            console.log(`  🔄 Turn completed, switching to ${newActiveBot}`)
            turnCompleted = true
          }

          // Check if all dice used
          if (currentGame.activePlay?.moves) {
            const movesArray = Array.from(currentGame.activePlay.moves)
            const readyMoves = movesArray.filter((m) => m.stateKind === 'ready')
            if (readyMoves.length === 0) {
              if (currentGame.stateKind === 'moving') {
                currentGame = Game.checkAndCompleteTurn(currentGame)
              }
              console.log(`  🎯 All dice used, turn completed`)
              turnCompleted = true
            }
          }

          // Check win condition
          const currentWinner = checkWinCondition(currentGame.board)
          if (currentWinner) {
            winner = currentWinner
            console.log(`  🏆 ${winner} WINS!`)
            turnCompleted = true
            break
          }
        }
      }

      // Force turn completion if move limit reached
      if (!turnCompleted && moveCount >= maxMovesPerTurn) {
        console.log(`  ⚠️  Move limit reached, forcing turn completion`)
        if (currentGame.stateKind === 'moving') {
          currentGame = Game.checkAndCompleteTurn(currentGame)
        }
      }

      // Final win check
      winner = checkWinCondition(currentGame.board)
      if (winner) {
        gameResult.winner = winner
        gameResult.status = 'completed'
        break
      }

      // Timeout check
      if (turnCount >= maxTurns) {
        console.log(`  ⏱️  Turn limit exceeded, possible infinite loop`)
        saveFailureData(
          currentGame,
          gameNumber,
          turnCount,
          'Turn limit exceeded (possible infinite loop)',
          'Game did not complete within turn limit'
        )

        gameResult.status = 'timeout'
        gameResult.failureReason = 'Turn limit exceeded'
        gameResult.failureTurn = turnCount
        break
      }
    } catch (error) {
      // Unhandled exception
      console.log(`  💥 Unhandled exception: ${error.message}`)
      saveFailureData(
        currentGame,
        gameNumber,
        turnCount,
        'Unhandled exception',
        error
      )

      gameResult.status = 'failed'
      gameResult.failureReason = error.message
      gameResult.failureTurn = turnCount
      break
    }
  }

  // Finalize game result
  gameResult.turnCount = turnCount
  gameResult.gnuMoves = gnuMoves
  gameResult.nodotsMoves = nodotsMoves
  gameResult.duration = Date.now() - gameStartTime

  // Print game summary
  console.log(`\n📊 Game ${gameNumber} Summary:`)
  console.log(`   Status: ${gameResult.status}`)
  console.log(`   Winner: ${gameResult.winner || 'None'}`)
  console.log(`   Turns: ${gameResult.turnCount}`)
  console.log(
    `   Moves: GNU ${gameResult.gnuMoves}, NODOTS ${gameResult.nodotsMoves}`
  )
  console.log(`   Duration: ${(gameResult.duration / 1000).toFixed(2)}s`)

  if (gameResult.status === 'failed') {
    console.log(
      `   ❌ Failure: ${gameResult.failureReason} (Turn ${gameResult.failureTurn})`
    )
  }

  return gameResult
}

async function run10Simulations() {
  console.log('🚀 Starting 10 GNU vs Nodots Robot Simulations')
  console.log('⚡ Quick test run with detailed per-game output')
  console.log('='.repeat(60))

  const startTime = Date.now()
  const results = []
  let completedGames = 0
  let gnuWins = 0
  let nodotsWins = 0
  let failures = 0
  let timeouts = 0
  let totalTurns = 0
  let totalMoves = 0

  for (let gameNumber = 1; gameNumber <= 10; gameNumber++) {
    const result = await runSingleSimulation(gameNumber)
    results.push(result)

    // Update stats
    totalTurns += result.turnCount
    totalMoves += result.gnuMoves + result.nodotsMoves

    if (result.status === 'completed') {
      completedGames++
      if (result.winner === 'GNU') {
        gnuWins++
      } else if (result.winner === 'NODOTS') {
        nodotsWins++
      }
    } else if (result.status === 'failed') {
      failures++
    } else if (result.status === 'timeout') {
      timeouts++
    }
  }

  const endTime = Date.now()
  const totalTime = endTime - startTime

  // Print final summary
  console.log('\n\n' + '🎉'.repeat(60))
  console.log('🎉 10 SIMULATION QUICK TEST COMPLETE!')
  console.log('🎉'.repeat(60))

  console.log('\n📈 SUMMARY:')
  console.log(`   Total Games: 10`)
  console.log(
    `   Completed: ${completedGames} (${((completedGames / 10) * 100).toFixed(
      1
    )}%)`
  )
  console.log(`   Failed: ${failures} (${((failures / 10) * 100).toFixed(1)}%)`)
  console.log(
    `   Timeout: ${timeouts} (${((timeouts / 10) * 100).toFixed(1)}%)`
  )
  console.log(`   Total Time: ${(totalTime / 1000).toFixed(2)}s`)
  console.log(`   Avg Game: ${(totalTime / 10 / 1000).toFixed(2)}s`)

  if (completedGames > 0) {
    console.log('\n🏆 WIN STATISTICS:')
    console.log(
      `   GNU Wins: ${gnuWins} (${((gnuWins / completedGames) * 100).toFixed(
        1
      )}%)`
    )
    console.log(
      `   NODOTS Wins: ${nodotsWins} (${(
        (nodotsWins / completedGames) *
        100
      ).toFixed(1)}%)`
    )

    console.log('\n📊 GAME METRICS:')
    console.log(`   Total Turns: ${totalTurns}`)
    console.log(`   Total Moves: ${totalMoves}`)
    console.log(`   Avg Turns: ${(totalTurns / completedGames).toFixed(1)}`)
    console.log(`   Avg Moves: ${(totalMoves / completedGames).toFixed(1)}`)
  }

  console.log('\n🔍 INDIVIDUAL RESULTS:')
  results.forEach((result, index) => {
    const status =
      result.status === 'completed'
        ? '✅'
        : result.status === 'failed'
        ? '❌'
        : result.status === 'timeout'
        ? '⏱️'
        : '❓'
    const winner = result.winner ? `${result.winner} wins` : 'No winner'
    console.log(
      `   Game ${index + 1}: ${status} ${winner} (${result.turnCount} turns, ${(
        result.duration / 1000
      ).toFixed(1)}s)`
    )
  })

  // Assessment
  console.log('\n🎯 QUICK ASSESSMENT:')
  const successRate = completedGames / 10
  if (successRate >= 0.9) {
    console.log('✅ EXCELLENT: System working reliably')
  } else if (successRate >= 0.7) {
    console.log('✅ GOOD: System mostly stable')
  } else if (successRate >= 0.5) {
    console.log('⚠️  MODERATE: Some issues detected')
  } else {
    console.log('❌ POOR: System has reliability problems')
  }

  if (failures > 0) {
    console.log(`📁 ${failures} failure dump(s) saved to simulation-failures/`)
  }

  return {
    totalGames: 10,
    completedGames,
    gnuWins,
    nodotsWins,
    failures,
    timeouts,
    successRate,
    totalTime,
    results,
  }
}

// Run the quick simulation
run10Simulations()
  .then((summary) => {
    console.log('\n🚀 Quick test completed!')
    process.exit(summary.successRate >= 0.7 ? 0 : 1)
  })
  .catch((error) => {
    console.error('\n💥 SIMULATION CRASHED:', error)
    process.exit(1)
  })
