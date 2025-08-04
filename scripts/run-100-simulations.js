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

function dumpGameState(game, gameNumber, turnNumber, reason, error) {
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
      inactivePlayer: game.inactivePlayer
        ? {
            id: game.inactivePlayer.id,
            color: game.inactivePlayer.color,
            direction: game.inactivePlayer.direction,
            stateKind: game.inactivePlayer.stateKind,
          }
        : null,
    },
    boardState: {
      gnuPositionId: game.gnuPositionId,
      points: game.board?.points?.map((point) => ({
        id: point.id,
        position: point.position,
        checkerCount: point.checkers?.length || 0,
        checkerColors: point.checkers?.map((c) => c.color) || [],
      })),
      bar: {
        clockwise: {
          checkerCount: game.board?.bar?.clockwise?.checkers?.length || 0,
          checkerColors:
            game.board?.bar?.clockwise?.checkers?.map((c) => c.color) || [],
        },
        counterclockwise: {
          checkerCount:
            game.board?.bar?.counterclockwise?.checkers?.length || 0,
          checkerColors:
            game.board?.bar?.counterclockwise?.checkers?.map((c) => c.color) ||
            [],
        },
      },
      off: {
        clockwise: {
          checkerCount: game.board?.off?.clockwise?.checkers?.length || 0,
          checkerColors:
            game.board?.off?.clockwise?.checkers?.map((c) => c.color) || [],
        },
        counterclockwise: {
          checkerCount:
            game.board?.off?.counterclockwise?.checkers?.length || 0,
          checkerColors:
            game.board?.off?.counterclockwise?.checkers?.map((c) => c.color) ||
            [],
        },
      },
    },
    activePlay: game.activePlay
      ? {
          stateKind: game.activePlay.stateKind,
          movesCount: game.activePlay.moves?.size || 0,
          moves: game.activePlay.moves
            ? Array.from(game.activePlay.moves).map((move) => ({
                stateKind: move.stateKind,
                moveKind: move.moveKind,
                dieValue: move.dieValue,
                origin: move.origin
                  ? {
                      id: move.origin.id,
                      kind: move.origin.kind,
                      position: move.origin.position,
                    }
                  : null,
                destination: move.destination
                  ? {
                      id: move.destination.id,
                      kind: move.destination.kind,
                      position: move.destination.position,
                    }
                  : null,
              }))
            : [],
        }
      : null,
  }

  // Add ASCII board representation
  try {
    const playerModels = {}
    if (game.players) {
      game.players.forEach((player) => {
        if (player.color === 'white') {
          playerModels[player.id] = AI_CONFIGS.GNU.description
        } else {
          playerModels[player.id] = AI_CONFIGS.NODOTS.description
        }
      })
    }

    dump.asciiBoard = Board.getAsciiBoard(
      game.board,
      game.players,
      game.activePlayer,
      undefined,
      playerModels
    )
  } catch (error) {
    dump.asciiBoard = `Error generating ASCII board: ${error.message}`
  }

  // Write detailed dump to file
  fs.writeFileSync(dumpFile, JSON.stringify(dump, null, 2))

  return { dumpFile, dump }
}

