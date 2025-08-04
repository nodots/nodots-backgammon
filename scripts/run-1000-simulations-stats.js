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

function saveFailureData(
  game,
  gameNumber,
  turnNumber,
  reason,
  error,
  aggregateStats
) {
  const timestamp = new Date().toISOString()
  const dumpDir = path.join(process.cwd(), 'simulation-failures')

  // Create failure dump directory
  if (!fs.existsSync(dumpDir)) {
    fs.mkdirSync(dumpDir, { recursive: true })
  }

  const dumpFile = path.join(
    dumpDir,
    `failure-game-${gameNumber}-turn-${turnNumber}-${timestamp.replace(
      /[:.]/g,
      '-'
    )}.json`
  )

  let dump = {
    failureInfo: {
      gameNumber,
      turnNumber,
      reason,
      error: error?.message || error,
      timestamp,
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

  // Write failure data to file
  fs.writeFileSync(dumpFile, JSON.stringify(dump, null, 2))

  // Update aggregate stats
  aggregateStats.failures.push({
    gameNumber,
    turnNumber,
    reason,
    error: error?.message || error,
    timestamp,
    dumpFile,
  })

  return dumpFile
}

async function runSingleSimulation(gameNumber, aggregateStats) {
  const gameStartTime = Date.now()

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

  // Roll for start
  let currentGame = Game.rollForStart(game)

  const maxTurns = 300 // Generous limit to allow normal games to complete
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
            turnCompleted = true
          } else {
            // This is a failure - log it but continue the simulation
            const dumpFile = saveFailureData(
              currentGame,
              gameNumber,
              turnCount,
              `Robot execution error: ${activeBot}`,
              robotResult.error,
              aggregateStats
            )

            gameResult.status = 'failed'
            gameResult.failureReason = robotResult.error
            gameResult.failureTurn = turnCount

            // Force turn completion to continue simulation
            if (currentGame.stateKind === 'moving') {
              try {
                currentGame = Game.checkAndCompleteTurn(currentGame)
                turnCompleted = true
              } catch (forceError) {
                // If we can't force completion, end this game
                gameResult.turnCount = turnCount
                gameResult.gnuMoves = gnuMoves
                gameResult.nodotsMoves = nodotsMoves
                gameResult.duration = Date.now() - gameStartTime
                return gameResult
              }
            } else {
              // End this game
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

          // Check if turn completed (active player changed)
          const newActiveBot = getBotTypeFromColor(currentGame.activeColor)
          if (newActiveBot !== activeBot) {
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
              turnCompleted = true
            }
          }

          // Check win condition
          const currentWinner = checkWinCondition(currentGame.board)
          if (currentWinner) {
            winner = currentWinner
            turnCompleted = true
            break
          }
        }
      }

      // Force turn completion if move limit reached
      if (!turnCompleted && moveCount >= maxMovesPerTurn) {
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
        saveFailureData(
          currentGame,
          gameNumber,
          turnCount,
          'Turn limit exceeded (possible infinite loop)',
          'Game did not complete within turn limit',
          aggregateStats
        )

        gameResult.status = 'timeout'
        gameResult.failureReason = 'Turn limit exceeded'
        gameResult.failureTurn = turnCount
        break
      }
    } catch (error) {
      // Unhandled exception
      saveFailureData(
        currentGame,
        gameNumber,
        turnCount,
        'Unhandled exception',
        error,
        aggregateStats
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

  return gameResult
}

function printProgressReport(gameNumber, result, aggregateStats) {
  if (gameNumber % 50 === 0 || gameNumber <= 10) {
    const gnuWinRate =
      aggregateStats.completedGames > 0
        ? (
            (aggregateStats.gnuWins / aggregateStats.completedGames) *
            100
          ).toFixed(1)
        : 0
    const nodotsWinRate =
      aggregateStats.completedGames > 0
        ? (
            (aggregateStats.nodotsWins / aggregateStats.completedGames) *
            100
          ).toFixed(1)
        : 0
    const avgTurns =
      aggregateStats.completedGames > 0
        ? (aggregateStats.totalTurns / aggregateStats.completedGames).toFixed(1)
        : 0
    const avgDuration =
      aggregateStats.totalGames > 0
        ? (
            aggregateStats.totalDuration /
            aggregateStats.totalGames /
            1000
          ).toFixed(2)
        : 0

    console.log(`\n📊 Progress Report - Game ${gameNumber}/1000`)
    console.log(
      `   Status: ${result.status} | Winner: ${
        result.winner || 'None'
      } | Turns: ${result.turnCount}`
    )
    console.log(
      `   Completed: ${aggregateStats.completedGames} | Failures: ${aggregateStats.failures.length} | Timeouts: ${aggregateStats.timeouts}`
    )
    console.log(
      `   GNU: ${aggregateStats.gnuWins} wins (${gnuWinRate}%) | NODOTS: ${aggregateStats.nodotsWins} wins (${nodotsWinRate}%)`
    )
    console.log(`   Avg turns: ${avgTurns} | Avg duration: ${avgDuration}s`)
  } else {
    // Brief progress indicator
    process.stdout.write(
      result.status === 'completed'
        ? '✓'
        : result.status === 'failed'
        ? '✗'
        : result.status === 'timeout'
        ? '⏱'
        : '?'
    )
    if (gameNumber % 25 === 0) process.stdout.write(`[${gameNumber}]`)
  }
}

function generateDetailedReport(aggregateStats, totalTime) {
  const report = {
    summary: {
      totalGames: aggregateStats.totalGames,
      completedGames: aggregateStats.completedGames,
      failedGames: aggregateStats.failures.length,
      timeoutGames: aggregateStats.timeouts,
      totalDuration: totalTime,
      avgGameDuration:
        aggregateStats.totalGames > 0
          ? aggregateStats.totalDuration / aggregateStats.totalGames
          : 0,
    },
    winStatistics: {
      gnuWins: aggregateStats.gnuWins,
      nodotsWins: aggregateStats.nodotsWins,
      gnuWinRate:
        aggregateStats.completedGames > 0
          ? aggregateStats.gnuWins / aggregateStats.completedGames
          : 0,
      nodotsWinRate:
        aggregateStats.completedGames > 0
          ? aggregateStats.nodotsWins / aggregateStats.completedGames
          : 0,
    },
    gameMetrics: {
      totalTurns: aggregateStats.totalTurns,
      totalMoves: aggregateStats.totalMoves,
      avgTurnsPerGame:
        aggregateStats.completedGames > 0
          ? aggregateStats.totalTurns / aggregateStats.completedGames
          : 0,
      avgMovesPerGame:
        aggregateStats.completedGames > 0
          ? aggregateStats.totalMoves / aggregateStats.completedGames
          : 0,
      shortestGame: aggregateStats.shortestGame,
      longestGame: aggregateStats.longestGame,
      fastestGame: aggregateStats.fastestGame,
      slowestGame: aggregateStats.slowestGame,
    },
    reliability: {
      successRate:
        aggregateStats.totalGames > 0
          ? aggregateStats.completedGames / aggregateStats.totalGames
          : 0,
      failureRate:
        aggregateStats.totalGames > 0
          ? aggregateStats.failures.length / aggregateStats.totalGames
          : 0,
      timeoutRate:
        aggregateStats.totalGames > 0
          ? aggregateStats.timeouts / aggregateStats.totalGames
          : 0,
      avgFailureTurn:
        aggregateStats.failures.length > 0
          ? aggregateStats.failures.reduce((sum, f) => sum + f.turnNumber, 0) /
            aggregateStats.failures.length
          : 0,
    },
    failureAnalysis: {
      staleMovesCount: aggregateStats.failures.filter((f) =>
        f.reason.includes('stale move')
      ).length,
      timeoutCount: aggregateStats.timeouts,
      exceptionCount: aggregateStats.failures.filter((f) =>
        f.reason.includes('exception')
      ).length,
      otherFailuresCount: aggregateStats.failures.filter(
        (f) =>
          !f.reason.includes('stale move') &&
          !f.reason.includes('exception') &&
          !f.reason.includes('timeout')
      ).length,
    },
  }

  return report
}

async function run1000Simulations() {
  console.log('🚀 Starting 1000 GNU vs Nodots Robot Simulations')
  console.log('📊 Collecting comprehensive aggregate statistics')
  console.log('='.repeat(80))

  const startTime = Date.now()
  const aggregateStats = {
    totalGames: 0,
    completedGames: 0,
    gnuWins: 0,
    nodotsWins: 0,
    failures: [],
    timeouts: 0,
    totalTurns: 0,
    totalMoves: 0,
    totalDuration: 0,
    shortestGame: null,
    longestGame: null,
    fastestGame: null,
    slowestGame: null,
  }

  for (let gameNumber = 1; gameNumber <= 1000; gameNumber++) {
    aggregateStats.totalGames++

    const result = await runSingleSimulation(gameNumber, aggregateStats)

    // Update aggregate statistics
    aggregateStats.totalTurns += result.turnCount
    aggregateStats.totalMoves += result.gnuMoves + result.nodotsMoves
    aggregateStats.totalDuration += result.duration

    if (result.status === 'completed') {
      aggregateStats.completedGames++

      if (result.winner === 'GNU') {
        aggregateStats.gnuWins++
      } else if (result.winner === 'NODOTS') {
        aggregateStats.nodotsWins++
      }

      // Track game length records
      if (
        !aggregateStats.shortestGame ||
        result.turnCount < aggregateStats.shortestGame.turnCount
      ) {
        aggregateStats.shortestGame = result
      }
      if (
        !aggregateStats.longestGame ||
        result.turnCount > aggregateStats.longestGame.turnCount
      ) {
        aggregateStats.longestGame = result
      }

      // Track game duration records
      if (
        !aggregateStats.fastestGame ||
        result.duration < aggregateStats.fastestGame.duration
      ) {
        aggregateStats.fastestGame = result
      }
      if (
        !aggregateStats.slowestGame ||
        result.duration > aggregateStats.slowestGame.duration
      ) {
        aggregateStats.slowestGame = result
      }
    } else if (result.status === 'timeout') {
      aggregateStats.timeouts++
    }

    // Print progress report
    printProgressReport(gameNumber, result, aggregateStats)
  }

  const endTime = Date.now()
  const totalTime = endTime - startTime

  // Generate detailed report
  const report = generateDetailedReport(aggregateStats, totalTime)

  // Print comprehensive results
  console.log('\n\n' + '🎉'.repeat(80))
  console.log('🎉 1000 SIMULATION ANALYSIS COMPLETE!')
  console.log('🎉'.repeat(80))

  console.log('\n📈 SUMMARY STATISTICS:')
  console.log(`   Total Games: ${report.summary.totalGames}`)
  console.log(
    `   Completed: ${report.summary.completedGames} (${(
      report.reliability.successRate * 100
    ).toFixed(2)}%)`
  )
  console.log(
    `   Failed: ${report.summary.failedGames} (${(
      report.reliability.failureRate * 100
    ).toFixed(2)}%)`
  )
  console.log(
    `   Timeout: ${report.summary.timeoutGames} (${(
      report.reliability.timeoutRate * 100
    ).toFixed(2)}%)`
  )
  console.log(`   Total Time: ${(totalTime / 1000 / 60).toFixed(2)} minutes`)
  console.log(
    `   Avg Game Duration: ${(report.summary.avgGameDuration / 1000).toFixed(
      2
    )}s`
  )

  console.log('\n🏆 WIN STATISTICS:')
  console.log(`   O | ${AI_CONFIGS.GNU.description} | clockwise >`)
  console.log(
    `     Wins: ${report.winStatistics.gnuWins} (${(
      report.winStatistics.gnuWinRate * 100
    ).toFixed(2)}%)`
  )
  console.log(`   X | ${AI_CONFIGS.NODOTS.description} | counterclockwise >`)
  console.log(
    `     Wins: ${report.winStatistics.nodotsWins} (${(
      report.winStatistics.nodotsWinRate * 100
    ).toFixed(2)}%)`
  )

  console.log('\n📊 GAME METRICS:')
  console.log(`   Total Turns: ${report.gameMetrics.totalTurns}`)
  console.log(`   Total Moves: ${report.gameMetrics.totalMoves}`)
  console.log(
    `   Avg Turns per Game: ${report.gameMetrics.avgTurnsPerGame.toFixed(1)}`
  )
  console.log(
    `   Avg Moves per Game: ${report.gameMetrics.avgMovesPerGame.toFixed(1)}`
  )

  if (report.gameMetrics.shortestGame) {
    console.log(
      `   Shortest Game: ${report.gameMetrics.shortestGame.turnCount} turns (Game #${report.gameMetrics.shortestGame.gameNumber})`
    )
  }
  if (report.gameMetrics.longestGame) {
    console.log(
      `   Longest Game: ${report.gameMetrics.longestGame.turnCount} turns (Game #${report.gameMetrics.longestGame.gameNumber})`
    )
  }

  console.log('\n🔧 RELIABILITY ANALYSIS:')
  console.log(
    `   Success Rate: ${(report.reliability.successRate * 100).toFixed(2)}%`
  )
  console.log(
    `   Failure Rate: ${(report.reliability.failureRate * 100).toFixed(2)}%`
  )
  if (report.reliability.avgFailureTurn > 0) {
    console.log(
      `   Avg Failure Turn: ${report.reliability.avgFailureTurn.toFixed(1)}`
    )
  }

  console.log('\n🚨 FAILURE BREAKDOWN:')
  console.log(
    `   Stale Move References: ${report.failureAnalysis.staleMovesCount}`
  )
  console.log(`   Timeouts: ${report.failureAnalysis.timeoutCount}`)
  console.log(`   Exceptions: ${report.failureAnalysis.exceptionCount}`)
  console.log(`   Other Failures: ${report.failureAnalysis.otherFailuresCount}`)

  // Save detailed report to file
  const reportDir = path.join(process.cwd(), 'simulation-reports')
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportFile = path.join(
    reportDir,
    `1000-simulations-report-${timestamp}.json`
  )
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))

  console.log(`\n📁 Detailed report saved to: ${reportFile}`)

  if (aggregateStats.failures.length > 0) {
    console.log(
      `📁 ${aggregateStats.failures.length} failure dumps saved to: simulation-failures/`
    )
  }

  return report
}

