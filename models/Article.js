const mongoose = require('mongoose');
const crypto = require('crypto');

const ArticleSchema = new mongoose.Schema({
  // Unique identifier
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Content hash for duplicate detection
  contentHash: {
    type: String,
    required: true,
    index: true
  },
  
  // Article details
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  url: {
    type: String,
    required: true,
    unique: true
  },
  
  // Source information
  source: {
    name: String,
    domain: String,
    feedUrl: String
  },
  
  author: {
    type: String,
    default: 'Unknown'
  },
  
  publishedAt: {
    type: Date,
    required: true,
    index: true
  },
  
  excerpt: {
    type: String,
    maxlength: 500
  },
  
  content: {
    type: String
  },
  
  // Images
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
  
  // Categories and tags
  categories: [String],
  tags: [String],
  
  // Metadata
  commentCount: {
    type: Number,
    default: 0
  },
  
  isDuplicate: {
    type: Boolean,
    default: false
  },
  
  relevanceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate content hash for duplicate detection
ArticleSchema.methods.generateContentHash = function() {
  const content = `${this.title}${this.excerpt}${this.author}`.toLowerCase().replace(/\s+/g, '');
  return crypto.createHash('md5').update(content).digest('hex');
};

// Generate unique ID
ArticleSchema.methods.generateId = function() {
  return crypto.createHash('sha256').update(this.url + this.title).digest('hex').substring(0, 16);
};

// Pre-save middleware
ArticleSchema.pre('save', function(next) {
  if (this.isNew) {
    this.id = this.generateId();
    this.contentHash = this.generateContentHash();
  }
  this.updatedAt = new Date();
  next();
});

// Indexes for performance
ArticleSchema.index({ publishedAt: -1 });
ArticleSchema.index({ 'source.domain': 1 });
ArticleSchema.index({ categories: 1 });
ArticleSchema.index({ isDuplicate: 1 });

module.exports = mongoose.model('Article', ArticleSchema);
