const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const { createServer } = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const categoryRoutes = require('./routes/categories')
const topicRoutes = require('./routes/topics')
const postRoutes = require('./routes/posts')
const searchRoutes = require('./routes/search')
const uploadRoutes = require('./routes/upload')

const errorHandler = require('./middleware/errorHandler')
const { authenticateToken } = require('./middleware/auth')

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'))
}

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join-topic', (topicId) => {
    socket.join(`topic-${topicId}`)
  })

  socket.on('leave-topic', (topicId) => {
    socket.leave(`topic-${topicId}`)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// Make io available to routes
app.set('io', io)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/topics', topicRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/upload', uploadRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Static files for uploads
app.use('/uploads', express.static('uploads'))

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Error handling middleware
app.use(errorHandler)

const PORT = process.env.PORT || 8080

server.listen(PORT, () => {
  console.log(`Forum server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app