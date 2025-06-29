const http = require('http')

const gameId = '9684dd41-7702-4518-bd46-91baa1364ce7'

async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = ''
      res.on('data', (chunk) => {
        responseData += chunk
      })
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData)
          resolve({ status: res.statusCode, data: parsedData })
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (data) {
      req.write(data)
    }
    req.end()
  })
}

async function testMoveChecker() {
  try {
    console.log('=== GETTING CURRENT GAME STATE ===')

    // First, get the current game state to see available checkers
    const gameOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/games/${gameId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const gameResponse = await makeRequest(gameOptions)

    if (gameResponse.status !== 200) {
      console.log('❌ Failed to get game:', gameResponse.data)
      return
    }

    const game = gameResponse.data
    console.log('\nCurrent game state:')
    if (game.asciiBoard) {
      console.log(game.asciiBoard)
    }

    // Find a white checker to move (white is the active player)
    const activeColor = game.activeColor
    console.log(`\nActive player: ${activeColor}`)

    // Look for white checkers on the board
    let targetChecker = null

    // Check point 24 (clockwise) for white checkers
    const points = game.board.BackgammonPoints
    for (const point of points) {
      if (point.position.clockwise === 24 && point.checkers.length > 0) {
        const whiteChecker = point.checkers.find((c) => c.color === 'white')
        if (whiteChecker) {
          targetChecker = whiteChecker
          console.log(`\nFound white checker on point 24: ${whiteChecker.id}`)
          break
        }
      }
    }

    if (!targetChecker) {
      // Try point 13 if no checker on 24
      for (const point of points) {
        if (point.position.clockwise === 13 && point.checkers.length > 0) {
          const whiteChecker = point.checkers.find((c) => c.color === 'white')
          if (whiteChecker) {
            targetChecker = whiteChecker
            console.log(`\nFound white checker on point 13: ${whiteChecker.id}`)
            break
          }
        }
      }
    }

    if (!targetChecker) {
      console.log('❌ No white checker found to move')
      return
    }

    console.log('\n=== ATTEMPTING TO MOVE CHECKER ===')
    console.log(`Moving checker: ${targetChecker.id}`)

    // Attempt to move the checker
    const moveOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/games/${gameId}/move`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const moveData = JSON.stringify({
      checkerId: targetChecker.id,
      playerId: game.players.find((p) => p.color === activeColor)?.id,
    })

    const moveResponse = await makeRequest(moveOptions, moveData)

    console.log(`\nMove response status: ${moveResponse.status}`)

    if (moveResponse.status === 200) {
      console.log('✅ Move successful!')
      if (moveResponse.data.asciiBoard) {
        console.log('\nBoard after move:')
        console.log(moveResponse.data.asciiBoard)
      }
    } else {
      console.log('❌ Move failed or multiple moves possible:')
      if (moveResponse.data.message) {
        console.log('Message:', moveResponse.data.message)
      }
      if (moveResponse.data.possibleMoves) {
        console.log(
          `Found ${moveResponse.data.possibleMoves.length} possible moves:`
        )
        moveResponse.data.possibleMoves.forEach((move, index) => {
          console.log(`  ${index + 1}. Die ${move.dieValue}: ${move.moveKind}`)
        })
      }
      if (moveResponse.data.error) {
        console.log('Error:', moveResponse.data.error)
      }
      if (moveResponse.data.game && moveResponse.data.game.asciiBoard) {
        console.log('\nCurrent board:')
        console.log(moveResponse.data.game.asciiBoard)
      }
    }
  } catch (error) {
    console.error('Error during test:', error)
  }
}

console.log('🎲 Testing checker move based on dice roll...\n')
testMoveChecker()
