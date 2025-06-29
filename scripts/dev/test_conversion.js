const { Play } = require('./nodots-backgammon-core/dist/Play/index.js')
const { Board } = require('./nodots-backgammon-core/dist/Board')

// Test the conversion logic
console.log('=== TESTING CONVERSION LOGIC ===')

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
  // Create activePlay using Play.initialize
  const activePlay = Play.initialize(board, testPlayer)
  console.log('Original activePlay:', {
    playId: activePlay.id,
    movesCount: activePlay.moves ? activePlay.moves.size : 'undefined',
    movesType: activePlay.moves ? typeof activePlay.moves : 'undefined',
    movesKeys: activePlay.moves ? Object.keys(activePlay.moves) : 'undefined',
    movesValue: activePlay.moves,
  })

  // Test JSON serialization (like saveGame)
  const serialized = JSON.parse(JSON.stringify(activePlay))
  console.log('After JSON serialization:', {
    playId: serialized.id,
    movesCount: serialized.moves ? serialized.moves.length : 'undefined',
    movesType: typeof serialized.moves,
    isArray: Array.isArray(serialized.moves),
    movesKeys: serialized.moves ? Object.keys(serialized.moves) : 'undefined',
    movesValue: serialized.moves,
  })

  // Test conversion back to Set (like getGame)
  if (serialized.moves && Array.isArray(serialized.moves)) {
    const converted = {
      ...serialized,
      moves: new Set(serialized.moves),
    }
    console.log('After conversion back to Set:', {
      playId: converted.id,
      movesCount: converted.moves ? converted.moves.size : 'undefined',
      movesType: typeof converted.moves,
      isSet: converted.moves instanceof Set,
    })
  }
} catch (error) {
  console.error('Error in conversion test:', error)
}
