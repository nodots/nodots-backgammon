import { Router } from 'express'

const router = Router()

// Device flow initiation for CLI
router.post('/device', async (req, res) => {
  try {
    // This would integrate with Auth0 device flow
    // For now, return a mock response for CLI compatibility
    res.json({
      device_code: 'mock_device_code',
      user_code: 'ABCD-EFGH',
      verification_uri: `https://${process.env.AUTH0_DOMAIN}/activate`,
      verification_uri_complete: `https://${process.env.AUTH0_DOMAIN}/activate?user_code=ABCD-EFGH`,
      expires_in: 600,
      interval: 5
    })
  } catch (error) {
    console.error('Device flow error:', error)
    res.status(500).json({ error: 'Device flow initiation failed' })
  }
})

// Token exchange for device flow
router.post('/token', async (req, res) => {
  try {
    const { device_code, grant_type } = req.body

    if (grant_type !== 'urn:ietf:params:oauth:grant-type:device_code') {
      return res.status(400).json({ error: 'invalid_grant' })
    }

    // Mock token response for development
    // In production, this would validate with Auth0
    res.json({
      access_token: 'mock_jwt_token_for_development',
      token_type: 'Bearer',
      expires_in: 86400,
      scope: 'read:games write:games'
    })
  } catch (error) {
    console.error('Token exchange error:', error)
    res.status(500).json({ error: 'Token exchange failed' })
  }
})

// User profile endpoint
router.get('/profile', (req, res) => {
  res.json({
    sub: 'f25eaccd-1b88-4606-a8a3-bd95d604ecfa',
    email: 'kenr@nodots.com',
    name: 'Ken Riley',
    picture: 'https://example.com/avatar.jpg'
  })
})

export default router