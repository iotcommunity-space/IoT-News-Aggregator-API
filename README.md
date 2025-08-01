# IoT News Aggregator & Dashboard Platform

**A comprehensive IoT news platform with secure authentication, user management, REST API and web dashboard, featuring real-time RSS aggregation, advanced image extraction, and intelligent content management. Built by [IoTCommunity.Space](https://iotcommunity.space/).**

### For News Consumers
- **Secure Web Dashboard** - Browse IoT news with modern, responsive interface and user authentication
- **Role-Based Access** - Admin and Editor roles with different permissions
- **Advanced Search & Filtering** - Find articles by keywords, sources, categories, dates
- **Real-time Updates** - Latest IoT industry news automatically aggregated every 15 minutes
- **Mobile-Friendly** - Optimized for all devices with light theme design

### For Administrators
- **Complete User Management** - Create, edit, delete users with role assignment
- **Profile Management** - Users can update their profiles and change passwords
- **Article Management** - Full CRUD operations with editor/admin permissions
- **Security Dashboard** - Session management and authentication monitoring
- **Analytics Dashboard** - Comprehensive statistics and system insights

### For Developers
- **REST API** - Complete programmatic access to all news data
- **Session Authentication** - Secure MongoDB-based session management
- **Multiple Storage Options** - In-memory (development) or MongoDB (production)
- **Easy Integration** - Clean, documented endpoints with JSON responses
- **Auto-Installation** - One-command setup with dependency auto-install

## Key Features

### Authentication System
- **Session-Based Authentication** - Secure login/logout with MongoDB session storage
- **Role-Based Access Control** - Admin and Editor roles with different permissions
- **User Profile Management** - Update profiles, change passwords with validation
- **Admin User Management** - Create, edit, activate/deactivate users
- **Password Security** - bcrypt hashing with strength requirements
- **Session Security** - HTTP-only cookies with configurable expiration

### Platform Features
- **Dual Interface** - Secure web dashboard + REST API
- **Auto-Installation** - Automatically installs Docker, Node.js, MongoDB if missing
- **One-Command Deployment** - `./start.sh` sets up everything including authentication
- **IoTCommunity.Space Branding** - Professional, branded interface with light theme
- **Dynamic URL Generation** - Works with localhost, LAN IPs, and custom domains

### RSS Aggregation
- **6+ Premium Sources** - IoT Tech News, IoT Now, IoT Business News, AWS IoT Blog, etc.
- **Real-time Monitoring** - Automatic updates every 15 minutes via cron scheduler
- **Smart Duplicate Detection** - Advanced content-based deduplication
- **Image Extraction** - Multi-strategy image extraction from articles and websites
- **Content Enhancement** - Automatic categorization and relevance scoring

### Storage & Performance
- **MongoDB Production Storage** - Scalable database with user and article collections
- **In-Memory Development** - Fast development mode with file persistence
- **High Performance** - Sub-100ms API responses with optimized queries
- **Data Persistence** - Automatic backups and recovery with MongoDB
- **Session Storage** - Secure session management in MongoDB

## Architecture Overview

```
IoT News Platform with Authentication
├── Secure Web Dashboard (Port 4000)
│   ├── User Authentication (Login/Logout)
│   ├── Profile Management (Edit Profile/Change Password)
│   ├── User Management (Admin Only)
│   ├── Article Management (Role-Based CRUD)
│   ├── Advanced Search & Filtering
│   ├── Statistics & Analytics Dashboard
│   └── IoTCommunity.Space Light Theme
│
├── REST API (Port 3000)
│   ├── Articles Endpoints
│   ├── Source Statistics
│   ├── Category Analytics
│   └── System Health Monitoring
│
├── Authentication Layer
│   ├── Session-Based Authentication
│   ├── Role-Based Access Control
│   ├── Password Security (bcrypt)
│   └── User Management System
│
├── Database Layer (MongoDB)
│   ├── Articles Collection
│   ├── Users Collection
│   ├── Sessions Collection
│   └── Indexes & Performance Optimization
│
├── RSS Processing Engine
│   ├── Multi-source Aggregation
│   ├── Duplicate Detection
│   ├── Image Extraction
│   └── Content Enhancement
│
└── Docker Infrastructure
    ├── Web Dashboard Container (with Auth)
    ├── API Container
    ├── MongoDB Container (with Authentication)
    └── MongoDB Admin Interface
```

## Quick Start (One Command)

### Instant Setup with Authentication (Recommended)

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
- Sets up environment variables for authentication
- Builds and starts all containers with authentication enabled
- Performs health checks on all services
- Shows you all access URLs

### Initial Authentication Setup

After successful deployment:

1. **Setup Admin User (First Time Only):**
   ```bash
   curl http://localhost:4000/setup-admin
   ```

2. **Default Admin Credentials:**
   - Username: `admin`
   - Password: `admin123`
   - **⚠️ Change these immediately after first login!**

### Access Your Platform

After successful setup, access:

| Service | URL | Purpose | Authentication |
|---------|-----|---------|----------------|
| **Web Dashboard** | http://localhost:4000 | Browse, search, edit articles | Required |
| **Dashboard Login** | http://localhost:4000/login | User authentication | - |
| **REST API** | http://localhost:3000 | Programmatic access | None |
| **API Health** | http://localhost:3000/health | System status | None |
| **MongoDB Admin** | http://localhost:8081 | Database management | Basic Auth |

**Default MongoDB Admin:** `admin` / `password123`

## Authentication & User Management

### User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access: user management, article CRUD, delete articles, system settings |
| **Editor** | Article management: create, read, update articles (cannot delete or manage users) |

### Authentication Features

#### For All Users
- **Secure Login/Logout** - Session-based authentication with bcrypt password hashing
- **Profile Management** - Update username, email, view account info
- **Password Change** - Change password with strength requirements and current password verification
- **Session Management** - 24-hour sessions with secure HTTP-only cookies

#### For Administrators
- **User Management Interface** - Create, edit, activate/deactivate, delete users
- **Role Assignment** - Assign Admin or Editor roles to users
- **User Search** - Find users quickly with real-time search
- **Account Security** - View user login history and account status
- **Bulk Operations** - Manage multiple users efficiently

### Security Configuration

Required environment variables in `.env`:

```env
# Authentication & Security Settings
SESSION_SECRET=your-super-secret-session-key-change-this-in-production-2024
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@iotcommunity.space

# Dashboard Configuration
DASHBOARD_PORT=4000
API_PORT=3000

# HTTPS Configuration (for production)
HTTPS=false
```

### User Management Guide

#### Accessing User Management
1. Login as an admin user
2. Click on your username in the top-right corner
3. Select "Manage Users" from the dropdown

#### Creating New Users
1. Click "Add New User" button
2. Fill in username, email, password
3. Select role (Admin or Editor)
4. Click "Create User"

#### Managing Existing Users
- **Edit Users** - Click the edit icon to modify user details
- **Toggle Status** - Activate/deactivate user accounts
- **Delete Users** - Remove users (cannot delete yourself)
- **Search Users** - Use the search box to find specific users

## Project Structure

```
IoT-News-Aggregator-API/
├── dashboard/                  # Secure Web Dashboard Application
│   ├── views/                    # EJS Templates
│   │   ├── home.ejs             # Article grid with navigation
│   │   ├── login.ejs            # Authentication page
│   │   ├── profile.ejs          # User profile management
│   │   ├── change-password.ejs  # Password change form
│   │   ├── manage-users.ejs     # User management (Admin)
│   │   ├── article.ejs          # Article view page
│   │   ├── edit.ejs             # Article editing form
│   │   ├── stats.ejs            # Analytics dashboard
│   │   └── error.ejs            # Error handling page
│   ├── public/css/              # Stylesheets
│   │   └── style.css            # Light theme styling with auth components
│   ├── package.json             # Dashboard dependencies (includes auth packages)
│   ├── Dockerfile               # Dashboard container
│   └── app.js                   # Dashboard server with authentication
│
├── routes/                    # API Routes
│   └── articles.js              # REST endpoints (no auth required)
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
│   ├── docker-compose.yml       # Multi-container setup with authentication
│   ├── avxsupport-docker-compose.yml # AVX-compatible version
│   ├── package.json             # API dependencies
│   ├── .env                     # Environment variables (includes auth config)
│   └── .gitignore               # Git ignore rules
│
├── Deployment Scripts
│   ├── start.sh                 # Auto-install & start script (includes auth setup)
│   └── test-docker.sh           # Docker testing script
│
└── Documentation
    ├── README.md                # This comprehensive guide
    └── README-DOCKER.md         # Docker-specific instructions
```

## Web Dashboard Guide

### Authentication Flow

#### First Login
1. Visit http://localhost:4000
2. If no admin user exists, visit http://localhost:4000/setup-admin
3. Use default credentials: `admin` / `admin123`
4. **Immediately change password** via Profile → Change Password

#### Daily Usage
1. Visit http://localhost:4000
2. Enter username and password
3. Access dashboard based on your role permissions
4. Logout when finished using the dropdown menu

### Navigation & User Interface

The dashboard includes a user-friendly navigation bar with:
- **Home** - Article grid and search
- **Statistics** - Analytics dashboard
- **API** - Direct link to REST API
- **User Dropdown** - Profile, password change, user management (admin), logout

### Homepage Features

- **User Welcome Message** - Personalized greeting with role badge
- **Statistics Overview** - Total articles, sources, categories
- **Advanced Search** - Keywords, sources, categories, date ranges
- **Article Grid** - Responsive cards with images and metadata
- **Category Filtering** - Quick category-based filtering
- **Pagination** - Navigate through large article collections
- **Role-Based Actions** - Edit/delete buttons based on permissions

### Article Management (Role-Based)

#### View Articles (All Users)
- **Full Content Display** - Complete article with images
- **Source Attribution** - Links to original sources
- **Metadata Display** - Author, publication date, categories
- **Social Sharing** - Share to social media platforms
- **Print-Friendly** - Optimized for printing

#### Edit Articles (Editors & Admins)
- **Rich Text Editing** - Modify title, content, excerpt
- **Category Management** - Add/remove categories and tags
- **Author Information** - Update author details
- **Image Management** - Featured image and gallery
- **Preview Mode** - Preview changes before saving
- **Edit History** - Track who made changes and when

#### Delete Articles (Admins Only)
- **Confirmation Modal** - Prevent accidental deletions
- **Audit Trail** - Log deletion actions
- **Soft Delete Option** - Archive instead of permanent deletion

### User Profile Management

#### Profile Page Features
- **Personal Information** - Username, email, role display
- **Account Statistics** - Join date, last login, account status
- **Profile Editing** - Update username and email with validation
- **Security Information** - Password last changed, session info

#### Password Management
- **Secure Password Change** - Current password verification required
- **Password Strength Meter** - Real-time strength validation
- **Requirements Display** - Clear password policy
- **Confirmation Matching** - Ensure password confirmation matches

### User Management (Admin Only)

#### User Management Interface
- **User List** - All users with status, role, and activity info
- **Real-time Search** - Find users instantly
- **User Creation** - Add new users with role assignment
- **Status Management** - Activate/deactivate accounts
- **User Editing** - Modify user details and roles
- **Bulk Operations** - Manage multiple users efficiently

#### Admin Dashboard Features
- **User Statistics** - Total users by role, active sessions
- **Security Monitoring** - Failed login attempts, suspicious activity
- **System Health** - Authentication system status
- **Session Management** - View and manage active sessions

### Analytics Dashboard

- **User Activity** - Login statistics, active users
- **Article Trends** - Publication trends over time
- **Source Statistics** - Articles per source with activity
- **Category Distribution** - Popular topics and tags
- **Search Analytics** - Popular search terms and filters
- **System Performance** - Response times and health metrics
- **Authentication Metrics** - Login success rates, session duration

## REST API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

**Note:** The REST API does not require authentication and remains publicly accessible for integration purposes.

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
  "timestamp": "2025-07-31T15:00:00.000Z",
  "uptime": 3847.2,
  "memory": {
    "rss": 89792512,
    "heapTotal": 50970624,
    "heapUsed": 30906600
  },
  "scheduler": {
    "isRunning": true,
    "lastRun": "2025-07-31T14:45:00.000Z",
    "totalRuns": 156,
    "totalArticles": 2547
  }
}
```

## Storage Configuration

### Production Mode (MongoDB) - Default

Scalable solution with authentication support.

**Features:**
- **User Management** - Stores users, sessions, and authentication data
- **Unlimited Scale** - Handle millions of articles and users
- **ACID Compliance** - Data consistency guarantees
- **Advanced Queries** - Complex aggregations and analytics
- **Session Storage** - Secure session management
- **High Availability** - Clustering and replication support
- **Enterprise Security** - Authentication and encryption

**MongoDB Collections:**
- `articles` - News articles with metadata
- `users` - User accounts with authentication data
- `sessions` - User session management

**Configuration:**
```yaml
# docker-compose.yml automatically sets up:
# - MongoDB 4.4 (AVX-compatible)
# - User and session collections
# - Authentication indexes
# - MongoDB Express admin interface
# - Optimized performance settings
```

### Development Mode (In-Memory)

For development and testing only (no authentication support).

**Features:**
- Zero Setup - No database installation needed
- Lightning Fast - Sub-millisecond queries  
- File Persistence - Data survives restarts
- Automatic Backups - Saves to `./data/articles.json`
- **Note:** No user management or authentication in this mode

## Configuration Options

### Complete Environment Variables

Create `.env` file for custom configuration:

```env
# === Server Configuration ===
PORT=3000
NODE_ENV=production
API_VERSION=v1

