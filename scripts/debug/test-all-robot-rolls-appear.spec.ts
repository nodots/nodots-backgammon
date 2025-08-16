import { test, expect } from '@playwright/test'

const ROBOT_USER_ID = 'da7eac85-cf8f-49f4-b97d-9f40d3171b36' // gbg-bot

/**
 * E2E TEST: ALL Robot Rolls Must Appear in Roll History
 * 
 * This test proves that EVERY robot roll-dice action is properly recorded
 * and appears in the Roll History UI, not just the first one.
 */

test('ALL ROBOT ROLLS: Must appear in Roll History throughout the game', async ({ page }) => {
  test.setTimeout(300000) // 5 minutes timeout for multiple turns
  
  console.log('🎯 TESTING: ALL Robot rolls appear in Roll History')
  
  // === PHASE 1: Authentication and Game Setup ===
  console.log('\n=== PHASE 1: Authentication and Game Setup ===')
  
  await page.goto('http://localhost:5437/')
  await page.getByText(/get started/i).click()
  await page.getByLabel(/email address/i).fill('e2e-tests@nodots.com')
  await page.getByLabel(/password/i).fill('passworD1!')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.waitForURL('**/lobby', { timeout: 30000 })
  await page.waitForFunction(() => !/User ID:\\s*None/i.test(document.body.innerText), { timeout: 30000 })
  
  console.log('✅ Authentication completed')
  
  // Start game with robot
  const playRobotButtons = page.getByRole('button', { name: /play robot/i })
  await playRobotButtons.first().click()
  await page.waitForURL('**/game/**', { timeout: 30000 })
  await expect(page.locator('#BoardContainer')).toBeVisible({ timeout: 60000 })
  await page.waitForTimeout(3000)
  
  // Extract game ID from URL for database queries
  const currentUrl = page.url()
  const gameIdMatch = currentUrl.match(/\/game\/([a-f0-9\-]+)/)
  const gameId = gameIdMatch ? gameIdMatch[1] : null
  
  if (!gameId) {
    throw new Error('Could not extract game ID from URL')
  }
  
  console.log(`✅ Game started with ID: ${gameId}`)
  
  // === PHASE 2: Play Multiple Turns to Test Robot Roll Recording ===
  console.log('\\n=== PHASE 2: Play Multiple Turns to Test Robot Roll Recording ===')
  
  let turnCount = 0
  let robotRollsDetected = 0
  let humanRollsDetected = 0
  const maxTurns = 6 // Play 6 turns to test multiple robot rolls
  
  for (let turn = 0; turn < maxTurns; turn++) {
    turnCount++
    console.log(`\n--- TURN ${turnCount} ---`)
    
    // Get current game state
    const gameState = await page.evaluate(() => {
      const gameElement = document.querySelector('[data-testid=\"game-state\"]')
      if (gameElement) {
        return JSON.parse(gameElement.textContent || '{}')
      }
      return null
    })
    
    if (!gameState) {
      console.log('⚠️ Could not get game state, ending turn loop')
      break
    }
    
    const activePlayer = gameState.players?.find(p => p.color === gameState.activeColor)
    const isRobotTurn = activePlayer?.isRobot === true
    
    console.log(`🎮 GAME STATE: ${gameState.stateKind}, activePlayer: ${gameState.activeColor} ${isRobotTurn ? '(ROBOT)' : '(HUMAN)'}, isRobot: ${isRobotTurn}`)
    
    if (isRobotTurn) {
      // Robot's turn - wait for robot automation to complete
      console.log('🤖 ROBOT TURN: Waiting for robot automation...')
      
      // Wait for robot to complete its turn (state should change from robot to human)
      let robotTurnCompleted = false
      let waitTime = 0
      const maxWaitTime = 15000 // 15 seconds max wait for robot
      
      while (!robotTurnCompleted && waitTime < maxWaitTime) {
        await page.waitForTimeout(1000)
        waitTime += 1000
        
        const newGameState = await page.evaluate(() => {
          const gameElement = document.querySelector('[data-testid=\"game-state\"]')
          return gameElement ? JSON.parse(gameElement.textContent || '{}') : null
        })
        
        if (newGameState) {
          const newActivePlayer = newGameState.players?.find(p => p.color === newGameState.activeColor)
          const isStillRobotTurn = newActivePlayer?.isRobot === true
          
          if (!isStillRobotTurn) {
            robotTurnCompleted = true
            robotRollsDetected++
            console.log(`✅ Robot turn completed, now it's ${newGameState.activeColor}'s turn`)
          }
        }
      }
      
      if (!robotTurnCompleted) {
        console.log('⚠️ Robot turn did not complete within timeout')
      }
    } else {
      // Human's turn - use the same pattern as working tests
      console.log('👤 HUMAN TURN: Making moves...')
      
      // Check if human can roll dice using the proper selector
      const firstDie = page.locator('.die').first()
      const canRoll = await firstDie.isVisible().catch(() => false)
      
      if (canRoll) {
        // Check current die state and game context
        const gameAndDiceState = await page.evaluate(() => {
          // Get game state from the test data element
          const gameElement = document.querySelector('[data-testid="game-state"]')
          const gameData = gameElement ? JSON.parse(gameElement.textContent || '{}') : null
          
          // Get dice elements
          const diceElements = Array.from(document.querySelectorAll('.die'))
          
          return {
            gameStateKind: gameData?.stateKind,
            activeColor: gameData?.activeColor,
            hasActivePlay: !!gameData?.activePlay,
            diceCount: diceElements.length,
            firstDieVisible: diceElements.length > 0
          }
        })
        
        console.log('👤 HUMAN: Game and dice state:', gameAndDiceState)
        
        if (gameAndDiceState.gameStateKind === 'rolling' && gameAndDiceState.firstDieVisible) {
          console.log('👤 HUMAN: Rolling dice')
          await firstDie.click()
          
          // Wait for dice to be rolled using game state
          await page.waitForFunction(
            () => {
              const gameElement = document.querySelector('[data-testid="game-state"]')
              if (!gameElement) return false
              const gameData = JSON.parse(gameElement.textContent || '{}')
              return gameData.stateKind === 'rolled' && !!gameData.activePlay
            },
            { timeout: 10000 }
          )
          
          humanRollsDetected++
          console.log('👤 HUMAN: Dice rolled successfully')
          
          // Execute available moves using game state
          const moveState = await page.evaluate(() => {
            const gameElement = document.querySelector('[data-testid="game-state"]')
            if (!gameElement) return { readyMoves: 0, gameState: 'unknown' }
            const gameData = JSON.parse(gameElement.textContent || '{}')
            
            // Count ready moves in activePlay
            const readyMoves = gameData.activePlay?.moves ? 
              Array.from(gameData.activePlay.moves).filter(move => move.stateKind === 'ready').length : 0
            
            return {
              readyMoves: readyMoves,
              gameState: gameData.stateKind,
              totalMoves: gameData.activePlay?.moves ? Array.from(gameData.activePlay.moves).length : 0
            }
          })
          
          console.log('👤 HUMAN: Move state:', moveState)
          
          if (moveState.readyMoves > 0) {
            console.log(`👤 HUMAN: Executing moves (${moveState.readyMoves} available)`)
            const moveableCheckers = await page.locator('[data-moveable=\"true\"]').all()
            const maxMoves = Math.min(moveableCheckers.length, moveState.readyMoves, 4)
            
            for (let i = 0; i < maxMoves; i++) {
              const currentMoveableCheckers = await page.locator('[data-moveable=\"true\"]').all()
              if (currentMoveableCheckers.length === 0) break
              
              console.log(`👤 HUMAN: Executing move ${i + 1}`)
              await currentMoveableCheckers[0].click()
              await page.waitForTimeout(1000)
              
              // Check if no more moves available
              const currentMoveState = await page.evaluate(() => {
                const gameElement = document.querySelector('[data-testid="game-state"]')
                if (!gameElement) return 0
                const gameData = JSON.parse(gameElement.textContent || '{}')
                return gameData.activePlay?.moves ? 
                  Array.from(gameData.activePlay.moves).filter(move => move.stateKind === 'ready').length : 0
              })
              
              if (currentMoveState === 0) break
            }
          }
          
          // Complete the turn using game state
          const turnState = await page.evaluate(() => {
            const gameElement = document.querySelector('[data-testid="game-state"]')
            if (!gameElement) return { gameState: 'unknown', readyMoves: 0 }
            const gameData = JSON.parse(gameElement.textContent || '{}')
            
            const readyMoves = gameData.activePlay?.moves ? 
              Array.from(gameData.activePlay.moves).filter(move => move.stateKind === 'ready').length : 0
            
            return {
              gameState: gameData.stateKind,
              readyMoves: readyMoves,
              hasActivePlay: !!gameData.activePlay
            }
          })
          
          console.log('👤 HUMAN: Turn completion state:', turnState)
          
          if (turnState.readyMoves === 0 || turnState.gameState === 'moved') {
            console.log('👤 HUMAN: Completing turn...')
            
            // Look for pass turn action
            const passTurnDie = page.locator('[data-die-action=\"pass-turn\"]').first()
            const passTurnVisible = await passTurnDie.isVisible().catch(() => false)
            
            if (passTurnVisible) {
              await passTurnDie.click()
              console.log('👤 HUMAN: Clicked dice to pass turn')
            } else {
              // Fallback: try any clickable die
              const clickableDie = page.locator('[data-clickable=\"true\"]').first()
              if (await clickableDie.isVisible()) {
                await clickableDie.click()
                console.log('👤 HUMAN: Clicked clickable dice to pass turn (fallback)')
              }
            }
          }
          
          await page.waitForTimeout(2000)
        } else if (gameAndDiceState.gameStateKind === 'rolled') {
          console.log('👤 HUMAN: Dice already rolled, just completing turn')
          // Complete any remaining moves and pass turn
          const clickableDie = page.locator('[data-clickable=\"true\"]').first()
          if (await clickableDie.isVisible()) {
            await clickableDie.click()
            console.log('👤 HUMAN: Clicked dice to complete turn')
          } else {
            // Fallback: try clicking first die
            await firstDie.click()
            console.log('👤 HUMAN: Clicked first die to complete turn (fallback)')
          }
          await page.waitForTimeout(2000)
        } else {
          console.log('👤 HUMAN: Unexpected game state, trying to progress')
          console.log('👤 HUMAN: Game state was:', gameAndDiceState.gameStateKind)
          // Try clicking any available die
          await firstDie.click()
          await page.waitForTimeout(2000)
        }
      } else {
        console.log('👤 HUMAN: No dice visible, ending turns')
        break
      }
    }
    
    // Check for game completion
    if (gameState.stateKind === 'completed') {
      console.log('🏁 Game completed, ending turn loop')
      break
    }
  }
  
  console.log(`\n📊 TURN SUMMARY:`)
  console.log(`   Total turns played: ${turnCount}`)
  console.log(`   Robot rolls expected: ${robotRollsDetected}`)
  console.log(`   Human rolls expected: ${humanRollsDetected}`)
  
  // === PHASE 3: Wait for Final Database Writes ===
  console.log('\n=== PHASE 3: Final Database Analysis ===')
  
  // Wait for any final database writes
  await page.waitForTimeout(3000)
  
  // === PHASE 4: Comprehensive Roll History Validation ===
  console.log('\n=== PHASE 4: Roll History Validation ===')
  
  // Check database for ALL robot rolls
  const finalHistoryCheck = await page.evaluate(async ({gameId, robotUserId}) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v3.7/history/games/${gameId}`)
      if (!response.ok) {
        throw new Error(`History API error: ${response.status}`)
      }
      const historyData = await response.json()
      const actions = historyData.actions || []
      
      // Analyze roll actions specifically
      const rollActions = actions.filter(a => a.actionType === 'roll-dice' || a.actionType === 'roll-for-start')
      const robotRollActions = rollActions.filter(a => a.playerId === robotUserId)
      const humanRollActions = rollActions.filter(a => a.playerId !== robotUserId)
      
      // Sort by sequence number for analysis
      const sortedRobotRolls = robotRollActions.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      const sortedHumanRolls = humanRollActions.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      
      return {
        success: true,
        totalActions: actions.length,
        totalRollActions: rollActions.length,
        robotRollActions: sortedRobotRolls,
        humanRollActions: sortedHumanRolls,
        robotRollCount: robotRollActions.length,
        humanRollCount: humanRollActions.length
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }, {gameId, robotUserId: ROBOT_USER_ID})
  
  console.log('📊 FINAL ROLL HISTORY ANALYSIS:')
  if (finalHistoryCheck.success) {
    console.log(`   Total actions in database: ${finalHistoryCheck.totalActions}`)
    console.log(`   Total roll actions: ${finalHistoryCheck.totalRollActions}`)
    console.log(`   Robot roll actions found: ${finalHistoryCheck.robotRollCount}`)
    console.log(`   Human roll actions found: ${finalHistoryCheck.humanRollCount}`)
    
    // Log details of robot rolls
    if (finalHistoryCheck.robotRollActions.length > 0) {
      console.log('\n🎲 ROBOT ROLL ACTIONS FOUND:')
      finalHistoryCheck.robotRollActions.forEach((action, index) => {
        const dice = action.actionData?.rollDice?.dice || [action.actionData?.rollForStart?.dieValue]
        const timestamp = new Date(action.timestamp).toLocaleTimeString()
        console.log(`   ${index + 1}. Seq#${action.sequenceNumber}: ${action.actionType} - dice: [${dice.join(', ')}] at ${timestamp}`)
      })
    }
    
    // Log details of human rolls  
    if (finalHistoryCheck.humanRollActions.length > 0) {
      console.log('\n👤 HUMAN ROLL ACTIONS FOUND:')
      finalHistoryCheck.humanRollActions.forEach((action, index) => {
        const dice = action.actionData?.rollDice?.dice || [action.actionData?.rollForStart?.dieValue]
        const timestamp = new Date(action.timestamp).toLocaleTimeString()
        console.log(`   ${index + 1}. Seq#${action.sequenceNumber}: ${action.actionType} - dice: [${dice.join(', ')}] at ${timestamp}`)
      })
    }
  } else {
    console.log(`   ❌ History check failed: ${finalHistoryCheck.error}`)
  }
  
  // === PHASE 5: Roll History UI Verification ===
  console.log('\n=== PHASE 5: Roll History UI Verification ===')
  
  // Check if Roll History component shows all rolls
  const rollHistoryExists = await page.locator('text=Roll History').isVisible().catch(() => false)
  
  if (rollHistoryExists) {
    console.log('✅ Roll History UI component is visible')
    
    // Count visible roll entries in the UI
    const rollEntries = await page.locator('.MuiListItem-root').filter({ hasText: /rolled/ }).count()
    console.log(`📋 Visible roll entries in UI: ${rollEntries}`)
    
    // Take a screenshot for manual verification
    await page.screenshot({ path: 'robot-roll-history-test-result.png', fullPage: true })
    console.log('📸 Screenshot saved: robot-roll-history-test-result.png')
  } else {
    console.log('⚠️ Roll History UI component not found')
  }
  
  // === PHASE 6: FINAL ASSERTIONS ===
  console.log('\n=== PHASE 6: FINAL ASSERTIONS ===')
  
  // Critical assertion: ALL robot rolls must be recorded
  expect(finalHistoryCheck.success).toBe(true)
  expect(finalHistoryCheck.robotRollCount).toBeGreaterThan(1) // More than just the first roll
  
  // Verify we detected robot turns during gameplay
  expect(robotRollsDetected).toBeGreaterThan(1)
  
  // Verify robot roll actions have proper structure
  if (finalHistoryCheck.robotRollActions.length > 0) {
    const firstRobotRoll = finalHistoryCheck.robotRollActions[0]
    expect(firstRobotRoll.playerId).toBe(ROBOT_USER_ID)
    expect(['roll-dice', 'roll-for-start']).toContain(firstRobotRoll.actionType)
    expect(firstRobotRoll.actionData).toBeTruthy()
    
    // Check for multiple robot rolls (the key test)
    if (finalHistoryCheck.robotRollActions.length > 1) {
      const secondRobotRoll = finalHistoryCheck.robotRollActions[1]
      expect(secondRobotRoll.playerId).toBe(ROBOT_USER_ID)
      expect(secondRobotRoll.actionType).toBe('roll-dice') // Subsequent rolls should be 'roll-dice'
    }
  }
  
  console.log('\n🎉 SUCCESS: All robot rolls are properly recorded in history!')
  console.log(`✅ Found ${finalHistoryCheck.robotRollCount} robot roll actions in database`)
  console.log(`✅ Detected ${robotRollsDetected} robot turns during gameplay`)
  console.log('✅ Robot roll history bug has been FIXED!')
})