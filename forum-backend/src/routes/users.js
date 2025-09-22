const express = require('express')
const db = require('../config/database')
const { authenticateToken, optionalAuth } = require('../middleware/auth')

const router = express.Router()

// Get user profile
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params

    const user = await db('users')
      .select('id', 'username', 'display_name', 'avatar_url', 'bio', 'reputation', 'is_verified', 'created_at')
      .where('username', username)
      .first()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get user stats
    const [topicCount] = await db('topics')
      .where('user_id', user.id)
      .count('* as count')

    const [postCount] = await db('posts')
      .where('user_id', user.id)
      .count('* as count')

    const formattedUser = {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      reputation: user.reputation,
      isVerified: user.is_verified,
      joinedAt: user.created_at,
      stats: {
        topicCount: parseInt(topicCount.count),
        postCount: parseInt(postCount.count)
      }
    }

    res.json(formattedUser)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, bio, avatarUrl } = req.body

    const updates = {
      updated_at: new Date()
    }

    if (displayName !== undefined) updates.display_name = displayName
    if (bio !== undefined) updates.bio = bio
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl

    await db('users')
      .where('id', req.user.id)
      .update(updates)

    res.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router