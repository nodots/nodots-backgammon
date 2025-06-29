const http = require('http')
const { Board } = require('./nodots-backgammon-core/dist/Board')

const gameId = 'ed5eeef7-fd43-4d64-91a7-b564ebc965f5'

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/v1/games/${gameId}`,
  method: 'GET',
}

const req = http.request(options, (res) => {
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    try {
      const game = JSON.parse(data)
      console.log('=== CURRENT GAME STATE ===')
      console.log('Game ID:', game.id)
      console.log('Game state:', game.stateKind)
      console.log('Active player:', game.activePlayer.color)
      console.log('Active player direction:', game.activePlayer.direction)

      // Display dice information
      if (
        game.activePlayer.dice &&
        game.activePlayer.dice.stateKind === 'rolled'
      ) {
        console.log('🎲 DICE ROLLED:')
        console.log('  Values:', game.activePlayer.dice.currentRoll)
        console.log('  Total:', game.activePlayer.dice.total)
        console.log(
          '  Is Double:',
          game.activePlayer.dice.currentRoll[0] ===
            game.activePlayer.dice.currentRoll[1]
        )
      }

      console.log('\n=== ASCII BOARD ===')
      // Display ASCII board
      const asciiBoard = Board.getAsciiGameBoard(
        game.board,
        game.players,
        game.activeColor,
        game.stateKind
      )
      console.log(asciiBoard)
    } catch (e) {
      console.log('Raw response:', data)
    }
  })
})

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`)
})

req.end()
