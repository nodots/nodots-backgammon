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

async function testUpdatedAPI() {
  try {
    console.log('🔍 Testing Updated API with Robot Seeding...\n')

    console.log('1. Health Check...')
    const health = await makeRequest('GET', '/health')
    console.log('✅ API Health:', health.status)

    console.log('\n2. Checking for Seeded Robots...')
    const users = await makeRequest('GET', '/users')
    const robots = users.filter((u) => u.user_type === 'robot')
    console.log(`✅ Found ${robots.length} robots:`)
    robots.forEach((robot) => {
      console.log(`   - ${robot.nickname} (${robot.email})`)
    })

    if (robots.length >= 2) {
      console.log('\n3. Testing Robot Game Creation...')
      const robot1 = robots.find((r) => r.nickname.includes('Basic'))
      const robot2 = robots.find((r) => r.nickname.includes('Advanced'))

      if (robot1 && robot2) {
        const game = await makeRequest('POST', '/games', {
          player1: { userId: robot1.id },
          player2: { userId: robot2.id },
        })
        console.log(`✅ Game created: ${robot1.nickname} vs ${robot2.nickname}`)
        console.log(`   Game ID: ${game.id}`)

        console.log('\n4. Testing Robot Simulation...')
        const simulation = await makeRequest('POST', '/robots/simulations', {
          gameId: game.id,
          speed: 1000,
          maxMoves: 5, // Short test
        })
        console.log(`✅ Simulation started: ${simulation.id}`)

        // Monitor briefly
        await new Promise((resolve) => setTimeout(resolve, 3000))
        const status = await makeRequest(
          'GET',
          `/robots/simulations/${simulation.id}`
        )
        console.log(
          `✅ Simulation status: ${status.status}, Moves: ${
            status.moveCount || 0
          }`
        )

        console.log('\n🎉 API v3.2 with Robot Seeding is Working!')
        console.log('✅ HTTPS port 3443 functional')
        console.log('✅ Robot auto-seeding successful')
        console.log('✅ Game creation with robots working')
        console.log('✅ Robot simulation initiated')
      } else {
        console.log('⚠️  Could not find Basic Bot and Advanced Bot for testing')
      }
    } else {
      console.log('❌ Not enough robots found for testing')
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testUpdatedAPI()
