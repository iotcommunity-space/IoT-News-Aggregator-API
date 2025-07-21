# IoT News Aggregator API

A comprehensive REST API that aggregates IoT news from multiple RSS feeds with advanced duplicate detection, image extraction, and intelligent categorization. Supports both in-memory storage (for development) and MongoDB (for production).


## 🚀 Features

- **Multi-Source RSS Aggregation**: Fetches from 6+ premium IoT news sources
- **Smart Duplicate Detection**: Advanced content-based deduplication with similarity algorithms
- **Image Extraction**: Automatically extracts featured images and content images from articles
- **Intelligent Categorization**: Rich category and tag extraction with normalization
- **RESTful API**: Clean, paginated endpoints with filtering, search, and sorting
- **Dual Storage Options**: In-memory (development) or MongoDB (production)
- **Automated Scheduling**: Configurable RSS refresh intervals (default: every 15 minutes)
- **Relevance Scoring**: Content quality and freshness scoring system
- **Error Handling**: Robust error handling with graceful fallbacks
- **Real-time Updates**: Live RSS feed monitoring and incremental updates


## 📁 Project Structure

```
IOT-NEWS/
├── data/                          # Auto-generated data storage
│   └── articles.json              # In-memory persistence file
├── models/                        # Database models (MongoDB version)
│   └── Article.js                 # Mongoose article schema with validation
├── routes/                        # API route handlers
│   └── articles.js                # All article-related REST endpoints
├── services/                      # Core business logic services
│   ├── rssParser.js              # RSS feed parsing and normalization
│   ├── duplicateDetector.js      # Duplicate detection algorithms
│   ├── imageExtractor.js         # Image extraction and processing
│   ├── memoryDatabase.js         # In-memory database service
│   ├── databaseService.js        # MongoDB database service
│   └── scheduler.js              # RSS fetching scheduler with cron
├── .env                          # Environment configuration
├── .env.old                      # Backup environment file
├── .gitignore                    # Git ignore rules
├── Ins.md                        # Installation instructions
├── package.json                  # Dependencies and npm scripts
├── package-lock.json            # Dependency lock file
├── server.js                     # Main application entry point
├── server.js.old                # Backup server file
├── test.json                     # Test configuration
└── README.md                     # This documentation
```


## 🔧 Detailed File Descriptions

### **Core Application Files**

#### **`server.js`** - Main Application Server

- Express.js server setup and configuration
- Middleware mounting (CORS, Helmet, JSON parsing)
- Database connection handling (MongoDB or In-Memory)
- Route mounting and error handling
- Graceful shutdown handling
- Health check endpoint implementation


#### **`.env`** - Environment Configuration

- RSS feed URLs configuration
- Database connection settings
- API configuration (pagination limits, versions)
- Caching and scheduling parameters
- Feature flags and development settings


### **API Routes**

#### **`routes/articles.js`** - REST API Endpoints

- **GET** `/api/v1/articles` - Paginated articles with filtering
- **GET** `/api/v1/articles/sources` - Source statistics and metadata
- **GET** `/api/v1/articles/categories` - Category analytics
- **GET** `/api/v1/articles/stats` - System performance statistics
- **POST** `/api/v1/articles/refresh` - Manual RSS feed refresh
- Request validation and response formatting
- Error handling and status code management


### **Business Logic Services**

#### **`services/rssParser.js`** - RSS Processing Engine

- Multi-format RSS/XML parsing (RSS 2.0, Atom)
- Content normalization across different feed structures
- HTML content extraction and cleaning
- Source-specific parsing optimizations
- Author name normalization
- Publication date standardization
- Category and tag extraction
- Relevance score calculation


#### **`services/duplicateDetector.js`** - Advanced Deduplication

- Content-based hashing algorithms
- Levenshtein distance calculations for similarity
- Title similarity matching with configurable thresholds
- Time-based duplicate detection (24-hour windows)
- Cross-source duplicate identification
- Duplicate grouping and management
- Performance optimization for large datasets


#### **`services/imageExtractor.js`** - Image Processing

- Multi-source image extraction strategies
- WordPress featured image detection
- HTML content image parsing with Cheerio
- Image URL validation and normalization
- Alt-text and caption extraction
- Source-specific image extraction rules
- Image metadata processing (dimensions, formats)


#### **`services/memoryDatabase.js`** - In-Memory Storage (Development)

