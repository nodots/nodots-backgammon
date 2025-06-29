const { simulateCompleteGame } = require('./complete-robot-simulation.js')
const fetch = require('node-fetch')

// Check if API server is running
async function checkApiServer() {
  try {
    const response = await fetch('http://localhost:3000/api/v1/users')
    return response.ok
  } catch (error) {
    return false
  }
}

// Run multiple simulations
async function runMultipleSimulations(count = 3) {
  console.log(`🚀 Starting ${count} robot backgammon simulations...`)
  console.log('='.repeat(60))

  // Check API server first
  console.log('🔍 Checking API server...')
  const apiRunning = await checkApiServer()

  if (!apiRunning) {
    console.error('❌ API server is not running!')
    console.error('   Please start the API server first:')
    console.error('   cd nodots-backgammon-api && npm run dev')
    process.exit(1)
  }

  console.log('✅ API server is running')
  console.log()

  const results = []
  const startTime = Date.now()

  for (let i = 1; i <= count; i++) {
    console.log(`\n🎮 SIMULATION ${i}/${count}`)
    console.log('='.repeat(40))

    try {
      const result = await simulateCompleteGame()
      results.push({
        simulation: i,
        ...result,
      })

      console.log(`✅ Simulation ${i} completed`)
      console.log(`   Game ID: ${result.gameId}`)
      console.log(`   Success: ${result.success}`)
      console.log(`   Winner: ${result.winner || 'N/A'}`)
      console.log(`   Log file: ${result.logFile}`)
    } catch (error) {
      console.error(`❌ Simulation ${i} failed:`, error.message)
      results.push({
        simulation: i,
        success: false,
        error: error.message,
      })
    }

    // Small delay between simulations
    if (i < count) {
      console.log(`\n⏳ Waiting 3 seconds before next simulation...`)
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }

  // Summary report
  const endTime = Date.now()
  const totalDuration = endTime - startTime

  console.log('\n' + '='.repeat(60))
  console.log('📊 SIMULATION SUMMARY REPORT')
  console.log('='.repeat(60))

  const successful = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  console.log(`Total simulations: ${results.length}`)
  console.log(`Successful: ${successful.length}`)
  console.log(`Failed: ${failed.length}`)
  console.log(
    `Success rate: ${((successful.length / results.length) * 100).toFixed(1)}%`
  )
  console.log(`Total duration: ${(totalDuration / 1000).toFixed(2)} seconds`)
  console.log(
    `Average per simulation: ${(totalDuration / results.length / 1000).toFixed(
      2
    )} seconds`
  )

  if (successful.length > 0) {
    console.log('\n🏆 SUCCESSFUL GAMES:')
    successful.forEach((result) => {
      console.log(
        `   Simulation ${result.simulation}: ${result.gameId} - Winner: ${result.winner}`
      )
    })

    // Winner statistics
    const winners = successful.map((r) => r.winner).filter(Boolean)
    const blackWins = winners.filter((w) => w === 'black').length
    const whiteWins = winners.filter((w) => w === 'white').length

    if (winners.length > 0) {
      console.log('\n🎯 WINNER STATISTICS:')
      console.log(
        `   Black wins: ${blackWins} (${(
          (blackWins / winners.length) *
          100
        ).toFixed(1)}%)`
      )
      console.log(
        `   White wins: ${whiteWins} (${(
          (whiteWins / winners.length) *
          100
        ).toFixed(1)}%)`
      )
    }
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED SIMULATIONS:')
    failed.forEach((result) => {
      console.log(`   Simulation ${result.simulation}: ${result.error}`)
    })
  }

  console.log('\n📝 LOG FILES CREATED:')
  results.forEach((result) => {
    if (result.logFile) {
      console.log(`   Simulation ${result.simulation}: ${result.logFile}`)
    }
  })

  console.log('\n🎉 All simulations completed!')
  return results
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2)
  let count = 3

  if (args.length > 0) {
    const parsed = parseInt(args[0])
    if (!isNaN(parsed) && parsed > 0 && parsed <= 10) {
      count = parsed
    } else {
      console.error(
        '❌ Invalid simulation count. Please provide a number between 1 and 10.'
      )
      process.exit(1)
    }
  }

  runMultipleSimulations(count)
    .then((results) => {
      const successful = results.filter((r) => r.success).length
      console.log(
        `\n🎊 Final result: ${successful}/${results.length} simulations successful`
      )
      process.exit(successful === results.length ? 0 : 1)
    })
    .catch((error) => {
      console.error('\n💥 Batch simulation failed:', error)
      process.exit(1)
    })
}

module.exports = { runMultipleSimulations, checkApiServer }
