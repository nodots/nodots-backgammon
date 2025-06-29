const http = require('http')

const data = JSON.stringify({
  player1: { userId: '29ec9420-e628-4b0c-a56f-38b32d8dad10' },
  player2: { userId: 'cae217aa-44a5-40c2-bd5b-775c51c3b2bc' },
})

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/games',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
}

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`)

  let responseData = ''
  res.on('data', (chunk) => {
    responseData += chunk
  })

  res.on('end', () => {
    console.log('Response:', responseData)
  })
})

req.on('error', (error) => {
  console.error('Error:', error)
})

req.write(data)
req.end()
