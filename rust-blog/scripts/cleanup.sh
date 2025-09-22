#!/bin/bash

# Cleanup script for development environment
set -e

echo "🧹 Cleaning up Rust Blog development environment..."

# Stop and remove Docker containers
echo "🐳 Stopping Docker containers..."
docker-compose down -v

# Remove Docker images (optional)
read -p "Do you want to remove Docker images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing Docker images..."
    docker rmi rust-blog:latest 2>/dev/null || echo "rust-blog:latest image not found"
    docker rmi postgres:15-alpine 2>/dev/null || echo "postgres:15-alpine image not found"
fi

# Clean up Kubernetes resources (if deployed)
read -p "Do you want to clean up Kubernetes resources? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v kubectl &> /dev/null; then
        echo "☸️  Cleaning up Kubernetes resources..."
        kubectl delete namespace rust-blog --ignore-not-found=true
    else
        echo "⚠️  kubectl not found, skipping Kubernetes cleanup"
    fi
fi

# Clean Rust build artifacts
echo "🦀 Cleaning Rust build artifacts..."
cargo clean

echo "✅ Cleanup completed!"