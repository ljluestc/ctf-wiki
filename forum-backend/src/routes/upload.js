const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',')

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('File type not allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
})

// Upload avatar
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const avatarUrl = `/uploads/${req.file.filename}`

    // Update user's avatar URL in database
    await db('users')
      .where('id', req.user.id)
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date()
      })

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl
    })
  } catch (error) {
    console.error('Upload avatar error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload general file
router.post('/file', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const fileUrl = `/uploads/${req.file.filename}`

    res.json({
      message: 'File uploaded successfully',
      fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    })
  } catch (error) {
    console.error('Upload file error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' })
    }
    return res.status(400).json({ error: error.message })
  }

  if (error.message === 'File type not allowed') {
    return res.status(400).json({ error: 'File type not allowed' })
  }

  next(error)
})

module.exports = router