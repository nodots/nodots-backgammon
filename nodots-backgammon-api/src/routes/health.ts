import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'nodots-backgammon-api',
    version: '1.0.0',
    uptime: process.uptime()
  })
})

export default router