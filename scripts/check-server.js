const fetch = require('node-fetch')

async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/v1/health', {
      timeout: 5000,
    })
    if (response.ok) {
      console.log('✅ Server is running')
      return true
    } else {
      console.log('❌ Server returned error:', response.status)
      return false
    }
  } catch (error) {
    console.log('❌ Server connection failed:', error.code)
    return false
  }
}

if (require.main === module) {
  checkServer()
}

module.exports = { checkServer }
