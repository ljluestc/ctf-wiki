const express = require('express')
const Joi = require('joi')
const db = require('../config/database')
const { authenticateToken, optionalAuth } = require('../middleware/auth')

const router = express.Router()

// Validation schemas
const createPostSchema = Joi.object({
  topicId: Joi.number().integer().positive().required(),
  content: Joi.string().min(1).required(),
  replyToPostId: Joi.number().integer().positive().optional()
})

const updatePostSchema = Joi.object({
  content: Joi.string().min(1).required()
})

// Get posts for a topic
router.get('/topic/:topicId', optionalAuth, async (req, res) => {
  try {
    const { topicId } = req.params
    const { page = 1, limit = 20 } = req.query

    const offset = (parseInt(page) - 1) * parseInt(limit)

    const posts = await db('posts')
      .select(
        'posts.*',
        'users.username',
        'users.display_name as user_display_name',
        'users.avatar_url as user_avatar_url',
        'users.reputation as user_reputation',
        'users.is_verified as user_is_verified',
        'users.created_at as user_joined_at',
        'edited_users.username as edited_by_username',
        'edited_users.display_name as edited_by_display_name'
      )
      .leftJoin('users', 'posts.user_id', 'users.id')
      .leftJoin('users as edited_users', 'posts.edited_by_user_id', 'edited_users.id')
      .where('posts.topic_id', topicId)
      .orderBy('posts.post_number', 'asc')
      .limit(parseInt(limit))
      .offset(offset)

    // Get like status for authenticated user
    let postLikes = []
    if (req.user && posts.length > 0) {
      const postIds = posts.map(p => p.id)
      postLikes = await db('post_likes')
        .select('post_id')
        .whereIn('post_id', postIds)
        .where('user_id', req.user.id)
    }

    const likedPostIds = new Set(postLikes.map(l => l.post_id))

    const formattedPosts = posts.map(post => ({
      id: post.id,
      topicId: post.topic_id,
      content: post.content,
      rawContent: post.raw_content,
      postNumber: post.post_number,
      isSolution: post.is_solution,
      likeCount: post.like_count,
      isLiked: likedPostIds.has(post.id),
      replyToPostId: post.reply_to_post_id,
      user: {
        id: post.user_id,
        username: post.username,
        displayName: post.user_display_name,
        avatarUrl: post.user_avatar_url,
        reputation: post.user_reputation,
        isVerified: post.user_is_verified,
        joinedAt: post.user_joined_at
      },
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      editedAt: post.edited_at,
      editedBy: post.edited_by_user_id ? {
        username: post.edited_by_username,
        displayName: post.edited_by_display_name
      } : null
    }))

    res.json(formattedPosts)
  } catch (error) {
    console.error('Get posts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create post (reply)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = createPostSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { topicId, content, replyToPostId } = value

    // Check if topic exists and is not locked
    const topic = await db('topics').where('id', topicId).first()
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    if (topic.is_locked && !req.user.isAdmin && !req.user.isModerator) {
      return res.status(403).json({ error: 'Topic is locked' })
    }

    // Get next post number
    const lastPost = await db('posts')
      .where('topic_id', topicId)
      .orderBy('post_number', 'desc')
      .first()

    const postNumber = lastPost ? lastPost.post_number + 1 : 1

    // Create post
    const [post] = await db('posts')
      .insert({
        topic_id: topicId,
        user_id: req.user.id,
        content,
        raw_content: content,
        post_number: postNumber,
        reply_to_post_id: replyToPostId || null,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*')

    // Update topic stats
    await db('topics')
      .where('id', topicId)
      .update({
        reply_count: db.raw('reply_count + 1'),
        last_reply_at: new Date(),
        last_reply_user_id: req.user.id,
        updated_at: new Date()
      })

    // Emit real-time event
    const io = req.app.get('io')
    io.to(`topic-${topicId}`).emit('new-post', {
      topicId,
      postId: post.id,
      user: {
        id: req.user.id,
        username: req.user.username,
        displayName: req.user.displayName
      }
    })

    res.status(201).json({
      message: 'Post created successfully',
      post: {
        id: post.id,
        postNumber: post.post_number
      }
    })
  } catch (error) {
    console.error('Create post error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update post
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { error, value } = updatePostSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { content } = value

    const post = await db('posts').where('id', id).first()
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Check permissions
    const canEdit = req.user.id === post.user_id || req.user.isAdmin || req.user.isModerator
    if (!canEdit) {
      return res.status(403).json({ error: 'Not authorized to edit this post' })
    }

    // Update post
    await db('posts')
      .where('id', id)
      .update({
        content,
        raw_content: content,
        edited_at: new Date(),
        edited_by_user_id: req.user.id,
        updated_at: new Date()
      })

    // If this is the first post, update topic title and content
    if (post.post_number === 1 && req.body.title) {
      await db('topics')
        .where('id', post.topic_id)
        .update({
          title: req.body.title,
          updated_at: new Date()
        })
    }

    res.json({ message: 'Post updated successfully' })
  } catch (error) {
    console.error('Update post error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const post = await db('posts').where('id', id).first()
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Check permissions
    const canDelete = req.user.id === post.user_id || req.user.isAdmin || req.user.isModerator
    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this post' })
    }

    // Can't delete the first post (would delete entire topic)
    if (post.post_number === 1) {
      return res.status(400).json({ error: 'Cannot delete the original post. Delete the topic instead.' })
    }

    await db('posts').where('id', id).del()

    // Update topic reply count
    await db('topics')
      .where('id', post.topic_id)
      .decrement('reply_count', 1)

    res.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Delete post error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Like/unlike post
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const post = await db('posts').where('id', id).first()
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Check if already liked
    const existingLike = await db('post_likes')
      .where('post_id', id)
      .where('user_id', req.user.id)
      .first()

    if (existingLike) {
      return res.status(400).json({ error: 'Post already liked' })
    }

    // Add like
    await db('post_likes').insert({
      post_id: id,
      user_id: req.user.id,
      created_at: new Date()
    })

    // Update like count
    await db('posts').where('id', id).increment('like_count', 1)

    res.json({ message: 'Post liked successfully' })
  } catch (error) {
    console.error('Like post error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const deletedRows = await db('post_likes')
      .where('post_id', id)
      .where('user_id', req.user.id)
      .del()

    if (deletedRows > 0) {
      // Update like count
      await db('posts').where('id', id).decrement('like_count', 1)
    }

    res.json({ message: 'Post unliked successfully' })
  } catch (error) {
    console.error('Unlike post error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark post as solution
router.post('/:id/solution', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const post = await db('posts')
      .select('posts.*', 'topics.user_id as topic_author_id')
      .join('topics', 'posts.topic_id', 'topics.id')
      .where('posts.id', id)
      .first()

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Only topic author, admins, and moderators can mark solutions
    const canMarkSolution = req.user.id === post.topic_author_id || req.user.isAdmin || req.user.isModerator
    if (!canMarkSolution) {
      return res.status(403).json({ error: 'Not authorized to mark solution' })
    }

    // Remove any existing solution marks
    await db('posts')
      .where('topic_id', post.topic_id)
      .update({ is_solution: false })

    // Mark this post as solution
    await db('posts')
      .where('id', id)
      .update({ is_solution: true })

    // Mark topic as solved
    await db('topics')
      .where('id', post.topic_id)
      .update({ is_solved: true })

    res.json({ message: 'Post marked as solution successfully' })
  } catch (error) {
    console.error('Mark solution error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router