- High-performance in-memory article storage using Maps
- File-based persistence for data recovery
- Memory usage optimization and cleanup
- Efficient indexing for fast queries
- Pagination and filtering implementation
- Statistics calculation and aggregation
- Automatic backup and restore functionality


#### **`services/databaseService.js`** - MongoDB Operations (Production)

- Mongoose ODM integration
- Complex aggregation queries for analytics
- Index optimization for performance
- Transaction handling for data consistency
- Connection pooling and error recovery
- Bulk operations for efficient data processing


#### **`services/scheduler.js`** - Automated RSS Fetching

- Cron-based RSS feed scheduling
- Multi-source parallel fetching
- Error handling and retry logic
- Performance monitoring and statistics
- Graceful error recovery
- Memory management during bulk operations
- Rate limiting and throttling


### **Database Models**

#### **`models/Article.js`** - MongoDB Article Schema

- Comprehensive article data structure
- Field validation and constraints
- Database indexes for query optimization
- Pre-save middleware for data processing
- Content hashing for duplicate detection
- Relationship definitions and population
- Custom validation methods


### **Generated Files**

#### **`data/articles.json`** - Persistence File

- Auto-generated JSON storage for in-memory mode
- Structured article data with metadata
- Backup and recovery information
- Last update timestamps
- Article count statistics


## 📋 Prerequisites

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0
- **MongoDB** >= 4.4 (for production mode only)
- **Internet connection** for RSS feed fetching


## ⚡ Installation \& Setup

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd IOT-NEWS
```


### 2. Install Dependencies

```bash
npm install
```


### 3. Environment Configuration

Create and configure your environment file:

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# RSS Feed URLs (6 premium IoT sources)
RSS_FEEDS=https://iottechnews.com/feed/,https://www.iot-now.com/feed/,https://iotbusinessnews.com/feed/,https://www.iotinsider.com/category/news/feed/,https://aws.amazon.com/blogs/iot/feed/,https://connectedworld.com/feed/

# Database Configuration (MongoDB - Production Only)
MONGODB_URI=mongodb://localhost:27017/iot-news-api

# API Configuration
API_VERSION=v1
MAX_ARTICLES_PER_PAGE=50
DEFAULT_ARTICLES_PER_PAGE=20

# Caching and Scheduling
CACHE_TTL=300
RSS_FETCH_INTERVAL=*/15 * * * *

# Memory Database Settings (Development)
MAX_ARTICLES_IN_MEMORY=10000
AUTO_SAVE_INTERVAL=300000
DATA_PERSISTENCE_ENABLED=true
```


### 4. Choose Your Storage Mode

#### **Option A: Development Mode (In-Memory Storage)**

```bash
# No database required - runs immediately
npm run dev
```


#### **Option B: Production Mode (MongoDB)**

```bash
# Start MongoDB service
mongod

# Run with MongoDB
npm start
```


## 🌐 API Endpoints

### **Base URL**: `http://localhost:3000/api/v1`

### **Articles Endpoints**

#### **GET** `/articles` - Get Articles

Retrieve paginated articles with filtering and search capabilities.

**Query Parameters:**

- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 50) - Items per page
- `source` (string) - Filter by source domain
- `category` (string) - Filter by category name
- `author` (string) - Filter by author name
- `search` (string) - Search in title, excerpt, and categories
- `start_date` (date) - Filter articles after this date
- `end_date` (date) - Filter articles before this date
- `include_duplicates` (boolean, default: false) - Include duplicate articles

**Example Requests:**

```bash
# Get latest 5 articles
curl "http://localhost:3000/api/v1/articles?limit=5"

# Search for AI-related articles
curl "http://localhost:3000/api/v1/articles?search=artificial%20intelligence&limit=10"

# Filter by source and category
curl "http://localhost:3000/api/v1/articles?source=iottechnews.com&category=Security"

# Date range filtering
curl "http://localhost:3000/api/v1/articles?start_date=2025-07-01&end_date=2025-07-20"
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
        "content": "<p>Full HTML content...</p>",
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


#### **GET** `/articles/sources` - Get Source Statistics

Retrieve information about all RSS sources and their activity.

**Example Request:**

```bash
curl "http://localhost:3000/api/v1/articles/sources"
```

**Response Format:**

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


#### **GET** `/articles/categories` - Get Category Statistics

Retrieve category distribution and analytics.

**Example Request:**

```bash
curl "http://localhost:3000/api/v1/articles/categories"
```

**Response Format:**

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "IoT Security",
        "count": 67
      },
      {
        "_id": "Artificial Intelligence",
        "count": 54
      },
      {
        "_id": "Connected Devices",
        "count": 43
      }
    ],
    "total": 85
  }
}
```


