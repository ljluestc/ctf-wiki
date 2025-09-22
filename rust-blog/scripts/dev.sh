#!/bin/bash

# Development script - starts the full development environment
set -e

echo "🚀 Starting Rust Blog Development Environment"
echo "============================================"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | sed 's/#.*//g' | xargs)
fi

# Start PostgreSQL in Docker
echo "🐘 Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout 60s bash -c 'until docker-compose exec postgres pg_isready -U postgres; do sleep 1; done'

# Run migrations
echo "🔄 Running database migrations..."
./scripts/migrate.sh

# Create a default admin user if it doesn't exist
echo "👤 Setting up default admin user..."
./scripts/create-admin.sh

# Start the Rust application
echo "🦀 Starting Rust Blog application..."
echo "📱 The application will be available at: http://localhost:${PORT:-3000}"
echo "🔧 Admin panel: http://localhost:${PORT:-3000}/admin"
echo "📊 Health check: http://localhost:${PORT:-3000}/health"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

cargo run