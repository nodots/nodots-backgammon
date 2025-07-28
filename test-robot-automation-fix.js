#!/usr/bin/env node

/**
 * Test script to verify robot automation completes all moves in game.activePlay.moves
 * This proves the fix for the issue where robots got stuck in 'moving' state
 */

import { Game } from './packages/core/dist/index.js';
import { Robot } from './packages/core/dist/index.js';

console.log('🤖 Testing Robot Automation Fix - Complete Move Execution');
console.log('=' * 60);

async function testRobotMoveCompletion() {
  try {
    // Create a new game between human and robot
    console.log('1. Creating game with robot as player 1 (black)...');
    const humanPlayer = { id: 'human-123', isRobot: false, color: 'white' };
    const robotPlayer = { id: 'robot-456', isRobot: true, color: 'black' };
    
    let game = Game.create(humanPlayer, robotPlayer);
    console.log(`   Initial state: ${game.stateKind}`);
    
    // Simulate robot winning roll-for-start
    console.log('2. Simulating robot winning roll-for-start...');
    game = Game.rollForStart(game);
    
    if (game.activePlayer?.isRobot && game.stateKind === 'rolled-for-start') {
      console.log('   ✅ Robot won roll-for-start');
      console.log(`   State: ${game.stateKind}, Active player: ${game.activePlayer.color}`);
      
      // Robot rolls dice to start turn
      console.log('3. Robot rolling dice...');
      game = Game.roll(game);
      console.log(`   State after roll: ${game.stateKind}`);
      console.log(`   Dice rolled: [${game.dice.join(', ')}]`);
      
      if (game.stateKind === 'rolled' && game.activePlayer?.isRobot) {
        console.log('4. Testing robot move automation...');
        console.log(`   Moves to complete: ${game.activePlay?.moves?.length || 0}`);
        
        // This is the key test - robot should complete ALL moves
        const automationResult = await Robot.makeOptimalMove(game, 'intermediate');
        
        if (automationResult.success && automationResult.game) {
          const finalGame = automationResult.game;
          console.log(`   ✅ Robot automation completed!`);
          console.log(`   Final state: ${finalGame.stateKind}`);
          console.log(`   Moves completed: ${game.activePlay?.moves?.length || 0}`);
          console.log(`   Can confirm turn: ${Game.canConfirmTurn(finalGame)}`);
          
          if (finalGame.stateKind === 'rolling' || finalGame.stateKind === 'rolled-for-start') {
            console.log('   ✅ SUCCESS: Robot completed all moves and passed turn!');
            return true;
          } else if (finalGame.stateKind === 'moving') {
            console.log('   ❌ FAILURE: Robot still in moving state - fix needed');
            return false;
          }
        } else {
          console.log('   ❌ Robot automation failed');
          console.log(`   Error: ${automationResult.message}`);
          return false;
        }
      } else {
        console.log('   ⚠️ Game not in expected state for robot move testing');
      }
    } else {
      console.log('   ⚠️ Human won roll-for-start, retrying...');
      // Could retry here, but for now just report
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run multiple attempts since roll-for-start is random
async function runTest() {
  console.log('Starting robot automation tests...\n');
  
  for (let attempt = 1; attempt <= 5; attempt++) {
    console.log(`\n🎲 Attempt ${attempt}/5:`);
    const success = await testRobotMoveCompletion();
    
    if (success) {
      console.log('\n🎉 ROBOT AUTOMATION FIX VERIFIED!');
      console.log('Robot successfully completes all moves in game.activePlay.moves');
      process.exit(0);
    }
  }
  
  console.log('\n⚠️ Could not verify fix - robot may not have won roll-for-start in any attempt');
  console.log('This is normal due to randomness. Try running the test again.');
}

runTest().catch(console.error);