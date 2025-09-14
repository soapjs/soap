import { MetricsMiddleware, createMetricsMiddleware, defaultMetricsConfig } from '../middleware';
import { MetricsConfig, MetricsCollector, ConsoleMetricsClient } from '../types';
import { HttpRequest, HttpResponse } from '../../types';

// Mock generic HTTP request/response
const createMockReq = (): HttpRequest => ({
  method: 'GET',
  path: '/api/users',
  headers: {},
  body: {},
  query: {},
  params: {},
  files: {},
  cookies: {},
  secure: false,
  ip: '127.0.0.1'
});

const createMockRes = (): HttpResponse => {
  const res: HttpResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    locals: {},
    statusCode: 200,
    end: jest.fn()
  };
  return res;
};

const createMockNext = (): () => void => jest.fn();

describe('MetricsMiddleware', () => {
  let config: MetricsConfig;
  let collector: MetricsCollector;
  let middleware: MetricsMiddleware;

  beforeEach(() => {
    config = {
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
    collector = {
      recordResponseTime: jest.fn(),
      recordRequestCount: jest.fn(),
      recordErrorRate: jest.fn(),
      recordMemoryUsage: jest.fn(),
      recordCpuUsage: jest.fn(),
      counter: jest.fn(),
      histogram: jest.fn(),
      gauge: jest.fn(),
      summary: jest.fn(),
      withRequestContext: jest.fn().mockImplementation((req: any, res: any, next: any) => {
        // Mock the actual behavior of withRequestContext
        const originalEnd = res.end;
        res.end = jest.fn().mockImplementation((...args: any[]) => {
          // Call original end if it exists
          if (originalEnd) {
            originalEnd.apply(res, args);
          }
        });
        // Call next
        next();
      }),
      destroy: jest.fn()
    } as any;
    middleware = new MetricsMiddleware(collector);
  });

  afterEach(() => {
    middleware.destroy();
  });

  describe('middleware function', () => {
    it('should return Express middleware function', () => {
      const middlewareFn = middleware.middleware();
      expect(typeof middlewareFn).toBe('function');
    });

    it('should call next function', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();
      
      const middlewareFn = middleware.middleware();
      middlewareFn(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should override res.end to capture metrics', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();
      
      const originalEnd = res.end;
      const middlewareFn = middleware.middleware();
      
      middlewareFn(req, res, next);
      
      expect(res.end).not.toBe(originalEnd);
      expect(typeof res.end).toBe('function');
    });

    it('should call original res.end after recording metrics', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();
      
      const originalEnd = jest.fn();
      res.end = originalEnd;
      
      const middlewareFn = middleware.middleware();
      middlewareFn(req, res, next);
      
      // Call the overridden end function
      res.end('test');
      
      expect(originalEnd).toHaveBeenCalledWith('test');
    });
  });

  describe('getCollector', () => {
    it('should return SoapMetricsCollector instance', () => {
      const collector = middleware.getCollector();
      expect(collector).toBeDefined();
      expect(typeof collector.recordResponseTime).toBe('function');
      expect(typeof collector.recordRequestCount).toBe('function');
      expect(typeof collector.counter).toBe('function');
    });
  });

  describe('destroy', () => {
    it('should destroy collector', () => {
      const collector = middleware.getCollector();
      const destroySpy = jest.spyOn(collector, 'destroy');
      
      middleware.destroy();
      
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});

describe('createMetricsMiddleware', () => {
  it('should create MetricsMiddleware instance', () => {
    const testCollector: MetricsCollector = {
      recordResponseTime: jest.fn(),
      recordRequestCount: jest.fn(),
      recordErrorRate: jest.fn(),
      recordMemoryUsage: jest.fn(),
      recordCpuUsage: jest.fn(),
      counter: jest.fn(),
      histogram: jest.fn(),
      gauge: jest.fn(),
      summary: jest.fn(),
      withRequestContext: jest.fn(),
      destroy: jest.fn()
    } as any;
    const middleware = createMetricsMiddleware(testCollector);
    expect(middleware).toBeInstanceOf(MetricsMiddleware);
  });
});

describe('defaultMetricsConfig', () => {
  it('should have correct default values', () => {
    expect(defaultMetricsConfig.enabled).toBe(true);
    expect(defaultMetricsConfig.metrics.responseTime).toBe(true);
    expect(defaultMetricsConfig.metrics.requestCount).toBe(true);
    expect(defaultMetricsConfig.metrics.errorRate).toBe(true);
    expect(defaultMetricsConfig.metrics.memoryUsage).toBe(true);
    expect(defaultMetricsConfig.metrics.cpuUsage).toBe(true);
    expect(defaultMetricsConfig.collectInterval).toBe(30000);
    expect(defaultMetricsConfig.includeRouteParams).toBe(false);
    expect(defaultMetricsConfig.customLabels).toEqual({});
  });
});
