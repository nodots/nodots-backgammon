const axios = require('axios')

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1'
const EXISTING_GAME_ID = '8f9fe0e3-3bd3-4a99-9fc8-a2d2eb7cd0de' // From current games list

console.log('🎯 **SIMPLE API ROBOT BUG TEST**\n')

class SimpleApiTester {
  constructor() {
    this.gameId = EXISTING_GAME_ID
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

  async testGetGame() {
    console.log('1️⃣ Getting existing game...')
    const result = await this.makeRequest('GET', `/games/${this.gameId}`)

    if (result.success) {
      this.currentGame = result.data
      console.log(`   🎮 Game found: ${this.gameId}`)
      console.log(`   📊 Game state: ${result.data.stateKind}`)
      console.log(`   🎯 Active color: ${result.data.activeColor}`)
      return true
    }
    return false
  }

  async testCreateNewGameForTesting() {
    console.log('1️⃣ Creating new test game...')

    // Try creating a simple game for testing
    const result = await this.makeRequest('POST', '/games', {
      player1: { userId: 'robot-test-1' },
      player2: { userId: 'robot-test-2' },
    })

    if (result.success) {
      this.gameId = result.data.id
      this.currentGame = result.data
      console.log(`   🎮 Test game created: ${this.gameId}`)
      console.log(`   📊 Game state: ${result.data.stateKind}`)
      console.log(`   🎯 Active color: ${result.data.activeColor}`)
      return true
    } else {
      console.log(`   ⚠️ Game creation failed: ${result.error}`)
      console.log('   🔄 Trying with existing game instead...')
      return this.testGetGame()
    }
  }

  async testRobotBugSequence() {
    console.log('\n2️⃣ Testing robot bug sequence...')

    // Check if game needs dice roll
    if (this.currentGame.stateKind === 'rolled-for-start') {
      console.log('   🎲 Rolling dice...')
      const rollResult = await this.makeRequest(
        'POST',
        `/games/${this.gameId}/roll`
      )
      if (rollResult.success) {
        this.currentGame = rollResult.data
        console.log('   ✅ Dice rolled successfully')
      } else {
        console.log('   ❌ Dice roll failed')
        return false
      }
    }

    // Now test the bug sequence: possible moves → move → possible moves again
    const activePlayerId = this.currentGame.activePlay?.player?.id
    if (!activePlayerId) {
      console.log('   ❌ No active player found')
      return false
    }

    console.log(`   👤 Active player: ${activePlayerId}`)

    // Step 1: Get first possible moves (should work)
    console.log('\n   🔍 Step 1: Getting first possible moves...')
    const firstMovesResult = await this.makeRequest(
      'GET',
      `/games/${this.gameId}/possible-moves?playerId=${activePlayerId}`
    )

    if (!firstMovesResult.success) {
      console.log(
        `   ❌ First possible moves failed: ${firstMovesResult.error}`
      )
      return false
    }

    const possibleMoves = firstMovesResult.data.possibleMoves || []
    console.log(`   ✅ Found ${possibleMoves.length} possible moves`)

    if (possibleMoves.length === 0) {
      console.log('   ⚠️ No moves available - cannot test robot bug')
      return false
    }

    // Step 2: Make a move
    console.log('\n   🎯 Step 2: Making first move...')
    const firstMove = possibleMoves[0]
    const checkerId = firstMove.origin?.id

    if (!checkerId) {
      console.log('   ❌ No checker ID found in move')
      return false
    }

    console.log(`   🎯 Moving checker: ${checkerId}`)
    const moveResult = await this.makeRequest(
      'POST',
      `/games/${this.gameId}/move`,
      {
        playerId: activePlayerId,
        checkerId: checkerId,
      }
    )

    if (!moveResult.success) {
      console.log(`   ❌ Move failed: ${moveResult.error}`)
      return false
    }

    console.log('   ✅ Move successful')
    this.currentGame = moveResult.data

    // Step 3: Get possible moves again (this is where robots fail with 400)
    console.log('\n   🔍 Step 3: Getting possible moves after first move...')
    console.log('   📝 THIS IS WHERE THE ROBOT BUG OCCURS...')

    const secondMovesResult = await this.makeRequest(
      'GET',
      `/games/${this.gameId}/possible-moves?playerId=${activePlayerId}`
    )

    if (!secondMovesResult.success) {
      console.log(
        '   🔴 **BUG REPRODUCED**: Second possible moves call failed!'
      )
      console.log(`   ❌ Error: ${secondMovesResult.error}`)
      console.log(`   📊 Status: ${secondMovesResult.status}`)

      // This is the exact bug that was breaking robot players
      if (secondMovesResult.status === 400) {
        console.log(
          '   🎯 **CONFIRMED**: This is the 400 error that breaks robot moves!'
        )
      }

      return false
    } else {
      console.log('   ✅ **BUG FIXED**: Second possible moves call succeeded!')
      const secondPossibleMoves = secondMovesResult.data.possibleMoves || []
      console.log(
        `   📊 Found ${secondPossibleMoves.length} moves for remaining dice`
      )
      return true
    }
  }

  async runSimpleTest() {
    try {
      console.log(`🔍 Testing robot bug with game: ${this.gameId}\n`)

      const gameReady = await this.testCreateNewGameForTesting()
      if (!gameReady) {
        console.log('❌ Could not get game for testing')
        return
      }

      const bugTestResult = await this.testRobotBugSequence()

      console.log('\n🎉 **SIMPLE API TEST COMPLETED**')
      console.log('\n📊 **ROBOT BUG TEST RESULT**:')
      console.log(
        `   - Robot bug status: ${bugTestResult ? '✅ FIXED' : '🔴 REPRODUCED'}`
      )

      if (bugTestResult) {
        console.log(
          '   🎉 SUCCESS: The dice consumption fix in core library resolved the API bug!'
        )
      } else {
        console.log(
          '   ⚠️ FAILED: Robot bug still exists - may need API layer fixes'
        )
      }
    } catch (error) {
      console.error('❌ **SIMPLE API TEST FAILED**:', error.message)
      console.error(error.stack)
    }
  }
}

// Run the test
const tester = new SimpleApiTester()
tester.runSimpleTest()
