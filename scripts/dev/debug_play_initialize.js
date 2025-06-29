const { Play } = require('./nodots-backgammon-core/dist/Play/index.js')
const { Board } = require('./nodots-backgammon-core/dist/Board')

// Test Play.initialize directly
console.log('=== TESTING Play.initialize ===')

// Create a test board and player
const board = Board.initialize()
const testPlayer = {
  id: 'test-player',
  color: 'black',
  direction: 'counterclockwise',
  stateKind: 'rolled',
  dice: {
    stateKind: 'rolled',
    currentRoll: [2, 4],
  },
}

console.log('Board initialized:', !!board)
console.log('Test player:', testPlayer)

try {
  const activePlay = Play.initialize(board, testPlayer)
  console.log('Play.initialize result:', {
    playId: activePlay.id,
    movesCount: activePlay.moves ? activePlay.moves.size : 'undefined',
    moves: activePlay.moves
      ? Array.from(activePlay.moves).map((m) => ({
          id: m.id,
          dieValue: m.dieValue,
          stateKind: m.stateKind,
          possibleMovesCount: m.possibleMoves ? m.possibleMoves.length : 0,
        }))
      : 'undefined',
  })
} catch (error) {
  console.error('Error in Play.initialize:', error)
}
