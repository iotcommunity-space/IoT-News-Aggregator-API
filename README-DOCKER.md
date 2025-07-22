text
# 🐳 IoT News API - Docker Quick Start

## Prerequisites
- Docker Desktop installed
- At least 2GB free RAM
- Internet connection
- Node, Npm, Docker and Docker compose

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

- # Complete Docker Deployment Instructions

Based on your GitHub repository structure, you have everything ready for a **Docker-based deployment**. You **don't need to install MongoDB manually** - Docker will handle everything automatically!

## Prerequisites Check

First, ensure you have these installed on your Linux system:

```bash
# Check if Docker is installed
docker --version

# Check if Docker Compose is installed
docker-compose --version

# If not installed, install them:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 🎯 Step-by-Step Deployment Guide

### **Step 1: Clone and Navigate to Your Repository**

```bash
# Clone your repository
git clone https://github.com/yourusername/your-iot-news-repo.git
cd your-iot-news-repo

# Verify all files are present
ls -la
```

You should see:
```
├── docker/
├── models/
├── routes/
├── services/
├── .env
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server.js
├── start.sh
└── test-docker.sh
```

### **Step 2: Configure Environment Variables**

Ensure your `.env` file has the correct MongoDB connection for Docker:

```bash
# Edit your .env file
nano .env
```

Make sure it contains:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# MongoDB Configuration (Docker Compose)
MONGODB_URI=mongodb://mongodb:27017/iot_news_api

# RSS Feed URLs
RSS_FEEDS=https://iottechnews.com/feed/,https://www.iot-now.com/feed/,https://iotbusinessnews.com/feed/,https://www.iotinsider.com/category/news/feed/,https://aws.amazon.com/blogs/iot/feed/,https://connectedworld.com/feed/

# API Configuration
API_VERSION=v1
MAX_ARTICLES_PER_PAGE=50
DEFAULT_ARTICLES_PER_PAGE=20

# Cache Configuration
CACHE_TTL=300
RSS_FETCH_INTERVAL=*/15 * * * *
```

### **Step 3: Make Scripts Executable**

```bash
# Make startup scripts executable
chmod +x start.sh
chmod +x test-docker.sh
```

### **Step 4: Deploy with Docker Compose**

#### **Option A: One-Command Deployment (Recommended)**

```bash
# Run the startup script
./start.sh
```

#### **Option B: Manual Docker Commands**

```bash
# Build and start all services
docker-compose up --build -d

# View logs to monitor startup
docker-compose logs -f
```

### **Step 5: Wait for Services to Initialize**

The startup process takes about 30-60 seconds:

```bash
# Monitor the logs
docker-compose logs -f iot-news-api

# You should see:
# ✅ Connected to MongoDB
# 🚀 Starting IoT News API with MongoDB...
# 🌐 IoT News API server running on port 3000
```

### **Step 6: Verify Everything is Working**

#### **Check Container Status:**
```bash
docker-compose ps
```

Expected output:
```
NAME                   STATUS          PORTS
iot_news_api           Up             0.0.0.0:3000->3000/tcp
iot_news_mongodb       Up (healthy)   0.0.0.0:27017->27017/tcp
iot_news_mongo_express Up             0.0.0.0:8081->8081/tcp
```

#### **Test API Health:**
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "storage": "mongodb",
  "database": "connected",
  "timestamp": "2025-07-21T17:23:00.000Z"
}
```

#### **Test API Endpoints:**
```bash
# Get latest articles
curl "http://localhost:3000/api/v1/articles?limit=3"

# Check sources
curl "http://localhost:3000/api/v1/articles/sources"

# Manual RSS refresh
curl -X POST "http://localhost:3000/api/v1/articles/refresh"
```

### **Step 7: Run Complete Test Suite**

```bash
# Run automated tests
./test-docker.sh
```

## 🌐 Access Points

Once deployed, you can access:

| Service | URL | Purpose |
|---------|-----|---------|
| **Main API** | http://localhost:3000 | IoT News API endpoints |
| **Health Check** | http://localhost:3000/health | System health monitoring |
| **API Docs** | http://localhost:3000 | API information and endpoints |
| **MongoDB Admin** | http://localhost:8081 | Database management interface |

**MongoDB Admin Credentials:**
- Username: `admin`
- Password: `password123`

## 🔧 Management Commands

### **View Logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f iot-news-api
docker-compose logs -f mongodb
```

### **Restart Services:**
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart iot-news-api
```

### **Stop Services:**
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (complete reset)
docker-compose down -v
```

### **Update and Rebuild:**
```bash
# Pull latest code changes
git pull

# Rebuild and restart
docker-compose up --build -d
```

## 📊 Monitoring Your API

### **Real-time Performance:**
```bash
# Watch API stats
watch -n 5 'curl -s http://localhost:3000/api/v1/articles/stats | jq .data.scheduler'
```

### **RSS Fetch Monitoring:**
```bash
# Monitor RSS fetching
docker-compose logs -f iot-news-api | grep "RSS"
```

### **Database Stats:**
Visit http://localhost:8081 to see:
- Article count
- Database size
- Index performance
- Query statistics

## 🚨 Troubleshooting

### **Common Issues:**

#### **Port Already in Use:**
```bash
# Check what's using port 3000
sudo netstat -tulpn | grep :3000

# Kill the process or change port in docker-compose.yml
```

#### **Docker Permission Issues:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### **MongoDB Connection Failed:**
```bash
# Check MongoDB container
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

#### **API Not Fetching RSS:**
```bash
# Check RSS parser logs
docker-compose logs -f iot-news-api | grep "Fetching RSS"

# Manual trigger
curl -X POST http://localhost:3000/api/v1/articles/refresh
```

## 🎯 What Happens After Deployment

1. **MongoDB starts** with proper indexes and configuration
2. **API connects** to MongoDB automatically
3. **Initial RSS fetch** happens within 10 seconds
4. **Scheduled fetching** runs every 15 minutes
5. **Articles populate** and are available via API
6. **Duplicate detection** runs automatically
7. **Images extract** from supported sources

## 📈 Expected Performance

After 15-30 minutes, you should have:
- **50-100+ articles** from 6 IoT sources
- **Categories** automatically extracted
- **Images** processed where available
- **API responding** in <200ms
- **RSS fetching** every 15 minutes

## 🎉 Success Indicators

Your deployment is successful when:

✅ All 3 containers are running (`docker-compose ps`)
✅ Health check returns `"status": "healthy"`
✅ API returns articles (`curl localhost:3000/api/v1/articles`)
✅ MongoDB admin shows data (http://localhost:8081)
✅ RSS fetch logs show successful parsing

**You now have a production-ready IoT News API with MongoDB running entirely in Docker containers!** 🚀

**No manual MongoDB installation required** - Docker handles everything automatically.

# Monitor the Startup

# Watch the logs
docker-compose logs -f

# In another terminal, check status
docker-compose ps

# Diagnose Clean Up and Restart

# Remove old containers and volumes
docker-compose down -v

# Remove old images
docker rmi mongo:7.0 mongo-express:1.0.0-alpha

# Clean up
docker system prune -f

# Restart with new configuration
docker-compose up --build -d

