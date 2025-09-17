import { HealthCheckPlugin, HealthCheckOptions } from '../health-check-plugin';
import { Logger } from '../../../../common';

// Mock RouteRegistry
const mockRouteRegistry = {
  register: jest.fn(),
  removeRoute: jest.fn(),
  getRoutes: jest.fn(() => []),
  clear: jest.fn()
};

// Mock Express app
const mockExpressApp = {
  get: jest.fn(),
  _router: {
    stack: []
  }
};

// Mock Logger
const mockLogger: Logger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
  debug: jest.fn()
};

// Mock HttpApp
const mockHttpApp = {
  getApp: () => mockExpressApp,
  getRouteRegistry: () => mockRouteRegistry,
  getMiddlewareRegistry: jest.fn(() => ({})),
  useMiddleware: jest.fn(),
  getContainer: jest.fn(() => ({})),
  start: jest.fn(),
  stop: jest.fn(),
  getServer: jest.fn(),
  register: jest.fn(),
  usePlugin: jest.fn(),
  getPlugin: jest.fn(),
  listPlugins: jest.fn(() => []),
  isDevelopment: jest.fn(() => false),
  isProduction: jest.fn(() => true),
  isTest: jest.fn(() => false)
} as any;

describe('HealthCheckPlugin', () => {
  let plugin: HealthCheckPlugin;
  let options: HealthCheckOptions;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    options = {
      path: '/health',
      timeout: 5000,
      responseFormat: 'json'
    };
    plugin = new HealthCheckPlugin(options, mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultPlugin = new HealthCheckPlugin({}, mockLogger);
      
      expect(defaultPlugin.name).toBe('health-check');
    });

    it('should merge provided options with defaults', () => {
      const customOptions: HealthCheckOptions = {
        path: '/custom-health',
        timeout: 10000,
        responseFormat: 'text'
      };
      
      const customPlugin = new HealthCheckPlugin(customOptions, mockLogger);
      
      expect(customPlugin['options'].path).toBe('/custom-health');
      expect(customPlugin['options'].timeout).toBe(10000);
      expect(customPlugin['options'].responseFormat).toBe('text');
    });
  });

  describe('install', () => {
    it('should install plugin and register health check route', () => {
      plugin.install(mockHttpApp);
      
      expect(mockRouteRegistry.register).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        path: '/health'
      }));
    });

    it('should add default health checks', () => {
      plugin.install(mockHttpApp);
      
      const checks = plugin.getHealthChecks();
      expect(checks).toHaveLength(3); // uptime, memory, process
      
      const checkNames = checks.map(check => check.name);
      expect(checkNames).toContain('uptime');
      expect(checkNames).toContain('memory');
      expect(checkNames).toContain('process');
    });

    it('should merge options during install', () => {
      const installOptions: HealthCheckOptions = {
        path: '/custom-health',
        timeout: 10000
      };
      
      plugin.install(mockHttpApp, installOptions);
      
      expect(plugin['options'].path).toBe('/custom-health');
      expect(plugin['options'].timeout).toBe(10000);
    });
  });

  describe('uninstall', () => {
    it('should uninstall plugin and remove route', () => {
      plugin.install(mockHttpApp);
      plugin.uninstall(mockHttpApp);
      
      expect(mockRouteRegistry.removeRoute).toHaveBeenCalledWith('GET', '/health');
    });
  });

  describe('addHealthCheck', () => {
    it('should add custom health check', () => {
      // Install plugin first to add default checks
      plugin.install(mockHttpApp);
      
      const customCheck = {
        name: 'custom',
        check: () => ({ status: 'healthy' as const, message: 'Custom check' })
      };
      
      plugin.addHealthCheck(customCheck);
      
      const checks = plugin.getHealthChecks();
      expect(checks).toHaveLength(4); // 3 default + 1 custom
      expect(checks.find(c => c.name === 'custom')).toBeDefined();
    });
  });

  describe('removeHealthCheck', () => {
    it('should remove health check by name', () => {
      plugin.addHealthCheck({
        name: 'custom',
        check: () => ({ status: 'healthy' as const, message: 'Custom check' })
      });
      
      plugin.removeHealthCheck('custom');
      
      const checks = plugin.getHealthChecks();
      expect(checks.find(c => c.name === 'custom')).toBeUndefined();
    });
  });

  describe('lifecycle hooks', () => {
    it('should call beforeStart hook', () => {
      plugin.beforeStart?.(mockHttpApp);
      
      expect(mockLogger.debug).toHaveBeenCalledWith('HealthCheck plugin: Application starting...');
    });

    it('should call afterStart hook', () => {
      plugin.afterStart?.(mockHttpApp);
      
      expect(mockLogger.debug).toHaveBeenCalledWith('HealthCheck plugin: Application started successfully');
    });

    it('should call beforeStop hook', () => {
      plugin.beforeStop?.(mockHttpApp);
      
      expect(mockLogger.debug).toHaveBeenCalledWith('HealthCheck plugin: Application stopping...');
    });

    it('should call afterStop hook', () => {
      plugin.afterStop?.(mockHttpApp);
      
      expect(mockLogger.debug).toHaveBeenCalledWith('HealthCheck plugin: Application stopped');
    });
  });

  describe('health check execution', () => {
    it('should execute health checks and return proper response format', async () => {
      plugin.install(mockHttpApp);
      
      // Mock the route handler from RouteRegistry
      const routeHandler = mockRouteRegistry.register.mock.calls[0][0].handler;
      
      // Mock request and response
      const mockReq = {};
      const mockRes = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      await routeHandler(mockReq, mockRes);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ok',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          checks: expect.any(Object)
        })
      );
    });
  });
});
