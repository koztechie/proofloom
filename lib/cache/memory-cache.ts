type CacheItem<T> = {
  value: T;
  expiresAt: number; // Timestamp in milliseconds
};

class MemoryCache {
  private cache: Map<string, CacheItem<any>>;

  constructor() {
    this.cache = new Map();
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const memoryCache = new MemoryCache();
