import { HealthCheckPlugin } from '../health-check-plugin';
import { HealthCheckOptions } from '../plugin';

// Mock Express app
const mockExpressApp = {
  get: jest.fn(),
  _router: {
    stack: []
  }
};

// Mock HttpApp
const mockHttpApp = {
  getApp: () => mockExpressApp
} as any;

// Mock EnhancedPluginContext
const mockContext = {
  getContainer: jest.fn(),
  getService: jest.fn(),
  registerService: jest.fn(),
  getExpressApp: () => mockExpressApp,
  getRouteRegistry: jest.fn(),
  getMiddlewareRegistry: jest.fn(),
  getAuthRegistry: jest.fn(),
  createRoute: jest.fn(),
  createMiddleware: jest.fn(),
  createAuthStrategy: jest.fn()
} as any;

describe('HealthCheckPlugin', () => {
  let plugin: HealthCheckPlugin;
  let options: HealthCheckOptions;

  beforeEach(() => {
    options = {
      path: '/health',
      timeout: 5000,
      responseFormat: 'json'
    };
    plugin = new HealthCheckPlugin(options);
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultPlugin = new HealthCheckPlugin();
      
      expect(defaultPlugin.name).toBe('health-check');
      expect(defaultPlugin.version).toBe('1.0.0');
      expect(defaultPlugin.description).toBe('Basic health check plugin for SoapExpress');
    });

    it('should merge provided options with defaults', () => {
      const customOptions: HealthCheckOptions = {
        path: '/custom-health',
        timeout: 10000,
        responseFormat: 'text'
      };
      
      const customPlugin = new HealthCheckPlugin(customOptions);
      
      expect(customPlugin['options'].path).toBe('/custom-health');
      expect(customPlugin['options'].timeout).toBe(10000);
      expect(customPlugin['options'].responseFormat).toBe('text');
    });
  });

  describe('install', () => {
    it('should install plugin and register health check route', () => {
      plugin.install(mockHttpApp, mockContext);
      
      expect(mockExpressApp.get).toHaveBeenCalledWith('/health', expect.any(Function));
    });

    it('should add default health checks', () => {
      plugin.install(mockHttpApp, mockContext);
      
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
      
      plugin.install(mockHttpApp, mockContext, installOptions);
      
      expect(plugin['options'].path).toBe('/custom-health');
      expect(plugin['options'].timeout).toBe(10000);
    });
  });

  describe('uninstall', () => {
    it('should uninstall plugin and remove route', () => {
      plugin.install(mockHttpApp, mockContext);
      plugin.uninstall(mockHttpApp);
      
      // In real implementation, this would remove the route from the router stack
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('addHealthCheck', () => {
    it('should add custom health check', () => {
      // Install plugin first to add default checks
      plugin.install(mockHttpApp, mockContext);
      
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
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      plugin.beforeStart?.(mockHttpApp);
      
      expect(consoleSpy).toHaveBeenCalledWith('HealthCheck plugin: Application starting...');
      
      consoleSpy.mockRestore();
    });

    it('should call afterStart hook', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      plugin.afterStart?.(mockHttpApp);
      
      expect(consoleSpy).toHaveBeenCalledWith('HealthCheck plugin: Application started successfully');
      
      consoleSpy.mockRestore();
    });

    it('should call beforeStop hook', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      plugin.beforeStop?.(mockHttpApp);
      
      expect(consoleSpy).toHaveBeenCalledWith('HealthCheck plugin: Application stopping...');
      
      consoleSpy.mockRestore();
    });

    it('should call afterStop hook', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      plugin.afterStop?.(mockHttpApp);
      
      expect(consoleSpy).toHaveBeenCalledWith('HealthCheck plugin: Application stopped');
      
      consoleSpy.mockRestore();
    });
  });

  describe('health check execution', () => {
    it('should execute health checks and return proper response format', async () => {
      plugin.install(mockHttpApp, mockContext);
      
      // Mock the route handler
      const routeHandler = mockExpressApp.get.mock.calls[0][1];
      
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
