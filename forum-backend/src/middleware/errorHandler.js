const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details.map(detail => detail.message)
    })
  }

  // Database errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          error: 'Resource already exists'
        })
      case '23503': // Foreign key violation
        return res.status(400).json({
          error: 'Referenced resource does not exist'
        })
      case '23502': // Not null violation
        return res.status(400).json({
          error: 'Required field is missing'
        })
      default:
        return res.status(500).json({
          error: 'Database error'
        })
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    })
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

module.exports = errorHandler