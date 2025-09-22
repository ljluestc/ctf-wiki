const express = require('express')
const Joi = require('joi')
const db = require('../config/database')
const { authenticateToken, optionalAuth, requireModerator } = require('../middleware/auth')

const router = express.Router()

// Validation schemas
const createTopicSchema = Joi.object({
  title: Joi.string().min(5).max(255).required(),
  content: Joi.string().min(10).required(),
  categoryId: Joi.number().integer().positive().required(),
  tags: Joi.array().items(Joi.string().max(50)).max(5).optional()
})

const updateTopicSchema = Joi.object({
  title: Joi.string().min(5).max(255).optional(),
  content: Joi.string().min(10).optional(),
  categoryId: Joi.number().integer().positive().optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(5).optional(),
  isPinned: Joi.boolean().optional(),
  isLocked: Joi.boolean().optional(),
  isSolved: Joi.boolean().optional()
})

// Helper function to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-')
}

// Get topics with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = 'latest',
      category,
      tag,
      search,
      pinned,
      solved,
      unanswered
    } = req.query

    const offset = (parseInt(page) - 1) * parseInt(limit)

    let query = db('topics')
      .select(
        'topics.*',
        'users.username',
        'users.display_name as user_display_name',
        'users.avatar_url as user_avatar_url',
        'users.reputation as user_reputation',
        'users.is_verified as user_is_verified',
        'categories.name as category_name',
        'categories.slug as category_slug',
        'categories.color as category_color',
        'last_reply_users.username as last_reply_username',
        'last_reply_users.display_name as last_reply_display_name',
        'last_reply_users.avatar_url as last_reply_avatar_url'
      )
      .leftJoin('users', 'topics.user_id', 'users.id')
      .leftJoin('categories', 'topics.category_id', 'categories.id')
      .leftJoin('users as last_reply_users', 'topics.last_reply_user_id', 'last_reply_users.id')

    // Apply filters
    if (category) {
      query = query.where('categories.slug', category)
    }

    if (tag) {
      query = query
        .join('topic_tags', 'topics.id', 'topic_tags.topic_id')
        .join('tags', 'topic_tags.tag_id', 'tags.id')
        .where('tags.name', tag)
    }

    if (search) {
      query = query.where(function() {
        this.where('topics.title', 'ilike', `%${search}%`)
      })
    }

    if (pinned === 'true') {
      query = query.where('topics.is_pinned', true)
    }

    if (solved === 'true') {
      query = query.where('topics.is_solved', true)
    } else if (solved === 'false') {
      query = query.where('topics.is_solved', false)
    }

    if (unanswered === 'true') {
      query = query.where('topics.reply_count', 0)
    }

    // Apply sorting
    switch (sort) {
      case 'popular':
        query = query.orderBy([
          { column: 'topics.like_count', order: 'desc' },
          { column: 'topics.view_count', order: 'desc' }
        ])
        break
      case 'trending':
        query = query.orderBy([
          { column: 'topics.reply_count', order: 'desc' },
          { column: 'topics.created_at', order: 'desc' }
        ])
        break
      case 'unanswered':
        query = query
          .where('topics.reply_count', 0)
          .orderBy('topics.created_at', 'desc')
        break
      default: // latest
        query = query.orderBy([
          { column: 'topics.is_pinned', order: 'desc' },
          { column: 'topics.last_reply_at', order: 'desc' },
          { column: 'topics.created_at', order: 'desc' }
        ])
    }

    const topics = await query.limit(parseInt(limit)).offset(offset)

    // Get tags for each topic
    const topicIds = topics.map(t => t.id)
    let topicTags = []

    if (topicIds.length > 0) {
      topicTags = await db('topic_tags')
        .select('topic_tags.topic_id', 'tags.id', 'tags.name', 'tags.color')
        .join('tags', 'topic_tags.tag_id', 'tags.id')
        .whereIn('topic_tags.topic_id', topicIds)
    }

    // Group tags by topic
    const tagsByTopic = topicTags.reduce((acc, tag) => {
      if (!acc[tag.topic_id]) acc[tag.topic_id] = []
      acc[tag.topic_id].push({
        id: tag.id,
        name: tag.name,
        color: tag.color
      })
      return acc
    }, {})

    // Format response
    const formattedTopics = topics.map(topic => ({
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      user: {
        id: topic.user_id,
        username: topic.username,
        displayName: topic.user_display_name,
        avatarUrl: topic.user_avatar_url,
        reputation: topic.user_reputation,
        isVerified: topic.user_is_verified
      },
      category: {
        id: topic.category_id,
        name: topic.category_name,
        slug: topic.category_slug,
        color: topic.category_color
      },
      tags: tagsByTopic[topic.id] || [],
      isPinned: topic.is_pinned,
      isLocked: topic.is_locked,
      isSolved: topic.is_solved,
      viewCount: topic.view_count,
      replyCount: topic.reply_count,
      likeCount: topic.like_count,
      createdAt: topic.created_at,
      updatedAt: topic.updated_at,
      lastReplyAt: topic.last_reply_at,
      lastReplyUser: topic.last_reply_user_id ? {
        id: topic.last_reply_user_id,
        username: topic.last_reply_username,
        displayName: topic.last_reply_display_name,
        avatarUrl: topic.last_reply_avatar_url
      } : null
    }))

    res.json(formattedTopics)
  } catch (error) {
    console.error('Get topics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single topic
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params

    const topic = await db('topics')
      .select(
        'topics.*',
        'users.username',
        'users.display_name as user_display_name',
        'users.avatar_url as user_avatar_url',
        'users.reputation as user_reputation',
        'users.is_verified as user_is_verified',
        'categories.name as category_name',
        'categories.slug as category_slug',
        'categories.color as category_color'
      )
      .leftJoin('users', 'topics.user_id', 'users.id')
      .leftJoin('categories', 'topics.category_id', 'categories.id')
      .where('topics.id', id)
      .first()

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    // Get tags
    const tags = await db('topic_tags')
      .select('tags.id', 'tags.name', 'tags.color')
      .join('tags', 'topic_tags.tag_id', 'tags.id')
      .where('topic_tags.topic_id', id)

    // Increment view count (if user is not the author)
    if (!req.user || req.user.id !== topic.user_id) {
      await db('topics')
        .where('id', id)
        .increment('view_count', 1)

      // Track view for analytics (optional)
      if (req.user) {
        await db('topic_views')
          .insert({
            topic_id: id,
            user_id: req.user.id,
            viewed_at: new Date()
          })
          .onConflict(['topic_id', 'user_id'])
          .merge({ viewed_at: new Date() })
      }
    }

    const formattedTopic = {
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      user: {
        id: topic.user_id,
        username: topic.username,
        displayName: topic.user_display_name,
        avatarUrl: topic.user_avatar_url,
        reputation: topic.user_reputation,
        isVerified: topic.user_is_verified
      },
      category: {
        id: topic.category_id,
        name: topic.category_name,
        slug: topic.category_slug,
        color: topic.category_color
      },
      tags,
      isPinned: topic.is_pinned,
      isLocked: topic.is_locked,
      isSolved: topic.is_solved,
      viewCount: topic.view_count,
      replyCount: topic.reply_count,
      likeCount: topic.like_count,
      createdAt: topic.created_at,
      updatedAt: topic.updated_at,
      lastReplyAt: topic.last_reply_at
    }

    res.json(formattedTopic)
  } catch (error) {
    console.error('Get topic error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create topic
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = createTopicSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const { title, content, categoryId, tags } = value

    // Check if category exists
    const category = await db('categories').where('id', categoryId).first()
    if (!category) {
      return res.status(400).json({ error: 'Category not found' })
    }

    const slug = generateSlug(title)

    // Start transaction
    const result = await db.transaction(async (trx) => {
      // Create topic
      const [topic] = await trx('topics')
        .insert({
          title,
          slug,
          user_id: req.user.id,
          category_id: categoryId,
          created_at: new Date(),
          updated_at: new Date(),
          last_reply_at: new Date()
        })
        .returning('*')

      // Create initial post
      const [post] = await trx('posts')
        .insert({
          topic_id: topic.id,
          user_id: req.user.id,
          content,
          raw_content: content,
          post_number: 1,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*')

      // Handle tags
      if (tags && tags.length > 0) {
        const tagPromises = tags.map(async (tagName) => {
          // Get or create tag
          let [tag] = await trx('tags')
            .where('name', tagName.toLowerCase())
            .returning('*')

          if (!tag) {
            [tag] = await trx('tags')
              .insert({
                name: tagName.toLowerCase(),
                created_at: new Date()
              })
              .returning('*')
          }

          // Link tag to topic
          await trx('topic_tags')
            .insert({
              topic_id: topic.id,
              tag_id: tag.id
            })
            .onConflict(['topic_id', 'tag_id'])
            .ignore()

          return tag
        })

        await Promise.all(tagPromises)
      }

      return { topic, post }
    })

    // Emit real-time event
    const io = req.app.get('io')
    io.emit('new-topic', {
      topicId: result.topic.id,
      categoryId: categoryId
    })

    res.status(201).json({
      message: 'Topic created successfully',
      topic: {
        id: result.topic.id,
        title: result.topic.title,
        slug: result.topic.slug
      }
    })
  } catch (error) {
    console.error('Create topic error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update topic
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { error, value } = updateTopicSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const topic = await db('topics').where('id', id).first()
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    // Check permissions
    const canEdit = req.user.id === topic.user_id || req.user.isAdmin || req.user.isModerator
    if (!canEdit) {
      return res.status(403).json({ error: 'Not authorized to edit this topic' })
    }

    const updates = { ...value, updated_at: new Date() }

    // Generate new slug if title changed
    if (value.title) {
      updates.slug = generateSlug(value.title)
    }

    await db('topics').where('id', id).update(updates)

    res.json({ message: 'Topic updated successfully' })
  } catch (error) {
    console.error('Update topic error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete topic
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const topic = await db('topics').where('id', id).first()
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    // Check permissions
    const canDelete = req.user.id === topic.user_id || req.user.isAdmin || req.user.isModerator
    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this topic' })
    }

    await db('topics').where('id', id).del()

    res.json({ message: 'Topic deleted successfully' })
  } catch (error) {
    console.error('Delete topic error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Like/unlike topic
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const topic = await db('topics').where('id', id).first()
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    // Check if already liked
    const existingLike = await db('post_likes')
      .join('posts', 'post_likes.post_id', 'posts.id')
      .where('posts.topic_id', id)
      .where('posts.post_number', 1)
      .where('post_likes.user_id', req.user.id)
      .first()

    if (existingLike) {
      return res.status(400).json({ error: 'Topic already liked' })
    }

    // Get the first post of the topic
    const firstPost = await db('posts')
      .where('topic_id', id)
      .where('post_number', 1)
      .first()

    if (firstPost) {
      await db('post_likes').insert({
        post_id: firstPost.id,
        user_id: req.user.id,
        created_at: new Date()
      })

      // Update like count
      await db('posts').where('id', firstPost.id).increment('like_count', 1)
      await db('topics').where('id', id).increment('like_count', 1)
    }

    res.json({ message: 'Topic liked successfully' })
  } catch (error) {
    console.error('Like topic error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Get the first post of the topic
    const firstPost = await db('posts')
      .where('topic_id', id)
      .where('post_number', 1)
      .first()

    if (firstPost) {
      const deletedRows = await db('post_likes')
        .where('post_id', firstPost.id)
        .where('user_id', req.user.id)
        .del()

      if (deletedRows > 0) {
        // Update like count
        await db('posts').where('id', firstPost.id).decrement('like_count', 1)
        await db('topics').where('id', id).decrement('like_count', 1)
      }
    }

    res.json({ message: 'Topic unliked successfully' })
  } catch (error) {
    console.error('Unlike topic error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router