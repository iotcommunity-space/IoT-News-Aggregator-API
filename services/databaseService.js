const Article = require('../models/Article');
const DuplicateDetector = require('./duplicateDetector');

class DatabaseService {
  constructor() {
    this.duplicateDetector = new DuplicateDetector();
  }

  // Save articles to database
  async saveArticles(articles) {
    if (!articles || articles.length === 0) {
      return { saved: 0, updated: 0, skipped: 0 };
    }

    let saved = 0;
    let updated = 0;
    let skipped = 0;

    // Process duplicates
    const processedResult = this.duplicateDetector.processArticles(articles);

    for (const article of processedResult.allArticles) {
      try {
        // Check if article already exists
        const existingArticle = await Article.findOne({ 
          $or: [
            { url: article.url },
            { contentHash: article.contentHash }
          ]
        });

        if (existingArticle) {
          // Update if content has changed
          if (existingArticle.updatedAt < new Date(Date.now() - 60000)) { // 1 minute threshold
            await Article.findByIdAndUpdate(existingArticle._id, {
              ...article,
              updatedAt: new Date()
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          // Create new article
          const newArticle = new Article(article);
          await newArticle.save();
          saved++;
        }
      } catch (error) {
        console.error('Error saving article:', error.message);
        skipped++;
      }
    }

    console.log(`Database operation completed: ${saved} saved, ${updated} updated, ${skipped} skipped`);
    
    return { saved, updated, skipped, totalProcessed: articles.length };
  }

  // Get articles with pagination and filters
  async getArticles(filters = {}) {
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
    } = filters;

    // Build query
    const query = {};

    if (!includeDuplicates) {
      query.isDuplicate = false;
    }

    if (source) {
      query['source.domain'] = source;
    }

    if (category) {
      query.categories = { $in: [new RegExp(category, 'i')] };
    }

    if (author && author !== 'Unknown') {
      query.author = new RegExp(author, 'i');
    }

    if (startDate || endDate) {
      query.publishedAt = {};
      if (startDate) query.publishedAt.$gte = new Date(startDate);
      if (endDate) query.publishedAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { categories: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Execute query
    const skip = (page - 1) * limit;
    
    const [articles, total] = await Promise.all([
      Article.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Article.countDocuments(query)
    ]);

    return {
      articles,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    };
  }

  // Get sources statistics
  async getSourcesStats() {
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

    return stats;
  }

  // Get categories statistics
  async getCategoriesStats() {
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

    return stats;
  }

  // Clean old articles
  async cleanOldArticles(daysToKeep = 90) {
    const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
    
    const result = await Article.deleteMany({
      publishedAt: { $lt: cutoffDate }
    });

    console.log(`Cleaned ${result.deletedCount} old articles`);
    return result.deletedCount;
  }
}

module.exports = DatabaseService;
