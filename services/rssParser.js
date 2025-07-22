// services/rssParser.js - ENHANCED VERSION with Advanced Image Extraction

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
    this.imageTimeout = 8000; // 8 seconds timeout for image fetching
    this.maxImageFetchAttempts = 3;
  }

  // Main RSS parsing function
  async parseRSSFeed(feedUrl) {
    try {
      console.log(`Fetching RSS feed: ${feedUrl}`);

      const response = await axios.get(feedUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'IoT-News-Aggregator/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml'
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

  // ENHANCED - Multi-strategy image extraction
  async extractImages(item, sourceDomain) {
    const strategies = [
      await this.extractFromRSSContent(item),
      await this.extractFromMediaElements(item),
      await this.extractFromEnclosures(item),
      await this.extractFromOriginalPage(item.link, sourceDomain),
      await this.generatePlaceholderImage(item, sourceDomain)
    ];

    let featuredImage = null;
    let images = [];

    // Combine results from all strategies
    for (const strategy of strategies) {
      if (strategy.featuredImage && !featuredImage) {
        featuredImage = strategy.featuredImage;
      }
      if (strategy.images && strategy.images.length > 0) {
        images = [...images, ...strategy.images];
      }
    }

    // Remove duplicates and limit images
    images = this.removeDuplicateImages(images).slice(0, 5);

    return { featuredImage, images };
  }

  // Strategy 1: Extract from RSS content (enhanced version)
  async extractFromRSSContent(item) {
    const htmlContent = item['content:encoded'] || item.description || '';
    if (!htmlContent) return { featuredImage: null, images: [] };

    const $ = cheerio.load(htmlContent);
    const images = [];
    let featuredImage = null;

    // Extract images from HTML content
    $('img').each((index, element) => {
      const src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-lazy-src');
      const alt = $(element).attr('alt') || '';
      const caption = $(element).attr('title') || $(element).next('figcaption').text() || '';

      if (src && this.isValidImageUrl(src)) {
        const imageObj = {
          url: this.normalizeImageUrl(src),
          alt: alt.trim(),
          caption: caption.trim(),
          source: 'rss_content'
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

    return { featuredImage, images };
  }

  // Strategy 2: Extract from media elements (RSS 2.0 media namespace)
  async extractFromMediaElements(item) {
    const images = [];
    let featuredImage = null;

    try {
      // Check for media:content elements
      if (item['media:content']) {
        const mediaContent = Array.isArray(item['media:content']) 
          ? item['media:content'] 
          : [item['media:content']];

        mediaContent.forEach((media, index) => {
          if (media.$ && media.$.type && media.$.type.startsWith('image/')) {
            const imageObj = {
              url: this.normalizeImageUrl(media.$.url),
              alt: media.$.title || `Media image ${index + 1}`,
              caption: media.$.description || '',
              source: 'media_content'
            };
            images.push(imageObj);
            if (!featuredImage) {
              featuredImage = imageObj;
            }
          }
        });
      }

      // Check for media:thumbnail
      if (item['media:thumbnail'] && item['media:thumbnail'].$) {
        const thumbnail = {
          url: this.normalizeImageUrl(item['media:thumbnail'].$.url),
          alt: 'Article thumbnail',
          caption: '',
          source: 'media_thumbnail'
        };
        if (!featuredImage) {
          featuredImage = thumbnail;
        }
        images.push(thumbnail);
      }

      // Check for iTunes image (podcast feeds)
      if (item['itunes:image'] && item['itunes:image'].$) {
        const itunesImage = {
          url: this.normalizeImageUrl(item['itunes:image'].$.href),
          alt: 'Podcast image',
          caption: '',
          source: 'itunes_image'
        };
        if (!featuredImage) {
          featuredImage = itunesImage;
        }
        images.push(itunesImage);
      }
    } catch (error) {
      console.log(`Error extracting media elements: ${error.message}`);
    }

    return { featuredImage, images };
  }

  // Strategy 3: Extract from RSS enclosures
  async extractFromEnclosures(item) {
    const images = [];
    let featuredImage = null;

    try {
      if (item.enclosure) {
        const enclosures = Array.isArray(item.enclosure) ? item.enclosure : [item.enclosure];
        
        enclosures.forEach(enclosure => {
          if (enclosure.$ && enclosure.$.type && enclosure.$.type.startsWith('image/')) {
            const imageObj = {
              url: this.normalizeImageUrl(enclosure.$.url),
              alt: 'Article image',
              caption: '',
              source: 'enclosure'
            };
            if (!featuredImage) {
              featuredImage = imageObj;
            }
            images.push(imageObj);
          }
        });
      }
    } catch (error) {
      console.log(`Error extracting enclosures: ${error.message}`);
    }

    return { featuredImage, images };
  }

  // Strategy 4: Extract from original article page
  async extractFromOriginalPage(articleUrl, sourceDomain) {
    try {
      if (!articleUrl || !this.isValidImageUrl(articleUrl)) {
        return { featuredImage: null, images: [] };
      }

      const response = await axios.get(articleUrl, {
        timeout: this.imageTimeout,
        headers: {
          'User-Agent': 'IoT-News-Aggregator/1.0',
          'Accept': 'text/html,application/xhtml+xml'
        },
        maxRedirects: 3
      });

      const $ = cheerio.load(response.data);
      const images = [];
      let featuredImage = null;

      // Try Open Graph image first
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage && this.isValidImageUrl(ogImage)) {
        featuredImage = {
          url: this.normalizeImageUrl(ogImage, articleUrl),
          alt: $('meta[property="og:image:alt"]').attr('content') || 'Article image',
          caption: $('meta[property="og:title"]').attr('content') || '',
          source: 'open_graph'
        };
      }

      // Try Twitter Card image
      if (!featuredImage) {
        const twitterImage = $('meta[name="twitter:image"]').attr('content');
        if (twitterImage && this.isValidImageUrl(twitterImage)) {
          featuredImage = {
            url: this.normalizeImageUrl(twitterImage, articleUrl),
            alt: $('meta[name="twitter:image:alt"]').attr('content') || 'Article image',
            caption: $('meta[name="twitter:title"]').attr('content') || '',
            source: 'twitter_card'
          };
        }
      }

      // Try source-specific selectors
      if (!featuredImage) {
        const selectors = this.getSourceSpecificSelectors(sourceDomain);
        
        for (const selector of selectors) {
          const img = $(selector).first();
          if (img.length) {
            const src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
            if (src && this.isValidImageUrl(src)) {
              featuredImage = {
                url: this.normalizeImageUrl(src, articleUrl),
                alt: img.attr('alt') || 'Article image',
                caption: img.attr('title') || '',
                source: 'page_extraction'
              };
              break;
            }
          }
        }
      }

      // Add featured image to images array
      if (featuredImage) {
        images.push(featuredImage);
      }

      return { featuredImage, images };
    } catch (error) {
      console.log(`Could not fetch images from ${articleUrl}: ${error.message}`);
      return { featuredImage: null, images: [] };
    }
  }

// Strategy 5: Generate placeholder image
async generatePlaceholderImage(item, sourceDomain) {
  const placeholders = {
    'iottechnews.com': {
      url: 'https://placehold.co/400x200/2c3e50/ffffff?text=IoT+Tech+News',
      alt: 'IoT Tech News placeholder',
      caption: 'IoT technology news',
      source: 'placeholder'
    },
    'iot-now.com': {
      url: 'https://placehold.co/400x200/3498db/ffffff?text=IoT+Now',
      alt: 'IoT Now placeholder', 
      caption: 'Enterprise IoT insights',
      source: 'placeholder'
    },
    'www.iot-now.com': {
      url: 'https://placehold.co/400x200/3498db/ffffff?text=IoT+Now',
      alt: 'IoT Now placeholder', 
      caption: 'Enterprise IoT insights',
      source: 'placeholder'
    },
    'iotbusinessnews.com': {
      url: 'https://placehold.co/400x200/27ae60/ffffff?text=IoT+Business+News',
      alt: 'IoT Business News placeholder',
      caption: 'IoT business news',
      source: 'placeholder'
    },
    'iotinsider.com': {
      url: 'https://placehold.co/400x200/e74c3c/ffffff?text=IoT+Insider',
      alt: 'IoT Insider placeholder',
      caption: 'IoT industry insights',
      source: 'placeholder'
    },
    'aws.amazon.com': {
      url: 'https://placehold.co/400x200/FF9900/000000?text=AWS+IoT+Blog',
      alt: 'AWS IoT placeholder',
      caption: 'AWS IoT solutions',
      source: 'placeholder'
    },
    'connectedworld.com': {
      url: 'https://placehold.co/400x200/7B68EE/ffffff?text=Connected+World',
      alt: 'Connected World placeholder',
      caption: 'Connected world insights',
      source: 'placeholder'
    }
  };

  const placeholder = placeholders[sourceDomain] || {
    url: 'https://placehold.co/400x200/95a5a6/ffffff?text=IoT+News',
    alt: 'IoT News placeholder',
    caption: 'IoT industry news',
    source: 'placeholder'
  };

  return { 
    featuredImage: placeholder, 
    images: [placeholder] 
  };
}

  // Get source-specific image selectors
  getSourceSpecificSelectors(sourceDomain) {
    const selectorMap = {
      'iottechnews.com': [
        '.wp-post-image',
        '.post-thumbnail img',
        '.featured-image img',
        'article img:first-of-type',
        '.entry-content img:first-child',
        '.hero-image img',
        '.post-featured-image img'
      ],
      'iot-now.com': [
        '.post-featured-image img',
        '.article-image img', 
        '.post-content img:first-child',
        'img.attachment-full',
        '.entry-content img:first-child'
      ],
      'www.iot-now.com': [
        '.post-featured-image img',
        '.article-image img', 
        '.post-content img:first-child',
        'img.attachment-full',
        '.entry-content img:first-child'
      ],
      'iotbusinessnews.com': [
        '.wp-post-image',
        '.featured-image img',
        '.post-image img',
        'img.attachment-post-thumbnail',
        '.wp-block-image img'
      ],
      'aws.amazon.com': [
        '.blog-post-image img',
        '.featured-image img',
        'article img:first-of-type',
        '.content img:first-child'
      ],
      'connectedworld.com': [
        '.featured-image img',
        '.post-thumbnail img',
        'article img:first-of-type',
        '.entry-content img:first-child'
      ]
    };

    return selectorMap[sourceDomain] || [
      '.featured-image img',
      '.post-thumbnail img',
      'article img:first-of-type',
      '.content img:first-child',
      'img.hero',
      'img.featured'
    ];
  }

  // Enhanced URL validation
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      // Handle relative URLs
      if (url.startsWith('//')) url = 'https:' + url;
      if (url.startsWith('/') || !url.startsWith('http')) return url.length > 1;
      
      // Validate URL format
      new URL(url);
      
      // Check for image file extensions or image-related patterns
      const imagePatterns = [
        /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?.*)?$/i,
        /\/wp-content\/uploads\//,
        /\/images?\//,
        /\/media\//,
        /\/assets\//,
        /placeholder\.com/,
        /gravatar\.com/,
        /amazonaws\.com.*\.(jpg|png|gif|webp)/i,
        /unsplash\.com/,
        /pexels\.com/,
        /\/photo/,
        /\/image/
      ];
      
      return imagePatterns.some(pattern => pattern.test(url));
    } catch {
      return false;
    }
  }

  // Enhanced URL normalization
  normalizeImageUrl(url, baseUrl = '') {
    if (!url) return url;

    try {
      // Handle protocol-relative URLs
      if (url.startsWith('//')) {
        return 'https:' + url;
      }

      // Handle relative URLs
      if (url.startsWith('/') && !url.startsWith('//')) {
        if (baseUrl) {
          const base = new URL(baseUrl);
          return `${base.protocol}//${base.hostname}${url}`;
        }
        return url;
      }

      // Handle relative paths
      if (!url.startsWith('http') && baseUrl) {
        return new URL(url, baseUrl).href;
      }

      return url;
    } catch (error) {
      return url;
    }
  }

  // Remove duplicate images
  removeDuplicateImages(images) {
    const seen = new Set();
    return images.filter(img => {
      if (seen.has(img.url)) {
        return false;
      }
      seen.add(img.url);
      return true;
    });
  }

  // Clean and extract text from HTML
  extractCleanText(html, maxLength = 200) {
    if (!html) return '';

    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, noscript, iframe, .ad, .advertisement, .social-share').remove();
    $('.read-more, .continue-reading, .more-link').remove();

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
    const genericAuthors = ['IoT.Business.News', 'admin', 'editor', 'staff'];
    
    if (genericAuthors.includes(author) || (author.toLowerCase().includes('iot') && sourceDomain.includes('iotbusiness'))) {
      const sourceNames = {
        'iotbusinessnews.com': 'IoT Business News Team',
        'iottechnews.com': 'IoT Tech News Team',
        'iot-now.com': 'IoT Now Team',
        'www.iot-now.com': 'IoT Now Team',
        'aws.amazon.com': 'AWS Team',
        'connectedworld.com': 'Connected World Team'
      };
      
      return sourceNames[sourceDomain] || 'Editorial Team';
    }

    return author.trim();
  }

  // Extract and normalize categories
  normalizeCategories(categories) {
    if (!categories) return [];

    let cats = Array.isArray(categories) ? categories : [categories];

    return cats
      .map(cat => {
        if (typeof cat === 'object') {
          return cat._ || cat.$?.value || String(cat);
        }
        return String(cat);
      })
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0 && cat !== 'Uncategorized' && cat !== 'Uncategorised')
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
    if (content.includes('<img') || content.includes('image')) score += 0.1;

    // Articles with categories get higher scores
    if (item.category) score += 0.1;

    // Trusted sources get higher scores
    const trustedSources = [
      'iot-now.com', 
      'www.iot-now.com', 
      'iottechnews.com', 
      'iotbusinessnews.com',
      'aws.amazon.com'
    ];
    if (trustedSources.includes(sourceDomain)) score += 0.1;

    // Articles with media elements get higher scores
    if (item['media:content'] || item['media:thumbnail']) score += 0.1;

    return Math.min(score, 1.0);
  }

  // Convert RSS item to normalized format (now async)
  async normalizeRSSItem(item, feedUrl) {
    try {
      const sourceDomain = new URL(feedUrl).hostname;
      const sourceNames = {
        'iottechnews.com': 'IoT Tech News',
        'iot-now.com': 'IoT Now',
        'www.iot-now.com': 'IoT Now',
        'iotbusinessnews.com': 'IoT Business News',
        'iotinsider.com': 'IoT Insider',
        'www.iotinsider.com': 'IoT Insider',
        'aws.amazon.com': 'AWS IoT Blog',
        'connectedworld.com': 'Connected World'
      };

      const content = item['content:encoded'] || item.description || '';
      
      // Enhanced image extraction (now async)
      const { featuredImage, images } = await this.extractImages(item, sourceDomain);

      const normalizedItem = {
        title: (item.title || '').trim(),
        url: item.link || item.guid || item.id,
        source: {
          name: sourceNames[sourceDomain] || sourceDomain,
          domain: sourceDomain,
          feedUrl: feedUrl
        },
        author: this.normalizeAuthor(item['dc:creator'] || item.author || item.creator, sourceDomain),
        publishedAt: moment(item.pubDate || item.published || item.date).toDate(),
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

      if (!validator.isURL(normalizedItem.url, { require_protocol: true })) {
        throw new Error('Invalid URL format');
      }

      return normalizedItem;
    } catch (error) {
      console.error('Error normalizing RSS item:', error.message);
      return null;
    }
  }

  // Parse multiple RSS feeds (now async for all operations)
  async parseMultipleFeeds(feedUrls) {
    const allItems = [];

    for (const feedUrl of feedUrls) {
      try {
        console.log(`🔄 Processing feed: ${new URL(feedUrl).hostname}`);
        const rssItems = await this.parseRSSFeed(feedUrl);
        
        for (const item of rssItems) {
          const normalizedItem = await this.normalizeRSSItem(item, feedUrl); // Now async
          if (normalizedItem) {
            allItems.push(normalizedItem);
          }
        }
        
        console.log(`✅ Processed ${rssItems.length} items from ${new URL(feedUrl).hostname}`);
      } catch (error) {
        console.error(`❌ Error processing feed ${feedUrl}:`, error.message);
      }
    }

    console.log(`📰 Total items processed: ${allItems.length}`);
    return allItems;
  }
}

module.exports = RSSParser;
