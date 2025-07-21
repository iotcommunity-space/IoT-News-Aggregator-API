// services/rssParser.js - CORRECTED VERSION

const axios = require('axios');
const xml2js = require('xml2js');
const cheerio = require('cheerio');
const moment = require('moment');
const validator = require('validator');

class RSSParser {
  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      trim: true
    });
  }

  // Main RSS parsing function
  async parseRSSFeed(feedUrl) {
    try {
      console.log(`Fetching RSS feed: ${feedUrl}`);
      
      const response = await axios.get(feedUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'IoT-News-Aggregator/1.0'
        }
      });

      const result = await this.parser.parseStringPromise(response.data);
      const items = result.rss?.channel?.item || [];
      
      if (!Array.isArray(items)) {
        return [items].filter(Boolean);
      }

      return items;
    } catch (error) {
      console.error(`Error parsing RSS feed ${feedUrl}:`, error.message);
      return [];
    }
  }

  // FIXED - Extract images from RSS item (not htmlContent directly)
  extractImages(item, sourceDomain) {
    // Get HTML content from the RSS item
    const htmlContent = item['content:encoded'] || item.description || '';
    
    if (!htmlContent) return { featuredImage: null, images: [] };

    const $ = cheerio.load(htmlContent);
    const images = [];
    let featuredImage = null;

    // Extract images from HTML
    $('img').each((index, element) => {
      const src = $(element).attr('src');
      const alt = $(element).attr('alt') || '';
      const caption = $(element).attr('title') || $(element).next('figcaption').text() || '';

      if (src && validator.isURL(src, { require_protocol: true })) {
        const imageObj = {
          url: this.normalizeImageUrl(src),
          alt: alt.trim(),
          caption: caption.trim()
        };

        // Avoid duplicates
        if (!images.find(img => img.url === imageObj.url)) {
          images.push(imageObj);

          // First valid image becomes featured image
          if (!featuredImage && index === 0) {
            featuredImage = { ...imageObj };
          }
        }
      }
    });

    // Source-specific enhancements
    return this.enhanceImagesForSource($, htmlContent, featuredImage, images, sourceDomain);
  }

  // Enhanced image extraction based on source
  enhanceImagesForSource($, htmlContent, featuredImage, images, sourceDomain) {
    switch (sourceDomain) {
      case 'iotbusinessnews.com':
        return this.extractIoTBusinessNewsImages($, featuredImage, images);
      
      case 'iottechnews.com':
        return this.extractIoTTechNewsImages($, featuredImage, images);
      
      case 'iot-now.com':
      case 'www.iot-now.com':
        return this.extractIoTNowImages($, featuredImage, images);
      
      default:
        return { featuredImage, images };
    }
  }

  // IoT Business News specific extraction
  extractIoTBusinessNewsImages($, featuredImage, images) {
    // Look for WordPress featured images
    const wpFeatured = $('img.wp-post-image, .wp-block-image img').first();
    if (wpFeatured.length && this.isValidImageUrl(wpFeatured.attr('src'))) {
      const wpImage = {
        url: this.normalizeImageUrl(wpFeatured.attr('src')),
        alt: wpFeatured.attr('alt') || '',
        caption: wpFeatured.attr('title') || wpFeatured.next('figcaption').text() || ''
      };
      
      if (!featuredImage) {
        featuredImage = wpImage;
      }
      
      if (!images.find(img => img.url === wpImage.url)) {
        images.unshift(wpImage);
      }
    }

    return { featuredImage, images };
  }

  // IoT Tech News specific extraction
  extractIoTTechNewsImages($, featuredImage, images) {
    // Look for article images in common containers
    const selectors = ['.hero-image img', '.post-featured-image img', '.entry-header img', '.post-image img'];
    
    for (const selector of selectors) {
      const img = $(selector).first();
      if (img.length && this.isValidImageUrl(img.attr('src'))) {
        const heroImage = {
          url: this.normalizeImageUrl(img.attr('src')),
          alt: img.attr('alt') || '',
          caption: img.attr('title') || ''
        };
        
        if (!featuredImage) {
          featuredImage = heroImage;
          break;
        }
      }
    }

    return { featuredImage, images };
  }

  // IoT Now specific extraction
  extractIoTNowImages($, featuredImage, images) {
    // IoT Now specific selectors
    const selectors = ['.post-content img', '.entry-content img', '.article-image img'];
    
    for (const selector of selectors) {
      const img = $(selector).first();
      if (img.length && this.isValidImageUrl(img.attr('src'))) {
        const mainImage = {
          url: this.normalizeImageUrl(img.attr('src')),
          alt: img.attr('alt') || '',
          caption: img.attr('title') || ''
        };
        
        if (!featuredImage) {
          featuredImage = mainImage;
          break;
        }
      }
    }

    return { featuredImage, images };
  }

  // Validate image URL
  isValidImageUrl(url) {
    if (!url) return false;
    
    try {
      // Handle relative URLs
      if (url.startsWith('//')) {
        url = 'https:' + url;
      }
      
      // Basic URL validation
      if (!validator.isURL(url, { require_protocol: false })) {
        return false;
      }

      // Check for image extensions or patterns
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
      const imagePatterns = [
        /cdn\./,
        /images?\./,
        /img\./,
        /media\./,
        /assets\./,
        /uploads?/,
        /wp-content/
      ];

      return imageExtensions.test(url) || imagePatterns.some(pattern => pattern.test(url));
    } catch (error) {
      return false;
    }
  }

  // Normalize image URLs
  normalizeImageUrl(url) {
    if (!url) return url;

    // Handle protocol-relative URLs
    if (url.startsWith('//')) {
      return 'https:' + url;
    }

    // Return as-is if already absolute
    if (url.startsWith('http')) {
      return url;
    }

    return url;
  }

  // Clean and extract text from HTML
  extractCleanText(html, maxLength = 200) {
    if (!html) return '';

    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $('script, style, noscript, iframe').remove();
    $('.read-more, .continue-reading').remove();
    
    let text = $.root().text().replace(/\s+/g, ' ').trim();
    
    // Truncate to maxLength
    if (text.length > maxLength) {
      text = text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
    }

    return text;
  }

  // Normalize author names
  normalizeAuthor(author, sourceDomain) {
    if (!author) return 'Unknown';

    // Handle generic author names
    if (author === 'IoT.Business.News' || (author.includes('iot') && sourceDomain.includes('iotbusiness'))) {
      return 'IoT Business News Team';
    }

    return author.trim();
  }

  // Extract and normalize categories
  normalizeCategories(categories) {
    if (!categories) return [];

    let cats = Array.isArray(categories) ? categories : [categories];
    
    return cats
      .map(cat => typeof cat === 'object' ? cat._ || cat.$?.value || String(cat) : String(cat))
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0 && cat !== 'Uncategorized')
      .slice(0, 10); // Limit to 10 categories
  }

  // Calculate relevance score
  calculateRelevanceScore(item, sourceDomain) {
    let score = 0.5; // Base score

    // Recent articles get higher scores
    const publishedDate = moment(item.pubDate);
    const daysSincePublished = moment().diff(publishedDate, 'days');
    
    if (daysSincePublished <= 1) score += 0.3;
    else if (daysSincePublished <= 7) score += 0.2;
    else if (daysSincePublished <= 30) score += 0.1;

    // Articles with images get higher scores
    const content = item['content:encoded'] || item.description || '';
    if (content.includes('<img')) score += 0.1;

    // Articles with categories get higher scores
    if (item.category) score += 0.1;

    // Trusted sources get higher scores
    const trustedSources = ['iot-now.com', 'www.iot-now.com', 'iottechnews.com'];
    if (trustedSources.includes(sourceDomain)) score += 0.1;

    return Math.min(score, 1.0);
  }

  // Convert RSS item to normalized format
  normalizeRSSItem(item, feedUrl) {
    try {
      const sourceDomain = new URL(feedUrl).hostname;
      const sourceNames = {
        'iottechnews.com': 'IoT Tech News',
        'iot-now.com': 'IoT Now',
        'www.iot-now.com': 'IoT Now',
        'iotbusinessnews.com': 'IoT Business News',
        'iotinsider.com': 'IoT Insider'
      };

      const content = item['content:encoded'] || item.description || '';
      const { featuredImage, images } = this.extractImages(item, sourceDomain);

      const normalizedItem = {
        title: (item.title || '').trim(),
        url: item.link || item.guid,
        source: {
          name: sourceNames[sourceDomain] || sourceDomain,
          domain: sourceDomain,
          feedUrl: feedUrl
        },
        author: this.normalizeAuthor(item['dc:creator'] || item.author, sourceDomain),
        publishedAt: moment(item.pubDate).toDate(),
        excerpt: this.extractCleanText(item.description, 200),
        content: content,
        featuredImage: featuredImage,
        images: images,
        categories: this.normalizeCategories(item.category),
        tags: [], // Can be enhanced with NLP
        commentCount: parseInt(item['slash:comments']) || 0,
        isDuplicate: false,
        relevanceScore: this.calculateRelevanceScore(item, sourceDomain)
      };

      // Validation
      if (!normalizedItem.title || !normalizedItem.url) {
        throw new Error('Missing required fields: title or url');
      }

      if (!validator.isURL(normalizedItem.url)) {
        throw new Error('Invalid URL format');
      }

      return normalizedItem;
    } catch (error) {
      console.error('Error normalizing RSS item:', error.message);
      return null;
    }
  }

  // Parse multiple RSS feeds
  async parseMultipleFeeds(feedUrls) {
    const allItems = [];

    for (const feedUrl of feedUrls) {
      try {
        const rssItems = await this.parseRSSFeed(feedUrl);
        
        for (const item of rssItems) {
          const normalizedItem = this.normalizeRSSItem(item, feedUrl);
          if (normalizedItem) {
            allItems.push(normalizedItem);
          }
        }
      } catch (error) {
        console.error(`Error processing feed ${feedUrl}:`, error.message);
      }
    }

    return allItems;
  }
}

module.exports = RSSParser;
