# Memory Monitoring Plugin

The Memory Monitoring Plugin provides advanced memory monitoring capabilities for SoapExpress applications, including real-time memory tracking, leak detection, and automatic garbage collection.

## Features

- **Real-time Memory Monitoring**: Track memory usage, heap statistics, and RSS
- **Memory Leak Detection**: Automatically detect memory leaks with configurable thresholds
- **Automatic Garbage Collection**: Optional auto-GC when memory usage exceeds thresholds
- **Multiple Endpoints**: RESTful API endpoints for memory statistics and management
- **Integration with Health Checks**: Compatible with health check systems
- **Configurable Thresholds**: Customizable memory limits and detection parameters
- **Memory History**: Track memory usage over time with configurable retention

## Installation

```typescript
import { MemoryMonitoringPlugin } from '@soapjs/soap/infra/http/plugins';

const app = new SoapExpress();

// Basic usage
const memoryPlugin = new MemoryMonitoringPlugin();
app.usePlugin(memoryPlugin);
```

## Configuration

### Basic Configuration

```typescript
const memoryPlugin = new MemoryMonitoringPlugin({
  basePath: '/memory',           // Base path for endpoints (default: '/memory')
  exposeEndpoints: true,         // Expose REST endpoints (default: true)
  includeInRequest: true,        // Add memory info to request context (default: true)
  autoGC: false,                 // Enable automatic garbage collection (default: false)
  gcThreshold: 90               // GC threshold percentage (default: 90)
});
```

### Advanced Configuration

```typescript
const memoryPlugin = new MemoryMonitoringPlugin({
  basePath: '/advanced-memory',
  exposeEndpoints: true,
  includeInRequest: true,
  autoGC: true,
  gcThreshold: 80,
  
  // Memory monitoring configuration
  enabled: true,
  interval: 15000,              // Check every 15 seconds
  
  // Memory thresholds
  threshold: {
    used: 1024 * 1024 * 1024,   // 1GB
    percentage: 75,              // 75%
    heapUsed: 512 * 1024 * 1024, // 512MB
    rss: 1024 * 1024 * 1024     // 1GB
  },
  
  // Leak detection
  leakDetection: {
    enabled: true,
    consecutiveGrowths: 2,      // Detect leak after 2 consecutive growths
    growthThreshold: 5,         // 5% growth threshold
    maxHistory: 30             // Keep 30 snapshots
  },
  
  // Event callbacks
  onLeak: (leakInfo) => {
    console.log('Memory leak detected!', leakInfo);
  },
  
  onThreshold: (memoryInfo) => {
    console.log('Memory threshold exceeded!', memoryInfo);
  }
});
```

## API Endpoints

When `exposeEndpoints` is enabled, the plugin provides the following REST endpoints:

### GET `/memory/stats`
Returns detailed memory statistics including current usage, history, and detected leaks.

**Response:**
```json
{
  "current": {
    "used": 1048576000,
    "total": 8589934592,
    "percentage": 12.21,
    "heapUsed": 524288000,
    "heapTotal": 1048576000,
    "external": 104857600,
    "rss": 1048576000,
    "arrayBuffers": 10485760
  },
  "history": [...],
  "leaks": [...],
  "uptime": 3600,
  "lastCheck": 1640995200000,
  "plugin": {
    "name": "memory-monitoring",
    "version": "1.0.0",
    "uptime": 3600000
  }
}
```

### GET `/memory/summary`
Returns a memory summary with health status.

**Response:**
```json
{
  "current": {
    "used": 1048576000,
    "percentage": 12.21
  },
  "status": "healthy",
  "leaks": 0,
  "uptime": 3600,
  "lastCheck": 1640995200000,
  "plugin": {
    "name": "memory-monitoring",
    "version": "1.0.0",
    "uptime": 3600000
  }
}
```

### GET `/memory/leaks`
Returns detected memory leaks.

**Response:**
```json
{
  "leaks": [
    {
      "timestamp": 1640995200000,
      "current": {...},
      "previous": {...},
      "growth": {
        "used": 10485760,
        "percentage": 15.5,
        "heapUsed": 5242880,
        "rss": 10485760
      },
      "threshold": {...},
      "severity": "medium"
    }
  ],
  "count": 1,
  "plugin": {...}
}
```

### GET `/memory/history`
Returns memory usage history.

**Query Parameters:**
- `limit` (optional): Number of recent snapshots to return (default: 50)

**Response:**
```json
{
  "history": [
    {
      "timestamp": 1640995200000,
      "memory": {...},
      "processUptime": 3600
    }
  ],
  "count": 10,
  "total": 100,
  "plugin": {...}
}
```

### POST `/memory/gc`
Triggers garbage collection and returns memory usage before and after.

**Response:**
```json
{
  "message": "Garbage collection triggered",
  "before": {...},
  "after": {...},
  "freed": {
    "heapUsed": 10485760,
    "rss": 5242880,
    "external": 1048576
  },
  "timestamp": "2021-12-31T12:00:00.000Z"
}
```

### GET `/memory/health`
Returns memory health status (compatible with health check systems).

**Response:**
```json
{
  "status": "healthy",
  "message": "Memory usage: 12.21%",
  "data": {
    "current": {...},
    "leaks": 0,
    "uptime": 3600
  },
  "timestamp": "2021-12-31T12:00:00.000Z"
}
```

## Plugin Methods

### `getMonitor(): MemoryMonitor`
Returns the underlying memory monitor instance.

### `getMemoryStats(): MemoryStats`
Returns current memory statistics.

### `getMemorySummary(): MemorySummary`
Returns memory summary with health status.

### `getMemoryLeaks(): MemoryLeakInfo[]`
Returns detected memory leaks.

