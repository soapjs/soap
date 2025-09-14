import { BasePluginDiscovery } from '../plugin-discovery';
import { HttpAppPlugin } from '../plugin';

// Mock fs completely
jest.mock('fs', () => ({
  readdirSync: jest.fn(() => []),
  statSync: jest.fn(() => ({ isDirectory: () => false })),
  existsSync: jest.fn(() => true)
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  extname: jest.fn((file) => file.endsWith('.js') ? '.js' : ''),
  basename: jest.fn((file) => file.split('/').pop())
}));

describe('HttpAppPluginDiscovery - Minimal Tests', () => {
  let discovery: BasePluginDiscovery<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    discovery = new BasePluginDiscovery<any>();
  });

  describe('validate', () => {
    it('should validate correct plugin', () => {  
      const validPlugin: HttpAppPlugin<any> = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn()
      };

      expect(() => discovery.validate(validPlugin)).not.toThrow();
    });

    it('should throw error for plugin without name', () => {
      const invalidPlugin = {
        version: '1.0.0',
        install: jest.fn()
      } as any;

      expect(() => discovery.validate(invalidPlugin))
        .toThrow('Plugin must have a valid name');
    });

    it('should throw error for plugin without version', () => {
      const invalidPlugin = {
        name: 'test-plugin',
        install: jest.fn()
      } as any;

      expect(() => discovery.validate(invalidPlugin))
        .toThrow('Plugin must have a valid version');
    });

    it('should throw error for plugin without install method', () => {
      const invalidPlugin = {
        name: 'test-plugin',
        version: '1.0.0'
      } as any;

      expect(() => discovery.validate(invalidPlugin))
        .toThrow('Plugin must implement install method');
    });
  });
});
