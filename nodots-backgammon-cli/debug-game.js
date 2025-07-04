const axios = require('axios')

const GAME_ID = '7653ef37-d462-42d5-8fcf-a5d3adcdfe52'
const API_URL = process.env.NODOTS_API_URL || 'http://localhost:3000'

async function debugGame() {
  try {
    console.log(`Fetching game state for: ${GAME_ID}`)

    const response = await axios.get(`${API_URL}/api/v1/games/${GAME_ID}`)
    const game = response.data

    console.log('\n=== Raw Game Data ===')
    console.log(JSON.stringify(game, null, 2))
  } catch (error) {
    console.error('Error fetching game:', error.response?.data || error.message)
  }
}

debugGame()
