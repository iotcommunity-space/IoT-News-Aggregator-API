const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const RSSScheduler = require('./services/scheduler');
const articleRoutes = require('./routes/articles');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB connection with retry logic
const connectToMongoDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB');
      break;
    } catch (error) {
      retries++;
      console.log(`❌ MongoDB connection attempt ${retries}/${maxRetries} failed:`, error.message);
      
      if (retries < maxRetries) {
        console.log('⏳ Retrying MongoDB connection in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error('💥 Failed to connect to MongoDB after all retries');
        process.exit(1);
      }
    }
  }
};

// Initialize database and start server
const startServer = async () => {
  await connectToMongoDB();
  
  // Initialize and start RSS scheduler
  const scheduler = new RSSScheduler();
  app.set('scheduler', scheduler);
  
  console.log('🚀 Starting IoT News API with MongoDB...');
  scheduler.start();

  // Routes
  app.use('/api/v1/articles', articleRoutes);

  // Health check endpoint
  app.get('/health', async (req, res) => {
    const scheduler = app.get('scheduler');
    const stats = scheduler.getStats();
    
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      status: 'healthy',
      storage: 'mongodb',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      scheduler: {
        isRunning: stats.isRunning,
        lastRun: stats.lastRun,
        totalRuns: stats.totalRuns,
        totalArticles: await mongoose.model('Article').countDocuments()
      }
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'IoT News Aggregator API (MongoDB)',
      version: '1.0.0',
      description: 'Aggregates IoT news from multiple RSS feeds with MongoDB storage',
      storage: 'mongodb',
      endpoints: {
        articles: '/api/v1/articles',
        sources: '/api/v1/articles/sources',
        categories: '/api/v1/articles/categories',
        refresh: 'POST /api/v1/articles/refresh',
        stats: '/api/v1/articles/stats',
        health: '/health'
      }
    });
  });

  // Error handling
  app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not found',
      message: 'The requested endpoint does not exist'
    });
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    
    try {
      await mongoose.connection.close();
      console.log('📦 MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 IoT News API server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Storage: MongoDB`);
    console.log(`🔗 MongoDB URI: ${process.env.MONGODB_URI}`);
  });
};

startServer().catch(error => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
