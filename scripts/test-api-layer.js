const axios = require('axios')

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1'
const TEST_USERS = {
  player1: 'test-player1-' + Date.now(),
  player2: 'test-player2-' + Date.now(),
}

console.log('🔍 **API LAYER TESTING**\n')

class ApiTester {
  constructor() {
    this.gameId = null
    this.currentGame = null
  }

  async makeRequest(method, endpoint, data = null) {
    try {
      const config = {
        method,
        url: `${API_BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (data) {
        config.data = data
      }

      console.log(`   📡 ${method.toUpperCase()} ${endpoint}`)
      if (data) {
        console.log(`   📤 Request: ${JSON.stringify(data, null, 2)}`)
      }

      const response = await axios(config)
      console.log(`   ✅ Response (${response.status}): Success`)
      return { success: true, data: response.data, status: response.status }
    } catch (error) {
      console.log(
        `   ❌ Response (${error.response?.status || 'ERROR'}): ${
          error.response?.data?.error || error.message
        }`
      )
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        status: error.response?.status,
        data: error.response?.data,
      }
    }
  }

  async testServerHealth() {
    console.log('1️⃣ Testing server health...')
    const result = await this.makeRequest('GET', '/')
    return result.success
  }

  async testUserCreation() {
    console.log('\n2️⃣ Creating test users...')

    // Create robot users for testing
    const user1Result = await this.makeRequest('POST', '/users', {
      source: 'test',
      externalId: TEST_USERS.player1,
      userType: 'robot',
      given_name: 'Robot',
      family_name: 'Player1',
    })

    const user2Result = await this.makeRequest('POST', '/users', {
      source: 'test',
      externalId: TEST_USERS.player2,
      userType: 'robot',
      given_name: 'Robot',
      family_name: 'Player2',
    })

    if (user1Result.success && user2Result.success) {
      console.log(
        `   👤 Created users: ${user1Result.data.id}, ${user2Result.data.id}`
      )
      // Update user IDs to the actual database IDs
      TEST_USERS.player1 = user1Result.data.id
      TEST_USERS.player2 = user2Result.data.id
      return true
    }
    return false
  }

  async testGameCreation() {
    console.log('\n3️⃣ Testing game creation...')
    const result = await this.makeRequest('POST', '/games', {
      player1: { userId: TEST_USERS.player1 },
      player2: { userId: TEST_USERS.player2 },
    })

    if (result.success) {
      this.gameId = result.data.id
      this.currentGame = result.data
      console.log(`   🎮 Game created: ${this.gameId}`)
      console.log(`   📊 Game state: ${result.data.stateKind}`)
      console.log(`   🎯 Active color: ${result.data.activeColor}`)
      return true
    }
    return false
  }

  async testDiceRoll() {
    console.log('\n4️⃣ Testing dice roll...')
    const result = await this.makeRequest('POST', `/games/${this.gameId}/roll`)

    if (result.success) {
      this.currentGame = result.data
      const activePlay = result.data.activePlay
      console.log(
        `   🎲 Dice rolled: [${activePlay.player.dice.currentRoll.join(', ')}]`
      )
      console.log(`   📊 Game state: ${result.data.stateKind}`)
      console.log(
        `   🔢 Moves created: ${activePlay.moves?.length || 'unknown'}`
      )
      return true
    }
    return false
  }

  async testGetPossibleMoves(moveNumber = 1) {
    console.log(
      `\n${moveNumber === 1 ? '5️⃣' : '7️⃣'} Testing get possible moves (${
        moveNumber === 1 ? 'first' : 'after first move'
      })...`
    )

    const activePlayerId = this.currentGame.activePlay.player.id
    const result = await this.makeRequest(
      'GET',
      `/games/${this.gameId}/possible-moves?playerId=${activePlayerId}`
    )

    if (result.success) {
      const possibleMoves = result.data.possibleMoves || []
      console.log(`   🎯 Found ${possibleMoves.length} possible moves`)

      // Show detailed analysis
      const gameState = result.data.game || this.currentGame
      const activePlay = gameState.activePlay

      if (activePlay && activePlay.moves) {
        const moves = Array.isArray(activePlay.moves)
          ? activePlay.moves
          : Array.from(activePlay.moves)
        const readyMoves = moves.filter((m) => m.stateKind === 'ready')
        const completedMoves = moves.filter((m) => m.stateKind === 'completed')

        console.log(
          `   📈 Move states: ${readyMoves.length} ready, ${completedMoves.length} completed`
        )
        console.log(
          `   🎲 Available dice: [${readyMoves
            .map((m) => m.dieValue || m.die)
            .join(', ')}]`
        )

        if (possibleMoves.length > 0) {
          console.log(`   🎯 Sample moves:`)
          possibleMoves.slice(0, 3).forEach((move, index) => {
            const from =
              move.origin?.position?.clockwise ||
              move.origin?.position?.counterclockwise ||
              'unknown'
            const to =
              move.destination?.position?.clockwise ||
              move.destination?.position?.counterclockwise ||
              'unknown'
            console.log(
              `     ${index + 1}. ${from} → ${to} (die: ${move.dieValue})`
            )
          })
        } else {
          console.log(`   ⚠️  No possible moves found!`)
        }
      }

      return { success: true, possibleMoves, updatedGame: result.data.game }
    }
    return { success: false, error: result.error }
  }

  async testMakeMove(possibleMoves) {
    console.log('\n6️⃣ Testing make move...')

    if (!possibleMoves || possibleMoves.length === 0) {
      console.log('   ❌ No possible moves to test')
      return false
    }

    const firstMove = possibleMoves[0]
    const activePlayerId = this.currentGame.activePlay.player.id

    // Extract origin ID for the move
    const originId = firstMove.origin?.id
    if (!originId) {
      console.log('   ❌ No origin ID found in move')
      return false
    }

    console.log(
      `   🎯 Making move: ${
        firstMove.origin?.position?.clockwise ||
        firstMove.origin?.position?.counterclockwise
      } → ${
        firstMove.destination?.position?.clockwise ||
        firstMove.destination?.position?.counterclockwise
      } (die: ${firstMove.dieValue})`
    )

    const result = await this.makeRequest(
      'POST',
      `/games/${this.gameId}/move`,
      {
        playerId: activePlayerId,
        checkerId: originId,
      }
    )

    if (result.success) {
      this.currentGame = result.data
      console.log(`   ✅ Move successful`)
      console.log(`   📊 Game state: ${result.data.stateKind}`)

      const activePlay = result.data.activePlay
      if (activePlay && activePlay.moves) {
        const moves = Array.isArray(activePlay.moves)
          ? activePlay.moves
          : Array.from(activePlay.moves)
        const readyMoves = moves.filter((m) => m.stateKind === 'ready')
        const completedMoves = moves.filter((m) => m.stateKind === 'completed')
        console.log(
          `   🔄 After move: ${readyMoves.length} ready, ${completedMoves.length} completed`
        )
      }

      return true
    } else {
      console.log(`   ❌ Move failed: ${result.error}`)
      return false
    }
  }

  async runFullTest() {
    try {
      // Test sequence that should reveal the robot bug
      const healthOk = await this.testServerHealth()
      if (!healthOk) {
        console.log('❌ Server health check failed')
        return
      }

      const userCreated = await this.testUserCreation()
      if (!userCreated) {
        console.log('❌ User creation failed')
        return
      }

      const gameCreated = await this.testGameCreation()
      if (!gameCreated) {
        console.log('❌ Game creation failed')
        return
      }

      const diceRolled = await this.testDiceRoll()
      if (!diceRolled) {
        console.log('❌ Dice roll failed')
        return
      }

      // First possible moves call (should work)
      const firstMovesResult = await this.testGetPossibleMoves(1)
      if (!firstMovesResult.success) {
        console.log('❌ First possible moves call failed')
        return
      }

      // Make first move
      const moveSuccess = await this.testMakeMove(
        firstMovesResult.possibleMoves
      )
      if (!moveSuccess) {
        console.log('❌ First move failed')
        return
      }

      // Second possible moves call (this is where robots fail)
      const secondMovesResult = await this.testGetPossibleMoves(2)
      if (!secondMovesResult.success) {
        console.log('🔴 **BUG REPRODUCED**: Second possible moves call failed')
        console.log(`   Error: ${secondMovesResult.error}`)
        return
      }

      console.log('\n🎉 **API LAYER TEST COMPLETED SUCCESSFULLY**')
      console.log('\n📊 **API TEST SUMMARY**:')
      console.log(`   - Server health: ✅ OK`)
      console.log(`   - User creation: ✅ OK`)
      console.log(`   - Game creation: ✅ OK`)
      console.log(`   - Dice rolling: ✅ OK`)
      console.log(`   - First possible moves: ✅ OK`)
      console.log(`   - Make move: ✅ OK`)
      console.log(`   - Second possible moves: ✅ OK`)
      console.log(
        `   - Robot bug: ${
          secondMovesResult.success ? '✅ FIXED' : '🔴 REPRODUCED'
        }`
      )
    } catch (error) {
      console.error('❌ **API TEST FAILED**:', error.message)
      console.error(error.stack)
    }
  }
}

// Run the test
const tester = new ApiTester()
tester.runFullTest()
