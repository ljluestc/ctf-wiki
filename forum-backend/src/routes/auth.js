const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Joi = require('joi')
const db = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  displayName: Joi.string().min(1).max(100).optional()
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

// Register
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { username, email, password, displayName } = value

    // Check if user already exists
    const existingUser = await db('users')
      .where('email', email)
      .orWhere('username', username)
      .first()

    if (existingUser) {
      return res.status(409).json({
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      })
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const [user] = await db('users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
        display_name: displayName || username,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['id', 'username', 'email', 'display_name', 'avatar_url', 'reputation', 'is_admin', 'is_moderator', 'is_verified'])

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        reputation: user.reputation,
        isAdmin: user.is_admin,
        isModerator: user.is_moderator,
        isVerified: user.is_verified
      },
      token
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { email, password } = value

    // Find user
    const user = await db('users')
      .select('id', 'username', 'email', 'display_name', 'avatar_url', 'reputation', 'is_admin', 'is_moderator', 'is_verified', 'password_hash')
      .where('email', email)
      .first()

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Update last seen
    await db('users')
      .where('id', user.id)
      .update({ last_seen_at: new Date() })

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        reputation: user.reputation,
        isAdmin: user.is_admin,
        isModerator: user.is_moderator,
        isVerified: user.is_verified
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user })
})

// Refresh token
router.post('/refresh', authenticateToken, (req, res) => {
  const token = jwt.sign(
    { userId: req.user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

  res.json({ token })
})

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' })
})

module.exports = router