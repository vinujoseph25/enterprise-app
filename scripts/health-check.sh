#!/bin/bash

# Health check script for deployed application
URL=${1:-http://localhost:3000}
MAX_ATTEMPTS=${2:-30}
WAIT_TIME=${3:-5}

echo "🔍 Performing health check on $URL"

for i in $(seq 1 $MAX_ATTEMPTS); do
    echo "Attempt $i/$MAX_ATTEMPTS..."
    
    if curl -f -s "$URL/health" > /dev/null; then
        echo "✅ Health check passed!"
        exit 0
    fi
    
    if [ $i -lt $MAX_ATTEMPTS ]; then
        echo "⏳ Waiting ${WAIT_TIME}s before next attempt..."
        sleep $WAIT_TIME
    fi
done

echo "❌ Health check failed after $MAX_ATTEMPTS attempts"
exit 1