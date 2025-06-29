const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api/v1'

async function apiCall(method, endpoint, body = null) {
  const url = `${API_BASE}${endpoint}`
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  const data = await response.json()

  console.log(`\n=== ${method} ${endpoint} ===`)
  console.log(`Status: ${response.status}`)
  console.log(`Response:`, JSON.stringify(data, null, 2))

  return data
}

async function debugPossibleMoves() {
  try {
    console.log('🔍 Debugging Possible Moves API Issue\n')

    // Use the game ID from the last simulation
    const gameId = 'a7746d5c-51d5-4262-b1f8-5880e79a52af'

    // Get current game state
    const game = await apiCall('GET', `/games/${gameId}`)

    console.log('\n=== GAME STATE ANALYSIS ===')
    console.log(`Game State: ${game.stateKind}`)
    console.log(`Active Color: ${game.activeColor}`)
    console.log(`Active Player ID: ${game.activePlayer?.id}`)
    console.log(`Active Player State: ${game.activePlayer?.stateKind}`)
    console.log(`Dice: [${game.activePlayer?.dice?.currentRoll || 'none'}]`)

    // Check if there's an active play
    if (game.activePlay) {
      console.log(`Active Play State: ${game.activePlay.stateKind}`)
      console.log(`Active Play Moves: ${game.activePlay.moves?.length || 0}`)

      if (
        game.activePlay.moves &&
        Object.keys(game.activePlay.moves).length > 0
      ) {
        console.log('Available moves in activePlay:')
        Object.values(game.activePlay.moves).forEach((move, i) => {
          console.log(
            `  Move ${i + 1}: ${move.stateKind}, die: ${move.dieValue}, kind: ${
              move.moveKind
            }`
          )
        })
      }
    }

    // Test the possible-moves endpoint
    console.log('\n=== TESTING POSSIBLE-MOVES ENDPOINT ===')
    const possibleMovesResponse = await apiCall(
      'GET',
      `/games/${gameId}/possible-moves`
    )

    // If no possible moves, let's check why
    if (
      !possibleMovesResponse.success ||
      !possibleMovesResponse.possibleMoves ||
      possibleMovesResponse.possibleMoves.length === 0
    ) {
      console.log('\n=== INVESTIGATING WHY NO MOVES ===')

      // Check if game state allows possible moves
      console.log(
        `Game state allows possible moves: ${game.stateKind === 'rolled'}`
      )

      // Check dice state
      if (game.activePlayer && game.activePlayer.dice) {
        console.log(`Dice state: ${game.activePlayer.dice.stateKind}`)
        console.log(`Current roll: [${game.activePlayer.dice.currentRoll}]`)
      }

      // Look at board state for white checkers
      let whiteCheckerPositions = []
      if (game.board && game.board.BackgammonPoints) {
        game.board.BackgammonPoints.forEach((point) => {
          const whiteCheckers = point.checkers.filter(
            (c) => c.color === 'white'
          )
          if (whiteCheckers.length > 0) {
            whiteCheckerPositions.push({
              position: point.position.clockwise,
              count: whiteCheckers.length,
            })
          }
        })
      }

      console.log('White checker positions:', whiteCheckerPositions)

      // Check if white checkers are on the bar
      if (game.board && game.board.bar) {
        const whiteOnBar = game.board.bar.clockwise.checkers.filter(
          (c) => c.color === 'white'
        ).length
        console.log(`White checkers on bar: ${whiteOnBar}`)
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

debugPossibleMoves()
