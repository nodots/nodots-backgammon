#!/usr/bin/env node

const gameId = '2d0eeec9-2f35-4ed3-837c-637642dc1064'

async function analyzeBoardState() {
  console.log(`🔍 Analyzing board state for game: ${gameId}`)
  
  try {
    const response = await fetch(`http://localhost:3000/api/v3.6/games/${gameId}`)
    const game = await response.json()
    
    console.log('\n=== BLACK CHECKER LOCATIONS ===')
    let blackCheckersFound = 0
    
    // Check points
    game.board.points.forEach(point => {
      const blackCheckers = point.checkers.filter(c => c.color === 'black')
      if (blackCheckers.length > 0) {
        console.log(`Point ${point.position.clockwise}: ${blackCheckers.length} black checkers`)
        blackCheckersFound += blackCheckers.length
      }
    })
    
    // Check bar
    const blackOnBar = (game.board.bar.clockwise?.checkers?.filter(c => c.color === 'black') || []).length +
                      (game.board.bar.counterclockwise?.checkers?.filter(c => c.color === 'black') || []).length
    if (blackOnBar > 0) {
      console.log(`Bar: ${blackOnBar} black checkers`)
      blackCheckersFound += blackOnBar
    }
    
    // Check off
    const blackOff = (game.board.off.clockwise?.checkers?.filter(c => c.color === 'black') || []).length +
                     (game.board.off.counterclockwise?.checkers?.filter(c => c.color === 'black') || []).length
    if (blackOff > 0) {
      console.log(`Off board: ${blackOff} black checkers`)
      blackCheckersFound += blackOff
    }
    
    console.log(`\nTotal black checkers found: ${blackCheckersFound}/15`)
    
    console.log('\n=== ACTIVE PLAY vs REALITY ===')
    const moves = Array.isArray(game.activePlay.moves) ? game.activePlay.moves : Object.values(game.activePlay.moves)
    
    moves.forEach((move, index) => {
      console.log(`\nMove ${index + 1}:`)
      console.log(`  Status: ${move.stateKind}`)
      console.log(`  Die Value: ${move.dieValue}`)
      console.log(`  Expected Origin: Point ${move.origin?.position?.clockwise} (${move.origin?.kind})`)
      
      // Check if there are actually checkers there
      const originPoint = game.board.points.find(p => p.id === move.origin?.id)
      const blackCheckersOnOrigin = originPoint ? originPoint.checkers.filter(c => c.color === 'black').length : 0
      
      console.log(`  Actual checkers on origin: ${blackCheckersOnOrigin}`)
      console.log(`  PROBLEM: ${move.stateKind === 'ready' && blackCheckersOnOrigin === 0 ? 'YES - No checkers but move still pending!' : 'None'}`)
    })
    
    console.log('\n=== SOLUTION ===')
    console.log('The game needs to:')
    console.log('1. Detect that all moves have been physically completed')
    console.log('2. Update activePlay to mark all moves as completed') 
    console.log('3. Call Game.confirmTurn() to transition from "moving" to next player')
    
    // Try to fix by calling confirmTurn
    console.log('\n🔧 Attempting to fix by calling pass-turn endpoint...')
    await attemptFix(gameId)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function attemptFix(gameId) {
  try {
    const response = await fetch(`http://localhost:3000/api/v3.6/games/${gameId}/confirm-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ FIXED! Game transitioned successfully!')
      console.log(`New state: ${result.game?.stateKind}`)
      console.log(`New active player: ${result.game?.activeColor}`)
    } else {
      console.log(`❌ Fix attempt failed: ${result.error}`)
    }
  } catch (error) {
    console.error('❌ Fix attempt error:', error.message)
  }
}

analyzeBoardState()