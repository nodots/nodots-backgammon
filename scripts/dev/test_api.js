const fetch = require('node-fetch')

async function testGameCreation() {
  try {
    console.log('Testing game creation...')

    const response = await fetch('http://localhost:3000/api/v1/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player1: '29ec9420-e628-4b0c-a56f-38b32d8dad10',
        player2: 'cae217aa-44a5-40c2-bd5b-775c51c3b2bc',
      }),
    })

    const result = await response.text()
    console.log('Response status:', response.status)
    console.log('Response body:', result)

    if (response.status === 201) {
      console.log('✅ Game created successfully!')
    } else {
      console.log('❌ Game creation failed')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testGameCreation()
