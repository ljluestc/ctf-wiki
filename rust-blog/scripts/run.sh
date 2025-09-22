#!/bin/bash

# Run the Rust Blog application
set -e

echo "🦀 Starting Rust Blog application..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | sed 's/#.*//g' | xargs)
fi

# Check if database is running
if ! nc -z localhost 5432 2>/dev/null; then
    echo "⚠️  PostgreSQL doesn't seem to be running."
    echo "   Run './scripts/start-db.sh' first or start with './scripts/dev.sh'"
    exit 1
fi

# Start the application
echo "🚀 Application starting on port ${PORT:-3000}..."
echo "📱 Open http://localhost:${PORT:-3000} in your browser"

cargo run