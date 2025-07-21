// MongoDB initialization script
db = db.getSiblingDB('iot_news_api');

// Create collections with proper indexing
db.createCollection('articles');

// Create indexes for performance
db.articles.createIndex({ "url": 1 }, { unique: true });
db.articles.createIndex({ "publishedAt": -1 });
db.articles.createIndex({ "source.domain": 1 });
db.articles.createIndex({ "categories": 1 });
db.articles.createIndex({ "isDuplicate": 1 });
db.articles.createIndex({ "contentHash": 1 });
db.articles.createIndex({ 
  "title": "text", 
  "excerpt": "text", 
  "categories": "text" 
});

print('✅ IoT News API database initialized successfully');
