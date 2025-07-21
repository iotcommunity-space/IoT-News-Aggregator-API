const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const DuplicateDetector = require('./duplicateDetector');

class MemoryDatabase {
  constructor() {
    this.articles = new Map(); // Use Map for better performance
    this.duplicateDetector = new DuplicateDetector();
    this.dataFile = path.join(__dirname, '..', 'data', 'articles.json');
    this.maxArticles = 10000; // Limit to prevent memory issues
    
    // Ensure data directory exists
    fs.ensureDirSync(path.dirname(this.dataFile));
    
    // Load existing data
    this.loadFromFile();
  }

  // Generate unique ID for articles
  generateId(article) {
    return crypto.createHash('sha256')
      .update(article.url + article.title)
      .digest('hex')
      .substring(0, 16);
  }

  // Generate content hash for duplicate detection
  generateContentHash(article) {
    const content = `${article.title}${article.excerpt}${article.author}`
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return crypto.createHash('md5').update(content).digest('hex');
  }

  // Load articles from file
  async loadFromFile() {
    try {
      if (await fs.pathExists(this.dataFile)) {
        console.log('Loading articles from file...');
        const data = await fs.readJson(this.dataFile);
        
        if (data.articles && Array.isArray(data.articles)) {
          data.articles.forEach(article => {
            this.articles.set(article.id, {
              ...article,
              publishedAt: new Date(article.publishedAt),
              createdAt: new Date(article.createdAt),
              updatedAt: new Date(article.updatedAt)
            });
          });
          console.log(`Loaded ${this.articles.size} articles from file`);
        }
      }
    } catch (error) {
      console.error('Error loading articles from file:', error.message);
    }
  }

  // Save articles to file
  async saveToFile() {
    try {
      const articles = Array.from(this.articles.values());
      await fs.writeJson(this.dataFile, { 
        articles,
        lastUpdated: new Date().toISOString(),
        total: articles.length
      }, { spaces: 2 });
      console.log(`Saved ${articles.length} articles to file`);
    } catch (error) {
      console.error('Error saving articles to file:', error.message);
    }
  }

  // Save articles with duplicate detection
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
        // Generate ID and content hash
        const id = this.generateId(article);
        const contentHash = this.generateContentHash(article);
        
        // Check if article already exists
        const existingArticle = this.articles.get(id);
        
        if (existingArticle) {
          // Update if content has changed
          const timeDiff = Date.now() - existingArticle.updatedAt.getTime();
          if (timeDiff > 60000) { // 1 minute threshold
            this.articles.set(id, {
              ...article,
              id,
              contentHash,
              createdAt: existingArticle.createdAt,
              updatedAt: new Date()
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          // Create new article
          const now = new Date();
          this.articles.set(id, {
            ...article,
            id,
            contentHash,
            createdAt: now,
            updatedAt: now
          });
          saved++;
        }

        // Limit memory usage
        if (this.articles.size > this.maxArticles) {
          const oldestArticles = Array.from(this.articles.values())
            .sort((a, b) => a.publishedAt - b.publishedAt)
            .slice(0, 1000); // Remove oldest 1000 articles

          oldestArticles.forEach(article => {
            this.articles.delete(article.id);
          });
        }
      } catch (error) {
        console.error('Error saving article:', error.message);
        skipped++;
      }
    }

    // Save to file periodically
    await this.saveToFile();

    console.log(`Memory database operation: ${saved} saved, ${updated} updated, ${skipped} skipped`);
    
    return { saved, updated, skipped, totalProcessed: articles.length };
  }

  // Get articles with filters and pagination
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

    let articles = Array.from(this.articles.values());

    // Apply filters
    if (!includeDuplicates) {
      articles = articles.filter(article => !article.isDuplicate);
    }

    if (source) {
      articles = articles.filter(article => 
        article.source && article.source.domain === source
      );
    }

    if (category) {
      const categoryRegex = new RegExp(category, 'i');
      articles = articles.filter(article => 
        article.categories && article.categories.some(cat => categoryRegex.test(cat))
      );
    }

    if (author && author !== 'Unknown') {
      const authorRegex = new RegExp(author, 'i');
      articles = articles.filter(article => authorRegex.test(article.author));
    }

    if (startDate || endDate) {
      articles = articles.filter(article => {
        const publishedDate = new Date(article.publishedAt);
        let match = true;
        
        if (startDate) {
          match = match && publishedDate >= new Date(startDate);
        }
        if (endDate) {
          match = match && publishedDate <= new Date(endDate);
        }
        
        return match;
      });
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      articles = articles.filter(article => 
        searchRegex.test(article.title) || 
        searchRegex.test(article.excerpt) ||
        (article.categories && article.categories.some(cat => searchRegex.test(cat)))
      );
    }

    // Sort by published date (newest first)
    articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Pagination
    const total = articles.length;
    const skip = (page - 1) * limit;
    const paginatedArticles = articles.slice(skip, skip + limit);

    return {
      articles: paginatedArticles,
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
    const articles = Array.from(this.articles.values())
      .filter(article => !article.isDuplicate);

    const sourcesMap = new Map();

    articles.forEach(article => {
      if (article.source && article.source.domain) {
        const domain = article.source.domain;
        
        if (!sourcesMap.has(domain)) {
          sourcesMap.set(domain, {
            _id: domain,
            name: article.source.name,
            count: 0,
            latestArticle: article.publishedAt
          });
        }

        const source = sourcesMap.get(domain);
        source.count++;
        
        if (new Date(article.publishedAt) > new Date(source.latestArticle)) {
          source.latestArticle = article.publishedAt;
        }
      }
    });

    return Array.from(sourcesMap.values())
      .sort((a, b) => b.count - a.count);
  }

  // Get categories statistics
  async getCategoriesStats() {
    const articles = Array.from(this.articles.values())
      .filter(article => !article.isDuplicate);

    const categoriesMap = new Map();

    articles.forEach(article => {
      if (article.categories && Array.isArray(article.categories)) {
        article.categories.forEach(category => {
          categoriesMap.set(category, (categoriesMap.get(category) || 0) + 1);
        });
      }
    });

    return Array.from(categoriesMap.entries())
      .map(([category, count]) => ({ _id: category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
  }

  // Clean old articles
  async cleanOldArticles(daysToKeep = 90) {
    const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
    
    let deletedCount = 0;
    
    for (const [id, article] of this.articles.entries()) {
      if (new Date(article.publishedAt) < cutoffDate) {
        this.articles.delete(id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      await this.saveToFile();
    }

    console.log(`Cleaned ${deletedCount} old articles from memory`);
    return deletedCount;
  }

  // Get total count
  getTotalCount() {
    return this.articles.size;
  }

  // Clear all data
  async clearAll() {
    this.articles.clear();
    await this.saveToFile();
    console.log('Cleared all articles from memory and file');
  }
}

module.exports = MemoryDatabase;
