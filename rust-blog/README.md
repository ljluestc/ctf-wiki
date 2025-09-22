# Rust Community Platform

A modern, fast, and secure community platform with blog and forum functionality, built with Rust, Axum, and PostgreSQL. Features an Elastic-inspired forum design and is designed for easy deployment both locally and on Kubernetes.

## ✨ Features

### Core Platform
- **Fast & Secure**: Built with Rust for maximum performance and safety
- **Modern Web Framework**: Uses Axum for high-performance HTTP handling
- **Database Integration**: PostgreSQL with SQLx for type-safe database operations
- **Authentication**: JWT-based authentication system with user roles
- **Containerized**: Docker and Docker Compose support
- **Kubernetes Ready**: Complete K8s manifests for production deployment
- **Developer Friendly**: Comprehensive scripts and development tools

### Blog Features
- **Content Management**: Full-featured admin interface for blog posts
- **Rich Text Support**: Markdown support with syntax highlighting
- **Tagging System**: Organize posts with tags
- **Publishing Control**: Draft and publish workflow

### Forum Features (Elastic-Inspired Design)
- **Category-Based Organization**: Clean category structure like Elastic forums
- **Discussion Threads**: Topic creation with threaded replies
- **User Profiles**: User reputation and activity tracking
- **Real-Time Features**: Live updates and notifications
- **Moderation Tools**: Admin controls for community management
- **Search & Filtering**: Advanced search functionality
- **Rich Formatting**: Markdown support with code highlighting
- **Mobile Responsive**: Clean, professional design that works on all devices

## 🚀 Quick Start

### Prerequisites

