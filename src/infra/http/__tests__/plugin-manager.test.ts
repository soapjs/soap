import { HttpPluginManager } from '../http-plugin-manager';
import { HttpPlugin } from '../types';

const mockPlugin: HttpPlugin = {
  name: 'test-plugin',
  version: '1.0.0',
  install: jest.fn()
};

// Mock RouteRegistry
const mockRouteRegistry = {
  register: jest.fn(),
  removeRoute: jest.fn(),
  getRoutes: jest.fn(() => []),
  clear: jest.fn()
};

// Mock MiddlewareRegistry
const mockMiddlewareRegistry = {
  register: jest.fn(),
  unregister: jest.fn(),
  getMiddlewares: jest.fn(() => []),
  clear: jest.fn()
};

const mockApp = {
  registerController: jest.fn(),
  registerMiddleware: jest.fn(),
  use: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  listen: jest.fn(),
  getApp: jest.fn(),
  getRouter: jest.fn(),
  getPluginManager: jest.fn(),
  getRouteRegistry: () => mockRouteRegistry,
  getMiddlewareRegistry: () => mockMiddlewareRegistry,
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

describe('SoapExpressPluginManager - Minimal Tests', () => {
  let pluginManager: HttpPluginManager;

  beforeEach(() => {
    jest.clearAllMocks();
    pluginManager = new HttpPluginManager();
  });

  describe('constructor', () => {
    it('should initialize with empty plugins array', () => {
      expect(pluginManager.listPlugins()).toEqual([]);
    });
  });

  describe('listPlugins', () => {
    it('should return empty array initially', () => {
      expect(pluginManager.listPlugins()).toEqual([]);
    });
  });

  describe('getPlugin', () => {
    it('should return undefined for non-existent plugin', () => {
      expect(pluginManager.getPlugin('non-existent')).toBeUndefined();
    });
  });

  describe('isPluginLoaded', () => {
    it('should return false for non-loaded plugin', () => {
      expect(pluginManager.isPluginLoaded('non-existent')).toBe(false);
    });
  });

  describe('setApp', () => {
    it('should set app instance', () => {
      pluginManager.setApp(mockApp);

      const appInstance = (pluginManager as any).getAppInstance();
      expect(appInstance).toBe(mockApp);
    });
  });

  describe('getApp', () => {
    it('should return app instance', () => {
      pluginManager.setApp(mockApp);

      const appInstance = (pluginManager as any).getApp();
      expect(appInstance).toBe(mockApp);
    });
  });
});
