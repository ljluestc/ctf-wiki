const jwt = require('jsonwebtoken')
const db = require('../config/database')

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Fetch current user data
    const user = await db('users')
      .select('id', 'username', 'email', 'display_name', 'avatar_url', 'reputation', 'is_admin', 'is_moderator', 'is_verified')
      .where('id', decoded.userId)
      .first()

    if (!user) {
      return res.status(401).json({ error: 'Invalid token - user not found' })
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      reputation: user.reputation,
      isAdmin: user.is_admin,
      isModerator: user.is_moderator,
      isVerified: user.is_verified
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

const requireModerator = (req, res, next) => {
  if (!req.user || (!req.user.isAdmin && !req.user.isModerator)) {
    return res.status(403).json({ error: 'Moderator access required' })
  }
  next()
}

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    req.user = null
    return next()
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await db('users')
      .select('id', 'username', 'email', 'display_name', 'avatar_url', 'reputation', 'is_admin', 'is_moderator', 'is_verified')
      .where('id', decoded.userId)
      .first()

    req.user = user ? {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      reputation: user.reputation,
      isAdmin: user.is_admin,
      isModerator: user.is_moderator,
      isVerified: user.is_verified
    } : null

    next()
  } catch (error) {
    req.user = null
    next()
  }
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireModerator,
  optionalAuth
}