const axios = require('axios');
const cheerio = require('cheerio');
const validator = require('validator');

class EnhancedImageExtractor {
  constructor() {
    this.timeout = 10000; // 10 seconds timeout for fetching
  }

  // Main extraction method with multiple strategies
  async extractImages(item, sourceDomain) {
    const strategies = [
      this.extractFromRSSContent(item),
      this.extractFromMediaElements(item),
      await this.extractFromOriginalPage(item.link, sourceDomain),
      this.extractFromEnclosures(item),
      this.generateFallbackImage(item, sourceDomain)
    ];

    let featuredImage = null;
    let images = [];

    for (const strategy of strategies) {
      if (strategy.featuredImage && !featuredImage) {
        featuredImage = strategy.featuredImage;
      }
      if (strategy.images && strategy.images.length > 0) {
        images = [...images, ...strategy.images];
      }
    }

    // Remove duplicates
    images = this.removeDuplicateImages(images);

    return {
      featuredImage,
      images: images.slice(0, 5) // Limit to 5 images
    };
  }

  // Strategy 1: Extract from RSS content (existing logic)
  extractFromRSSContent(item) {
    const content = item['content:encoded'] || item.description || '';
    if (!content) return { featuredImage: null, images: [] };

    const $ = cheerio.load(content);
    const images = [];
    let featuredImage = null;

    $('img').each((index, element) => {
      const src = $(element).attr('src');
      const alt = $(element).attr('alt') || '';

      if (src && this.isValidImageUrl(src)) {
        const imageObj = {
          url: this.normalizeImageUrl(src),
          alt: alt.trim(),
          caption: $(element).attr('title') || ''
        };

        images.push(imageObj);
        if (!featuredImage && index === 0) {
          featuredImage = imageObj;
        }
      }
    });

    return { featuredImage, images };
  }

  // Strategy 2: Extract from media elements (RSS 2.0 media namespace)
  extractFromMediaElements(item) {
    const images = [];
    let featuredImage = null;

    // Check for media:content elements
    if (item['media:content']) {
      const mediaContent = Array.isArray(item['media:content']) 
        ? item['media:content'] 
        : [item['media:content']];

      mediaContent.forEach(media => {
        if (media.$ && media.$.type && media.$.type.startsWith('image/')) {
          const imageObj = {
            url: media.$.url,
            alt: media.$.title || '',
            caption: media.$.description || ''
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
        url: item['media:thumbnail'].$.url,
        alt: 'Article thumbnail',
        caption: ''
      };
      if (!featuredImage) {
        featuredImage = thumbnail;
      }
      images.push(thumbnail);
    }

    return { featuredImage, images };
  }

  // Strategy 3: Fetch from original article page
  async extractFromOriginalPage(articleUrl, sourceDomain) {
    try {
      if (!articleUrl || !this.isValidImageUrl(articleUrl)) {
        return { featuredImage: null, images: [] };
      }

      const response = await axios.get(articleUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'IoT-News-Aggregator/1.0',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });

      const $ = cheerio.load(response.data);
      const images = [];
      let featuredImage = null;

      // Try source-specific selectors
      const selectors = this.getSourceSpecificSelectors(sourceDomain);
      
      for (const selector of selectors) {
        const img = $(selector).first();
        if (img.length) {
          const src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
          if (src && this.isValidImageUrl(src)) {
            const imageObj = {
              url: this.normalizeImageUrl(src, articleUrl),
              alt: img.attr('alt') || '',
              caption: img.attr('title') || ''
            };
            if (!featuredImage) {
              featuredImage = imageObj;
            }
            images.push(imageObj);
            break;
          }
        }
      }

      // Fallback to Open Graph images
      if (!featuredImage) {
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage && this.isValidImageUrl(ogImage)) {
          featuredImage = {
            url: this.normalizeImageUrl(ogImage, articleUrl),
            alt: $('meta[property="og:image:alt"]').attr('content') || 'Article image',
            caption: ''
          };
        }
      }

      return { featuredImage, images };
    } catch (error) {
      console.log(`Could not fetch images from ${articleUrl}: ${error.message}`);
      return { featuredImage: null, images: [] };
    }
  }

  // Strategy 4: Extract from RSS enclosures
  extractFromEnclosures(item) {
    const images = [];
    let featuredImage = null;

    if (item.enclosure && item.enclosure.$) {
      const enclosure = item.enclosure.$;
      if (enclosure.type && enclosure.type.startsWith('image/')) {
        const imageObj = {
          url: enclosure.url,
          alt: 'Article image',
          caption: ''
        };
        featuredImage = imageObj;
        images.push(imageObj);
      }
    }

    return { featuredImage, images };
  }

  // Strategy 5: Generate fallback placeholder
  generateFallbackImage(item, sourceDomain) {
    // Create a placeholder image based on source
    const placeholders = {
      'iottechnews.com': {
        url: 'https://via.placeholder.com/400x200/2c3e50/ffffff?text=IoT+Tech+News',
        alt: 'IoT Tech News placeholder',
        caption: 'IoT technology news'
      },
      'iot-now.com': {
        url: 'https://via.placeholder.com/400x200/3498db/ffffff?text=IoT+Now',
        alt: 'IoT Now placeholder', 
        caption: 'Enterprise IoT insights'
      },
      'iotbusinessnews.com': {
        url: 'https://via.placeholder.com/400x200/27ae60/ffffff?text=IoT+Business',
        alt: 'IoT Business News placeholder',
        caption: 'IoT business news'
      }
    };

    const placeholder = placeholders[sourceDomain] || {
      url: 'https://via.placeholder.com/400x200/95a5a6/ffffff?text=IoT+News',
      alt: 'IoT News placeholder',
      caption: 'IoT industry news'
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
        '.entry-content img:first-child'
      ],
      'iot-now.com': [
        '.post-featured-image img',
        '.article-image img', 
        '.post-content img:first-child',
        'img.attachment-full'
      ],
      'iotbusinessnews.com': [
        '.wp-post-image',
        '.featured-image img',
        '.post-image img',
        'img.attachment-post-thumbnail'
      ]
    };

    return selectorMap[sourceDomain] || [
      'img.featured',
      '.featured-image img',
      'article img:first-of-type',
      '.content img:first-child',
      'img'
    ];
  }

  // Enhanced URL validation
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      // Handle relative URLs
      if (url.startsWith('//')) url = 'https:' + url;
      if (!url.startsWith('http')) return false;
      
      // Validate URL format
      new URL(url);
      
      // Check for image file extensions or image-related patterns
      const imagePatterns = [
        /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i,
        /\/wp-content\/uploads\//,
        /\/images?\//,
        /\/media\//,
        /\/assets\//,
        /placeholder/,
        /gravatar/,
        /amazonaws\.com/
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
      if (url.startsWith('/') && baseUrl) {
        const base = new URL(baseUrl);
        return `${base.protocol}//${base.hostname}${url}`;
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
}

module.exports = EnhancedImageExtractor;