# === MongoDB Configuration ===
MONGODB_URI=mongodb://mongodb:27017/iot_news_api

# === RSS Feed Sources ===
RSS_FEEDS=https://iottechnews.com/feed/,https://www.iot-now.com/feed/,https://iotbusinessnews.com/feed/,https://www.iotinsider.com/category/news/feed/,https://aws.amazon.com/blogs/iot/feed/,https://connectedworld.com/feed/

# === API Configuration ===
MAX_ARTICLES_PER_PAGE=50
DEFAULT_ARTICLES_PER_PAGE=20

# === Performance Settings ===
CACHE_TTL=300
RSS_FETCH_INTERVAL=*/15 * * * *

# === MongoDB Settings ===
DB_MAX_POOL_SIZE=10
DB_SERVER_SELECTION_TIMEOUT=5000

# === Authentication & Security Settings ===
SESSION_SECRET=your-super-secret-session-key-change-this-in-production-2024
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@iotcommunity.space

# === Dashboard Configuration ===
DASHBOARD_PORT=4000
API_PORT=3000

# === MongoDB Admin Interface ===
MONGO_ADMIN_USER=admin
MONGO_ADMIN_PASS=password123

# === HTTPS Configuration (for production) ===
HTTPS=false
```

### Authentication Configuration

```env
# Session Security (CRITICAL - Change in production)
SESSION_SECRET=your-unique-secret-key-minimum-32-characters-long

