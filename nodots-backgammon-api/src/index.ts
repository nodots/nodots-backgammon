import express from 'express'
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

// Security middleware
app.use(helmet())
app.use(compression())

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://backgammon.nodots.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
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

// Authentication routes (no auth middleware)
app.use('/api/v1/auth', authRouter)

// Protected routes
app.use('/api/v1/games', authMiddleware, gamesRouter)

// Error handling
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 Nodots Backgammon API server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`)
  console.log(`🎮 Environment: ${process.env.NODE_ENV || 'development'}`)
})