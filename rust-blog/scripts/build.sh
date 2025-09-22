#!/bin/bash

# Build the Docker image for the Rust Blog
set -e

echo "🐳 Building Docker image for Rust Blog..."

# Get the current git commit hash for tagging (if in a git repo)
if git rev-parse --git-dir > /dev/null 2>&1; then
    COMMIT_HASH=$(git rev-parse --short HEAD)
    echo "📝 Git commit: $COMMIT_HASH"
else
    COMMIT_HASH="latest"
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t rust-blog:$COMMIT_HASH .
docker tag rust-blog:$COMMIT_HASH rust-blog:latest

echo "✅ Docker image built successfully!"
echo "🏷️  Tags: rust-blog:$COMMIT_HASH, rust-blog:latest"
echo ""
echo "To run the image:"
echo "  docker-compose up"
echo ""
echo "To push to a registry:"
echo "  docker tag rust-blog:latest your-registry/rust-blog:latest"
echo "  docker push your-registry/rust-blog:latest"