async function runSingleSimulation(gameNumber) {
  console.log(`\n🎮 Starting Game ${gameNumber}/100`)
  console.log('='.repeat(50))

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

  const maxTurns = 200 // Prevent infinite loops
  let winner = null

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
            console.log(`  ✅ ${activeBot} completed turn (no moves available)`)
            turnCompleted = true
          } else if (robotResult.error?.includes('stale move reference')) {
            // This is a failure we want to catch
            console.log(`\n🚨 SIMULATION FAILURE DETECTED!`)
            console.log(`🚨 Game ${gameNumber}, Turn ${turnCount}`)
            console.log(`🚨 Error: ${robotResult.error}`)

            const failureData = dumpGameState(
              currentGame,
              gameNumber,
              turnCount,
              'Stale move reference error',
              robotResult.error
            )

            console.log(`\n📁 Failure data saved to: ${failureData.dumpFile}`)
            console.log(`\n🔍 Game State Summary:`)
            console.log(`   Game ID: ${currentGame.id}`)
            console.log(`   State: ${currentGame.stateKind}`)
            console.log(`   Active: ${activeBot} (${currentGame.activeColor})`)
            console.log(`   GNU Position: ${currentGame.gnuPositionId}`)

            if (currentGame.activePlay?.moves) {
              const movesArray = Array.from(currentGame.activePlay.moves)
              const readyMoves = movesArray.filter(
                (m) => m.stateKind === 'ready'
              )
              console.log(`   Ready moves: ${readyMoves.length}`)
            }

            return {
              success: false,
              gameNumber,
              turnCount,
              error: robotResult.error,
              failureData: failureData.dump,
              dumpFile: failureData.dumpFile,
            }
          } else {
            // Other types of failures
            console.log(`\n🚨 SIMULATION FAILURE DETECTED!`)
            console.log(`🚨 Game ${gameNumber}, Turn ${turnCount}`)
            console.log(`🚨 Robot Error: ${robotResult.error}`)

            const failureData = dumpGameState(
              currentGame,
              gameNumber,
              turnCount,
              'Robot execution error',
              robotResult.error
            )

            console.log(`\n📁 Failure data saved to: ${failureData.dumpFile}`)

            return {
              success: false,
              gameNumber,
              turnCount,
              error: robotResult.error,
              failureData: failureData.dump,
              dumpFile: failureData.dumpFile,
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

          console.log(`  ✅ ${activeBot}: ${robotResult.message}`)

          // Check if turn completed (active player changed)
          const newActiveBot = getBotTypeFromColor(currentGame.activeColor)
          if (newActiveBot !== activeBot) {
            console.log(`  🔄 Turn completed, ${newActiveBot} is now active`)
            turnCompleted = true
          }

          // Check if all dice used
          if (currentGame.activePlay?.moves) {
            const movesArray = Array.from(currentGame.activePlay.moves)
            const readyMoves = movesArray.filter((m) => m.stateKind === 'ready')
            if (readyMoves.length === 0) {
              console.log(`  ✅ ${activeBot} completed turn (all dice used)`)
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
        console.log(
          `  ⚠️ ${activeBot} reached move limit, forcing turn completion`
        )
        if (currentGame.stateKind === 'moving') {
          currentGame = Game.checkAndCompleteTurn(currentGame)
        }
      }

      // Final win check
      winner = checkWinCondition(currentGame.board)
      if (winner) {
        const winnerConfig =
          winner === 'GNU' ? AI_CONFIGS.GNU : AI_CONFIGS.NODOTS
        const winnerSymbol = winner === 'GNU' ? 'O' : 'X'
        const winnerDirection =
          winner === 'GNU' ? 'clockwise' : 'counterclockwise'

        console.log(
          `\n🎉 ${winnerSymbol} | ${winnerConfig.description} | ${winnerDirection} > wins!`
        )
        console.log(`   Total turns: ${turnCount}`)
        console.log(`   GNU moves: ${gnuMoves}`)
        console.log(`   Nodots moves: ${nodotsMoves}`)
        break
      }

      // Timeout check
      if (turnCount >= maxTurns) {
        console.log(
          `\n⚠️ Game reached turn limit (${maxTurns}) - potential infinite loop`
        )
        const failureData = dumpGameState(
          currentGame,
          gameNumber,
          turnCount,
          'Turn limit exceeded (possible infinite loop)',
          'Game did not complete within turn limit'
        )

        return {
          success: false,
          gameNumber,
          turnCount,
          error: 'Turn limit exceeded',
          failureData: failureData.dump,
          dumpFile: failureData.dumpFile,
        }
      }
    } catch (error) {
      console.log(`\n🚨 SIMULATION FAILURE DETECTED!`)
      console.log(`🚨 Game ${gameNumber}, Turn ${turnCount}`)
      console.log(`🚨 Exception: ${error.message}`)

      const failureData = dumpGameState(
        currentGame,
        gameNumber,
        turnCount,
        'Unhandled exception',
        error
      )

      console.log(`\n📁 Failure data saved to: ${failureData.dumpFile}`)

      return {
        success: false,
        gameNumber,
        turnCount,
        error: error.message,
        failureData: failureData.dump,
        dumpFile: failureData.dumpFile,
      }
    }
  }

  // Game completed successfully
  return {
    success: true,
    gameNumber,
    winner,
    turnCount,
    gnuMoves,
    nodotsMoves,
    gameId,
  }
}

