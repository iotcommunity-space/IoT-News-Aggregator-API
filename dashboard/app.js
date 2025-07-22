const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const moment = require('moment');

const app = express();
const PORT = process.env.DASHBOARD_PORT || 4000;

// Middleware to dynamically set base URLs for dashboard links
app.use((req, res, next) => {
  const protocol = req.protocol;           // 'http' or 'https'
  const hostname = req.hostname;           // domain or IP without port
  const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000; // fallback
  const apiPort = process.env.API_PORT || 3000;

  res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
  res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
  res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

  next();
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make moment available in templates
app.locals.moment = moment;

// MongoDB connection with retry mechanism
const connectToMongoDB = async () => {
  const maxRetries = 5;
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Dashboard connected to MongoDB');
      break;
    } catch (error) {
      retries++;
      console.log(`❌ Dashboard MongoDB connection attempt ${retries}/${maxRetries} failed:`, error.message);
      if (retries < maxRetries) {
        console.log('⏳ Retrying MongoDB connection in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error('💥 Dashboard failed to connect to MongoDB after all retries');
        process.exit(1);
      }
    }
  }
};

// Article schema
const ArticleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  contentHash: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true, unique: true },
  source: {
    name: String,
    domain: String,
    feedUrl: String
  },
  author: { type: String, default: 'Unknown' },
  publishedAt: { type: Date, required: true, index: true },
  excerpt: { type: String, maxlength: 500 },
  content: { type: String },
  featuredImage: {
    url: String,
    alt: String,
    width: Number,
    height: Number
  },
  images: [{
    url: String,
    alt: String,
    caption: String
  }],
  categories: [String],
  tags: [String],
  commentCount: { type: Number, default: 0 },
  isDuplicate: { type: Boolean, default: false },
  relevanceScore: { type: Number, default: 0, min: 0, max: 1 },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

const Article = mongoose.model('Article', ArticleSchema);

// Routes

// Dashboard Home - Article List
app.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const search = req.query.search || '';
    const source = req.query.source || '';
    const category = req.query.category || '';

    const query = { isDuplicate: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    if (source) {
      query['source.domain'] = source;
    }

    if (category) {
      query.categories = { $regex: category, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [articles, total, sources, categories] = await Promise.all([
      Article.find(query).sort({ publishedAt: -1 }).skip(skip).limit(limit).lean(),
      Article.countDocuments(query),
      Article.aggregate([
        { $match: { isDuplicate: false } },
        { $group: { _id: '$source.domain', name: { $first: '$source.name' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Article.aggregate([
        { $match: { isDuplicate: false } },
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ])
    ]);

    const pages = Math.ceil(total / limit);

    res.render('home', {
      articles,
      currentPage: page,
      totalPages: pages,
      total,
      search,
      selectedSource: source,
      selectedCategory: category,
      sources,
      categories,
      title: 'IoT News Dashboard'
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    // Set locals for error template so apiBaseUrl etc exist
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    res.status(500).render('error', {
      error: 'Failed to load articles',
      title: 'Error'
    });
  }
});

// View Single Article
app.get('/article/:id', async (req, res) => {
  try {
    const article = await Article.findOne({ id: req.params.id });
    if (!article) {
      // Pass required locals in case error.ejs uses apiBaseUrl
      const protocol = req.protocol;
      const hostname = req.hostname;
      const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
      const apiPort = process.env.API_PORT || 3000;

      res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
      res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
      res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

      return res.status(404).render('error', {
        error: 'Article not found',
        title: 'Article Not Found'
      });
    }

    res.render('article', {
      article,
      title: article.title
    });
  } catch (error) {
    console.error('Error loading article:', error);
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    res.status(500).render('error', {
      error: 'Failed to load article',
      title: 'Error'
    });
  }
});

// Edit Article Form
app.get('/article/:id/edit', async (req, res) => {
  try {
    const article = await Article.findOne({ id: req.params.id });
    if (!article) {
      const protocol = req.protocol;
      const hostname = req.hostname;
      const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
      const apiPort = process.env.API_PORT || 3000;

      res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
      res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
      res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

      return res.status(404).render('error', {
        error: 'Article not found',
        title: 'Article Not Found'
      });
    }

    res.render('edit', {
      article,
      title: `Edit: ${article.title}`
    });
  } catch (error) {
    console.error('Error loading article for edit:', error);
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    res.status(500).render('error', {
      error: 'Failed to load article',
      title: 'Error'
    });
  }
});

// Update Article
app.post('/article/:id/edit', async (req, res) => {
  try {
    const { title, excerpt, content, author, categories, tags } = req.body;

    const updateData = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content,
      author: author.trim(),
      categories: categories ? categories.split(',').map(cat => cat.trim()).filter(Boolean) : [],
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      updatedAt: new Date()
    };

    await Article.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );

    res.redirect(`/article/${req.params.id}?updated=true`);
  } catch (error) {
    console.error('Error updating article:', error);
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    res.status(500).render('error', {
      error: 'Failed to update article',
      title: 'Update Error'
    });
  }
});

// Delete Article
app.post('/article/:id/delete', async (req, res) => {
  try {
    await Article.findOneAndDelete({ id: req.params.id });
    res.redirect('/?deleted=true');
  } catch (error) {
    console.error('Error deleting article:', error);
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    res.status(500).render('error', {
      error: 'Failed to delete article',
      title: 'Delete Error'
    });
  }
});

// Statistics Page
app.get('/stats', async (req, res) => {
  try {
    const [
      totalArticles,
      sourcesStats,
      categoriesStats,
      recentStats
    ] = await Promise.all([
      Article.countDocuments({ isDuplicate: false }),
      Article.aggregate([
        { $match: { isDuplicate: false } },
        { $group: {
          _id: '$source.domain',
          name: { $first: '$source.name' },
          count: { $sum: 1 },
          latestArticle: { $max: '$publishedAt' }
        }},
        { $sort: { count: -1 } }
      ]),
      Article.aggregate([
        { $match: { isDuplicate: false } },
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ]),
      Article.aggregate([
        { $match: {
          isDuplicate: false,
          publishedAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
        }},
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$publishedAt" } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    res.render('stats', {
      totalArticles,
      sources: sourcesStats,
      categories: categoriesStats,
      recentStats,
      title: 'Dashboard Statistics'
    });
  } catch (error) {
    console.error('Error loading statistics:', error);
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    res.status(500).render('error', {
      error: 'Failed to load statistics',
      title: 'Statistics Error'
    });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'iot-news-dashboard',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handler (important: set locals here!)
app.use((error, req, res, next) => {
  console.error('Dashboard error:', error);

  // Inject res.locals so error.ejs has access to those variables
  const protocol = req.protocol;
  const hostname = req.hostname;
  const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
  const apiPort = process.env.API_PORT || 3000;

  res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
  res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
  res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

  res.status(500).render('error', {
    error: 'Internal server error',
    title: 'Server Error'
  });
});

// 404 handler (also inject locals)
app.use((req, res) => {
  const protocol = req.protocol;
  const hostname = req.hostname;
  const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
  const apiPort = process.env.API_PORT || 3000;

  res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
  res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
  res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

  res.status(404).render('error', {
    error: 'Page not found',
    title: '404 - Page Not Found'
  });
});

// Start server
const startServer = async () => {
  await connectToMongoDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 IoT News Dashboard running on port ${PORT}`);
    console.log(`📊 Dashboard URL: http://localhost:${PORT}`);
  });
};

startServer().catch(error => {
  console.error('💥 Failed to start dashboard:', error);
  process.exit(1);
});

module.exports = app;