### `getMemoryHistory(): MemorySnapshot[]`
Returns memory usage history.

### `forceGC(): void`
Triggers garbage collection.

### `getConfig(): MemoryMonitoringPluginOptions`
Returns current plugin configuration.

### `updateConfig(newConfig: Partial<MemoryMonitoringPluginOptions>): void`
Updates plugin configuration.

## Integration Examples

### With Health Check Plugin

```typescript
import { HealthCheckPlugin } from '@soapjs/soap/infra/http/plugins';
import { MemoryMonitoringPlugin } from '@soapjs/soap/infra/http/plugins';

const app = new SoapExpress();

const healthPlugin = new HealthCheckPlugin();
const memoryPlugin = new MemoryMonitoringPlugin();

// Add memory health check
healthPlugin.addHealthCheck({
  name: 'memory',
  check: () => {
    const summary = memoryPlugin.getMemorySummary();
    return {
      status: summary.status === 'healthy' ? 'healthy' : 'unhealthy',
      message: `Memory usage: ${summary.current.percentage.toFixed(2)}%`,
      data: summary
    };
  },
  critical: true
});

healthPlugin.addHealthCheck({
  name: 'memory-leaks',
  check: () => {
    const leaks = memoryPlugin.getMemoryLeaks();
    return {
      status: leaks.length === 0 ? 'healthy' : 'unhealthy',
      message: `${leaks.length} memory leaks detected`,
      data: { leaks: leaks.length }
    };
  }
});

app.usePlugin(healthPlugin);
app.usePlugin(memoryPlugin);
```

### With Metrics Plugin

```typescript
import { MetricsPlugin } from '@soapjs/soap/infra/http/plugins';
import { MemoryMonitoringPlugin } from '@soapjs/soap/infra/http/plugins';

const app = new SoapExpress();

const metricsPlugin = new MetricsPlugin();
const memoryPlugin = new MemoryMonitoringPlugin();

// Add custom memory metrics
const collector = metricsPlugin.getCollector();

setInterval(() => {
  const summary = memoryPlugin.getMemorySummary();
  collector.gauge('memory_usage_percentage', summary.current.percentage);
  collector.gauge('memory_leaks_count', summary.leaks);
  collector.gauge('memory_status', summary.status === 'healthy' ? 1 : 0);
}, 30000);

app.usePlugin(metricsPlugin);
app.usePlugin(memoryPlugin);
```

### Custom Memory Dashboard

```typescript
app.get('/dashboard/memory', (req, res) => {
  const stats = memoryPlugin.getMemoryStats();
  const summary = memoryPlugin.getMemorySummary();
  const leaks = memoryPlugin.getMemoryLeaks();
  
  res.json({
    timestamp: new Date().toISOString(),
    overview: {
      status: summary.status,
      usage: `${summary.current.percentage.toFixed(2)}%`,
      leaks: leaks.length,
      uptime: summary.uptime
    },
    details: {
      current: stats.current,
      recentLeaks: leaks.slice(-5),
      history: stats.history.slice(-10)
    },
    alerts: leaks.filter(leak => leak.severity === 'critical' || leak.severity === 'high')
  });
});
```

## Memory Leak Detection

The plugin automatically detects memory leaks by monitoring consecutive memory growth patterns:

### Leak Severity Levels

- **Low**: 10-15% growth
- **Medium**: 15-30% growth  
- **High**: 30-50% growth
- **Critical**: 50%+ growth

### Configuration

```typescript
leakDetection: {
  enabled: true,
  consecutiveGrowths: 3,        // Number of consecutive growths to trigger detection
  growthThreshold: 10,          // Minimum growth percentage to consider
  maxHistory: 20               // Maximum snapshots to keep in history
}
```

## Automatic Garbage Collection

When `autoGC` is enabled, the plugin automatically triggers garbage collection when memory usage exceeds the configured threshold:

```typescript
const memoryPlugin = new MemoryMonitoringPlugin({
  autoGC: true,
  gcThreshold: 85  // Trigger GC at 85% memory usage
});
```

## Best Practices

1. **Monitor in Production**: Enable memory monitoring in production environments
2. **Set Appropriate Thresholds**: Configure thresholds based on your application's memory requirements
3. **Use Health Checks**: Integrate with health check systems for monitoring
4. **Monitor Leaks**: Enable leak detection and set up alerts
5. **Regular Cleanup**: Use the GC endpoint for manual cleanup when needed
6. **Dashboard Integration**: Create custom dashboards using the plugin's data

## Troubleshooting

### High Memory Usage
- Check `/memory/stats` for detailed memory breakdown
- Review `/memory/leaks` for detected leaks
- Use `/memory/gc` to trigger garbage collection

### Memory Leaks
- Monitor `/memory/leaks` endpoint
- Review leak severity and growth patterns
- Check application code for potential memory leaks

### Performance Impact
- Adjust `interval` setting to reduce monitoring frequency
- Disable `includeInRequest` if not needed
- Use `exposeEndpoints: false` if REST API is not required

## Migration from Direct Monitoring Usage

If you're currently using the monitoring module directly, you can easily migrate to the plugin:

### Before (Direct Usage)
```typescript
import { MemoryMonitor, createMemoryMonitoringMiddleware } from '@soapjs/soap/infra/http/monitoring';

const monitor = new MemoryMonitor(config);
const middleware = createMemoryMonitoringMiddleware(config);
app.use(middleware.middleware());
```

### After (Plugin Usage)
```typescript
import { MemoryMonitoringPlugin } from '@soapjs/soap/infra/http/plugins';

const memoryPlugin = new MemoryMonitoringPlugin(config);
app.usePlugin(memoryPlugin);
```

The plugin provides the same functionality with additional benefits like REST endpoints, better integration, and lifecycle management.
