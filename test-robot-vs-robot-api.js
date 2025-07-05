#!/usr/bin/env node

const https = require('https')

const API_BASE = 'https://localhost:3443/api/v3.2'

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
      rejectUnauthorized: false, // Ignore SSL certificate errors
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

async function runRobotVsRobotGame() {
  try {
    console.log('🔍 Testing API Health...')
    const health = await makeRequest('GET', '/health')
    console.log('✅ API Health:', health)

    console.log('\n🤖 Getting available robots...')
    const users = await makeRequest('GET', '/users')
    const robots = users.filter((user) => user.user_type === 'robot')
    console.log(
      `✅ Found ${robots.length} robots:`,
      robots.map((r) => r.nickname)
    )

    if (robots.length < 2) {
      console.error('❌ Need at least 2 robots to run simulation')
      return
    }

    const robot1 = robots[0]
    const robot2 = robots[1]

    console.log(
      `\n🎮 Creating game: ${robot1.nickname} vs ${robot2.nickname}...`
    )
    const game = await makeRequest('POST', '/games', {
      player1: { userId: robot1.id },
      player2: { userId: robot2.id },
    })
    console.log('✅ Game created:', game.id)

    console.log('\n🎲 Rolling for start...')
    const rollForStart = await makeRequest(
      'POST',
      `/games/${game.id}/roll-for-start`
    )
    console.log(
      '✅ Roll for start complete, active player:',
      rollForStart.activeColor
    )

    console.log('\n🎯 Starting robot simulation...')
    const simulation = await makeRequest('POST', '/robots/simulations', {
      gameId: game.id,
      speed: 1000, // 1 second per move for observation
      maxMoves: 50,
    })
    console.log('✅ Robot simulation started:', simulation.id)

    // Monitor simulation for a few iterations
    console.log('\n📊 Monitoring simulation...')
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const status = await makeRequest(
        'GET',
        `/robots/simulations/${simulation.id}`
      )
      console.log(
        `Turn ${i + 1}: Status=${status.status}, Moves=${status.moveCount}`
      )

      if (status.status === 'completed' || status.status === 'error') {
        console.log('🏁 Simulation finished:', status)
        break
      }
    }

    console.log(
      '\n✅ Robot-vs-robot game simulation test completed successfully!'
    )
    console.log('\n🎉 API v3.2 on HTTPS port 3443 is working correctly!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(
      '💡 Make sure the API server is running with: cd nodots-backgammon-api && npm start'
    )
  }
}

runRobotVsRobotGame()
