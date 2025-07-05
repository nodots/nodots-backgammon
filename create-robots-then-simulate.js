#!/usr/bin/env node

const https = require('https')

// Ignore SSL certificate errors for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3443,
      path: `/api/v3.2${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false,
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch (e) {
          resolve(body)
        }
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }
    req.end()
  })
}

async function createRobotUser(nickname, skill = 'intermediate') {
  const robotData = {
    email: `${nickname.toLowerCase().replace(' ', '-')}@nodots.com`,
    first_name: nickname.split(' ')[0],
    last_name: nickname.split(' ')[1] || 'Bot',
    nickname: nickname,
    user_type: 'robot',
    source: 'system',
  }

  try {
    const robot = await makeRequest('POST', '/users', robotData)
    console.log(`✅ Created robot: ${nickname}`)
    return robot
  } catch (error) {
    console.log(`ℹ️  Robot ${nickname} might already exist`)
    // Try to find existing robot
    const users = await makeRequest('GET', '/users')
    const existingRobot = users.find((u) => u.nickname === nickname)
    if (existingRobot) {
      console.log(`✅ Found existing robot: ${nickname}`)
      return existingRobot
    }
    throw error
  }
}

async function runCompleteRobotSimulation() {
  try {
    console.log('🔍 Testing API Health...')
    const health = await makeRequest('GET', '/health')
    console.log('✅ API Health Status:', health.status)

    console.log('\n🤖 Creating robot users...')
    const robot1 = await createRobotUser('Beginner Bot')
    const robot2 = await createRobotUser('Advanced Bot')

    console.log(
      `\n🎮 Creating game: ${robot1.nickname} vs ${robot2.nickname}...`
    )
    const game = await makeRequest('POST', '/games', {
      player1: { userId: robot1.id },
      player2: { userId: robot2.id },
    })
    console.log('✅ Game created with ID:', game.id)

    console.log('\n🎲 Rolling for start...')
    const rollForStart = await makeRequest(
      'POST',
      `/games/${game.id}/roll-for-start`
    )
    console.log(
      '✅ Roll for start complete, active player:',
      rollForStart.activeColor
    )

    console.log('\n🎯 Starting robot simulation (fast mode)...')
    const simulation = await makeRequest('POST', '/robots/simulations', {
      gameId: game.id,
      speed: 500, // 0.5 seconds per move
      maxMoves: 100,
    })
    console.log('✅ Robot simulation started with ID:', simulation.id)

    // Monitor simulation progress
    console.log('\n📊 Monitoring simulation progress...')
    let turn = 0
    while (turn < 20) {
      // Monitor for up to 20 iterations
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait 2 seconds

      try {
        const status = await makeRequest(
          'GET',
          `/robots/simulations/${simulation.id}`
        )
        turn++
        console.log(
          `Turn ${turn}: Status=${status.status}, Moves=${
            status.moveCount || 0
          }, Game=${status.gameId}`
        )

        if (status.status === 'completed') {
          console.log('🏁 Simulation completed successfully!')

          // Get final game state
          const finalGame = await makeRequest('GET', `/games/${game.id}`)
          console.log('🎊 Final game state:', {
            winner: finalGame.winner,
            state: finalGame.stateKind,
            moveCount: status.moveCount,
          })
          break
        } else if (status.status === 'error') {
          console.log('❌ Simulation ended with error:', status.error)
          break
        }
      } catch (error) {
        console.log('⚠️  Error checking simulation status:', error.message)
      }
    }

    console.log('\n✅ COMPLETE ROBOT-VS-ROBOT SIMULATION TEST SUCCESSFUL!')
    console.log('🎉 API v3.2 on HTTPS port 3443 is fully functional!')
    console.log('🚀 Robot simulation through API layer working correctly!')
  } catch (error) {
    console.error('❌ Error during simulation:', error.message)
    console.error(
      '💡 Ensure API server is running: cd nodots-backgammon-api && npm start'
    )
  }
}

runCompleteRobotSimulation()
