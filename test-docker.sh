#!/bin/bash

echo "🧪 Testing IoT News API Docker Setup..."

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
for i in {1..30}; do
    if curl -sf http://localhost:3000/health > /dev/null; then
        echo "✅ API is ready!"
        break
    fi
    sleep 2
done

# Test endpoints
echo "🔍 Testing API endpoints..."

echo "1. Health check:"
curl -s http://localhost:3000/health | jq .

echo -e "\n2. Get articles:"
curl -s "http://localhost:3000/api/v1/articles?limit=2" | jq '.data.meta'

echo -e "\n3. Get sources:"
curl -s "http://localhost:3000/api/v1/articles/sources" | jq '.data.total'

echo -e "\n4. Manual refresh:"
curl -X POST -s "http://localhost:3000/api/v1/articles/refresh" | jq '.success'

echo -e "\n✅ All tests completed!"
