#!/bin/bash

# Start PostgreSQL database in Docker
set -e

echo "🐘 Starting PostgreSQL database..."

# Start only the PostgreSQL service
docker-compose up -d postgres

# Wait for the database to be ready
echo "⏳ Waiting for database to be ready..."
timeout 60s bash -c 'until docker-compose exec postgres pg_isready -U postgres; do sleep 1; done'

echo "✅ PostgreSQL is ready!"
echo "🔗 Connection string: postgres://postgres:password@localhost:5432/rust_blog"