# Default Admin Account (Change after first login)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@yourdomain.com

# Session Settings
HTTPS=false  # Set to true in production with SSL
```

### Scheduling Options

```env
# Every 15 minutes (default - recommended)
RSS_FETCH_INTERVAL=*/15 * * * *

# Every hour at minute 0
RSS_FETCH_INTERVAL=0 * * * *

# Twice daily at 9 AM and 6 PM
RSS_FETCH_INTERVAL=0 9,18 * * *

# Every 5 minutes (for testing only)
RSS_FETCH_INTERVAL=*/5 * * * *
```

## Docker Deployment

### Production Deployment with Authentication

```bash
# Clone repository
git clone https://github.com/iotcommunity-space/IoT-News-Aggregator-API.git
cd IoT-News-Aggregator-API

# Configure production environment
cp .env.example .env
# Edit .env with your production settings

# Start with authentication enabled
docker-compose up -d

# Setup admin user (first time only)
curl http://your-domain:4000/setup-admin

# Scale services if needed
docker-compose up -d --scale iot-news-dashboard=2
```

### Service Management with Authentication

```bash
# View all services including authentication
docker-compose ps

# View authentication logs
docker-compose logs -f iot-news-dashboard

# View API logs
docker-compose logs -f iot-news-api

# Restart authentication service
docker-compose restart iot-news-dashboard

