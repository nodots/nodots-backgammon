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

async function debugGameAndSimulation() {
  try {
    console.log('🔍 Diagnostic: API Health Check...')
    const health = await makeRequest('GET', '/health')
    console.log('✅ Health:', health.status)

    console.log('\n🤖 Getting existing robots...')
    const users = await makeRequest('GET', '/users')
    const robots = users.filter((u) => u.user_type === 'robot')
    console.log(
      `Found ${robots.length} robots:`,
      robots.map((r) => r.nickname)
    )

    if (robots.length < 2) {
      console.log('❌ Need at least 2 robots for testing')
      return
    }

    console.log('\n🎮 Creating test game...')
    const gameData = {
      player1: { userId: robots[0].id },
      player2: { userId: robots[1].id },
    }
    console.log('Game request:', gameData)

    const game = await makeRequest('POST', '/games', gameData)
    console.log('✅ Game response:', {
      id: game.id,
      stateKind: game.stateKind,
      activeColor: game.activeColor,
      player1: game.player1?.nickname,
      player2: game.player2?.nickname,
    })

    console.log('\n🎲 Rolling for start...')
    const rollResult = await makeRequest(
      'POST',
      `/games/${game.id}/roll-for-start`
    )
    console.log('✅ Roll result:', {
      stateKind: rollResult.stateKind,
      activeColor: rollResult.activeColor,
      activePlayer: rollResult.activePlayer?.nickname,
    })

    console.log('\n🎯 Checking game state after roll...')
    const gameAfterRoll = await makeRequest('GET', `/games/${game.id}`)
    console.log('Game state:', {
      id: gameAfterRoll.id,
      stateKind: gameAfterRoll.stateKind,
      activeColor: gameAfterRoll.activeColor,
      activePlayer: gameAfterRoll.activePlayer?.nickname,
      hasActivePlay: !!gameAfterRoll.activePlay,
      currentRoll: gameAfterRoll.activePlayer?.dice?.currentRoll,
    })

    console.log('\n🤖 Starting robot simulation...')
    const simData = {
      gameId: game.id,
      speed: 2000,
      maxMoves: 10,
    }
    console.log('Simulation request:', simData)

    const simulation = await makeRequest('POST', '/robots/simulations', simData)
    console.log('✅ Simulation created:', {
      id: simulation.id,
      status: simulation.status,
      gameId: simulation.gameId,
    })

    console.log('\n📊 Monitoring simulation for 10 seconds...')
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      console.log(`\n--- Check ${i + 1} ---`)

      // Check simulation status
      const simStatus = await makeRequest(
        'GET',
        `/robots/simulations/${simulation.id}`
      )
      console.log('Simulation status:', {
        status: simStatus.status,
        moveCount: simStatus.moveCount,
        error: simStatus.error,
      })

      // Check current game state
      const currentGame = await makeRequest('GET', `/games/${game.id}`)
      console.log('Current game state:', {
        stateKind: currentGame.stateKind,
        activeColor: currentGame.activeColor,
        activePlayer: currentGame.activePlayer?.nickname,
        hasActivePlay: !!currentGame.activePlay,
        currentRoll: currentGame.activePlayer?.dice?.currentRoll,
        movesLength: currentGame.activePlay?.moves
          ? Array.from(currentGame.activePlay.moves).length
          : 'N/A',
      })

      if (simStatus.status === 'completed' || simStatus.status === 'error') {
        console.log('🏁 Simulation finished')
        break
      }
    }

    console.log('\n✅ Diagnostic complete')
  } catch (error) {
    console.error('❌ Diagnostic error:', error.message)
    if (error.response) {
      console.error('Response:', error.response)
    }
  }
}

debugGameAndSimulation()
