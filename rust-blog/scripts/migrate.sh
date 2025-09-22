#!/bin/bash

# Run database migrations
set -e

echo "🔄 Running database migrations..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | sed 's/#.*//g' | xargs)
fi

# Set default DATABASE_URL if not set
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="postgres://postgres:password@localhost:5432/rust_blog"
fi

# Run migrations using sqlx
sqlx migrate run

echo "✅ Database migrations completed successfully!"