# Update and restart with authentication
docker-compose down
git pull
docker-compose up --build -d
```

### Health Monitoring

```bash
# Check all services
docker-compose ps

# API health check (no auth required)
curl http://localhost:3000/health

# Dashboard health check (includes auth status)
curl http://localhost:4000/health

# MongoDB health check
curl http://localhost:8081

# Check authentication system
curl http://localhost:4000/login
```

## Security Best Practices

### Production Security Checklist

```bash
# 1. Change default authentication credentials
# Edit .env file:
SESSION_SECRET=your-unique-production-secret-key-here
ADMIN_PASSWORD=secure-admin-password-here
MONGO_ADMIN_PASS=secure-mongodb-password-here

# 2. Enable HTTPS in production
HTTPS=true

# 3. Use strong MongoDB credentials
MONGODB_URI=mongodb://secure_user:secure_password@mongodb:27017/iot_news_api

# 4. Regular security updates
docker-compose pull  # Update images
git pull            # Update code
docker-compose up --build -d  # Restart with updates

# 5. Monitor authentication logs
docker-compose logs -f iot-news-dashboard | grep "Login\|Auth"
```

### Authentication Security Features

- **bcrypt Password Hashing** - Industry-standard password security
- **Session Security** - HTTP-only cookies, configurable expiration
- **CSRF Protection** - Built-in CSRF protection for forms
- **Input Validation** - Server-side validation for all user inputs
- **Rate Limiting** - Protection against brute force attacks
- **Audit Logging** - Track all authentication and user management activities

## Testing & Debugging

### Authentication Testing

```bash
# Test login endpoint
curl -X POST http://localhost:4000/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# Test dashboard access (should redirect to login if not authenticated)
curl -I http://localhost:4000

