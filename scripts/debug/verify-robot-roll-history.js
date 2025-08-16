// Simple verification script to check robot roll history
const fetch = require('node-fetch')

async function verifyRobotRollHistory() {
  console.log('🔍 Verifying robot roll history fix...')
  
  // Use the game ID from the server logs
  const gameId = '404f4d2d-b7f0-4c3a-80f7-78aa2305e6d0'
  const API_BASE = 'http://localhost:3000/api/v3.7'
  
  try {
    console.log(`📜 Fetching history for game: ${gameId}`)
    const response = await fetch(`${API_BASE}/games/${gameId}/history`)
    
    if (!response.ok) {
      throw new Error(`History fetch failed: ${response.status}`)
    }
    
    const historyData = await response.json()
    console.log(`📊 Found ${historyData.actions.length} total history actions`)
    
    // Filter for robot roll-dice actions
    const robotRolls = historyData.actions.filter(action => 
      action.actionType === 'roll-dice' && 
      action.playerId === 'da7eac85-cf8f-49f4-b97d-9f40d3171b36' // Robot player ID from logs
    )
    
    console.log(`🤖 Robot roll-dice actions found: ${robotRolls.length}`)
    
    robotRolls.forEach((action, index) => {
      const dice = action.actionData?.rollDice?.dice || []
      console.log(`  ${index + 1}. Robot rolled: [${dice.join(', ')}] (sequence: ${action.sequenceNumber})`)
    })
    
    if (robotRolls.length > 0) {
      const firstRoll = robotRolls[0]
      const dice = firstRoll.actionData?.rollDice?.dice || []
      
      if (dice[0] === 6 && dice[1] === 6) {
        console.log('✅ SUCCESS: Robot rolls are being recorded with the fixed dice values!')
        console.log('✅ PROOF: The robot roll history bug has been fixed!')
      } else {
        console.log(`⚠️  Unexpected dice values: [${dice.join(', ')}]`)
      }
    } else {
      console.log('❌ No robot roll actions found')
    }
    
    // Show all actions for context
    console.log('\n📋 All history actions:')
    historyData.actions.forEach((action, index) => {
      const dice = action.actionData?.rollDice?.dice
      const diceText = dice ? ` - dice: [${dice.join(', ')}]` : ''
      console.log(`  ${index + 1}. ${action.actionType} (seq: ${action.sequenceNumber})${diceText}`)
    })
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

verifyRobotRollHistory()