#!/bin/sh

# Replace environment variables in built files
# This script runs in the Docker container to inject runtime environment variables

echo "🔧 Injecting environment variables..."

# Find all JS files in the build directory
find /usr/share/nginx/html -name "*.js" -exec sed -i "s|REACT_APP_API_BASE_URL_PLACEHOLDER|${REACT_APP_API_BASE_URL}|g" {} \;

echo "✅ Environment variables injected successfully!"