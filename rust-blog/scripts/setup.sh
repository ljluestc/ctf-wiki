#!/bin/bash

# Rust Blog Setup Script
set -e

echo "🦀 Setting up Rust Blog Development Environment"
echo "=============================================="

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust first:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please review and update the values as needed."
else
    echo "✅ .env file already exists."
fi

# Install sqlx-cli if not already installed
if ! command -v sqlx &> /dev/null; then
    echo "📦 Installing sqlx-cli..."
    cargo install sqlx-cli --no-default-features --features rustls,postgres
else
    echo "✅ sqlx-cli already installed."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and update the .env file with your configuration"
echo "2. Start the development environment:"
echo "   ./scripts/dev.sh"
echo ""
echo "Or start services manually:"
echo "   ./scripts/start-db.sh    # Start PostgreSQL"
echo "   ./scripts/migrate.sh     # Run database migrations"
echo "   ./scripts/run.sh         # Start the Rust application"