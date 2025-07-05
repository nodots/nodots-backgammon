import express from 'express'
import https from 'https'
import fs from 'fs'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { authMiddleware } from './middleware/auth'
import { errorHandler } from './middleware/errorHandler'
import gamesRouter from './routes/games'
import authRouter from './routes/auth'
import healthRouter from './routes/health'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const HTTPS_PORT = process.env.HTTPS_PORT || 3443

// Security middleware
app.use(helmet())
app.use(compression())

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://backgammon.nodots.com'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'https://localhost:3443'],
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP'
})
app.use('/api', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check (no auth required)
app.use('/api/v1/health', healthRouter)
app.use('/api/v3.2/health', healthRouter)

// Authentication routes (no auth middleware)
app.use('/api/v1/auth', authRouter)
app.use('/api/v3.2/auth', authRouter)

// Protected routes - support both v1 and v3.2
app.use('/api/v1/games', authMiddleware, gamesRouter)
app.use('/api/v3.2/games', authMiddleware, gamesRouter)

// Error handling
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Start HTTP server
app.listen(PORT, () => {
  console.log(`🚀 Nodots Backgammon API server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`)
  console.log(`🎮 Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Start HTTPS server with certificate files
try {
  const certificatesPath = process.env.CERTIFICATES_PATH || './certificates'
  
  if (fs.existsSync(`${certificatesPath}/key.pem`) && fs.existsSync(`${certificatesPath}/cert.pem`)) {
    const httpsOptions = {
      key: fs.readFileSync(`${certificatesPath}/key.pem`),
      cert: fs.readFileSync(`${certificatesPath}/cert.pem`)
    }

    const httpsServer = https.createServer(httpsOptions, app)
    
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS server running on port ${HTTPS_PORT}`)
      console.log(`📊 HTTPS Health check: https://localhost:${HTTPS_PORT}/api/v3.2/health`)
      console.log(`🎮 CLI API URL: https://localhost:${HTTPS_PORT}`)
    })
  } else {
    console.log(`📋 Certificate files not found at ${certificatesPath}`)
    console.log(`🔒 HTTPS server not started - using HTTP only`)
    console.log(`💡 To enable HTTPS, place key.pem and cert.pem in ${certificatesPath}`)
  }
} catch (httpsError) {
  console.error('❌ Failed to start HTTPS server:', httpsError)
  console.log('📋 HTTPS server not available, using HTTP only')
}