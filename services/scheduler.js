const cron = require('node-cron');
const RSSParser = require('./rssParser');
const Article = require('../models/Article');
const DuplicateDetector = require('./duplicateDetector');
const crypto = require('crypto');

class RSSScheduler {
  constructor() {
    this.rssParser = new RSSParser();
    this.duplicateDetector = new DuplicateDetector();
    this.isRunning = false;
    this.lastRun = null;
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      errors: 0,
      articlesProcessed: 0
    };
  }

  // Generate content hash for comparison
  generateContentHash(article) {
    const content = `${article.title}${article.excerpt}${article.author}`
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return crypto.createHash('md5').update(content).digest('hex');
  }

  // Generate unique ID
  generateId(article) {
    return crypto.createHash('sha256')
      .update(article.url + article.title)
      .digest('hex')
      .substring(0, 16);
  }

  // Save articles to MongoDB with proper field generation
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
        // Generate required fields
        const contentHash = this.generateContentHash(article);
        const id = this.generateId(article);

        // Add required fields to article
        const articleWithRequiredFields = {
          ...article,
          id: id,
          contentHash: contentHash
        };

        // Check if article already exists
        const existingArticle = await Article.findOne({ 
          $or: [
            { url: article.url },
            { contentHash: contentHash }
          ]
        });

        if (existingArticle) {
          // Update if content has changed
          if (new Date() - existingArticle.updatedAt > 60000) { // 1 minute threshold
            await Article.findByIdAndUpdate(existingArticle._id, {
              ...articleWithRequiredFields,
              updatedAt: new Date()
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          // Create new article with all required fields
          const newArticle = new Article(articleWithRequiredFields);
          await newArticle.save();
          saved++;
        }
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error - skip
          skipped++;
        } else {
          console.error('Error saving article:', error.message);
          skipped++;
        }
      }
    }

    console.log(`📦 MongoDB operation: ${saved} saved, ${updated} updated, ${skipped} skipped`);
    
    return { saved, updated, skipped, totalProcessed: articles.length };
  }

  // Fetch and process all RSS feeds
  async fetchAllFeeds() {
    if (this.isRunning) {
      console.log('RSS fetch already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('🚀 Starting RSS feed fetch...');
      
      // Get feed URLs from environment
      const feedUrls = process.env.RSS_FEEDS.split(',').map(url => url.trim());
      
      // Parse all feeds
      const articles = await this.rssParser.parseMultipleFeeds(feedUrls);
      console.log(`📰 Parsed ${articles.length} articles from ${feedUrls.length} feeds`);

      // Save to MongoDB
      const result = await this.saveArticles(articles);
      
      // Update stats
      this.stats.totalRuns++;
      this.stats.successfulRuns++;
      this.stats.articlesProcessed += result.totalProcessed;
      this.lastRun = new Date();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`✅ RSS fetch completed in ${duration}s:`, result);

      return result;
    } catch (error) {
      console.error('❌ Error during RSS fetch:', error);
      this.stats.totalRuns++;
      this.stats.errors++;
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Start the scheduler
  start() {
    const cronPattern = process.env.RSS_FETCH_INTERVAL || '*/15 * * * *';
    
    console.log(`⏰ Starting RSS scheduler with pattern: ${cronPattern}`);
    
    // Schedule RSS fetching
    cron.schedule(cronPattern, async () => {
      try {
        await this.fetchAllFeeds();
      } catch (error) {
        console.error('⚠️  Scheduled RSS fetch failed:', error);
      }
    });

    // Schedule cleanup (daily at 2 AM)
    cron.schedule('0 2 * * *', async () => {
      try {
        console.log('🧹 Running daily cleanup...');
        const cutoffDate = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
        const result = await Article.deleteMany({
          publishedAt: { $lt: cutoffDate }
        });
        console.log(`🗑️  Cleaned ${result.deletedCount} old articles`);
      } catch (error) {
        console.error('❌ Daily cleanup failed:', error);
      }
    });

    // Initial fetch after 10 seconds
    setTimeout(async () => {
      try {
        console.log('🎯 Running initial RSS fetch...');
        await this.fetchAllFeeds();
      } catch (error) {
        console.error('❌ Initial RSS fetch failed:', error);
      }
    }, 10000);
  }

  // Get scheduler statistics
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      uptime: process.uptime()
    };
  }
}

module.exports = RSSScheduler;