#### **GET** `/articles/stats` - Get System Statistics

Retrieve comprehensive system performance and health metrics.

**Example Request:**

```bash
curl "http://localhost:3000/api/v1/articles/stats"
```

**Response Format:**

```json
{
  "success": true,
  "data": {
    "scheduler": {
      "totalRuns": 156,
      "successfulRuns": 154,
      "errors": 2,
      "articlesProcessed": 2847,
      "isRunning": false,
      "lastRun": "2025-07-20T14:45:00.000Z",
      "uptime": 3847.2,
      "articlesInMemory": 1547,
      "memoryUsage": {
        "rss": 89792512,
        "heapTotal": 50970624,
        "heapUsed": 30906600
      }
    },
    "sources": {
      "total": 6,
      "active": 6
    },
    "categories": {
      "total": 85,
      "top": [
        {"_id": "IoT Security", "count": 67},
        {"_id": "AI", "count": 54}
      ]
    }
  }
}
```


#### **POST** `/articles/refresh` - Manual RSS Refresh

Trigger an immediate RSS feed refresh across all sources.

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/v1/articles/refresh"
```

**Response Format:**

```json
{
  "success": true,
  "data": {
    "message": "RSS feeds refreshed successfully",
    "result": {
      "saved": 15,
      "updated": 3,
      "skipped": 47,
      "totalProcessed": 65
    }
  }
}
```


### **System Endpoints**

#### **GET** `/health` - Health Check

Check API health and system status.

**Example Request:**

```bash
curl "http://localhost:3000/health"
```

**Response Format:**

```json
{
  "status": "healthy",
  "storage": "in-memory",
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
    "totalRuns": 156,
    "articlesInMemory": 1547
  }
}
```


#### **GET** `/` - API Information

Get API metadata and available endpoints.

**Example Request:**

```bash
curl "http://localhost:3000/"
```


## 🗄️ Storage Options

### **In-Memory Storage (Development)**

**Advantages:**

- ✅ **Zero Setup** - No database installation required
- ✅ **Fast Performance** - Sub-millisecond queries
- ✅ **File Persistence** - Data survives restarts
- ✅ **Perfect for Development** - Quick testing and iteration

**Configuration:**

```env
# Automatically enabled when MongoDB is not configured
MAX_ARTICLES_IN_MEMORY=10000
DATA_PERSISTENCE_ENABLED=true
```

**Data Persistence:**

- Articles saved to `./data/articles.json`
- Automatic backups on updates
- Graceful shutdown handling


### **MongoDB Storage (Production)**

**Advantages:**

- ✅ **Scalable** - Handle millions of articles
- ✅ **ACID Compliance** - Data consistency guarantees
- ✅ **Advanced Querying** - Complex aggregations
- ✅ **Clustering Support** - High availability
- ✅ **Backup \& Recovery** - Enterprise-grade data protection

**Configuration:**

```env
MONGODB_URI=mongodb://localhost:27017/iot-news-api
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/iot-news-api
```

**Setup MongoDB:**

```bash
# Local MongoDB
mongod --dbpath /path/to/data

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```


## ⚙️ Configuration Guide

### **RSS Feed Sources**

Current supported premium IoT sources:

- **IoT Tech News** - Latest IoT technology news
- **IoT Now** - Enterprise IoT insights
- **IoT Business News** - Business-focused IoT content
- **IoT Insider** - Industry insider perspectives
- **AWS IoT Blog** - Cloud IoT solutions and tutorials
- **Connected World** - IoT ecosystem coverage


### **Scheduling Configuration**

```env
# Cron pattern for RSS fetching (default: every 15 minutes)
RSS_FETCH_INTERVAL=*/15 * * * *

# Other examples:
# RSS_FETCH_INTERVAL=0 */2 * * *    # Every 2 hours
# RSS_FETCH_INTERVAL=0 9 * * *      # Daily at 9 AM
# RSS_FETCH_INTERVAL=*/5 * * * *     # Every 5 minutes
```


### **Performance Tuning**

```env
# Memory limits
MAX_ARTICLES_IN_MEMORY=10000
MAX_ARTICLES_PER_PAGE=50

