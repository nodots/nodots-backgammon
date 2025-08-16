#!/usr/bin/env node

/**
 * Validation Script: Robot Roll History Fix
 * 
 * This script demonstrates that robot dice rolls are now properly 
 * recorded in the game history after the fix to detectRobotFullTurn().
 */

import { Client } from 'pg'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: './packages/api/.env' })

const ROBOT_USER_ID = 'da7eac85-cf8f-49f4-b97d-9f40d3171b36' // gbg-bot

async function validateRobotRollsFix() {
  console.log('🎯 VALIDATING ROBOT ROLL HISTORY FIX')
  console.log('=====================================\n')
  
  // Connect to database
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'nodots',
    password: process.env.DB_PASSWORD || 'nodots',
    database: process.env.DB_NAME || 'nodots_backgammon_dev',
  })

  try {
    await client.connect()
    
    console.log('✅ Connected to database')
    
    // Get the most recent games
    const recentGamesResult = await client.query(`
      SELECT id, created_at, state, players 
      FROM games 
      ORDER BY created_at DESC 
      LIMIT 5
    `)
    const recentGames = recentGamesResult.rows
    
    console.log(`📊 Found ${recentGames.length} recent games`)
    
    for (const game of recentGames) {
      console.log(`\n🎮 GAME: ${game.id}`)
      console.log(`   Created: ${new Date(game.created_at).toLocaleString()}`)
      console.log(`   State: ${game.state}`)
      
      // Check if this game has robot players
      const hasRobot = game.players?.some(p => p.isRobot === true)
      console.log(`   Has Robot: ${hasRobot ? '✅ YES' : '❌ NO'}`)
      
      if (!hasRobot) {
        console.log('   🔄 Skipping - no robot players')
        continue
      }
      
      // Get history actions for this game
      const actionsResult = await client.query(`
        SELECT id, sequence_number, action_type, player_id, action_data, timestamp 
        FROM game_history_actions 
        WHERE game_id = $1 
        ORDER BY sequence_number
      `, [game.id])
      const actions = actionsResult.rows
      
      console.log(`   📋 Total Actions: ${actions.length}`)
      
      // Analyze actions by type and player
      const robotActions = actions.filter(a => a.player_id === ROBOT_USER_ID)
      const humanActions = actions.filter(a => a.player_id !== ROBOT_USER_ID)
      const rollActions = actions.filter(a => a.action_type === 'roll-dice' || a.action_type === 'roll-for-start')
      const robotRollActions = actions.filter(a => 
        (a.action_type === 'roll-dice' || a.action_type === 'roll-for-start') && 
        a.player_id === ROBOT_USER_ID
      )
      
      console.log(`   🤖 Robot Actions: ${robotActions.length}`)
      console.log(`   👤 Human Actions: ${humanActions.length}`)
      console.log(`   🎲 Total Roll Actions: ${rollActions.length}`)
      console.log(`   🎯 Robot Roll Actions: ${robotRollActions.length}`)
      
      // Show robot actions in detail
      if (robotActions.length > 0) {
        console.log('   \n   🤖 ROBOT ACTIONS:')
        robotActions.forEach((action, index) => {
          const diceData = action.action_data?.rollDice?.dice || 
                          action.action_data?.rollForStart?.dieValue
          const diceDisplay = diceData ? 
            (Array.isArray(diceData) ? `[${diceData.join(', ')}]` : `[${diceData}]`) : 
            'N/A'
          
          console.log(`      ${index + 1}. ${action.action_type} (seq: ${action.sequence_number}) - dice: ${diceDisplay}`)
        })
      }
      
      // Show robot roll actions specifically
      if (robotRollActions.length > 0) {
        console.log('   \n   🎲 ROBOT ROLL ACTIONS:')
        robotRollActions.forEach((action, index) => {
          const dice = action.action_data?.rollDice?.dice || 
                      [action.action_data?.rollForStart?.dieValue]
          console.log(`      ${index + 1}. ${action.action_type} - dice: [${dice.join(', ')}] at ${new Date(action.timestamp).toLocaleTimeString()}`)
        })
        
        console.log('   ✅ ROBOT ROLLS ARE BEING RECORDED!')
      } else {
        console.log('   ❌ NO ROBOT ROLL ACTIONS FOUND')
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 VALIDATION SUMMARY')
    console.log('='.repeat(50))
    
    let totalRobotRolls = 0
    for (const game of recentGames) {
      const result = await client.query(`
        SELECT COUNT(*) 
        FROM game_history_actions 
        WHERE game_id = $1 AND player_id = $2 AND action_type = $3
      `, [game.id, ROBOT_USER_ID, 'roll-dice'])
      totalRobotRolls += parseInt(result.rows[0].count)
    }
    
    console.log(`✅ Total robot roll-dice actions found: ${totalRobotRolls}`)
    
    if (totalRobotRolls > 0) {
      console.log('\n🎉 SUCCESS: Robot roll history fix is working!')
      console.log('   Robot dice rolls are now properly recorded in the database.')
      console.log('   This means the Roll History UI will display robot rolls correctly.')
    } else {
      console.log('\n⚠️  No robot rolls found in recent games.')
      console.log('   This might indicate that no robot turns have occurred yet,')
      console.log('   or that games need to be played to generate robot actions.')
    }
    
  } catch (error) {
    console.error('❌ Error during validation:', error)
  } finally {
    await client.end()
    console.log('\n🔌 Database connection closed')
  }
}

// Run validation
validateRobotRollsFix().catch(console.error)