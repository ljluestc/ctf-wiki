#!/bin/bash

# Deploy to Kubernetes
set -e

echo "☸️  Deploying Rust Blog to Kubernetes..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if kustomize is available
if ! command -v kustomize &> /dev/null; then
    echo "⚠️  kustomize not found, using kubectl with -k flag"
    KUSTOMIZE_CMD="kubectl apply -k"
else
    KUSTOMIZE_CMD="kustomize build k8s/ | kubectl apply -f -"
fi

# Build and apply Kubernetes manifests
echo "🔧 Applying Kubernetes manifests..."
cd k8s/
kubectl apply -k .

echo "⏳ Waiting for deployments to be ready..."

# Wait for PostgreSQL to be ready
echo "🐘 Waiting for PostgreSQL..."
kubectl wait --for=condition=ready pod -l app=postgres -n rust-blog --timeout=300s

# Wait for the application to be ready
echo "🦀 Waiting for Rust Blog application..."
kubectl wait --for=condition=ready pod -l app=rust-blog-app -n rust-blog --timeout=300s

echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Checking deployment status..."
kubectl get pods -n rust-blog
echo ""
kubectl get services -n rust-blog
echo ""

# Get the service URL
echo "🌐 Service endpoints:"
echo "Application: http://localhost (if using port-forward or ingress)"
echo ""
echo "To access the application locally:"
echo "  kubectl port-forward service/rust-blog-service 8080:80 -n rust-blog"
echo "  Then visit: http://localhost:8080"
echo ""
echo "To check logs:"
echo "  kubectl logs -l app=rust-blog-app -n rust-blog -f"