- Rust 1.75+ ([Install Rust](https://rustup.rs/))
- Docker and Docker Compose ([Install Docker](https://docs.docker.com/get-docker/))
- Git

### Local Development

1. **Clone and setup:**
   ```bash
   git clone <your-repo-url>
   cd rust-blog
   ./scripts/setup.sh
   ```

2. **Start development environment:**
   ```bash
   ./scripts/dev.sh
   ```

3. **Access the application:**
   - Main site: http://localhost:3000
   - Forum: http://localhost:3000/forum (Elastic-inspired design)
   - Blog: http://localhost:3000/posts
   - Admin panel: http://localhost:3000/admin
   - Health check: http://localhost:3000/health

4. **Default admin credentials:**
   - Username: `admin`
   - Password: `admin123`
   - ⚠️ **Change these in production!**

## 📁 Project Structure

```
rust-blog/
├── src/                    # Rust source code
│   ├── main.rs            # Application entry point
│   ├── models.rs          # Data models (blog + forum)
│   ├── database.rs        # Database operations
│   ├── handlers.rs        # Blog HTTP request handlers
│   ├── forum_handlers.rs  # Forum HTTP request handlers
│   ├── auth.rs            # Authentication logic
│   └── templates.rs       # Template definitions
├── templates/             # HTML templates (Askama)
│   ├── forum/            # Forum-specific templates (Elastic-inspired)
│   └── *.html           # Blog templates
├── static/               # Static files (CSS, JS, images)
│   ├── forum.css        # Elastic-inspired forum styles
│   └── forum.js         # Forum JavaScript functionality
├── migrations/           # Database migrations
├── k8s/                 # Kubernetes manifests
├── scripts/             # Development and deployment scripts
├── Dockerfile           # Container definition
├── docker-compose.yml   # Local development setup
└── README.md           # This file
```

## 🔧 Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `./scripts/setup.sh` | Initial project setup |
| `./scripts/dev.sh` | Start full development environment |
| `./scripts/start-db.sh` | Start PostgreSQL only |
| `./scripts/migrate.sh` | Run database migrations |
| `./scripts/run.sh` | Start the Rust application |
| `./scripts/build.sh` | Build Docker image |
| `./scripts/deploy-k8s.sh` | Deploy to Kubernetes |
| `./scripts/cleanup.sh` | Clean up development environment |

### Manual Development Setup

1. **Start PostgreSQL:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Run migrations:**
   ```bash
   ./scripts/migrate.sh
   ```

3. **Start the application:**
   ```bash
   cargo run
   ```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgres://postgres:password@localhost:5432/rust_blog

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=3000
RUST_LOG=debug
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended for local/testing)

```bash
# Build and start everything
docker-compose up --build

# Or use the build script
./scripts/build.sh
docker-compose up
```

### Manual Docker Build

```bash
# Build the image
docker build -t rust-blog .

# Run with external PostgreSQL
docker run -e DATABASE_URL=postgres://user:pass@host:5432/db rust-blog
```

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (local or cloud)
- kubectl configured
- NGINX Ingress Controller (for ingress)

### Quick Deploy

```bash
./scripts/deploy-k8s.sh
```

### Manual Deployment

```bash
# Apply all manifests
kubectl apply -k k8s/

# Check deployment status
kubectl get pods -n rust-blog

# Access via port-forward
kubectl port-forward service/rust-blog-service 8080:80 -n rust-blog
```

### Production Considerations

Before deploying to production:

1. **Update secrets in `k8s/postgres-secret.yaml` and `k8s/app-secret.yaml`**
2. **Configure proper ingress hostname in `k8s/ingress.yaml`**
3. **Set up TLS certificates**
4. **Configure persistent storage for PostgreSQL**
5. **Set resource limits based on your needs**

## 🔑 Authentication & Users

### API Endpoints

#### Blog Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Home page | No |
| GET | `/posts` | List posts | No |
| GET | `/posts/:id` | View post | No |
| GET | `/admin` | Admin panel | No |
| GET | `/api/posts` | API: List posts | No |
| POST | `/api/posts` | API: Create post | Yes |
| PUT | `/api/posts/:id` | API: Update post | Yes |
| DELETE | `/api/posts/:id` | API: Delete post | Yes |

#### Forum Endpoints (Elastic-Inspired)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/forum` | Forum index (categories) | No |
| GET | `/forum/c/:category_id` | Category topics | No |
| GET | `/forum/t/:slug` | Topic with replies | No |
| GET | `/forum/create` | Create topic form | No |
| GET | `/api/forum/categories` | API: List categories | No |
| POST | `/api/forum/categories` | API: Create category | Admin |
| GET | `/api/forum/topics` | API: List topics | No |
| POST | `/api/forum/topics` | API: Create topic | Yes |
| GET | `/api/forum/topics/:slug` | API: Get topic | No |
| GET | `/api/forum/topics/:id/replies` | API: List replies | No |
| POST | `/api/forum/topics/:id/replies` | API: Create reply | Yes |
| GET | `/api/forum/users/:id/profile` | API: User profile | No |

#### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/register` | Register | No |

### User Roles

- **Admin**: Full access to all features
- **Editor**: Can create and edit posts
- **Viewer**: Read-only access

### Creating Users

Use the admin panel or API to create users:

```bash
curl -X POST http://localhost:3000/api/auth/register \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"username\": \"newuser\",
    \"email\": \"user@example.com\",
    \"password\": \"securepassword\",
    \"role\": \"editor\"
  }'
```

## 📝 Content Management

### Creating Posts

1. **Via Admin Panel:**
   - Navigate to `/admin`
   - Fill out the post form
   - Set tags and publish status

2. **Via API:**
   ```bash
   curl -X POST http://localhost:3000/api/posts \\
     -H \"Authorization: Bearer <your-jwt-token>\" \\
     -H \"Content-Type: application/json\" \\
     -d '{
       \"title\": \"My Post\",
       \"content\": \"Post content here\",
       \"author\": \"Author Name\",
       \"published\": true,
       \"tags\": [\"rust\", \"web\"]
     }'
   ```

### Post Fields

- **title**: Post title (required)
- **content**: Main content (supports HTML)
- **summary**: Optional excerpt
- **author**: Author name (required)
- **published**: Boolean for publish status
- **tags**: Array of tag strings

## 🔧 Configuration

### Database Configuration

The application uses PostgreSQL with SQLx for type-safe database operations. Migrations are automatically applied on startup.

### Logging

Set `RUST_LOG` environment variable:
- `error`: Error messages only
- `warn`: Warnings and errors
- `info`: General information
- `debug`: Detailed debugging
- `trace`: Very verbose

### Performance Tuning

For production deployment:

1. **Use release builds**: `cargo build --release`
2. **Configure connection pooling** in `database.rs`
3. **Set appropriate resource limits** in Kubernetes
4. **Enable HTTP/2** in your reverse proxy
5. **Configure CDN** for static assets

## 🚨 Security

### Best Practices Implemented

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password storage
- **SQL Injection Protection**: SQLx compile-time checked queries
- **Input Validation**: Comprehensive request validation
- **CORS Configuration**: Configurable cross-origin requests

### Production Security Checklist

- [ ] Change default JWT secret
- [ ] Change default admin credentials
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Regular security updates

## 🧪 Testing

Run tests with:

```bash
cargo test
```

For integration tests with database:

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run tests
DATABASE_URL=postgres://postgres:password@localhost:5433/rust_blog_test cargo test

# Cleanup
docker-compose -f docker-compose.test.yml down
```

## 📊 Monitoring

### Health Checks

- **Application**: `GET /health`
- **Database**: Included in health endpoint

### Kubernetes Monitoring

The K8s deployment includes:
- Liveness probes
- Readiness probes
- Resource monitoring

### Logging

Structured logging with tracing:

```bash
# View application logs
kubectl logs -l app=rust-blog-app -n rust-blog -f

# View PostgreSQL logs
kubectl logs -l app=postgres -n rust-blog -f
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Run tests: `cargo test`
6. Commit changes: `git commit -am 'Add feature'`
7. Push to branch: `git push origin feature-name`
8. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Database connection fails:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres
```

**Migrations fail:**
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
./scripts/migrate.sh
```

**Build fails:**
```bash
# Clean and rebuild
cargo clean
cargo build
```

**Kubernetes deployment issues:**
```bash
# Check pod status
kubectl get pods -n rust-blog

# Check events
kubectl get events -n rust-blog --sort-by=.metadata.creationTimestamp

# Check logs
kubectl logs -l app=rust-blog-app -n rust-blog
```

### Getting Help

- Check the [Issues](https://github.com/your-repo/rust-blog/issues) page
- Review application logs: `docker-compose logs blog`
- Enable debug logging: `RUST_LOG=debug`

## 🎯 Roadmap

- [ ] Comment system
- [ ] Rich text editor
- [ ] Image upload and management
- [ ] Search functionality
- [ ] RSS feed generation
- [ ] Email notifications
- [ ] Social media integration
- [ ] Performance metrics
- [ ] Automated backups

---

Built with ❤️ and 🦀 Rust