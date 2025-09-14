# Cache Implementation Guide

This guide explains how to use caching in SoapJS repositories.

## Overview

SoapJS provides a flexible caching system that can be integrated with repositories through the `DatabaseContext`. The cache system is designed to be:

- **Optional**: Cache can be easily enabled/disabled
- **Transparent**: Repository operations work the same with or without cache
- **Extensible**: Different cache implementations can be used

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Repository    │───▶│ DatabaseContext │───▶│   CacheManager  │
│  (Business)     │    │   (Cache)       │    │  (Storage)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Available Implementations

### Memory Cache (Built-in)

The `MemoryCacheManager` is included in the main SoapJS package and provides in-memory caching.

```typescript
import { MemoryCacheManager } from '@soapjs/soap';
import { CacheOptions } from '@soapjs/soap';

const cacheOptions: CacheOptions = {
  ttl: 300, // 5 minutes
  store: 'memory',
  prefix: 'users',
  enabled: true
};

const cacheManager = new MemoryCacheManager(cacheOptions);
```

### Redis Cache (External Package)

For production environments, use the Redis implementation from `@soapjs/soap-node-redis`:

```typescript
import { RedisCacheManager } from '@soapjs/soap-node-redis';
import { CacheOptions } from '@soapjs/soap';

const cacheOptions: CacheOptions = {
  ttl: 600, // 10 minutes
  store: 'redis',
  prefix: 'users',
  enabled: true
};

const cacheManager = new RedisCacheManager(redisClient, cacheOptions);
```

## Usage

### Basic Setup

```typescript
import { DatabaseContext, CacheOptions } from '@soapjs/soap';
import { MemoryCacheManager } from '@soapjs/soap';
import { ReadRepository } from '@soapjs/soap';

// 1. Configure cache options
const cacheOptions: CacheOptions = {
  ttl: 300, // 5 minutes
  store: 'memory',
  prefix: 'users',
  enabled: true
};

// 2. Create cache manager
const cacheManager = new MemoryCacheManager(cacheOptions);

// 3. Create context with cache
const userContext = new DatabaseContext(
  userSource,
  userMapper,
  sessionRegistry,
  cacheManager
);

// 4. Create repository
const userRepository = new ReadRepository(userContext);
```

### Using in Use Cases

```typescript
class GetUserUseCase {
  constructor(private userRepository: ReadRepository<User>) {}
  
  async execute(userId: string): Promise<Result<User>> {
    // Repository automatically checks cache first
    const result = await this.userRepository.find({ 
      where: { id: userId } 
    });
    
    if (result.isSuccess()) {
      return Result.withSuccess(result.value[0]);
    }
    
    return Result.withFailure(result.failure);
  }
}
```

## Cache Options

```typescript
interface CacheOptions {
  /**
   * Time to live in seconds
   */
  ttl: number;
  
  /**
   * Cache storage type
   */
  store?: "memory" | "redis" | "db";
  
  /**
   * Cache key prefix
   */
  prefix?: string;
  
  /**
   * Whether to enable cache for this context
   */
  enabled?: boolean;
}
```

## Cache Behavior

### Automatic Caching

The following repository operations are automatically cached:

- `find()` - Caches query results
- `count()` - Caches count results  
- `aggregate()` - Caches aggregation results

### Cache Keys

Cache keys are automatically generated based on:
- Operation type (find, count, aggregate)
- Query parameters
- Collection name (from source)

Example key: `users:find:eyJ3aGVyZSI6eyJzdGF0dXMiOiJhY3RpdmUifX0=`

### Cache Invalidation

Cache is automatically invalidated when:
- TTL expires
- Manual cache clearing
- Repository write operations (in future versions)

## Best Practices

### 1. Choose Appropriate TTL

```typescript
// Short TTL for frequently changing data
const userCacheOptions: CacheOptions = {
  ttl: 60, // 1 minute
  prefix: 'users',
  enabled: true
};

// Long TTL for static data
const configCacheOptions: CacheOptions = {
  ttl: 3600, // 1 hour
  prefix: 'config',
  enabled: true
};
```

### 2. Use Meaningful Prefixes

```typescript
const cacheOptions: CacheOptions = {
  ttl: 300,
  prefix: 'users', // Clear namespace
  enabled: true
};
```

### 3. Disable Cache for Development

```typescript
const cacheOptions: CacheOptions = {
  ttl: 300,
  prefix: 'users',
  enabled: process.env.NODE_ENV === 'production' // Disable in dev
};
```

### 4. Monitor Cache Performance

```typescript
class CacheMonitoringRepository extends ReadRepository<User> {
  private cacheHits = 0;
  private cacheMisses = 0;
  
  // Override methods to add monitoring
  // ... implementation details
}
```

## Troubleshooting

### Cache Not Working

1. Check if cache is enabled: `cacheManager.isEnabled()`
2. Verify cache options are correct
3. Check if context has cache manager assigned

### Memory Issues

1. Use appropriate TTL values
2. Consider using Redis for large datasets
3. Monitor cache size and clear when needed

### Performance Issues

1. Check cache hit rates
2. Optimize query patterns
3. Consider cache warming strategies

## Future Enhancements

- Write-through caching for write operations
- Cache warming strategies
- Distributed cache invalidation
- Cache statistics and monitoring
- Custom cache key strategies
