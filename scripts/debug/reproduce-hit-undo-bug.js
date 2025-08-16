// Test script to reproduce the hit checker undo bug
const { Game } = require('./packages/core/dist/Game/index.js')
const { Board } = require('./packages/core/dist/Board/index.js')

console.log('\n🔍 REPRODUCING HIT CHECKER UNDO BUG')
console.log('=' .repeat(50))

// Create a new game
let game = Game.createNewGame(
  'player1',
  'player2', 
  true, // auto roll for start
  false, // player1 is not robot
  false, // player2 is not robot
  {
    blackDirection: 'clockwise',
    whiteDirection: 'counterclockwise', 
    blackFirst: true
  }
)

// Advance to moving state
if (game.stateKind === 'rolled-for-start') {
  game = Game.roll(game)
}

console.log('\n📋 INITIAL BOARD STATE:')
Board.displayAsciiBoard(game.board)

console.log(`\n🎲 Active Player: ${game.activePlayer.color}`)
console.log(`🎲 Dice: [${game.activePlayer.dice?.currentRoll?.join(', ')}]`)

// Set up a specific scenario where we can create a hit based on the dice values
const modifiedBoard = JSON.parse(JSON.stringify(game.board))
const diceValues = game.activePlayer.dice?.currentRoll || [2, 5]

console.log(`Setting up board for hit with dice: [${diceValues.join(', ')}]`)

// For dice [2,5], we can create hits by placing opponent checkers at the right distances
// Let's put a black checker on a starting point and a white checker where it can be hit

// Clear point 24 and put black checker there 
const point24 = modifiedBoard.points.find(p => p.position.clockwise === 24)
if (point24) {
  point24.checkers = [{
    id: 'moving-checker-24',
    color: 'black',
    checkercontainerId: point24.id
  }]
}

// Put a single white checker on point 22 (24-2=22) so black can hit with a 2
const point22 = modifiedBoard.points.find(p => p.position.clockwise === 22)  
if (point22) {
  point22.checkers = [{
    id: 'target-checker-22',
    color: 'white',
    checkercontainerId: point22.id
  }]
}

// Put a single white checker on point 19 (24-5=19) so black can hit with a 5
const point19 = modifiedBoard.points.find(p => p.position.clockwise === 19)
if (point19) {
  point19.checkers = [{
    id: 'target-checker-19', 
    color: 'white',
    checkercontainerId: point19.id
  }]
}

// Update the game with our modified board
const gameWithSetupBoard = {
  ...game,
  board: modifiedBoard
}

console.log('\n📋 MODIFIED BOARD STATE (Setup for Hit):')
Board.displayAsciiBoard(gameWithSetupBoard.board)

// Prepare the game for moving
const preparedGame = Game.prepareMove(gameWithSetupBoard)
const movingGame = Game.toMoving(preparedGame)

console.log('\n📍 GETTING AVAILABLE MOVES...')
const possibleMovesResult = Game.getPossibleMoves(movingGame)
if (!possibleMovesResult.success) {
  console.log('❌ Failed to get possible moves')
  process.exit(1)
}

console.log(`Found ${possibleMovesResult.possibleMoves?.length || 0} possible moves`)
possibleMovesResult.possibleMoves?.forEach((move, i) => {
  console.log(`  ${i+1}. ${move.origin.kind}:${move.origin.id} -> ${move.destination.kind}:${move.destination.id} (hit: ${move.isHit})`)
})

// Find a move that results in a hit
const hitMove = possibleMovesResult.possibleMoves?.find(move => move.isHit)
if (!hitMove) {
  console.log('❌ No hitting moves available - cannot test hit undo bug')
  process.exit(0)
}

console.log(`\n📍 EXECUTING HITTING MOVE: ${hitMove.origin.kind}:${hitMove.origin.id} -> ${hitMove.destination.kind}:${hitMove.destination.id}`)

// Use the updated game from getPossibleMoves and execute the hitting move
const gameAfterHit = Game.executeAndRecalculate(possibleMovesResult.updatedGame, hitMove.origin.id)

console.log('\n📋 BOARD STATE AFTER HIT MOVE:')
Board.displayAsciiBoard(gameAfterHit.board)

// Check if the white checker is on the bar
const whiteBar = gameAfterHit.board.bar.counterclockwise // white goes counterclockwise
console.log(`\n🏴 White checkers on bar: ${whiteBar.checkers.length}`)
if (whiteBar.checkers.length > 0) {
  console.log(`   Hit checker ID: ${whiteBar.checkers[whiteBar.checkers.length - 1].id}`)
}

// Now try to undo the move
console.log('\n📍 ATTEMPTING TO UNDO THE HIT MOVE...')
const undoResult = Game.undoLastMove(gameAfterHit)

if (!undoResult.success) {
  console.log(`❌ Undo failed: ${undoResult.error}`)
  process.exit(1)
}

console.log('✅ Undo successful!')
const gameAfterUndo = undoResult.game

console.log('\n📋 BOARD STATE AFTER UNDO:')
Board.displayAsciiBoard(gameAfterUndo.board)

// Check if the white checker is back on point 5
const point5AfterUndo = gameAfterUndo.board.points.find(p => p.position.clockwise === 5)
const whiteBarAfterUndo = gameAfterUndo.board.bar.counterclockwise

console.log('\n🔍 VERIFICATION:')
console.log(`   Point 5 checkers: ${point5AfterUndo?.checkers.length || 0}`)
if (point5AfterUndo?.checkers.length > 0) {
  console.log(`   Point 5 checker color: ${point5AfterUndo.checkers[0].color}`)
  console.log(`   Point 5 checker ID: ${point5AfterUndo.checkers[0].id}`)
}
console.log(`   White bar checkers: ${whiteBarAfterUndo.checkers.length}`)

// Check if bug is present
if (whiteBarAfterUndo.checkers.length > 0 && (!point5AfterUndo?.checkers.length || point5AfterUndo.checkers[0].color !== 'white')) {
  console.log('\n❌ BUG CONFIRMED: Hit checker remained on bar instead of returning to original position!')
  process.exit(1)
} else {
  console.log('\n✅ NO BUG: Hit checker correctly returned to original position!')
}