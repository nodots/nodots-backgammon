const {
  Game,
  Play,
  Board,
  Player,
  Dice,
} = require('./nodots-backgammon-core/dist/index.js')

console.log('🧪 **TESTING CORE LIBRARY DICE TRACKING**\n')

// Test the core library directly
async function testCoreDiceTracking() {
  try {
    // 1. Create a new game
    console.log('1️⃣ Creating new game...')
    const game = Game.createNewGame('player1', 'player2', true, true, true)
    console.log(`✅ Game created with ID: ${game.id}`)

    // 2. Set up players
    console.log('\n2️⃣ Setting up players...')
    const player1 = game.players.find((p) => p.direction === 'clockwise')
    const player2 = game.players.find((p) => p.direction === 'counterclockwise')

    console.log(`   Player 1 (${player1.direction}): ${player1.id}`)
    console.log(`   Player 2 (${player2.direction}): ${player2.id}`)

    // 3. Roll dice for player1
    console.log('\n3️⃣ Rolling dice for player 1...')
    console.log('   Game state before roll:', game.stateKind)
    const rolledGame = Game.roll(game)
    console.log('   Game state after roll:', rolledGame.stateKind)

    const activePlay = rolledGame.activePlay
    console.log('   ActivePlay:', activePlay ? 'exists' : 'undefined')
    if (activePlay) {
      console.log('   ActivePlay properties:', Object.keys(activePlay))
      console.log(
        '   ActivePlay.player:',
        activePlay.player ? 'exists' : 'undefined'
      )
      if (activePlay.player) {
        console.log('   Player properties:', Object.keys(activePlay.player))
        console.log(`   Active player ID: ${activePlay.player.id}`)
        console.log(
          '   Active player dice type:',
          typeof activePlay.player.dice
        )
        console.log('   Active player dice:', activePlay.player.dice)
        if (Array.isArray(activePlay.player.dice)) {
          console.log(
            `   Dice values: [${activePlay.player.dice
              .map((d) => d.value)
              .join(', ')}]`
          )
        } else if (activePlay.player.dice) {
          console.log('   Dice object:', activePlay.player.dice)
        }
      }
      console.log('   ActivePlay.dice type:', typeof activePlay.dice)
      console.log('   ActivePlay.dice:', activePlay.dice)
      if (Array.isArray(activePlay.dice)) {
        console.log(
          `   ActivePlay dice values: [${activePlay.dice
            .map((d) => d.value)
            .join(', ')}]`
        )
      } else if (activePlay.dice) {
        console.log('   ActivePlay dice object:', activePlay.dice)
      }
      console.log(
        `   Number of moves: ${
          activePlay.moves ? activePlay.moves.size : 'no moves'
        }`
      )
    } else {
      console.log('   ❌ ActivePlay is undefined!')
      console.log('   Available properties:', Object.keys(rolledGame))
      return
    }

    // 4. Get possible moves using new core method
    console.log('\n4️⃣ Getting possible moves from core...')
    const possibleMovesResult1 = Game.getPossibleMoves(
      rolledGame,
      activePlay.playerId
    )
    console.log(`   Success: ${possibleMovesResult1.success}`)

    if (!possibleMovesResult1.success) {
      console.log(`   Error: ${possibleMovesResult1.error}`)
      return
    }

    const possibleMoves1 = possibleMovesResult1.possibleMoves || []
    console.log(`   Found ${possibleMoves1.length} possible moves`)

    // Show a few possible moves
    possibleMoves1.slice(0, 5).forEach((move, index) => {
      console.log(
        `   Move ${index + 1}: ${move.from} → ${move.to} (die: ${move.die})`
      )
    })

    // 5. Make the first move
    console.log('\n5️⃣ Making first move...')
    if (possibleMoves1.length === 0) {
      console.log('   ❌ No moves available!')
      return
    }
    const firstMove = possibleMoves1[0]

    console.log(
      `   Selected move: ${firstMove.from} → ${firstMove.to} (die: ${firstMove.die})`
    )
    console.log(`   Moves before: ${activePlay.moves.size}`)

    // Execute the move
    const moveResult = activePlay.move(firstMove)
    console.log(`   Move result: ${moveResult}`)
    console.log(`   Moves after: ${activePlay.moves.size}`)

    // Show current moves state
    console.log('\n   Current moves state:')
    const movesArray = Array.from(activePlay.moves)
    movesArray.forEach((move, index) => {
      console.log(
        `     Move ${index + 1}: die=${move.die}, ready=${
          move.ready
        }, completed=${move.completed}`
      )
    })

    // 6. Get possible moves again (this is where the bug was)
    console.log('\n6️⃣ Getting possible moves after first move...')
    const possibleMovesResult2 = Game.getPossibleMoves(
      rolledGame,
      activePlay.playerId
    )
    console.log(`   Success: ${possibleMovesResult2.success}`)

    if (!possibleMovesResult2.success) {
      console.log(`   Error: ${possibleMovesResult2.error}`)
      return
    }

    const possibleMoves2 = possibleMovesResult2.possibleMoves || []
    console.log(`   Found ${possibleMoves2.length} possible moves`)

    if (possibleMoves2.length > 0) {
      console.log('   ✅ SUCCESS: Possible moves found after first move')

      // Show available dice
      const availableDice = movesArray
        .filter((m) => m.ready && !m.completed)
        .map((m) => m.die)
      console.log(`   Available dice: [${availableDice.join(', ')}]`)

      // Show a few possible moves
      possibleMoves2.slice(0, 5).forEach((move, index) => {
        console.log(
          `   Move ${index + 1}: ${move.from} → ${move.to} (die: ${move.die})`
        )
      })
    } else {
      console.log('   ❌ ERROR: No possible moves found after first move')
    }

    // 7. Make second move if available
    if (possibleMoves2.length > 0) {
      console.log('\n7️⃣ Making second move...')
      const secondMove = possibleMoves2[0]

      console.log(
        `   Selected move: ${secondMove.from} → ${secondMove.to} (die: ${secondMove.die})`
      )
      console.log(`   Moves before: ${activePlay.moves.size}`)

      const moveResult2 = activePlay.move(secondMove)
      console.log(`   Move result: ${moveResult2}`)
      console.log(`   Moves after: ${activePlay.moves.size}`)

      // Final moves state
      console.log('\n   Final moves state:')
      const finalMovesArray = Array.from(activePlay.moves)
      finalMovesArray.forEach((move, index) => {
        console.log(
          `     Move ${index + 1}: die=${move.die}, ready=${
            move.ready
          }, completed=${move.completed}`
        )
      })

      // Check if turn is complete
      const readyMoves = finalMovesArray.filter((m) => m.ready && !m.completed)
      console.log(`\n   Ready moves remaining: ${readyMoves.length}`)

      if (readyMoves.length === 0) {
        console.log('   ✅ Turn completed - all dice consumed')
      } else {
        console.log('   ⚠️  Turn not complete - dice remaining')
      }
    }

    console.log('\n🎉 **CORE LIBRARY TEST COMPLETED**')
  } catch (error) {
    console.error('❌ **TEST FAILED**:', error.message)
    console.error(error.stack)
  }
}

// Run the test
testCoreDiceTracking()