async function run100Simulations() {
  console.log('🚀 Starting 100 GNU vs Nodots Robot Simulations')
  console.log('🛑 Will stop at first failure and dump game state')
  console.log('='.repeat(80))

  const startTime = Date.now()
  const results = {
    totalGames: 0,
    successfulGames: 0,
    gnuWins: 0,
    nodotsWins: 0,
    failures: 0,
    firstFailure: null,
  }

  for (let gameNumber = 1; gameNumber <= 100; gameNumber++) {
    results.totalGames++

    const result = await runSingleSimulation(gameNumber)

    if (!result.success) {
      // FAILURE DETECTED - STOP IMMEDIATELY
      results.failures++
      results.firstFailure = result

      console.log('\n' + '🚨'.repeat(40))
      console.log('🚨 FIRST FAILURE DETECTED - STOPPING SIMULATIONS')
      console.log('🚨'.repeat(40))
      console.log(`\n📊 Results after ${results.totalGames} games:`)
      console.log(`   Successful games: ${results.successfulGames}`)
      console.log(`   GNU wins: ${results.gnuWins}`)
      console.log(`   Nodots wins: ${results.nodotsWins}`)
      console.log(`   Failures: ${results.failures}`)
      console.log(`\n🔍 First failure details:`)
      console.log(`   Game: ${result.gameNumber}`)
      console.log(`   Turn: ${result.turnCount}`)
      console.log(`   Error: ${result.error}`)
      console.log(`   Dump file: ${result.dumpFile}`)

      const endTime = Date.now()
      console.log(
        `\n⏱️ Simulation time: ${((endTime - startTime) / 1000).toFixed(
          2
        )} seconds`
      )

      return results
    } else {
      // Game completed successfully
      results.successfulGames++

      if (result.winner === 'GNU') {
        results.gnuWins++
      } else if (result.winner === 'NODOTS') {
        results.nodotsWins++
      }

      console.log(`✅ Game ${gameNumber} completed successfully`)
      console.log(`   Winner: ${result.winner || 'None'}`)
      console.log(`   Turns: ${result.turnCount}`)
    }
  }

  // All 100 games completed successfully
  console.log('\n' + '🎉'.repeat(40))
  console.log('🎉 ALL 100 SIMULATIONS COMPLETED SUCCESSFULLY!')
  console.log('🎉'.repeat(40))
  console.log(`\n📊 Final Results:`)
  console.log(`   Total games: ${results.totalGames}`)
  console.log(`   Successful games: ${results.successfulGames}`)
  console.log(`   GNU wins: ${results.gnuWins}`)
  console.log(`   Nodots wins: ${results.nodotsWins}`)
  console.log(`   Failures: ${results.failures}`)

  const endTime = Date.now()
  console.log(
    `\n⏱️ Total simulation time: ${((endTime - startTime) / 1000).toFixed(
      2
    )} seconds`
  )

  return results
}

// Run the simulations
run100Simulations()
  .then((results) => {
    if (results.firstFailure) {
      console.log('\n🔍 FAILURE ANALYSIS COMPLETE')
      console.log('Check the dump file for detailed game state information.')
      process.exit(1)
    } else {
      console.log('\n✅ ALL SIMULATIONS SUCCESSFUL')
      console.log('No failures detected in 100 games.')
      process.exit(0)
    }
  })
  .catch((error) => {
    console.error('\n💥 SIMULATION RUNNER CRASHED:', error)
    process.exit(1)
  })