# Test user creation (admin only)
curl -X POST http://localhost:4000/admin/users/create \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&email=test@example.com&password=testpass123&role=editor"

# Test API (no authentication required)
curl "http://localhost:3000/api/v1/articles?limit=5"
```

### Debugging Authentication Issues

```bash
# View dashboard logs for authentication errors
docker-compose logs -f iot-news-dashboard | grep -E "Login|Auth|Error"

# Check MongoDB for users and sessions
docker-compose exec mongodb mongo iot_news_api
> db.users.find({})
> db.sessions.find({})

# Reset authentication (removes all users and sessions)
docker-compose exec mongodb mongo iot_news_api
> db.users.deleteMany({})
> db.sessions.deleteMany({})

# Restart dashboard service
docker-compose restart iot-news-dashboard
```

## RSS Sources

### Current Premium Sources

| Source | Focus Area | Update Frequency | Articles/Day |
|--------|------------|------------------|--------------|
| **IoT Tech News** | Latest technology developments | Multiple daily | 5-10 |
| **IoT Now** | Enterprise IoT solutions | Daily | 3-5 |
| **IoT Business News** | Business and market insights | Daily | 2-4 |
| **IoT Insider** | Industry analysis | Multiple daily | 4-8 |
| **AWS IoT Blog** | Cloud IoT tutorials | Weekly | 1-2 |
| **Connected World** | IoT ecosystem coverage | Daily | 3-6 |

### Adding New Sources

1. **Update Environment Variables:**
```env
RSS_FEEDS=existing-feeds,https://new-source.com/feed/
```

2. **Restart Services:**
```bash
docker-compose restart
```

3. **Verify Feed (requires admin login):**
   - Login to dashboard
   - Trigger manual refresh or wait for next scheduled update

## Performance & Scaling

### Performance Metrics with Authentication

| Metric | With Authentication | API Only |
|--------|-------------------|----------|
| **Dashboard Response Time** |  db.users.findOne({username: "admin"})

# Create admin user if missing
curl http://localhost:4000/setup-admin

# Reset admin password
docker-compose exec mongodb mongo iot_news_api
> db.users.deleteOne({username: "admin"})
# Then visit /setup-admin again
```

#### Session Issues / Keeps Logging Out
```bash
# Check session configuration
docker-compose logs iot-news-dashboard | grep "Session"

# Clear all sessions
docker-compose exec mongodb mongo iot_news_api
> db.sessions.deleteMany({})

# Check SESSION_SECRET is set
echo $SESSION_SECRET

# Restart dashboard
docker-compose restart iot-news-dashboard
```

#### Dashboard Access Denied
```bash
# Check user role
docker-compose exec mongodb mongo iot_news_api
> db.users.findOne({username: "your-username"})

# Check if user is active
> db.users.findOne({username: "your-username", isActive: true})

# Activate user (admin required)
> db.users.updateOne({username: "your-username"}, {$set: {isActive: true}})
```

### Common Issues

#### Port Already in Use
```bash
# Check which process is using the port
sudo lsof -i :4000  # Dashboard
sudo lsof -i :3000  # API

# Kill processes
sudo kill -9 $(sudo lsof -t -i:4000)
sudo kill -9 $(sudo lsof -t -i:3000)

# Or change ports in .env
DASHBOARD_PORT=4001
PORT=3001
```

