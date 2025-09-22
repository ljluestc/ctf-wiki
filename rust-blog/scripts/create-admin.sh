#!/bin/bash

# Create a default admin user for development
set -e

echo "👤 Creating default admin user..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | sed 's/#.*//g' | xargs)
fi

DATABASE_URL=${DATABASE_URL:-postgres://postgres:password@localhost:5432/rust_blog}

# Create admin user using psql
docker-compose exec postgres psql -U postgres -d rust_blog -c "
INSERT INTO users (id, username, email, password_hash, role, created_at)
VALUES (
    gen_random_uuid(),
    'admin',
    'admin@example.com',
    '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLO/BTNBVHjM5yy', -- password: 'admin123'
    'admin',
    NOW()
)
ON CONFLICT (username) DO NOTHING;
" 2>/dev/null || echo "Admin user might already exist or database is not ready."

echo "✅ Default admin user created (if it didn't exist already)"
echo "📝 Username: admin"
echo "🔑 Password: admin123"
echo "⚠️  Please change these credentials in production!"