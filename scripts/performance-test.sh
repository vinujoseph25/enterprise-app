#!/bin/bash

# Performance testing script using Lighthouse CI
set -e

URL=${1:-http://localhost:3000}
OUTPUT_DIR="reports/lighthouse"

echo "⚡ Running performance tests on $URL"

# Create output directory
mkdir -p $OUTPUT_DIR

# Install Lighthouse CI if not present
if ! command -v lhci &> /dev/null; then
    echo "📦 Installing Lighthouse CI..."
    npm install -g @lhci/cli
fi

# Run Lighthouse CI
echo "🔍 Running Lighthouse audit..."
lhci autorun \
    --upload.target=filesystem \
    --upload.outputDir=$OUTPUT_DIR \
    --collect.url=$URL \
    --collect.numberOfRuns=3

echo "✅ Performance tests completed!"
echo "📊 Results saved to $OUTPUT_DIR"