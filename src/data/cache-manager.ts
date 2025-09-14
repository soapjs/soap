import { CacheManager, CacheOptions } from "./repository-data-contexts";

/**
 * Simple in-memory cache manager implementation
 * 
 * Note: Redis implementation is available in @soapjs/soap-node-redis package
 */
export class MemoryCacheManager implements CacheManager {
  public readonly options: CacheOptions;
  private cache = new Map<string, { value: any; expires: number }>();

  constructor(options: CacheOptions) {
    this.options = options;
  }

  isEnabled(): boolean {
    return this.options.enabled !== false;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled()) {
      return null;
    }

    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    const actualTtl = ttl || this.options.ttl;
    const expires = Date.now() + (actualTtl * 1000);
    this.cache.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(prefix?: string): Promise<void> {
    if (prefix) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.startsWith(prefix)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  generateKey(operation: string, query: any): string {
    const queryString = JSON.stringify(query, Object.keys(query).sort());
    const prefix = this.options.prefix || 'cache';
    const key = `${prefix}:${operation}:${Buffer.from(queryString).toString('base64')}`;
    return key;
  }
}

