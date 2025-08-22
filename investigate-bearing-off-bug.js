#!/usr/bin/env node

import pg from 'pg';

const { Pool } = pg;

// Database configuration from .env
const dbConfig = {
  host: '127.0.0.1',
  port: 5432,
  user: 'nodots',
  password: 'nodots',
  database: 'nodots_backgammon_dev',
};

const gameId = '11d09d20-4f3f-4d8c-9f52-6137bfb2ceb1';

async function investigateBearingOffBug() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log(`🔍 Investigating bearing-off bug for game: ${gameId}`);
    console.log('=' * 80);
    
    // Get game data
    const gameResult = await pool.query('SELECT * FROM games WHERE id = $1', [gameId]);
    
    if (gameResult.rows.length === 0) {
      console.log('❌ Game not found in database');
      return;
    }
    
    const gameRow = gameResult.rows[0];
    console.log(`📋 Game found: ${gameRow.state}, created: ${gameRow.created_at}`);
    
    // Get game history
    const historyResult = await pool.query(
      'SELECT * FROM game_history_actions WHERE game_id = $1 ORDER BY sequence_number ASC',
      [gameId]
    );
    
    console.log(`📜 Found ${historyResult.rows.length} game actions`);
    console.log('');
    
    // Parse the game state from JSON
    let gameState;
    try {
      // The game state is stored as a combined object with separate fields
      gameState = {
        stateKind: gameRow.state,
        board: gameRow.board,
        players: gameRow.players,
        cube: gameRow.cube,
        activeColor: gameRow.active_color,
        activePlay: gameRow.active_play,
        winner: gameRow.winner
      };
      console.log('✅ Game state assembled successfully');
    } catch (error) {
      console.log('❌ Failed to assemble game state:', error.message);
      return;
    }
    
    console.log('');
    console.log('🎯 GAME ANALYSIS');
    console.log('-'.repeat(50));
    console.log(`State: ${gameState.stateKind}`);
    console.log(`Active Color: ${gameState.activeColor}`);
    console.log(`Last Update: ${gameRow.last_update || 'N/A'}`);
    
    // Analyze board state
    console.log('');
    console.log('🏁 BOARD STATE ANALYSIS');
    console.log('-'.repeat(50));
    
    // Check white player (the one suspected of invalid bearing-off)
    const whitePlayer = gameState.players.find(p => p.color === 'white');
    const blackPlayer = gameState.players.find(p => p.color === 'black');
    
    if (whitePlayer) {
      console.log(`🤍 WHITE PLAYER (${whitePlayer.userType})`);
      
      // Check checkers in home board (positions 1-6 for their direction)
      const whiteDirection = whitePlayer.direction;
      const homePositions = [1, 2, 3, 4, 5, 6];
      let whiteCheckersInHome = 0;
      let whiteCheckersOutsideHome = 0;
      
      for (const point of gameState.board.points) {
        const position = point.position[whiteDirection];
        const whiteCheckersOnPoint = point.checkers.filter(c => c.color === 'white').length;
        
        if (homePositions.includes(position)) {
          whiteCheckersInHome += whiteCheckersOnPoint;
          if (whiteCheckersOnPoint > 0) {
            console.log(`   Position ${position}: ${whiteCheckersOnPoint} checkers`);
          }
        } else {
          whiteCheckersOutsideHome += whiteCheckersOnPoint;
          if (whiteCheckersOnPoint > 0) {
            console.log(`   Position ${position}: ${whiteCheckersOnPoint} checkers (OUTSIDE HOME)`);
          }
        }
      }
      
      // Check bar
      const whiteCheckersOnBar = gameState.board.bar[whiteDirection].checkers.filter(c => c.color === 'white').length;
      if (whiteCheckersOnBar > 0) {
        console.log(`   Bar: ${whiteCheckersOnBar} checkers`);
        whiteCheckersOutsideHome += whiteCheckersOnBar;
      }
      
      // Check off
      const whiteCheckersBornOff = gameState.board.off[whiteDirection].checkers.filter(c => c.color === 'white').length;
      console.log(`   Born off: ${whiteCheckersBornOff} checkers`);
      
      console.log(`   TOTALS: ${whiteCheckersInHome} in home, ${whiteCheckersOutsideHome} outside home, ${whiteCheckersBornOff} born off`);
      
      // Bearing off rule validation
      const canBearOff = whiteCheckersOutsideHome === 0;
      console.log(`   🎯 CAN BEAR OFF: ${canBearOff ? 'YES' : 'NO'} (all checkers must be in home board)`);
    }
    
    console.log('');
    console.log('📊 MOVE HISTORY ANALYSIS');
    console.log('-'.repeat(50));
    
    // Analyze game actions for suspicious bearing-off moves
    let suspiciousMoves = 0;
    for (const action of historyResult.rows) {
      if (action.action_type === 'make-move') {
        try {
          const actionData = JSON.parse(action.action_data);
          
          // Look for moves to "off" container
          if (actionData.destination && actionData.destination.includes('off')) {
            console.log(`🚨 BEARING-OFF MOVE detected:`);
            console.log(`   Sequence: ${action.sequence_number}`);
            console.log(`   Player: ${action.player_id}`);
            console.log(`   Timestamp: ${action.created_at}`);
            console.log(`   Data: ${JSON.stringify(actionData, null, 2)}`);
            
            // This is where we need to validate if it was legal
            suspiciousMoves++;
          }
        } catch (error) {
          console.log(`   ⚠️ Could not parse action data for sequence ${action.sequence_number}`);
        }
      }
    }
    
    if (suspiciousMoves === 0) {
      console.log('✅ No bearing-off moves found in history');
    } else {
      console.log(`🚨 Found ${suspiciousMoves} bearing-off moves - need to validate legality`);
    }
    
    // Check current active play for dice information
    if (gameState.activePlay) {
      console.log('');
      console.log('🎲 CURRENT ACTIVE PLAY');
      console.log('-'.repeat(50));
      console.log(`Dice: ${gameState.activePlay.dice || 'No dice'}`);
      console.log(`Moves available: ${gameState.activePlay.moves ? gameState.activePlay.moves.length : 0}`);
      
      if (gameState.activePlay.moves) {
        for (const move of gameState.activePlay.moves) {
          console.log(`   Move ${move.id}: ${move.stateKind}, die: ${move.dieValue}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error investigating game:', error);
  } finally {
    await pool.end();
  }
}

// Run the investigation
investigateBearingOffBug().catch(console.error);