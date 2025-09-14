import { MemoryMonitor } from './memory-monitor';
import { MemoryMonitoringConfig, defaultMemoryConfig } from './types';
import { HttpContext, HttpRequest, HttpResponse } from '../types';

export class MemoryMonitoringMiddleware<Req extends HttpRequest = HttpRequest, Res extends HttpResponse = HttpResponse> {
  private monitor: MemoryMonitor;

  constructor(config: MemoryMonitoringConfig) {
    this.monitor = new MemoryMonitor(config);
  }

  // Generic middleware function that works with any framework
  middleware() {
    return (req: Req, res: Res, next: () => void) => {
      req.memoryInfo = this.monitor.getCurrentMemoryInfo();
      
      next();
    };
  }

  // Alternative method that accepts HttpContext directly
  process(context: HttpContext): void {
    const { req, res, next } = context;
    
    // Add memory info to request for debugging
    req.memoryInfo = this.monitor.getCurrentMemoryInfo();
    
    next();
  }

  // Get the monitor instance
  getMonitor(): MemoryMonitor {
    return this.monitor;
  }

  // Get current memory stats
  getStats() {
    return this.monitor.getStats();
  }

  // Get memory summary
  getSummary() {
    return this.monitor.getSummary();
  }

  // Force garbage collection
  forceGC() {
    this.monitor.forceGC();
  }

  // Cleanup
  destroy(): void {
    this.monitor.destroy();
  }
}

// Factory function for easy creation
export function createMemoryMonitoringMiddleware<Req extends HttpRequest = HttpRequest, Res extends HttpResponse = HttpResponse>(
  config: MemoryMonitoringConfig
): MemoryMonitoringMiddleware<Req, Res> {
  return new MemoryMonitoringMiddleware<Req, Res>(config);
}

// Helper function to create config from simple options
export function createMemoryConfig(options: {
  threshold?: string | number;
  interval?: number;
  onLeak?: (info: any) => void;
  onThreshold?: (info: any) => void;
}): MemoryMonitoringConfig {
  const threshold = typeof options.threshold === 'string' 
    ? parseMemoryThreshold(options.threshold)
    : options.threshold || 512 * 1024 * 1024; // 512MB default

  return {
    ...defaultMemoryConfig,
    threshold: {
      used: threshold,
      percentage: 80,
      heapUsed: threshold / 2,
      rss: threshold
    },
    interval: options.interval || 30000,
    onLeak: options.onLeak,
    onThreshold: options.onThreshold
  };
}

// Import parseMemoryThreshold for the helper function
import { parseMemoryThreshold } from './types';
