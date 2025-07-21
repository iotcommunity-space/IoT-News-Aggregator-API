const cheerio = require('cheerio');
const validator = require('validator');

class ImageExtractor {
  constructor() {
    this.imageSelectors = [
      'img[src]',
      '.wp-post-image',
      '.featured-image img',
      '.post-thumbnail img',
      '.entry-content img:first-child',
      'figure img',
      '.attachment-post-thumbnail'
    ];
  }

  // Enhanced image extraction from multiple content sources
  extractImages(item, sourceDomain) {
    const content = item['content:encoded'] || item.description || '';
    const images = [];
    let featuredImage = null;

    if (!content) return { featuredImage, images };

    const $ = cheerio.load(content);

    // Try multiple selectors for better coverage
    this.imageSelectors.forEach(selector => {
      $(selector).each((index, element) => {
        const src = $(element).attr('src');
        const alt = $(element).attr('alt') || '';
        const title = $(element).attr('title') || '';
        const width = $(element).attr('width');
        const height = $(element).attr('height');

        if (this.isValidImageUrl(src)) {
          const imageObj = {
            url: this.normalizeImageUrl(src),
            alt: alt.trim(),
            caption: title.trim(),
            width: width ? parseInt(width) : null,
            height: height ? parseInt(height) : null
          };

          // Avoid duplicates
          if (!images.find(img => img.url === imageObj.url)) {
            images.push(imageObj);

            // First valid image becomes featured image
            if (!featuredImage) {
              featuredImage = { ...imageObj };
            }
          }
        }
      });
    });

    // Source-specific extraction
    switch (sourceDomain) {
      case 'iotbusinessnews.com':
        return this.extractIoTBusinessNewsImages($, content, featuredImage, images);
      
      case 'iottechnews.com':
        return this.extractIoTTechNewsImages($, content, featuredImage, images);
      
      case 'iot-now.com':
        return this.extractIoTNowImages($, content, featuredImage, images);
      
      default:
        return { featuredImage, images };
    }
  }

  // Specific extraction for IoT Business News
  extractIoTBusinessNewsImages($, content, featuredImage, images) {
    // Check for WordPress featured images
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

  // Specific extraction for IoT Tech News
  extractIoTTechNewsImages($, content, featuredImage, images) {
    // Look for hero images or main article images
    const heroImg = $('.hero-image img, .post-featured-image img, .entry-header img').first();
    if (heroImg.length && this.isValidImageUrl(heroImg.attr('src'))) {
      const heroImage = {
        url: this.normalizeImageUrl(heroImg.attr('src')),
        alt: heroImg.attr('alt') || '',
        caption: heroImg.attr('title') || ''
      };
      
      if (!featuredImage) {
        featuredImage = heroImage;
      }
    }

    return { featuredImage, images };
  }

  // Specific extraction for IoT Now
  extractIoTNowImages($, content, featuredImage, images) {
    // IoT Now often has images in specific containers
    const mainImg = $('.post-content img, .entry-content img').first();
    if (mainImg.length && this.isValidImageUrl(mainImg.attr('src'))) {
      const mainImage = {
        url: this.normalizeImageUrl(mainImg.attr('src')),
        alt: mainImg.attr('alt') || '',
        caption: mainImg.attr('title') || ''
      };
      
      if (!featuredImage) {
        featuredImage = mainImage;
      }
    }

    return { featuredImage, images };
  }

  // Validate image URL
  isValidImageUrl(url) {
    if (!url) return false;
    
    // Check if it's a valid URL
    if (!validator.isURL(url, { require_protocol: false })) {
      return false;
    }

    // Check for common image extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
    const hasImageExt = imageExtensions.test(url);

    // Check for common image domains/patterns
    const imagePatterns = [
      /cdn\./,
      /images?\./,
      /img\./,
      /media\./,
      /assets\./,
      /uploads?/,
      /wp-content/
    ];

    const hasImagePattern = imagePatterns.some(pattern => pattern.test(url));

    return hasImageExt || hasImagePattern;
  }

  // Normalize image URL (handle relative URLs, etc.)
  normalizeImageUrl(url) {
    if (!url) return url;

    // Handle protocol-relative URLs
    if (url.startsWith('//')) {
      return 'https:' + url;
    }

    // Handle relative URLs (would need base URL context)
    if (url.startsWith('/') && !url.startsWith('//')) {
      // This would need the base domain context
      return url;
    }

    return url;
  }
}

module.exports = ImageExtractor;
