text
# 🐳 IoT News API - Docker Quick Start

## Prerequisites
- Docker Desktop installed
- At least 2GB free RAM
- Internet connection

## 🚀 One-Command Startup

Clone and start
git clone <your-repo>
cd IOT-NEWS
chmod +x start.sh
./start.sh

text

## 🔍 Verify Everything is Working

Check API health
curl http://localhost:3000/health

Get latest articles
curl "http://localhost:3000/api/v1/articles?limit=5"

View logs
docker-compose logs -f iot-news-api

text

## 🛠️ Management Commands

Stop everything
docker-compose down

Start again
docker-compose up -d

View all services
docker-compose ps

Restart just the API
docker-compose restart iot-news-api

text

## 📊 Access Points
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health  
- **MongoDB Admin**: http://localhost:8081
- **API Documentation**: http://localhost:3000