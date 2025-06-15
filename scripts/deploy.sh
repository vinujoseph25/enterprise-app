#!/bin/bash

# Deployment script for different environments
set -e

ENVIRONMENT=${1:-staging}
BUILD_VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment to $ENVIRONMENT environment"
echo "📦 Version: $BUILD_VERSION"
echo "⏰ Timestamp: $TIMESTAMP"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."
npm run type-check
npm run lint
npm run test:ci

# Build application
echo "🏗️ Building application for $ENVIRONMENT..."
npm run build:$ENVIRONMENT

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf "deploy-$ENVIRONMENT-$BUILD_VERSION-$TIMESTAMP.tar.gz" \
    build/ \
    nginx.conf \
    scripts/env.sh \
    package.json

# Upload to deployment target
echo "⬆️ Uploading to $ENVIRONMENT..."
case $ENVIRONMENT in
    staging)
        # Add staging deployment logic
        echo "Deploying to staging server..."
        ;;
    production)
        # Add production deployment logic
        echo "Deploying to production server..."
        ;;
esac

echo "✅ Deployment to $ENVIRONMENT completed successfully!"