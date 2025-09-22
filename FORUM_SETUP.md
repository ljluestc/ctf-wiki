# CTF Forum Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 13+
- npm or yarn

### 1. Database Setup
```bash
# Create database
createdb forum_db

# Run schema
psql forum_db < forum-schema.sql
```

### 2. Backend Setup
```bash
cd forum-backend
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your database credentials

# Run migrations and seeds
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd forum-frontend
npm install

# Start development server
npm run dev
```

## 🎯 Features

### 🔐 Authentication
- User registration/login
- JWT token-based auth
- Password hashing with bcrypt
- Role-based permissions (Admin/Moderator)

### 📝 Forum Features
- **Categories**: Organized discussion areas
- **Topics**: Thread creation with markdown
- **Posts**: Rich text replies with syntax highlighting
- **Tags**: Topic categorization
- **Voting**: Like/unlike posts and topics
- **Search**: Full-text search across content
- **Moderation**: Pin, lock, mark as solved

### 🎨 UI/UX
- Clean, modern design similar to Elastic Discuss
- Responsive layout for mobile/desktop
- Real-time updates with Socket.io
- Loading states and error handling
- Syntax highlighting for code blocks

### 📊 User System
- User profiles with reputation
- Avatar support
- Join dates and activity tracking
- Verification badges
- Admin/moderator roles

## 🛠 Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **React Query** - Data fetching
- **Zustand** - State management
- **React Markdown** - Content rendering
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **Knex.js** - Query builder
- **JWT** - Authentication
- **Socket.io** - Real-time features
- **Joi** - Validation
- **bcrypt** - Password hashing

## 📐 Database Schema

### Core Tables
- `users` - User accounts and profiles
- `categories` - Forum categories
- `topics` - Discussion threads
- `posts` - Topic posts and replies
- `post_likes` - Vote tracking
- `tags` - Topic tags
- `notifications` - User notifications

### Key Features
- Full-text search indexing
- Optimized queries with proper indexes
- Foreign key constraints
- Audit trails (created/updated timestamps)

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Topics
- `GET /api/topics` - List topics with filtering
- `POST /api/topics` - Create new topic
- `GET /api/topics/:id` - Get topic details
- `PUT /api/topics/:id` - Update topic
- `DELETE /api/topics/:id` - Delete topic

### Posts
- `GET /api/posts/topic/:topicId` - Get topic posts
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Additional Features
- Categories management
- Search functionality
- File upload support
- User profiles
- Real-time notifications

## 🔒 Security Features

- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Joi
- SQL injection prevention
- XSS protection
- CSRF protection

## 📱 Real-time Features

- Live post updates
- New topic notifications
- User presence indicators
- Typing indicators (can be added)

## 🎨 UI Components

### Layout Components
- `Header` - Navigation and search
- `Sidebar` - Categories and navigation
- `Layout` - Main layout wrapper

### Content Components
- `TopicList` - Forum topic listing
- `TopicPage` - Individual topic view
- `PostEditor` - Rich text editor
- `UserProfile` - User information display

### Form Components
- Authentication forms
- Topic creation form
- Post editor with preview

## 🚀 Deployment

### Environment Variables
```env
# Server
PORT=8080
NODE_ENV=production

# Database
DB_HOST=localhost
DB_NAME=forum_db
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379
```

### Production Build
```bash
# Frontend
cd forum-frontend
npm run build

# Backend
cd forum-backend
npm run build
npm start
```

## 📈 Performance Optimizations

- Database indexing for common queries
- React Query for client-side caching
- Lazy loading of components
- Image optimization
- Code splitting
- Pagination for large datasets

## 🔮 Future Enhancements

- Email notifications
- Advanced search filters
- File attachments
- Private messaging
- Mobile app
- Plugin system
- Advanced moderation tools
- Analytics dashboard

This forum system provides a solid foundation similar to Elastic Discuss with modern technologies and best practices!