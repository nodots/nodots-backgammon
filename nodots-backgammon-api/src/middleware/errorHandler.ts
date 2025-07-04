import { Request, Response, NextFunction } from 'express'

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('API Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  // Default error response
  let statusCode = 500
  let message = 'Internal server error'

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation error'
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401
    message = 'Unauthorized'
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403
    message = 'Forbidden'
  } else if (err.name === 'NotFoundError') {
    statusCode = 404
    message = 'Not found'
  } else if (err.message) {
    message = err.message
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}