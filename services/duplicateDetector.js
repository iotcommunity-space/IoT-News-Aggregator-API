const crypto = require('crypto');

class DuplicateDetector {
  constructor() {
    this.similarityThreshold = 0.8;
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

  // Calculate Levenshtein distance
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Calculate similarity ratio
  calculateSimilarity(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    
    const distance = this.levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
  }

  // Check if two articles are duplicates
  isDuplicate(article1, article2) {
    // Exact URL match
    if (article1.url === article2.url) {
      return { isDuplicate: true, reason: 'exact_url_match', similarity: 1.0 };
    }

    // Content hash match
    const hash1 = this.generateContentHash(article1);
    const hash2 = this.generateContentHash(article2);
    
    if (hash1 === hash2) {
      return { isDuplicate: true, reason: 'content_hash_match', similarity: 1.0 };
    }

    // Title similarity
    const titleSimilarity = this.calculateSimilarity(
      article1.title.toLowerCase(),
      article2.title.toLowerCase()
    );

    if (titleSimilarity >= this.similarityThreshold) {
      // Check if published within 24 hours of each other
      const timeDiff = Math.abs(
        new Date(article1.publishedAt) - new Date(article2.publishedAt)
      );
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff <= 24) {
        return { 
          isDuplicate: true, 
          reason: 'title_similarity_and_time', 
          similarity: titleSimilarity 
        };
      }
    }

    return { isDuplicate: false, similarity: titleSimilarity };
  }

  // Find duplicates in a collection of articles
  findDuplicates(articles) {
    const duplicateGroups = [];
    const processedArticles = [...articles];

    for (let i = 0; i < processedArticles.length; i++) {
      if (processedArticles[i].isDuplicate) continue;

      const currentGroup = [processedArticles[i]];

      for (let j = i + 1; j < processedArticles.length; j++) {
        if (processedArticles[j].isDuplicate) continue;

        const duplicateCheck = this.isDuplicate(
          processedArticles[i], 
          processedArticles[j]
        );

        if (duplicateCheck.isDuplicate) {
          processedArticles[j].isDuplicate = true;
          processedArticles[j].duplicateReason = duplicateCheck.reason;
          processedArticles[j].similarity = duplicateCheck.similarity;
          currentGroup.push(processedArticles[j]);
        }
      }

      if (currentGroup.length > 1) {
        // Keep the article with highest relevance score or most recent
        currentGroup.sort((a, b) => {
          if (a.relevanceScore !== b.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
          }
          return new Date(b.publishedAt) - new Date(a.publishedAt);
        });

        duplicateGroups.push(currentGroup);
      }
    }

    return {
      duplicateGroups,
      uniqueArticles: processedArticles.filter(article => !article.isDuplicate),
      duplicateArticles: processedArticles.filter(article => article.isDuplicate)
    };
  }

  // Mark duplicates and return processed articles
  processArticles(articles) {
    const result = this.findDuplicates(articles);
    
    console.log(`Duplicate detection complete:`);
    console.log(`- Total articles: ${articles.length}`);
    console.log(`- Unique articles: ${result.uniqueArticles.length}`);
    console.log(`- Duplicate articles: ${result.duplicateArticles.length}`);
    console.log(`- Duplicate groups: ${result.duplicateGroups.length}`);

    return {
      ...result,
      allArticles: [...result.uniqueArticles, ...result.duplicateArticles]
    };
  }
}

module.exports = DuplicateDetector;
