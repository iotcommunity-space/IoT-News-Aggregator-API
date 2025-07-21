const express = require('express');
const Article = require('../models/Article');

const router = express.Router();

// GET /api/v1/articles - Get articles with pagination and filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      source,
      category,
      author,
      startDate,
      endDate,
      search,
      includeDuplicates = false
    } = req.query;

    // Build query
    const query = {};

    if (!includeDuplicates) {
      query.isDuplicate = false;
    }

    if (source) {
      query['source.domain'] = source;
    }

    if (category) {
      query.categories = { $regex: category, $options: 'i' };
    }

    if (author && author !== 'Unknown') {
      query.author = { $regex: author, $options: 'i' };
    }

    if (startDate || endDate) {
      query.publishedAt = {};
      if (startDate) query.publishedAt.$gte = new Date(startDate);
      if (endDate) query.publishedAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 50);

    const [articles, total] = await Promise.all([
      Article.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Article.countDocuments(query)
    ]);

    // Get sources stats
    const sourcesStats = await Article.aggregate([
      { $match: { isDuplicate: false } },
      {
        $group: {
          _id: '$source.domain',
          name: { $first: '$source.name' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        articles,
        meta: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limitNum),
          per_page: limitNum,
          sources: sourcesStats.length,
          last_updated: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /api/v1/articles/sources - Get sources statistics
router.get('/sources', async (req, res) => {
  try {
    const stats = await Article.aggregate([
      { $match: { isDuplicate: false } },
      {
        $group: {
          _id: '$source.domain',
          name: { $first: '$source.name' },
          count: { $sum: 1 },
          latestArticle: { $max: '$publishedAt' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        sources: stats,
        total: stats.length
      }
    });
  } catch (error) {
    console.error('Error fetching sources stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /api/v1/articles/categories - Get categories statistics
router.get('/categories', async (req, res) => {
  try {
    const stats = await Article.aggregate([
      { $match: { isDuplicate: false } },
      { $unwind: '$categories' },
      {
        $group: {
          _id: '$categories',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);

    res.json({
      success: true,
      data: {
        categories: stats,
        total: stats.length
      }
    });
  } catch (error) {
    console.error('Error fetching categories stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// POST /api/v1/articles/refresh - Manually trigger RSS fetch
router.post('/refresh', async (req, res) => {
  try {
    const scheduler = req.app.get('scheduler');
    
    if (scheduler.isRunning) {
      return res.status(409).json({
        success: false,
        error: 'RSS fetch already in progress'
      });
    }

    const result = await scheduler.fetchAllFeeds();
    
    res.json({
      success: true,
      data: {
        message: 'RSS feeds refreshed successfully',
        result: result
      }
    });
  } catch (error) {
    console.error('Error refreshing feeds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh feeds',
      message: error.message
    });
  }
});

// GET /api/v1/articles/stats - Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const scheduler = req.app.get('scheduler');
    const schedulerStats = scheduler.getStats();
    
    const [sourcesStats, categoriesStats, totalArticles] = await Promise.all([
      Article.aggregate([
        { $match: { isDuplicate: false } },
        {
          $group: {
            _id: '$source.domain',
            name: { $first: '$source.name' },
            count: { $sum: 1 },
            latestArticle: { $max: '$publishedAt' }
          }
        }
      ]),
      Article.aggregate([
        { $match: { isDuplicate: false } },
        { $unwind: '$categories' },
        {
          $group: {
            _id: '$categories',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Article.countDocuments({ isDuplicate: false })
    ]);

    res.json({
      success: true,
      data: {
        scheduler: {
          ...schedulerStats,
          totalArticles
        },
        sources: {
          total: sourcesStats.length,
          active: sourcesStats.filter(s => 
            new Date(s.latestArticle) > new Date(Date.now() - 24*60*60*1000)
          ).length
        },
        categories: {
          total: categoriesStats.length,
          top: categoriesStats
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
