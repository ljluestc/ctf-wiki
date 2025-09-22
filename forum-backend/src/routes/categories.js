const express = require('express')
const db = require('../config/database')
const { optionalAuth } = require('../middleware/auth')

const router = express.Router()

// Get all categories
router.get('/', optionalAuth, async (req, res) => {
  try {
    const categories = await db('categories')
      .select('*')
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')

    // Get topic counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const [{ count }] = await db('topics')
          .where('category_id', category.id)
          .count('* as count')

        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          color: category.color,
          icon: category.icon,
          parentId: category.parent_id,
          isPrivate: category.is_private,
          topicCount: parseInt(count),
          createdAt: category.created_at
        }
      })
    )

    res.json(categoriesWithCounts)
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single category by slug
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params

    const category = await db('categories')
      .where('slug', slug)
      .first()

    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    // Get topic count
    const [{ count }] = await db('topics')
      .where('category_id', category.id)
      .count('* as count')

    const formattedCategory = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
      icon: category.icon,
      parentId: category.parent_id,
      isPrivate: category.is_private,
      topicCount: parseInt(count),
      createdAt: category.created_at
    }

    res.json(formattedCategory)
  } catch (error) {
    console.error('Get category error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router