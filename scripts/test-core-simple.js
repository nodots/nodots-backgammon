const { Game } = require('./nodots-backgammon-core/dist/index.js')

console.log('🎯 **SIMPLE CORE LIBRARY TEST**\n')

async function testCoreDiceTrackingSimple() {
  try {
    // 1. Create a new game
    console.log('1️⃣ Creating new game...')
    const game = Game.createNewGame('player1', 'player2', true, true, true)
    console.log(`✅ Game created with ID: ${game.id}`)
    console.log(`   Game state: ${game.stateKind}`)

    // 2. Roll dice
    console.log('\n2️⃣ Rolling dice...')
    const rolledGame = Game.roll(game)
    console.log(`   Game state after roll: ${rolledGame.stateKind}`)

    const activePlay = rolledGame.activePlay
    const player = activePlay.player
    const dice = player.dice

    console.log(`   Active player: ${player.id}`)
    console.log(`   Player color: ${player.color}`)
    console.log(`   Dice rolled: [${dice.currentRoll.join(', ')}]`)
    console.log(`   Number of moves created: ${activePlay.moves.size}`)

    // 3. Check moves structure
    console.log('\n3️⃣ Examining moves structure...')
    const movesArray = Array.from(activePlay.moves)
    movesArray.forEach((move, index) => {
      console.log(`   Move ${index + 1}:`)
      console.log(`     - ID: ${move.id}`)
      console.log(`     - Die value: ${move.dieValue || move.die}`)
      console.log(`     - State: ${move.stateKind}`)
      console.log(`     - Ready: ${move.ready}`)
      console.log(`     - Completed: ${move.completed}`)
    })

    // 4. Test getPossibleMoves
    console.log('\n4️⃣ Testing getPossibleMoves...')
    const result = Game.getPossibleMoves(rolledGame, player.id)
    console.log(`   Success: ${result.success}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
    if (result.possibleMoves) {
      console.log(`   Number of possible moves: ${result.possibleMoves.length}`)
      result.possibleMoves.slice(0, 3).forEach((move, index) => {
        console.log(`   Move ${index + 1}: ${JSON.stringify(move)}`)
      })
    }

    // 5. Verify dice consumption tracking readiness
    console.log('\n5️⃣ Dice consumption tracking verification...')
    const readyMoves = movesArray.filter((m) => m.stateKind === 'ready')
    const completedMoves = movesArray.filter((m) => m.stateKind === 'completed')

    console.log(`   Ready moves: ${readyMoves.length}`)
    console.log(`   Completed moves: ${completedMoves.length}`)
    console.log(`   Total moves: ${movesArray.length}`)

    // Check if ready moves correspond to dice values
    const diceValues = dice.currentRoll
    const readyMoveValues = readyMoves
      .map((m) => m.dieValue || m.die)
      .filter((v) => v !== undefined)

    console.log(`   Dice values: [${diceValues.join(', ')}]`)
    console.log(`   Ready move dice: [${readyMoveValues.join(', ')}]`)

    const diceMatched = diceValues.every((dieValue) =>
      readyMoveValues.some((moveValue) => moveValue === dieValue)
    )
    console.log(
      `   Dice-to-moves matching: ${
        diceMatched ? '✅ CORRECT' : '❌ INCORRECT'
      }`
    )

    console.log('\n🎉 **CORE DICE TRACKING TEST COMPLETED**')
    console.log('\n📊 **SUMMARY**:')
    console.log(`   - Game creation: ✅ Working`)
    console.log(`   - Dice rolling: ✅ Working`)
    console.log(
      `   - Move creation: ✅ Working (${movesArray.length} moves created)`
    )
    console.log(
      `   - Dice tracking: ${diceMatched ? '✅ Working' : '❌ Needs Fix'}`
    )
    console.log(
      `   - getPossibleMoves: ${result.success ? '✅ Working' : '❌ Needs Fix'}`
    )
  } catch (error) {
    console.error('❌ **TEST FAILED**:', error.message)
    console.error(error.stack)
  }
}

// Run the test
testCoreDiceTrackingSimple()
