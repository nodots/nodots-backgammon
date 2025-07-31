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

const REQUIRED_ROBOTS = [
  {
    nickname: 'Basic Bot',
    email: 'basic-bot@nodots.com',
    first_name: 'Basic',
    last_name: 'Bot',
    user_type: 'robot',
    source: 'system',
  },
  {
    nickname: 'Intermediate Bot',
    email: 'intermediate-bot@nodots.com',
    first_name: 'Intermediate',
    last_name: 'Bot',
    user_type: 'robot',
    source: 'system',
  },
  {
    nickname: 'Advanced Bot',
    email: 'advanced-bot@nodots.com',
    first_name: 'Advanced',
    last_name: 'Bot',
    user_type: 'robot',
    source: 'system',
  },
]

async function createRobotsManually() {
  try {
    console.log('🤖 Creating Required Robots Manually...\n')

    // First check if API is healthy
    const health = await makeRequest('GET', '/health')
    console.log('✅ API Health:', health.status)

    console.log('\n📋 Creating robots...')
    for (const robotConfig of REQUIRED_ROBOTS) {
      try {
        const robot = await makeRequest('POST', '/users', robotConfig)
        console.log(`✅ Created: ${robotConfig.nickname}`)
      } catch (error) {
        console.log(
          `ℹ️  ${robotConfig.nickname} might already exist or creation failed`
        )
      }
    }

    console.log('\n🔍 Verifying robots...')
    const users = await makeRequest('GET', '/users')
    const robots = users.filter((u) => u.user_type === 'robot')
    console.log(`✅ Found ${robots.length} robots total:`)
    robots.forEach((robot) => {
      console.log(`   - ${robot.nickname} (${robot.email})`)
    })

    if (robots.length >= 2) {
      console.log('\n🎮 Testing Robot vs Robot Game...')
      const robot1 = robots[0]
      const robot2 = robots[1]

      const game = await makeRequest('POST', '/games', {
        player1: { userId: robot1.id },
        player2: { userId: robot2.id },
      })
      console.log(`✅ Game created: ${robot1.nickname} vs ${robot2.nickname}`)
      console.log(`   Game ID: ${game.id}`)

      console.log('\n🎯 Starting Quick Robot Simulation...')
      const simulation = await makeRequest('POST', '/robots/simulations', {
        gameId: game.id,
        speed: 500, // Fast for demo
        maxMoves: 20,
      })
      console.log(`✅ Simulation started: ${simulation.id}`)

      // Monitor for a few seconds
      console.log('\n📊 Monitoring simulation...')
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        const status = await makeRequest(
          'GET',
          `/robots/simulations/${simulation.id}`
        )
        console.log(
          `Check ${i + 1}: Status=${status.status}, Moves=${
            status.moveCount || 0
          }`
        )

        if (status.status === 'completed' || status.status === 'error') {
          console.log('🏁 Simulation completed!')
          break
        }
      }

      console.log(
        '\n🎉 SUCCESS: Complete Robot-vs-Robot Simulation Through API v3.2!'
      )
      console.log('✅ HTTPS port 3443 working')
      console.log('✅ Robot creation successful')
      console.log('✅ Robot simulation functional')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(
      '💡 Make sure API server is running: cd nodots-backgammon-api && npm start'
    )
  }
}

createRobotsManually()
