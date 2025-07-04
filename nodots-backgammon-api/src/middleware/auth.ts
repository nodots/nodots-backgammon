import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-client'

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string
    email?: string
    name?: string
    [key: string]: any
  }
}

// Auth0 JWKS client
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  requestHeaders: {},
  timeout: 30000,
})

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err)
    }
    const signingKey = key?.getPublicKey()
    callback(null, signingKey)
  })
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header provided' })
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Handle legacy email tokens for CLI compatibility
    if (token.startsWith('cli|')) {
      console.warn('⚠️  Legacy email token detected, allowing for CLI compatibility')
      // Extract email from legacy token
      const email = token.split('|')[1] || 'cli-user'
      req.user = {
        sub: 'f25eaccd-1b88-4606-a8a3-bd95d604ecfa', // Default CLI user ID
        email: 'kenr@nodots.com',
        name: email
      }
      return next()
    }

    // Verify Auth0 JWT token
    jwt.verify(token, getKey, {
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        console.error('JWT verification failed:', err.message)
        return res.status(401).json({ error: 'Invalid token' })
      }

      req.user = decoded as any
      next()
    })

  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Authentication error' })
  }
}