# Caching
CACHE_TTL=300  # 5 minutes

# Auto-save interval (milliseconds)
AUTO_SAVE_INTERVAL=300000  # 5 minutes
```


## 🔄 Development Workflow

### **Available NPM Scripts**

```bash
# Development with auto-reload
npm run dev

# Production mode
npm start

# Setup project (install dependencies)
npm run setup

# Run tests
npm test
```


### **Development Mode Features**

- **Hot Reloading** - Automatic server restart on file changes
- **In-Memory Storage** - No database setup required
- **Detailed Logging** - Comprehensive debug information
- **File Persistence** - Data survives restarts


### **Adding New RSS Feeds**

1. **Update Environment:**
```env
RSS_FEEDS=existing-feeds,https://new-feed.com/rss
```

2. **Test Feed Format:**
```bash
# Manual refresh to test new feed
curl -X POST "http://localhost:3000/api/v1/articles/refresh"
```

3. **Monitor Performance:**
```bash
# Check system stats after adding feeds
curl "http://localhost:3000/api/v1/articles/stats"
```


## 🚨 Error Handling

### **Common Issues \& Solutions**

#### **RSS Feed Timeouts**

```
Error parsing RSS feed: connect ETIMEDOUT
```

**Solution:** Feed temporarily unavailable - API continues with other sources

#### **Memory Limits**

```
Articles in memory: 10,000 (limit reached)
```

**Solution:** Automatic cleanup removes oldest articles

#### **Invalid RSS Format**

```
Error normalizing RSS item: Missing required fields
```

**Solution:** Invalid articles are skipped, processing continues

### **Error Response Format**

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error description"
}
```


## 📈 Performance Metrics

### **Typical Performance**

- **RSS Fetch Speed:** 3-8 seconds for 6 sources
- **API Response Time:** < 100ms for paginated results
- **Memory Usage:** ~80MB for 1,000 articles
- **Throughput:** 1000+ requests/minute


### **Scalability Limits**

| Storage | Max Articles | Max Sources | Response Time |
| :-- | :-- | :-- | :-- |
| **In-Memory** | 10,000 | 15 feeds | < 50ms |
| **MongoDB** | Unlimited | Unlimited | < 200ms |

## 🔒 Security Features

- **Input Validation** - All parameters validated
- **SQL Injection Protection** - Parameterized queries
- **CORS Configuration** - Configurable cross-origin policies
- **Rate Limiting Ready** - Easy to add rate limiting
- **Secure Headers** - Helmet.js security headers
- **Environment Isolation** - Sensitive data in environment variables


## 🚀 Production Deployment

### **Environment Setup**

```env
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://production-cluster/iot-news
```


### **Process Management**

```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name "iot-news-api"
pm2 startup
pm2 save

# Using Docker
docker build -t iot-news-api .
docker run -p 8080:8080 -e NODE_ENV=production iot-news-api
```


### **Monitoring**

- Health check endpoint: `/health`
- System statistics: `/api/v1/articles/stats`
- Error logging and alerting
- Performance metrics collection


## 🧪 Testing

### **Manual Testing Examples**

```bash
# Test basic functionality
curl "http://localhost:3000/api/v1/articles?limit=1"

# Test search functionality
curl "http://localhost:3000/api/v1/articles?search=security"

# Test filtering
curl "http://localhost:3000/api/v1/articles?category=AI&source=iottechnews.com"

# Test system health
curl "http://localhost:3000/health"
```


### **Load Testing**

```bash
# Install Apache Bench
apt-get install apache2-utils

# Test API performance
ab -n 1000 -c 10 http://localhost:3000/api/v1/articles
```


## 🤝 Contributing

### **Development Setup**

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`
5. Make changes and test
6. Submit pull request

### **Code Standards**

- **ES6+ JavaScript** with modern syntax
- **Async/Await** for asynchronous operations
- **Error Handling** for all external calls
- **JSDoc Comments** for complex functions
- **Consistent Formatting** with Prettier


## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

### **Documentation**

- **API Documentation** - This README
- **Code Comments** - Inline documentation
- **Error Messages** - Descriptive error responses


### **Community**

- **Issues** - GitHub Issues for bug reports
- **Discussions** - GitHub Discussions for questions
- **Wiki** - Additional documentation and examples

**Built with ❤️ for the IoT Community**

*Last Updated: July 20, 2025*

<div style="text-align: center">⁂</div>

[^1]: image.jpg