// Run the simulations
run1000Simulations()
  .then((report) => {
    const successRate = report.reliability.successRate
    const gnuWinRate = report.winStatistics.gnuWinRate
    const nodotsWinRate = report.winStatistics.nodotsWinRate

    console.log('\n🎯 FINAL ASSESSMENT:')
    if (successRate >= 0.95) {
      console.log('✅ EXCELLENT: High reliability (≥95% success rate)')
    } else if (successRate >= 0.9) {
      console.log('✅ GOOD: Acceptable reliability (≥90% success rate)')
    } else if (successRate >= 0.8) {
      console.log('⚠️  MODERATE: Some reliability concerns (≥80% success rate)')
    } else {
      console.log('❌ POOR: Reliability issues detected (<80% success rate)')
    }

    console.log(
      `   GNU vs NODOTS balance: ${(gnuWinRate * 100).toFixed(1)}% vs ${(
        nodotsWinRate * 100
      ).toFixed(1)}%`
    )

    if (Math.abs(gnuWinRate - nodotsWinRate) < 0.1) {
      console.log('⚖️  Well-balanced competition between AI strategies')
    } else if (gnuWinRate > nodotsWinRate) {
      console.log('📈 GNU strategy shows advantage over Nodots strategy')
    } else {
      console.log('📈 Nodots strategy shows advantage over GNU strategy')
    }

    process.exit(successRate >= 0.9 ? 0 : 1)
  })
  .catch((error) => {
    console.error('\n💥 SIMULATION RUNNER CRASHED:', error)
    process.exit(1)
  })
