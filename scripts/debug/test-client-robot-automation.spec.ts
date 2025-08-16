import { test, expect } from '@playwright/test'

test('CLIENT Robot Automation: Robot dice rolls appear in Roll History', async ({ page }) => {
  console.log('🎯 TESTING: CLIENT-side robot automation with proper history recording')
  
  // Navigate to the game
  await page.goto('http://localhost:3001')
  
  // Wait for page to load
  await expect(page).toHaveTitle(/Nodots Backgammon/)
  
  // Start a human vs robot game
  await page.click('[data-testid="start-game-button"]')
  
  // Select human vs robot mode  
  await page.click('[data-testid="human-vs-robot-button"]')
  
  // Wait for game to load
  await page.waitForSelector('[data-testid="game-board"]', { timeout: 10000 })
  
  // Check initial robot automation status from game state
  const gameStateElement = page.locator('[data-testid="game-state"]')
  const initialGameState = JSON.parse(await gameStateElement.textContent() || '{}')
  
  console.log('🔍 Initial game state:', {
    activeColor: initialGameState.activeColor,
    isCurrentPlayerRobot: initialGameState.robotAutomation?.isCurrentPlayerRobot,
    robotState: initialGameState.robotAutomation?.robotState,
    isRobotTurn: initialGameState.robotAutomation?.isRobotTurn
  })
  
  // If robot starts first, wait for CLIENT automation to complete
  if (initialGameState.activePlayer?.isRobot) {
    console.log('🤖 Robot starts first - waiting for CLIENT automation')
    
    // Wait for robot to automatically click dice (roll)
    await page.waitForTimeout(3000)
    
    // Wait for robot to automatically make moves
    await page.waitForTimeout(2000)
    
    // Wait for robot to automatically confirm turn
    await page.waitForTimeout(2000)
  }
  
  // Get initial robot roll count from history
  await expect(page.locator('[data-testid="roll-history"]')).toBeVisible()
  const initialRobotRolls = await page.locator('[data-testid="roll-history"] .robot-roll').count()
  console.log(`📊 Initial robot rolls in history: ${initialRobotRolls}`)
  
  // Human player takes a turn to trigger next robot turn
  console.log('👤 Human player taking turn...')
  
  // Human roll dice
  await page.click('[data-testid="roll-dice-button"]')
  await page.waitForTimeout(1000)
  
  // Make a move (click first moveable checker if any)
  const moveableChecker = page.locator('[data-moveable="true"]').first()
  if (await moveableChecker.count() > 0) {
    await moveableChecker.click()
    await page.waitForTimeout(500)
    
    // Click destination (simplified)
    await page.locator('[data-testid="game-board"] .point').first().click()
    await page.waitForTimeout(500)
  }
  
  // Human confirm turn - this should trigger CLIENT robot automation
  await page.click('[data-testid="confirm-turn-button"]')
  console.log('✅ Human confirmed turn - should trigger CLIENT robot automation')
  
  // Wait for CLIENT robot automation sequence to complete
  console.log('⏳ Waiting for CLIENT robot automation...')
  
  // Monitor robot automation status
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(1000)
    
    const currentGameState = JSON.parse(await gameStateElement.textContent() || '{}')
    console.log(`🔍 Robot automation status #${i + 1}:`, {
      isCurrentPlayerRobot: currentGameState.robotAutomation?.isCurrentPlayerRobot,
      robotState: currentGameState.robotAutomation?.robotState,
      actionsRemaining: currentGameState.robotAutomation?.actionsRemaining,
      gameState: currentGameState.stateKind,
      activeColor: currentGameState.activeColor
    })
    
    // Check if robot automation is complete (no longer robot's turn)
    if (!currentGameState.robotAutomation?.isCurrentPlayerRobot) {
      console.log('✅ Robot automation completed - turn passed back to human')
      break
    }
  }
  
  // Check final robot roll count
  const finalRobotRolls = await page.locator('[data-testid="roll-history"] .robot-roll').count()
  console.log(`📊 Final robot rolls in history: ${finalRobotRolls}`)
  
  // VERIFICATION: Should have more robot rolls now
  expect(finalRobotRolls).toBeGreaterThan(initialRobotRolls)
  
  // Take screenshot as evidence
  await page.screenshot({ 
    path: 'client-robot-automation-proof.png', 
    fullPage: true 
  })
  
  console.log('✅ CLIENT ROBOT AUTOMATION TEST PASSED')
  console.log(`   - Initial robot rolls: ${initialRobotRolls}`)
  console.log(`   - Final robot rolls: ${finalRobotRolls}`)
  console.log(`   - Robot rolls recorded by CLIENT automation: ${finalRobotRolls - initialRobotRolls}`)
})