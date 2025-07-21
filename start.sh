#!/bin/bash
echo "🚀 Starting IoT News API with MongoDB..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
mkdir -p logs

# Start the services
echo "📦 Building and starting containers..."
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."
sleep 30

echo "🔍 Checking service health..."
docker-compose ps

echo ""
echo "✅ IoT News API is starting up!"
echo "🌐 API URL: http://localhost:3000"
echo "📊 Health Check: http://localhost:3000/health"
echo "🗄️  MongoDB Admin: http://localhost:8081 (admin/password123)"
echo ""
echo "📋 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart: docker-compose restart"
echo ""
echo "⏱️  The API will start fetching RSS feeds automatically in ~10 seconds"
