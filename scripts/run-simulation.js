const axios = require('axios')
const fs = require('fs')
const path = require('path')

const API_BASE = 'http://localhost:3000/api/v1'

async function runSimulation() {
  try {
    console.log('🤖 Starting robot simulation...')

    // Start simulation
    const response = await axios.post(`${API_BASE}/robots/simulations`, {
      robot1Difficulty: 'advanced',
      robot2Difficulty: 'beginner',
      speed: 100, // Fast to get to the error quickly
    })

    const simulationId = response.data.id
    console.log(`📋 Simulation ID: ${simulationId}`)
    console.log(`🎮 Game ID: ${response.data.gameId}`)
    console.log(
      `🤖 ${response.data.robot1Name} (advanced) vs ${response.data.robot2Name} (beginner)`
    )

    // Monitor simulation
    let completed = false
    let lastStatus = ''
    const startTime = Date.now()

    while (!completed && Date.now() - startTime < 20000) {
      // 20 second timeout
      await new Promise((resolve) => setTimeout(resolve, 1000))

      try {
        const statusResponse = await axios.get(
          `${API_BASE}/robots/simulations/${simulationId}`
        )
        const status = statusResponse.data

        if (status.status !== lastStatus) {
          console.log(
            `📊 Status: ${status.status} | Moves: ${status.totalMoves} | Turn: ${status.currentTurn}`
          )
          lastStatus = status.status
        }

        if (status.status === 'completed' || status.status === 'error') {
          completed = true

          // Get final game state
          const gameResponse = await axios.get(
            `${API_BASE}/games/${status.gameId}`
          )
          const finalGame = gameResponse.data

          // Create results
          const results = {
            simulationId,
            gameId: status.gameId,
            status: status.status,
            duration: status.duration,
            totalMoves: status.totalMoves,
            turns: status.currentTurn,
            robot1Name: status.robot1Name,
            robot2Name: status.robot2Name,
            robot1Difficulty: 'advanced',
            robot2Difficulty: 'beginner',
            winner:
              finalGame.stateKind === 'completed'
                ? finalGame.winner?.color || 'unknown'
                : 'none',
            logs: status.logs,
            finalGame: finalGame,
            timestamp: new Date().toISOString(),
          }

          // Save to game-results
          const resultsDir = path.join(
            __dirname,
            'nodots-backgammon-api',
            'game-results'
          )
          if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true })
          }

          const filename = `simulation-${simulationId}-${Date.now()}.json`
          const filepath = path.join(resultsDir, filename)

          fs.writeFileSync(filepath, JSON.stringify(results, null, 2))

          console.log('✅ Simulation completed!')
          console.log(`🏆 Winner: ${results.winner}`)
          console.log(`⏱️  Duration: ${results.duration}ms`)
          console.log(`🎯 Total moves: ${results.totalMoves}`)
          console.log(`📁 Results saved to: ${filepath}`)

          return results
        }

        if (status.status === 'error') {
          console.error(`❌ Simulation error: ${status.error}`)
          break
        }
      } catch (err) {
        console.error(`❌ Error checking status: ${err.message}`)
        break
      }
    }

    if (!completed) {
      console.log('⏰ Simulation timeout - stopping...')
      try {
        await axios.delete(`${API_BASE}/robots/simulations/${simulationId}`)
      } catch (err) {
        console.error(`Error stopping simulation: ${err.message}`)
      }
    }
  } catch (error) {
    console.error(
      '❌ Failed to start simulation:',
      error.response?.data || error.message
    )
  }
}

runSimulation().catch(console.error)
