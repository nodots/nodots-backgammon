const http = require('http')
const { Board } = require('./nodots-backgammon-core/dist/Board')

// Game ID from the most recent game
const gameId = 'bd766bee-253f-40dd-8746-7d27ec5164db'

// First, let's get the current game state to find black checkers
const getGameOptions = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/v1/games/${gameId}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
}

const getGameReq = http.request(getGameOptions, (res) => {
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    try {
      const gameData = JSON.parse(data)
      console.log('=== CURRENT GAME STATE ===')
      console.log('Game State:', gameData.stateKind)
      console.log('Active Color:', gameData.activeColor)

      // Find all black checkers
      const blackCheckers = []
      gameData.board.BackgammonPoints.forEach((point) => {
        point.checkers.forEach((checker) => {
          if (checker.color === 'black') {
            blackCheckers.push({
              id: checker.id,
              position: point.position.counterclockwise, // Black's perspective
              pointId: point.id,
            })
          }
        })
      })

      console.log('\n=== BLACK CHECKERS ===')
      blackCheckers.forEach((checker, index) => {
        console.log(
          `Checker ${index + 1}: ID = ${checker.id}, Position = ${
            checker.position
          }`
        )
      })

      // Find checkers that can be moved with dice values 2 and 4
      const diceValues = [2, 4]
      const movableCheckers = []

      blackCheckers.forEach((checker) => {
        diceValues.forEach((dieValue) => {
          const destination = checker.position + dieValue
          if (destination <= 24) {
            movableCheckers.push({
              checkerId: checker.id,
              origin: checker.position,
              destination: destination,
              dieValue: dieValue,
            })
          }
        })
      })

      console.log('\n=== POSSIBLE MOVES ===')
      movableCheckers.forEach((move, index) => {
        console.log(
          `Move ${index + 1}: Checker from ${move.origin} to ${
            move.destination
          } (using die ${move.dieValue})`
        )
      })

      if (movableCheckers.length > 0) {
        // Try the first possible move
        const firstMove = movableCheckers[0]
        console.log(
          `\nAttempting move: Checker from ${firstMove.origin} to ${firstMove.destination} (using die ${firstMove.dieValue})`
        )
        makeMove(firstMove.checkerId)
      } else {
        console.log('No valid moves found for black checkers')
      }
    } catch (e) {
      console.error('Error parsing game data:', e)
      console.log('Raw response:', data)
    }
  })
})

getGameReq.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`)
})

getGameReq.end()

function makeMove(checkerId) {
  const postData = JSON.stringify({
    checkerId: checkerId,
    playerId: '9a13377c-5c54-46fc-b6ef-325b0da41a39', // Black player ID
  })

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/games/${gameId}/move`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  }

  const req = http.request(options, (res) => {
    console.log(`Move Status: ${res.statusCode}`)

    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      console.log('Move response:', data)
      try {
        const moveResult = JSON.parse(data)

        if (moveResult.possibleMoves && moveResult.possibleMoves.length > 0) {
          console.log('\n=== POSSIBLE MOVES ===')
          moveResult.possibleMoves.forEach((move, index) => {
            console.log(`Move ${index + 1}:`)
            console.log(`  Die Value: ${move.dieValue}`)
            console.log(`  Direction: ${move.direction}`)
            console.log(`  Origin: ${move.origin}`)
            console.log(`  Destination: ${move.destination}`)
          })
        } else if (moveResult.id) {
          // Single move was executed
          console.log('\n=== MOVE EXECUTED ===')
          console.log('Game State:', moveResult.stateKind)
          console.log('Active Color:', moveResult.activeColor)

          // Display ASCII board
          const asciiBoard = Board.getAsciiGameBoard(
            moveResult.board,
            moveResult.players,
            moveResult.activeColor,
            moveResult.stateKind
          )
          console.log(asciiBoard)
        }
      } catch (e) {
        console.error('Error parsing move result:', e)
        console.log('Raw response:', data)
      }
    })
  })

  req.on('error', (e) => {
    console.error(`Problem with move request: ${e.message}`)
  })

  req.write(postData)
  req.end()
}
