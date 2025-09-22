const express = require('express')
const db = require('../config/database')
const { optionalAuth } = require('../middleware/auth')

const router = express.Router()

// Search topics and posts
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q: query, category, tag, type = 'all', page = 1, limit = 20 } = req.query

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' })
    }

    const searchTerm = query.trim()
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let results = []

    // Search topics
    if (type === 'all' || type === 'topics') {
      let topicQuery = db('topics')
        .select(
          'topics.id',
          'topics.title',
          'topics.slug',
          'topics.view_count',
          'topics.reply_count',
          'topics.like_count',
          'topics.created_at',
          'users.username',
          'users.display_name as user_display_name',
          'categories.name as category_name',
          'categories.slug as category_slug',
          'categories.color as category_color'
        )
        .leftJoin('users', 'topics.user_id', 'users.id')
        .leftJoin('categories', 'topics.category_id', 'categories.id')
        .where('topics.title', 'ilike', `%${searchTerm}%`)

      if (category) {
        topicQuery = topicQuery.where('categories.slug', category)
      }

      if (tag) {
        topicQuery = topicQuery
          .join('topic_tags', 'topics.id', 'topic_tags.topic_id')
          .join('tags', 'topic_tags.tag_id', 'tags.id')
          .where('tags.name', tag)
      }

      const topics = await topicQuery
        .orderBy('topics.created_at', 'desc')
        .limit(parseInt(limit))
        .offset(offset)

      results = results.concat(
        topics.map(topic => ({
          type: 'topic',
          id: topic.id,
          title: topic.title,
          slug: topic.slug,
          content: null,
          user: {
            username: topic.username,
            displayName: topic.user_display_name
          },
          category: {
            name: topic.category_name,
            slug: topic.category_slug,
            color: topic.category_color
          },
          stats: {
            viewCount: topic.view_count,
            replyCount: topic.reply_count,
            likeCount: topic.like_count
          },
          createdAt: topic.created_at
        }))
      )
    }

    // Search posts
    if (type === 'all' || type === 'posts') {
      let postQuery = db('posts')
        .select(
          'posts.id',
          'posts.content',
          'posts.post_number',
          'posts.created_at',
          'topics.id as topic_id',
          'topics.title as topic_title',
          'topics.slug as topic_slug',
          'users.username',
          'users.display_name as user_display_name',
          'categories.name as category_name',
          'categories.slug as category_slug',
          'categories.color as category_color'
        )
        .leftJoin('topics', 'posts.topic_id', 'topics.id')
        .leftJoin('users', 'posts.user_id', 'users.id')
        .leftJoin('categories', 'topics.category_id', 'categories.id')
        .where('posts.content', 'ilike', `%${searchTerm}%`)

      if (category) {
        postQuery = postQuery.where('categories.slug', category)
      }

      const posts = await postQuery
        .orderBy('posts.created_at', 'desc')
        .limit(parseInt(limit))
        .offset(offset)

      results = results.concat(
        posts.map(post => ({
          type: 'post',
          id: post.id,
          title: post.topic_title,
          slug: post.topic_slug,
          content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
          postNumber: post.post_number,
          topicId: post.topic_id,
          user: {
            username: post.username,
            displayName: post.user_display_name
          },
          category: {
            name: post.category_name,
            slug: post.category_slug,
            color: post.category_color
          },
          createdAt: post.created_at
        }))
      )
    }

    // Sort results by relevance and date
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json({
      query: searchTerm,
      results: results.slice(0, parseInt(limit)),
      total: results.length,
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router