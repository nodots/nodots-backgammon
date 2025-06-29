const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api/v1'
const GAME_ID = '04a8c4de-6176-43eb-bdc2-46d65b8a75d8'

// Helper function to get ASCII board representation
function getAsciiBoard(game) {
  try {
    const { Board } = require('./nodots-backgammon-core/dist/Board/index.js')
    return Board.getAsciiGameBoard(
      game.board,
      game.players,
      game.activeColor,
      game.stateKind
    )
  } catch (error) {
    console.error('Error getting ASCII board:', error)
    return `Game State: ${game.stateKind}\nActive Player: ${game.activeColor}\nBoard data available but ASCII conversion failed\n`
  }
}

async function showLastBoard() {
  try {
    console.log('🎯 Fetching last game state...')
    console.log(`   Game ID: ${GAME_ID}`)

    const response = await fetch(`${API_BASE}/games/${GAME_ID}`)

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`)

      if (response.status === 404) {
        console.log(
          "\n📝 Game may have been cleaned up. Here's the last known board state from the simulation:"
        )
        console.log('\n📋 LAST KNOWN BOARD STATE (After Move 1)')
        console.log('════════════════════════════════════════')
        console.log(
          'LEGEND: BLACK (X) [clockwise]  WHITE (O) [counterclockwise]'
        )
        console.log(' +-13-14-15-16-17-18--------19-20-21-22-23-24-+')
        console.log(' | X           O     |   |  O              X  |')
        console.log(' | X           O     |   |  O              X  |')
        console.log(' | X           O     |   |  O                 |')
        console.log(' | X                 |   |  O                 |')
        console.log(' | X                 |   |  O                 |')
        console.log('v|                   |BAR|                    |')
        console.log(' | O                 |   |                    |')
        console.log(' | O                 |   |  X                 |')
        console.log(' | O           X     |   |  X                 |')
        console.log(' | O           X     |   |  X              O  |')
        console.log(' | O           X     |   |  X  X           O  |')
        console.log(' +-12-11-10--9-8--7--------6--5--4--3--2--1--+')
        console.log('       BLACK BAR: 0          WHITE BAR: 0')
        console.log('       BLACK OFF: 0          WHITE OFF: 0')
        console.log('')
        console.log('GAME STATE: MOVING')
        console.log('ACTIVE PLAYER: BLACK (X) [clockwise]')
        console.log('DICE ROLL: [1, 6] (Total: 7)')
        console.log('')
        console.log('📊 GAME STATUS:')
        console.log(
          '   • Black player successfully moved one checker from point 6 → 5'
        )
        console.log('   • Used die value 1, still has die value 6 available')
        console.log(
          '   • Next move attempt failed with 400 error due to dice synchronization bug'
        )
        console.log(
          '   • Possible moves API showed stale moves for already-used die value 1'
        )
        return
      }

      const errorData = await response.text()
      console.error('Response:', errorData)
      return
    }

    const game = await response.json()

    console.log('\n📋 CURRENT BOARD STATE')
    console.log('═════════════════════')
    console.log(getAsciiBoard(game))
    console.log('═════════════════════')

    console.log('\n📊 GAME INFO:')
    console.log(`   State: ${game.stateKind}`)
    console.log(`   Active Player: ${game.activeColor}`)

    if (game.players) {
      game.players.forEach((player, idx) => {
        const dice = player.dice?.currentRoll || []
        console.log(
          `   Player ${idx + 1}: ${player.color} (${
            player.direction
          }) - Robot: ${player.isRobot}`
        )
        if (dice.length > 0) {
          console.log(`     Dice: [${dice.join(', ')}]`)
        }
      })
    }

    if (game.activePlay) {
      console.log(`   Active Play: ${game.activePlay.moves?.length || 0} moves`)
      if (game.activePlay.moves) {
        game.activePlay.moves.forEach((move, idx) => {
          console.log(
            `     Move ${idx + 1}: die ${move.dieValue}, state: ${
              move.stateKind
            }`
          )
        })
      }
    }
  } catch (error) {
    console.error('❌ Error fetching game:', error.message)
  }
}

// Run the script
if (require.main === module) {
  showLastBoard()
}

module.exports = { showLastBoard }
