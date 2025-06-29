const http = require('http')

// Game ID from the current game
const gameId = 'bd766bee-253f-40dd-8746-7d27ec5164db'

// First, get the current game
const getOptions = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/v1/games/${gameId}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
}

const getReq = http.request(getOptions, (res) => {
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    try {
      const game = JSON.parse(data)
      console.log('Current game state:', game.stateKind)
      console.log('Has activePlay:', !!game.activePlay)

      // Create a game update without activePlay to force re-initialization
      const gameUpdate = {
        ...game,
        activePlay: null, // Remove activePlay to force re-initialization
      }

      // Update the game
      const updateData = JSON.stringify(gameUpdate)
      const updateOptions = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/v1/games/${gameId}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(updateData),
        },
      }

      const updateReq = http.request(updateOptions, (updateRes) => {
        console.log(`Update Status: ${updateRes.statusCode}`)

        let updateResponseData = ''
        updateRes.on('data', (chunk) => {
          updateResponseData += chunk
        })

        updateRes.on('end', () => {
          console.log(
            'Game updated, now calling possible moves to trigger re-initialization...'
          )

          // Now call possible moves to trigger re-initialization
          const possibleMovesOptions = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/v1/games/${gameId}/possible-moves`,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }

          const possibleMovesReq = http.request(
            possibleMovesOptions,
            (possibleMovesRes) => {
              console.log(
                `Possible Moves Status: ${possibleMovesRes.statusCode}`
              )

              let possibleMovesData = ''
              possibleMovesRes.on('data', (chunk) => {
                possibleMovesData += chunk
              })

              possibleMovesRes.on('end', () => {
                console.log('Possible moves response received')

                // Check if activePlay was re-initialized
                const checkOptions = {
                  hostname: 'localhost',
                  port: 3000,
                  path: `/api/v1/games/${gameId}`,
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                }

                const checkReq = http.request(checkOptions, (checkRes) => {
                  let checkData = ''
                  checkRes.on('data', (chunk) => {
                    checkData += chunk
                  })

                  checkRes.on('end', () => {
                    try {
                      const updatedGame = JSON.parse(checkData)
                      console.log('=== FINAL CHECK ===')
                      console.log('Game State:', updatedGame.stateKind)
                      console.log('Has Active Play:', !!updatedGame.activePlay)
                      if (updatedGame.activePlay) {
                        console.log(
                          'Active Play ID:',
                          updatedGame.activePlay.id
                        )
                        console.log(
                          'Moves Type:',
                          typeof updatedGame.activePlay.moves
                        )
                        if (Array.isArray(updatedGame.activePlay.moves)) {
                          console.log(
                            'Moves Array Length:',
                            updatedGame.activePlay.moves.length
                          )
                        } else if (
                          updatedGame.activePlay.moves instanceof Set
                        ) {
                          console.log(
                            'Moves Set Size:',
                            updatedGame.activePlay.moves.size
                          )
                        } else {
                          console.log(
                            'Moves Object Keys:',
                            Object.keys(updatedGame.activePlay.moves)
                          )
                        }
                      }
                    } catch (e) {
                      console.error('Error parsing final check:', e)
                    }
                  })
                })

                checkReq.on('error', (e) => {
                  console.error(`Problem with final check: ${e.message}`)
                })

                checkReq.end()
              })
            }
          )

          possibleMovesReq.on('error', (e) => {
            console.error(`Problem with possible moves request: ${e.message}`)
          })

          possibleMovesReq.end()
        })
      })

      updateReq.on('error', (e) => {
        console.error(`Problem with update request: ${e.message}`)
      })

      updateReq.write(updateData)
      updateReq.end()
    } catch (e) {
      console.error('Error parsing game data:', e)
    }
  })
})

getReq.on('error', (e) => {
  console.error(`Problem with get request: ${e.message}`)
})

getReq.end()
