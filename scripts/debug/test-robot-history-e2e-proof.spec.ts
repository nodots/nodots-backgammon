import { test, expect } from '@playwright/test'

test('PROOF: Multiple robot rolls appear in Roll History UI', async ({ page }) => {
  console.log('🎯 E2E PROOF: Testing multiple robot rolls in Roll History UI')
  
  // Navigate to the game
  await page.goto('http://localhost:3001')
  
  // Wait for page to load
  await expect(page).toHaveTitle(/Nodots Backgammon/)
  
  // Start a human vs robot game
  await page.click('[data-testid="start-game-button"]')
  
  // Select human vs robot mode
  await page.click('[data-testid="human-vs-robot-button"]')
  
  // Wait for game to load and robot to complete first turn
  await page.waitForSelector('[data-testid="game-board"]', { timeout: 10000 })
  await page.waitForTimeout(3000) // Allow robot automation to complete
  
  // Check Roll History component for robot rolls
  await expect(page.locator('[data-testid="roll-history"]')).toBeVisible()
  
  // Get initial robot roll count
  const initialRobotRolls = await page.locator('[data-testid="roll-history"] .robot-roll').count()
  console.log(`Initial robot rolls: ${initialRobotRolls}`)
  
  // Human player takes a turn
  console.log('Human player taking turn...')
  
  // Roll dice for human
  await page.click('[data-testid="roll-dice-button"]')
  await page.waitForTimeout(1000)
  
  // Make a move (click first moveable checker)
  const moveableChecker = page.locator('[data-moveable="true"]').first()
  if (await moveableChecker.count() > 0) {
    await moveableChecker.click()
    await page.waitForTimeout(500)
    
    // Click destination (simplified - just click somewhere)
    await page.locator('[data-testid="game-board"] .point').first().click()
    await page.waitForTimeout(500)
  }
  
  // Confirm turn to trigger robot automation
  await page.click('[data-testid="confirm-turn-button"]')
  
  // Wait for robot automation to complete the next turn
  console.log('Waiting for robot automation...')
  await page.waitForTimeout(5000)
  
  // Check if a second robot roll appeared
  const finalRobotRolls = await page.locator('[data-testid="roll-history"] .robot-roll').count()
  console.log(`Final robot rolls: ${finalRobotRolls}`)
  
  // PROOF: Multiple robot rolls should be visible
  expect(finalRobotRolls).toBeGreaterThan(initialRobotRolls)
  
  // Take screenshot as evidence
  await page.screenshot({ path: 'robot-history-proof.png', fullPage: true })
  
  console.log('✅ PROOF COMPLETE: Multiple robot rolls detected in UI')
})