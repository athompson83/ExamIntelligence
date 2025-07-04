interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
  }

  set(key: string, value: T, ttl: number = 300000): void { // Default 5 minutes
    // Remove oldest entries if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export class CacheService {
  private userCache = new MemoryCache<any>({ maxSize: 500, ttl: 600000 }); // 10 minutes
  private quizCache = new MemoryCache<any>({ maxSize: 200, ttl: 300000 }); // 5 minutes
  private analyticsCache = new MemoryCache<any>({ maxSize: 100, ttl: 900000 }); // 15 minutes
  private questionCache = new MemoryCache<any>({ maxSize: 1000, ttl: 1800000 }); // 30 minutes

  constructor() {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.userCache.cleanup();
      this.quizCache.cleanup();
      this.analyticsCache.cleanup();
      this.questionCache.cleanup();
    }, 300000);
  }

  // User caching
  cacheUser(userId: string, user: any): void {
    this.userCache.set(`user:${userId}`, user);
  }

  getCachedUser(userId: string): any | null {
    return this.userCache.get(`user:${userId}`);
  }

  invalidateUser(userId: string): void {
    this.userCache.delete(`user:${userId}`);
  }

  // Quiz caching
  cacheQuiz(quizId: string, quiz: any): void {
    this.quizCache.set(`quiz:${quizId}`, quiz);
  }

  getCachedQuiz(quizId: string): any | null {
    return this.quizCache.get(`quiz:${quizId}`);
  }

  invalidateQuiz(quizId: string): void {
    this.quizCache.delete(`quiz:${quizId}`);
    // Also invalidate related analytics
    this.invalidateQuizAnalytics(quizId);
  }

  // Analytics caching
  cacheAnalytics(key: string, data: any, ttl?: number): void {
    this.analyticsCache.set(`analytics:${key}`, data, ttl);
  }

  getCachedAnalytics(key: string): any | null {
    return this.analyticsCache.get(`analytics:${key}`);
  }

  invalidateAnalytics(key: string): void {
    this.analyticsCache.delete(`analytics:${key}`);
  }

  invalidateQuizAnalytics(quizId: string): void {
    // Invalidate all analytics related to a quiz
    const keys = ['dashboard', 'performance', 'question_analysis', 'student_performance'];
    keys.forEach(key => {
      this.invalidateAnalytics(`${key}:${quizId}`);
    });
  }

  // Question caching
  cacheQuestion(questionId: string, question: any): void {
    this.questionCache.set(`question:${questionId}`, question);
  }

  getCachedQuestion(questionId: string): any | null {
    return this.questionCache.get(`question:${questionId}`);
  }

  invalidateQuestion(questionId: string): void {
    this.questionCache.delete(`question:${questionId}`);
  }

  // Batch operations
  cacheBatch(prefix: string, items: Record<string, any>, ttl?: number): void {
    Object.entries(items).forEach(([key, value]) => {
      const cache = this.getCacheByPrefix(prefix);
      cache.set(`${prefix}:${key}`, value, ttl);
    });
  }

  getCachedBatch(prefix: string, keys: string[]): Record<string, any> {
    const cache = this.getCacheByPrefix(prefix);
    const result: Record<string, any> = {};
    
    keys.forEach(key => {
      const value = cache.get(`${prefix}:${key}`);
      if (value !== null) {
        result[key] = value;
      }
    });

    return result;
  }

  // Helper method to get appropriate cache
  private getCacheByPrefix(prefix: string): MemoryCache<any> {
    switch (prefix) {
      case 'user': return this.userCache;
      case 'quiz': return this.quizCache;
      case 'analytics': return this.analyticsCache;
      case 'question': return this.questionCache;
      default: return this.userCache;
    }
  }

  // Cache statistics
  getStats(): Record<string, any> {
    return {
      users: this.userCache['cache'].size,
      quizzes: this.quizCache['cache'].size,
      analytics: this.analyticsCache['cache'].size,
      questions: this.questionCache['cache'].size,
      total: this.userCache['cache'].size + 
             this.quizCache['cache'].size + 
             this.analyticsCache['cache'].size + 
             this.questionCache['cache'].size
    };
  }

  // Clear all caches
  clearAll(): void {
    this.userCache.clear();
    this.quizCache.clear();
    this.analyticsCache.clear();
    this.questionCache.clear();
  }
}

export const cacheService = new CacheService();