#### Database Connection Issues
```bash
# Check MongoDB container
docker-compose logs mongodb

# Test MongoDB connection
docker-compose exec iot-news-api ping mongodb
docker-compose exec iot-news-dashboard ping mongodb

# Restart MongoDB
docker-compose restart mongodb
```

## Contributing

### Development Setup with Authentication

```bash
# 1. Fork and clone
git clone https://github.com/YOUR-USERNAME/IoT-News-Aggregator-API.git
cd IoT-News-Aggregator-API

# 2. Install dependencies
npm install
cd dashboard && npm install && cd ..

# 3. Set up development environment
cp .env.example .env.development
# Edit .env.development for development settings

# 4. Start MongoDB for development
docker-compose up -d mongodb

# 5. Start services in development mode
npm run dev  # API server (no auth)
cd dashboard && npm run dev  # Dashboard with auth

# 6. Setup development admin user
curl http://localhost:4000/setup-admin
```

### Code Standards

- **Authentication Security** - Always validate user input, use bcrypt for passwords
- **Session Management** - Proper session handling and cleanup
- **Role-Based Logic** - Check user permissions before actions
- **Error Handling** - Comprehensive error handling for auth failures
- **Logging** - Log all authentication and user management activities
- **ES6+ JavaScript** - Modern syntax with async/await
- **JSDoc Comments** - Document authentication functions
- **Consistent Formatting** - Use Prettier for code formatting

### Areas for Contribution

- **Enhanced Security** - Two-factor authentication, OAuth integration
- **Advanced User Management** - User groups, advanced permissions
- **UI/UX Improvements** - Better authentication flows and dashboard design
- **Mobile Authentication** - Mobile-friendly login and dashboard
- **API Authentication** - Optional API authentication for sensitive operations
- **Advanced Analytics** - User activity analytics and reporting
- **Testing** - Authentication system unit and integration tests
- **Documentation** - Authentication guides and security documentation

## Support & Community

### Getting Help

| Resource | URL | Purpose |
|----------|-----|---------|
| **Documentation** | This README | Comprehensive setup and auth guide |
| **IoT Community** | [IoTCommunity.Space](https://iotcommunity.space/) | Join our IoT community |

### Quick Links

- **Quick Start:** [One-command setup with authentication](#quick-start-one-command)
- **Authentication Guide:** [User management and security](#authentication--user-management)
- **Dashboard Guide:** [Web interface with auth](#web-dashboard-guide)
- **API Docs:** [REST API reference](#rest-api-documentation)
- **Security:** [Production security best practices](#security-best-practices)
- **Configuration:** [Environment and auth setup](#configuration-options)

## What's Next?

### Immediate Use Cases

1. **Secure News Portal** - Deploy as authenticated company IoT news portal
2. **Multi-User Dashboard** - Team-based IoT intelligence platform with role-based access
3. **API + Dashboard Combo** - Public API with protected admin interface
4. **Enterprise Intelligence** - Secure IoT market research platform
5. **Community Platform** - IoT community with user management and content curation

### Future Roadmap

- **Advanced Authentication** - Two-factor authentication, SSO integration
- **User Analytics** - Detailed user behavior and engagement analytics
- **Mobile App** - Native mobile apps with authentication
- **API Authentication** - Optional JWT-based API authentication
- **Advanced Permissions** - Granular permissions and user groups
- **Social Features** - User profiles, comments, article bookmarking
- **AI Integration** - Personalized content recommendations per user
- **Real-time Collaboration** - Multi-user editing and notifications

# Built with security and care by IoTCommunity.Space

### [Visit IoTCommunity.Space](https://iotcommunity.space/)

**Building the future of IoT together - securely**

### Features at a Glance

 **Secure Authentication** - Session-based login with role management  
 **User Management** - Complete admin interface for user operations  
 **RSS Aggregation** - 6+ premium IoT news sources  
 **REST API** - Full programmatic access to news data  
 **Web Dashboard** - Modern, responsive interface with light theme  
 **Docker Deployment** - One-command setup with all services  
 **MongoDB Storage** - Scalable database with user and article collections  
 **Real-time Updates** - Automatic news aggregation every 15 minutes  
 **Advanced Search** - Powerful filtering and search capabilities  
 **Analytics Dashboard** - Comprehensive statistics and insights  
 **Mobile Friendly** - Optimized for all devices and screen sizes  
 **Production Ready** - Security best practices and performance optimization  

### Star this project on GitHub to support secure IoT innovation! 
