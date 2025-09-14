import { MetricsConfig, ConsoleMetricsClient } from '../types';
import { BaseMetricsCollector } from '../collector';
import { MetricsMiddleware, createMetricsMiddleware } from '../middleware';
import { HttpRequest, HttpResponse } from '../../types';

describe('Metrics Integration', () => {
  let collector: BaseMetricsCollector;
  let middleware: MetricsMiddleware;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    if (collector) {
      collector.destroy();
    }
    consoleSpy.mockRestore();
  });

  describe('Metrics collector and middleware integration', () => {
    it('should create collector and middleware with config', () => {
      const config: MetricsConfig = {
        enabled: true,
        metrics: {
          responseTime: true,
          requestCount: true,
          errorRate: true,
          memoryUsage: true,
          cpuUsage: true
        },
        client: new ConsoleMetricsClient()
      };

      collector = new BaseMetricsCollector(config);
      middleware = createMetricsMiddleware(collector);

      expect(collector).toBeDefined();
      expect(middleware).toBeDefined();
    });

    it('should create middleware with factory function', () => {
      const config: MetricsConfig = {
        enabled: true,
        metrics: {
          responseTime: true,
          requestCount: true,
          errorRate: true,
          memoryUsage: true,
          cpuUsage: true
        }
      };

      collector = new BaseMetricsCollector(config);
      middleware = createMetricsMiddleware(collector);

      expect(middleware).toBeInstanceOf(MetricsMiddleware);
    });
  });

  describe('Custom metrics usage', () => {
    it('should allow custom metrics recording', () => {
      const config: MetricsConfig = {
        enabled: true,
        metrics: {
          responseTime: false,
          requestCount: false,
          errorRate: false,
          memoryUsage: false,
          cpuUsage: false
        },
        client: new ConsoleMetricsClient()
      };

      collector = new BaseMetricsCollector(config);
      middleware = createMetricsMiddleware(collector);

      collector.counter('custom_api_requests', 1, { endpoint: '/test' });
      collector.histogram('custom_response_time', 150, { endpoint: '/test' });
      collector.gauge('custom_active_connections', 25);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[METRICS] Counter: custom_api_requests = 1',
        { endpoint: '/test' }
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[METRICS] Histogram: custom_response_time = 150',
        { endpoint: '/test' }
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[METRICS] Gauge: custom_active_connections = 25',
        {}
      );
    });
  });

  describe('Configuration options', () => {
    it('should respect custom labels', () => {
      const config: MetricsConfig = {
        enabled: true,
        metrics: {
          responseTime: true,
          requestCount: false,
          errorRate: false,
          memoryUsage: false,
          cpuUsage: false
        },
        customLabels: {
          service: 'test-service',
          version: '1.0.0'
        },
        client: new ConsoleMetricsClient()
      };

      collector = new BaseMetricsCollector(config);
      middleware = createMetricsMiddleware(collector);

      collector.recordResponseTime('/api/users', 'GET', 150);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[METRICS] Histogram: http_request_duration_seconds = 150',
        { 
          route: '/api/users', 
          method: 'GET',
          service: 'test-service',
          version: '1.0.0'
        }
      );
    });

    it('should respect route parameter inclusion', () => {
      const config: MetricsConfig = {
        enabled: true,
        metrics: {
          responseTime: true,
          requestCount: false,
          errorRate: false,
          memoryUsage: false,
          cpuUsage: false
        },
        includeRouteParams: true,
        client: new ConsoleMetricsClient()
      };

      collector = new BaseMetricsCollector(config);
      middleware = createMetricsMiddleware(collector);

      collector.recordResponseTime('/api/users/:id', 'GET', 150);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[METRICS] Histogram: http_request_duration_seconds = 150',
        { 
          route: '/api/users/:param', 
          method: 'GET'
        }
      );
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const config: MetricsConfig = {
        enabled: true,
        metrics: {
          responseTime: true,
          requestCount: true,
          errorRate: true,
          memoryUsage: true,
          cpuUsage: true
        },
        collectInterval: 1000 // 1 second for testing
      };

      collector = new BaseMetricsCollector(config);
      middleware = createMetricsMiddleware(collector);

      // Start periodic collection
      expect(collector).toBeDefined();

      // Destroy should clean up intervals
      collector.destroy();
      
      // Should not throw any errors
      expect(() => collector.destroy()).not.toThrow();
    });
  });
});
