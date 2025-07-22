# IoT News Aggregator & Dashboard Platform

**A comprehensive IoT news platform with REST API and web dashboard, featuring real-time RSS aggregation, advanced image extraction, and intelligent content management. Built by [IoTCommunity.Space](https://iotcommunity.space/).**

### For News Consumers
- **Beautiful Web Dashboard** - Browse IoT news with modern, responsive interface
- **Advanced Search & Filtering** - Find articles by keywords, sources, categories, dates
- **Real-time Updates** - Latest IoT industry news automatically aggregated
- **Mobile-Friendly** - Optimized for all devices and screen sizes

### For Developers
- **REST API** - Complete programmatic access to all news data
- **Multiple Storage Options** - In-memory (development) or MongoDB (production)
- **Easy Integration** - Clean, documented endpoints with JSON responses
- **Auto-Installation** - One-command setup with dependency auto-install

### For Enterprises
- **Scalable Architecture** - Handle millions of articles with MongoDB
- **Docker Deployment** - Production-ready containerization
- **Content Management** - Edit, categorize, and manage news articles
- **Analytics Dashboard** - Comprehensive statistics and insights

## Key Features

### Platform Features
- Dual Interface - Web dashboard + REST API
- Auto-Installation - Automatically installs Docker, Node.js, MongoDB if missing
- One-Command Deployment - `./start.sh` sets up everything
- IoTCommunity.Space Branding - Professional, branded interface
- Light Theme Design - Clean, modern UI with excellent readability

### RSS Aggregation
- 6+ Premium Sources - IoT Tech News, IoT Now, IoT Business News, AWS IoT Blog, etc.
- Real-time Monitoring - Automatic updates every 15 minutes
- Smart Duplicate Detection - Advanced content-based deduplication
- Image Extraction - Multi-strategy image extraction from articles and websites
- Content Enhancement - Automatic categorization and relevance scoring

### Storage & Performance
- Dual Storage - In-memory (dev) or MongoDB (production)
- High Performance - Sub-100ms API responses
- Data Persistence - Automatic backups and recovery
- Scalable Design - Handle unlimited articles with MongoDB

### Management Features
- CRUD Operations - Create, read, update, delete articles via dashboard
- Advanced Search - Full-text search with filtering options
- Statistics Dashboard - Comprehensive analytics and insights
- Error Handling - Robust error management with user-friendly messages

## Architecture Overview

```
IoT News Platform
├── Web Dashboard (Port 4000)
│   ├── Article Management (CRUD)
│   ├── Search & Filtering
│   ├── Statistics & Analytics
│   └── IoTCommunity.Space Branding
│
├── REST API (Port 3000)
│   ├── Articles Endpoints
│   ├── Source Statistics
│   ├── Category Analytics
│   └── System Health
│
├── Database Layer
│   ├── MongoDB (Production)
│   └── In-Memory (Development)
│
├── RSS Processing Engine
│   ├── Multi-source Aggregation
│   ├── Duplicate Detection
│   ├── Image Extraction
│   └── Content Enhancement
│
└── Docker Infrastructure
    ├── Web Dashboard Container
    ├── API Container
    ├── MongoDB Container
    └── MongoDB Admin Interface
```

## Project Structure

```
IoT-News-Aggregator-API/
├── dashboard/                  # Web Dashboard Application
│   ├── views/                    # EJS Templates
│   │   ├── home.ejs             # Article grid with search
│   │   ├── article.ejs          # Article view page
│   │   ├── edit.ejs             # Article editing form
│   │   ├── stats.ejs            # Analytics dashboard
│   │   └── error.ejs            # Error handling page
│   ├── public/css/              # Stylesheets
│   │   └── style.css            # Light theme styling
│   ├── package.json             # Dashboard dependencies
│   ├── Dockerfile               # Dashboard container
│   └── app.js                   # Dashboard server
│
├── routes/                    # API Routes
│   └── articles.js              # REST endpoints
│
├── services/                  # Core Business Logic
│   ├── rssParser.js             # Enhanced RSS processing
│   ├── enhancedImageExtractor.js # Multi-strategy image extraction
│   ├── duplicateDetector.js     # Content deduplication
│   ├── memoryDatabase.js        # In-memory storage
│   ├── databaseService.js       # MongoDB operations
│   └── scheduler.js             # Automated RSS fetching
│
├── models/                   # Database Models
│   └── Article.js               # Mongoose schema
│
├── docker/                   # Docker Configuration
│   └── mongo-init.js            # MongoDB initialization
│
├── logs/                     # Application Logs
│
├── Configuration Files
│   ├── docker-compose.yml       # Multi-container setup
│   ├── package.json             # API dependencies
│   ├── .env                     # Environment variables
│   └── .gitignore               # Git ignore rules
│
├── Deployment Scripts
│   ├── start.sh                 # Auto-install & start script
│   └── test-docker.sh           # Docker testing script
│
└── Documentation
    ├── README.md                # This comprehensive guide
    └── README-DOCKER.md         # Docker-specific instructions
```

## Quick Start (One Command)

### Instant Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/iotcommunity-space/IoT-News-Aggregator-API.git
cd IoT-News-Aggregator-API

# Auto-install everything and start (one command!)
./start.sh
```

**What this does:**
- Auto-detects your OS (Ubuntu, CentOS, Fedora, etc.)
- Installs Docker if missing
- Installs Docker Compose if missing  
- Installs Node.js & npm if missing
- Builds and starts all containers
- Performs health checks
- Shows you all access URLs

### Access Your Platform

After successful setup, access:

| Service | URL | Purpose |
|---------|-----|---------|
| **Web Dashboard** | http://localhost:4000 | Browse, search, edit articles |
| **REST API** | http://localhost:3000 | Programmatic access |
| **API Health** | http://localhost:3000/health | System status |
| **MongoDB Admin** | http://localhost:8081 | Database management |

**Default MongoDB Admin:** `admin` / `password123`

## Manual Installation (Alternative)

### Prerequisites

- **Docker** >= 20.0
- **Docker Compose** >= 2.0  
- **Node.js** >= 16.0 (for local development)
- **Git** (for cloning)

### Step-by-Step Setup

```bash
# 1. Clone repository
git clone https://github.com/iotcommunity-space/IoT-News-Aggregator-API.git
cd IoT-News-Aggregator-API

# 2. Install Docker (if needed)
# Ubuntu/Debian:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Install Docker Compose (if needed)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Start the platform
docker-compose up --build -d

# 5. Wait for startup (about 45 seconds)
sleep 45

# 6. Check status
docker-compose ps
```

### Verify Installation

```bash
# Test API
curl http://localhost:3000/health

# Test Dashboard  
curl http://localhost:4000/health

# Check article count
curl "http://localhost:3000/api/v1/articles?limit=1"
```

## Web Dashboard Guide

### Homepage Features

- **Statistics Overview** - Total articles, sources, categories
- **Advanced Search** - Keywords, sources, categories, date ranges
- **Article Grid** - Responsive cards with images and metadata
- **Category Filtering** - Quick category-based filtering
- **Pagination** - Navigate through large article collections

### Article Management

#### View Articles
- **Full Content Display** - Complete article with images
- **Source Attribution** - Links to original sources
- **Metadata Display** - Author, publication date, categories
- **Social Sharing** - Share to Twitter, LinkedIn
- **Print-Friendly** - Optimized for printing

#### Edit Articles
- **Rich Text Editing** - Modify title, content, excerpt
- **Category Management** - Add/remove categories and tags
- **Author Information** - Update author details
- **Image Management** - Featured image and gallery
- **Preview Mode** - Preview changes before saving

#### Delete Articles
- **Confirmation Modal** - Prevent accidental deletions
- **Batch Operations** - Delete multiple articles
- **Soft Delete Option** - Mark as inactive instead of permanent deletion

### Analytics Dashboard

- **Article Trends** - Publication trends over time
- **Source Statistics** - Articles per source with activity
- **Category Distribution** - Popular topics and tags
- **Search Analytics** - Popular search terms
- **System Performance** - Response times and health metrics

## REST API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Articles Endpoints

#### GET `/articles` - List Articles
Retrieve paginated articles with advanced filtering.

**Query Parameters:**
```javascript
{
  page: 1,                    // Page number (default: 1)
  limit: 20,                  // Items per page (max: 50)
  search: "artificial intelligence", // Search keywords
  source: "iottechnews.com",  // Filter by source domain
  category: "AI",             // Filter by category
  author: "John Smith",       // Filter by author
  start_date: "2025-07-01",   // Articles after date
  end_date: "2025-07-31",     // Articles before date
  include_duplicates: false   // Include duplicate articles
}
```

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/articles?search=security&limit=5&source=iottechnews.com"
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "a1b2c3d4e5f6g7h8",
        "title": "Latest IoT Security Breakthrough",
        "url": "https://example.com/article",
        "source": {
          "name": "IoT Tech News",
          "domain": "iottechnews.com",
          "feedUrl": "https://iottechnews.com/feed/"
        },
        "author": "John Smith",
        "publishedAt": "2025-07-20T14:30:00.000Z",
        "excerpt": "Revolutionary security protocol for IoT devices...",
        "content": "Full HTML content...",
        "featuredImage": {
          "url": "https://cdn.example.com/image.jpg",
          "alt": "Security diagram",
          "caption": "IoT Security Architecture"
        },
        "images": [
          {
            "url": "https://cdn.example.com/diagram.png", 
            "alt": "Technical diagram",
            "caption": "System overview"
          }
        ],
        "categories": ["Security", "IoT", "Technology"],
        "tags": ["cybersecurity", "iot-devices", "encryption"],
        "commentCount": 12,
        "isDuplicate": false,
        "relevanceScore": 0.95,
        "createdAt": "2025-07-20T14:35:00.000Z",
        "updatedAt": "2025-07-20T14:35:00.000Z"
      }
    ],
    "meta": {
      "total": 1547,
      "page": 1, 
      "pages": 78,
      "per_page": 20,
      "sources": 6,
      "last_updated": "2025-07-20T15:00:00.000Z"
    }
  }
}
```

#### GET `/articles/sources` - Source Statistics
Get activity statistics for all RSS sources.

**Example Request:**
```bash
curl "http://localhost:3000/api/v1/articles/sources"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sources": [
      {
        "_id": "iottechnews.com",
        "name": "IoT Tech News", 
        "count": 245,
        "latestArticle": "2025-07-20T14:30:00.000Z"
      },
      {
        "_id": "iot-now.com",
        "name": "IoT Now",
        "count": 189, 
        "latestArticle": "2025-07-20T13:45:00.000Z"
      }
    ],
    "total": 6
  }
}
```

#### GET `/articles/categories` - Category Analytics
Get category distribution and popularity.

#### GET `/articles/stats` - System Statistics
Comprehensive system health and performance metrics.

#### POST `/articles/refresh` - Manual Refresh
Trigger immediate RSS feed refresh.

### System Endpoints

#### GET `/health` - Health Check
```bash
curl "http://localhost:3000/health"
```

**Response:**
```json
{
  "status": "healthy",
  "storage": "mongodb",
  "timestamp": "2025-07-20T15:00:00.000Z",
  "uptime": 3847.2,
  "memory": {
    "rss": 89792512,
    "heapTotal": 50970624,
    "heapUsed": 30906600
  },
  "scheduler": {
    "isRunning": false,
    "lastRun": "2025-07-20T14:45:00.000Z",
    "totalRuns": 156
  }
}
```

## Storage Configuration

### Development Mode (In-Memory)

Perfect for quick testing and development.

**Features:**
- Zero Setup - No database installation needed
- Lightning Fast - Sub-millisecond queries  
- File Persistence - Data survives restarts
- Automatic Backups - Saves to `./data/articles.json`

**Configuration:**
```bash
# Automatically used when MongoDB is not available
# No additional setup required
npm run dev
```

### Production Mode (MongoDB)

Scalable solution for production deployments.

**Features:**
- Unlimited Scale - Handle millions of articles
- ACID Compliance - Data consistency guarantees
- Advanced Queries - Complex aggregations and analytics
- High Availability - Clustering and replication support
- Enterprise Security - Authentication and encryption

**Configuration:**
```yaml
# docker-compose.yml automatically sets up:
# - MongoDB 4.4 (AVX-compatible)
# - MongoDB Express admin interface
# - Optimized indexes and schema
# - Automatic health checks
```

## RSS Sources

### Current Premium Sources

| Source | Focus Area | Update Frequency |
|--------|------------|------------------|
| **IoT Tech News** | Latest technology developments | Multiple daily |
| **IoT Now** | Enterprise IoT solutions | Daily |
| **IoT Business News** | Business and market insights | Daily |
| **IoT Insider** | Industry analysis | Multiple daily |
| **AWS IoT Blog** | Cloud IoT tutorials | Weekly |
| **Connected World** | IoT ecosystem coverage | Daily |

### Adding New Sources

1. **Update Environment Variables:**
```env
RSS_FEEDS=existing-feeds,https://new-source.com/feed/
```

2. **Restart Services:**
```bash
docker-compose restart
```

3. **Verify Feed:**
```bash
curl -X POST "http://localhost:3000/api/v1/articles/refresh"
```

## Configuration Options

### Environment Variables

Create `.env` file for custom configuration:

```env
# === Server Configuration ===
PORT=3000
NODE_ENV=production
API_VERSION=v1

# === RSS Feed Sources ===
RSS_FEEDS=https://iottechnews.com/feed/,https://www.iot-now.com/feed/,https://iotbusinessnews.com/feed/,https://www.iotinsider.com/category/news/feed/,https://aws.amazon.com/blogs/iot/feed/,https://connectedworld.com/feed/

# === Database Configuration ===
MONGODB_URI=mongodb://mongodb:27017/iot_news_api

# === API Pagination ===
MAX_ARTICLES_PER_PAGE=50
DEFAULT_ARTICLES_PER_PAGE=20

# === Performance Settings ===
CACHE_TTL=300
RSS_FETCH_INTERVAL=*/15 * * * *

# === Dashboard Configuration ===
DASHBOARD_PORT=4000

# === Memory Storage (Development) ===
MAX_ARTICLES_IN_MEMORY=10000
AUTO_SAVE_INTERVAL=300000
DATA_PERSISTENCE_ENABLED=true
```

### Scheduling Options

```env
# Every 15 minutes (default)
RSS_FETCH_INTERVAL=*/15 * * * *

# Every hour at minute 0
RSS_FETCH_INTERVAL=0 * * * *

# Twice daily at 9 AM and 6 PM
RSS_FETCH_INTERVAL=0 9,18 * * *

# Every 5 minutes (for testing)
RSS_FETCH_INTERVAL=*/5 * * * *
```

## Docker Deployment

### Production Deployment

```bash
# Clone repository
git clone https://github.com/iotcommunity-space/IoT-News-Aggregator-API.git
cd IoT-News-Aggregator-API

# Production environment
export NODE_ENV=production

# Start with production settings
docker-compose up -d

# Scale dashboard service (if needed)
docker-compose up -d --scale iot-news-dashboard=3
```

### Service Management

```bash
# View service status
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f iot-news-api
docker-compose logs -f iot-news-dashboard

# Restart services
docker-compose restart

# Update and restart
docker-compose down
git pull
docker-compose up --build -d

# Scale services
docker-compose up -d --scale iot-news-dashboard=2
```

### Health Monitoring

```bash
# Check all services
docker-compose ps

# API health check
curl http://localhost:3000/health

# Dashboard health check  
curl http://localhost:4000/health

# MongoDB health check
curl http://localhost:8081

# Container resource usage
docker stats
```

## Performance & Scaling

### Performance Metrics

| Metric | In-Memory | MongoDB |
|--------|-----------|---------|
| **API Response Time** | <50ms | <100ms |
| **Concurrent Users** | 50+ | 500+ |
| **Article Capacity** | 10,000 | Unlimited |
| **Search Performance** | <10ms | <50ms |
| **Memory Usage** | 200MB | 100MB |

### Scaling Strategies

**Horizontal Scaling:**
```bash
# Scale API instances
docker-compose up -d --scale iot-news-api=3

# Scale Dashboard instances  
docker-compose up -d --scale iot-news-dashboard=2

# Load balancer configuration (nginx/Apache)
# Distribute traffic across multiple instances
```

**Vertical Scaling:**
```yaml
# docker-compose.yml
services:
  iot-news-api:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## Security Best Practices

### Production Security

```bash
# 1. Change default MongoDB credentials
# docker-compose.yml
MONGO_INITDB_ROOT_USERNAME=secure_admin
MONGO_INITDB_ROOT_PASSWORD=strong_password_here

# 2. Use environment secrets
echo "MONGODB_PASSWORD=secure_password" > .env.secret
echo ".env.secret" >> .gitignore

# 3. Enable MongoDB authentication
# In production, configure MongoDB with authentication:
MONGODB_URI=mongodb://username:password@mongodb:27017/iot_news_api

# 4. Use HTTPS in production
# Configure reverse proxy (nginx) with SSL certificates

# 5. Regular updates
docker-compose pull  # Update images
git pull            # Update code
```

## Testing & Debugging

### Development Testing

```bash
# Start in development mode
npm run dev

# Test API endpoints
curl "http://localhost:3000/api/v1/articles?limit=5"
curl "http://localhost:3000/health"

# Test search functionality
curl "http://localhost:3000/api/v1/articles?search=IoT&category=Security"

# Manual RSS refresh
curl -X POST "http://localhost:3000/api/v1/articles/refresh"
```

### Debugging Commands

```bash
# View container logs
docker-compose logs -f iot-news-api
docker-compose logs -f iot-news-dashboard

# Access container shell
docker-compose exec iot-news-api bash
docker-compose exec iot-news-dashboard bash

# MongoDB shell access
docker-compose exec mongodb mongo

# Check container resources
docker stats

# Restart specific service
docker-compose restart iot-news-api
```

### Load Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API performance (1000 requests, 10 concurrent)
ab -n 1000 -c 10 http://localhost:3000/api/v1/articles

# Test dashboard performance
ab -n 500 -c 5 http://localhost:4000/

# Test with search parameters
ab -n 100 -c 10 "http://localhost:3000/api/v1/articles?search=IoT&limit=20"
```

## Troubleshooting Guide

### Common Issues

#### Port Already in Use
```bash
# Error: Port 3000/4000 already in use
sudo lsof -i :3000
sudo lsof -i :4000

# Kill processes using ports
sudo kill -9 $(sudo lsof -t -i:3000)
sudo kill -9 $(sudo lsof -t -i:4000)

# Or use different ports
export PORT=3001
export DASHBOARD_PORT=4001
```

#### Docker Permission Issues
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Or run with sudo
sudo docker-compose up -d
```

#### MongoDB Connection Issues
```bash
# Check MongoDB container
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb

# Check network connectivity
docker-compose exec iot-news-api ping mongodb
```

#### RSS Feed Timeouts
```bash
# Check RSS feed accessibility
curl -I https://iottechnews.com/feed/

# View RSS parser logs
docker-compose logs iot-news-api | grep "RSS"

# Test manual refresh
curl -X POST "http://localhost:3000/api/v1/articles/refresh"
```

### Recovery Commands

```bash
# Complete reset (removes all data)
docker-compose down -v
docker system prune -a
./start.sh

# Restart services only
docker-compose restart

# Rebuild containers
docker-compose down
docker-compose up --build -d

# Reset MongoDB data only
docker-compose down
docker volume rm $(docker volume ls -q | grep mongodb)
docker-compose up -d
```

## Contributing

### Development Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/IoT-News-Aggregator-API.git
cd IoT-News-Aggregator-API

# 3. Create feature branch
git checkout -b feature-your-feature-name

# 4. Install dependencies
npm install
cd dashboard && npm install && cd ..

# 5. Start development servers
npm run dev  # API server
cd dashboard && npm run dev  # Dashboard server

# 6. Make changes and test
# 7. Commit and push
git add .
git commit -m "feat: your feature description"
git push origin feature-your-feature-name

# 8. Create Pull Request on GitHub
```

### Code Standards

- ES6+ JavaScript with modern syntax
- Async/Await for asynchronous operations  
- Error Handling for all external API calls
- JSDoc Comments for complex functions
- Consistent Formatting with Prettier
- Descriptive Commit Messages following conventional commits

### Areas for Contribution

- **New RSS Sources** - Add more IoT news sources
- **UI/UX Improvements** - Enhance dashboard design
- **Advanced Analytics** - More detailed statistics
- **Search Enhancement** - Better search algorithms
- **Mobile App** - React Native or Flutter app
- **API Extensions** - Additional endpoints and features
- **Testing** - Unit tests and integration tests
- **Documentation** - Improve guides and examples

## License & Legal

### MIT License

```
MIT License

Copyright (c) 2025 IoTCommunity.Space

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Content Attribution

- **RSS Feeds** - All article content remains property of original publishers
- **Fair Use** - Content aggregation falls under fair use for informational purposes
- **Attribution** - All articles include links to original sources
- **No Redistribution** - Platform aggregates and links; does not republish content

## Support & Community

### Getting Help

| Resource | URL | Purpose |
|----------|-----|---------|
| **Bug Reports** | [GitHub Issues](https://github.com/iotcommunity-space/IoT-News-Aggregator-API/issues) | Report bugs and issues |
| **Feature Requests** | [GitHub Discussions](https://github.com/iotcommunity-space/IoT-News-Aggregator-API/discussions) | Suggest new features |
| **Documentation** | This README | Comprehensive setup guide |
| **IoT Community** | [IoTCommunity.Space](https://iotcommunity.space/) | Join our IoT community |

### Quick Links

- **Quick Start:** [One-command setup](#quick-start-one-command)
- **Dashboard Guide:** [Web interface usage](#web-dashboard-guide)
- **API Docs:** [REST API reference](#rest-api-documentation)
- **Docker Setup:** [Container deployment](#docker-deployment)
- **Configuration:** [Environment setup](#configuration-options)

## What's Next?

### Immediate Use Cases

1. **News Portal** - Deploy as company IoT news portal
2. **API Integration** - Integrate IoT news into existing applications  
3. **Market Research** - Analyze IoT industry trends and topics
4. **Enterprise Dashboard** - Internal IoT intelligence platform
5. **Mobile Backend** - Power mobile IoT news applications

### Future Roadmap

- **AI Integration** - GPT-powered article summarization
- **Advanced Analytics** - Sentiment analysis and trend prediction  
- **Smart Search** - Semantic search with vector embeddings
- **Mobile Apps** - Native iOS and Android applications
- **Multi-language** - Support for international IoT sources
- **Real-time Notifications** - WebSocket-based live updates

---

# Built with care by IoTCommunity.Space

### [Visit IoTCommunity.Space](https://iotcommunity.space/)

**Building the future of IoT together**

### Star this project on GitHub to support IoT innovation!
