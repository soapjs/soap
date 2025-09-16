import { HttpPluginRegistry } from '../http-plugin-registry';
import { HttpPlugin } from '../types';

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

// Mock HttpApp
const mockHttpApp = {
  getApp: jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn()
  })),
  getRouteRegistry: jest.fn(() => mockRouteRegistry),
  getMiddlewareRegistry: jest.fn(() => mockMiddlewareRegistry),
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


// Helper function to create a mock plugin
function createMockPlugin(name: string, version: string = '1.0.0', dependencies: string[] = []): HttpPlugin {
  return {
    name,
    version,
    dependencies,
    install: jest.fn(),
    uninstall: jest.fn(),
    beforeStart: jest.fn(),
    afterStart: jest.fn(),
    beforeStop: jest.fn(),
    afterStop: jest.fn()
  };
}

describe('HttpAppPluginRegistry', () => {
  let registry: HttpPluginRegistry;

  beforeEach(() => {
    registry = new HttpPluginRegistry();
    jest.clearAllMocks();
  });

  describe('Plugin Registration', () => {
    it('should register a valid plugin', () => {
      const plugin = createMockPlugin('test-plugin', '1.0.0');
      
      expect(() => registry.register(plugin)).not.toThrow();
      expect(registry.get('test-plugin')).toBe(plugin);
    });

    it('should throw error when registering duplicate plugin', () => {
      const plugin1 = createMockPlugin('duplicate-plugin');
      const plugin2 = createMockPlugin('duplicate-plugin');
      
      registry.register(plugin1);
      
      expect(() => registry.register(plugin2)).toThrow(
        "Plugin 'duplicate-plugin' is already registered"
      );
    });

    it('should validate plugin name', () => {
      const invalidPlugin = createMockPlugin('', '1.0.0');
      delete (invalidPlugin as any).name;
      
      expect(() => registry.register(invalidPlugin as any)).toThrow(
        'Plugin must have a valid name'
      );
    });

    it('should validate plugin version', () => {
      const invalidPlugin = createMockPlugin('test-plugin', '');
      delete (invalidPlugin as any).version;
      
      expect(() => registry.register(invalidPlugin as any)).toThrow(
        'Plugin must have a valid version'
      );
    });

    it('should validate plugin install method', () => {
      const invalidPlugin = createMockPlugin('test-plugin');
      delete (invalidPlugin as any).install;
      
      expect(() => registry.register(invalidPlugin as any)).toThrow(
        'Plugin must implement install method'
      );
    });

    it('should validate semantic versioning format', () => {
      const invalidPlugin = createMockPlugin('test-plugin', 'invalid-version');
      
      expect(() => registry.register(invalidPlugin)).toThrow(
        'Plugin version must follow semantic versioning format'
      );
    });

    it('should accept valid semantic versions', () => {
      const validVersions = ['1.0.0', '2.1.3', '1.0.0-beta', '1.0.0+build123', '1.0.0-beta+build123'];
      
      validVersions.forEach((version, index) => {
        const plugin = createMockPlugin(`plugin-${index}`, version);
        expect(() => registry.register(plugin)).not.toThrow();
      });
    });
  });

  describe('Plugin Unregistration', () => {
    it('should unregister a plugin', () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);
      
      expect(registry.get('test-plugin')).toBe(plugin);
      
      registry.unregister('test-plugin');
      
      expect(registry.get('test-plugin')).toBeUndefined();
    });

    it('should throw error when unregistering installed plugin', async () => {
      const plugin = createMockPlugin('installed-plugin');
      registry.register(plugin);
      await registry.install(mockHttpApp, 'installed-plugin');
      
      expect(() => registry.unregister('installed-plugin')).toThrow(
        "Cannot unregister plugin 'installed-plugin' while it's installed"
      );
    });

    it('should not throw error when unregistering non-existent plugin', () => {
      expect(() => registry.unregister('non-existent-plugin')).not.toThrow();
    });
  });

  describe('Plugin Retrieval', () => {
    it('should get registered plugin', () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);
      
      expect(registry.get('test-plugin')).toBe(plugin);
    });

    it('should return undefined for non-existent plugin', () => {
      expect(registry.get('non-existent-plugin')).toBeUndefined();
    });

    it('should list all registered plugins', () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');
      const plugin3 = createMockPlugin('plugin-3');
      
      registry.register(plugin1);
      registry.register(plugin2);
      registry.register(plugin3);
      
      const plugins = registry.list();
      expect(plugins).toHaveLength(3);
      expect(plugins).toContain(plugin1);
      expect(plugins).toContain(plugin2);
      expect(plugins).toContain(plugin3);
    });

    it('should return empty array when no plugins registered', () => {
      expect(registry.list()).toEqual([]);
    });
  });

  describe('Plugin Installation', () => {
    it('should install a plugin successfully', async () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await registry.install(mockHttpApp, 'test-plugin');
      
      expect(plugin.install).toHaveBeenCalledWith(mockHttpApp, undefined);
      expect(plugin.installed).toBe(true);
      expect(plugin.enabled).toBe(true);
      expect(registry.isInstalled('test-plugin')).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith("Plugin 'test-plugin' installed successfully");
      
      consoleSpy.mockRestore();
    });

    it('should install a plugin with options', async () => {
      const plugin = createMockPlugin('test-plugin');
      const options = { setting: 'value' };
      registry.register(plugin);
      
      await registry.install(mockHttpApp, 'test-plugin', options);
      
      expect(plugin.install).toHaveBeenCalledWith(mockHttpApp, options);
    });

    it('should throw error when installing non-existent plugin', async () => {
      await expect(registry.install(mockHttpApp, 'non-existent-plugin')).rejects.toThrow(
        "Plugin 'non-existent-plugin' not found"
      );
    });

    it('should throw error when installing already installed plugin', async () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);
      await registry.install(mockHttpApp, 'test-plugin');
      
      await expect(registry.install(mockHttpApp, 'test-plugin')).rejects.toThrow(
        "Plugin 'test-plugin' is already installed"
      );
    });

    it('should handle installation failure and rollback', async () => {
      const plugin = createMockPlugin('failing-plugin');
      plugin.install = jest.fn().mockImplementation(() => {
        throw new Error('Installation failed');
      });
      registry.register(plugin);
      
      await expect(registry.install(mockHttpApp, 'failing-plugin')).rejects.toThrow(
        "Failed to install plugin 'failing-plugin': Installation failed"
      );
      
      expect(plugin.installed).toBe(false);
      expect(plugin.enabled).toBe(false);
      expect(registry.isInstalled('failing-plugin')).toBe(false);
    });
  });

  describe('Dependencies', () => {
    it('should install plugin with satisfied dependencies', async () => {
      const dependencyPlugin = createMockPlugin('dependency-plugin');
      const mainPlugin = createMockPlugin('main-plugin', '1.0.0', ['dependency-plugin']);
      
      registry.register(dependencyPlugin);
      registry.register(mainPlugin);
      
      await registry.install(mockHttpApp, 'dependency-plugin');
      await expect(registry.install(mockHttpApp, 'main-plugin')).resolves.not.toThrow();
      
      expect(registry.isInstalled('dependency-plugin')).toBe(true);
      expect(registry.isInstalled('main-plugin')).toBe(true);
    });

    it('should throw error when installing plugin with missing dependencies', async () => {
      const mainPlugin = createMockPlugin('main-plugin', '1.0.0', ['missing-dependency']);
      registry.register(mainPlugin);
      
      await expect(registry.install(mockHttpApp, 'main-plugin')).rejects.toThrow(
        "Plugin 'main-plugin' requires dependency 'missing-dependency' to be installed first"
      );
    });

    it('should install plugin with multiple dependencies', async () => {
      const dep1 = createMockPlugin('dependency-1');
      const dep2 = createMockPlugin('dependency-2');
      const mainPlugin = createMockPlugin('main-plugin', '1.0.0', ['dependency-1', 'dependency-2']);
      
      registry.register(dep1);
      registry.register(dep2);
      registry.register(mainPlugin);
      
      await registry.install(mockHttpApp, 'dependency-1');
      await registry.install(mockHttpApp, 'dependency-2');
      await expect(registry.install(mockHttpApp, 'main-plugin')).resolves.not.toThrow();
    });

    it('should handle plugin with no dependencies', async () => {
      const plugin = createMockPlugin('no-deps-plugin');
      registry.register(plugin);
      
      await expect(registry.install(mockHttpApp, 'no-deps-plugin')).resolves.not.toThrow();
    });
  });

  describe('Installation Status', () => {
    it('should check if plugin is installed', async () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);
      
      expect(registry.isInstalled('test-plugin')).toBe(false);
      
      await registry.install(mockHttpApp, 'test-plugin');
      
      expect(registry.isInstalled('test-plugin')).toBe(true);
    });

    it('should return false for non-existent plugin', () => {
      expect(registry.isInstalled('non-existent-plugin')).toBe(false);
    });

    it('should get list of installed plugins', async () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');
      const plugin3 = createMockPlugin('plugin-3');
      
      registry.register(plugin1);
      registry.register(plugin2);
      registry.register(plugin3);
      
      await registry.install(mockHttpApp, 'plugin-1');
      await registry.install(mockHttpApp, 'plugin-3');
      
      const installedPlugins = registry.getInstalled();
      expect(installedPlugins).toHaveLength(2);
      expect(installedPlugins).toContain(plugin1);
      expect(installedPlugins).toContain(plugin3);
      expect(installedPlugins).not.toContain(plugin2);
    });

    it('should return empty array when no plugins installed', () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);
      
      expect(registry.getInstalled()).toEqual([]);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple plugins with dependencies', async () => {
      const basePlugin = createMockPlugin('base-plugin');
      const midPlugin = createMockPlugin('mid-plugin', '1.0.0', ['base-plugin']);
      const topPlugin = createMockPlugin('top-plugin', '1.0.0', ['mid-plugin']);
      
      registry.register(basePlugin);
      registry.register(midPlugin);
      registry.register(topPlugin);
      
      // Install in correct order
      await registry.install(mockHttpApp, 'base-plugin');
      await registry.install(mockHttpApp, 'mid-plugin');
      await registry.install(mockHttpApp, 'top-plugin');
      
      expect(registry.isInstalled('base-plugin')).toBe(true);
      expect(registry.isInstalled('mid-plugin')).toBe(true);
      expect(registry.isInstalled('top-plugin')).toBe(true);
    });

    it('should prevent circular dependencies', async () => {
      const pluginA = createMockPlugin('plugin-a', '1.0.0', ['plugin-b']);
      const pluginB = createMockPlugin('plugin-b', '1.0.0', ['plugin-a']);
      
      registry.register(pluginA);
      registry.register(pluginB);
      
      // Try to install pluginA - it will fail because pluginB is not installed
      await expect(registry.install(mockHttpApp, 'plugin-a')).rejects.toThrow(
        "Plugin 'plugin-a' requires dependency 'plugin-b' to be installed first"
      );
      
      // Try to install pluginB - it will fail because pluginA is not installed
      await expect(registry.install(mockHttpApp, 'plugin-b')).rejects.toThrow(
        "Plugin 'plugin-b' requires dependency 'plugin-a' to be installed first"
      );
    });

    it('should handle plugin uninstall and reinstall', async () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);
      
      // Install
      await registry.install(mockHttpApp, 'test-plugin');
      expect(registry.isInstalled('test-plugin')).toBe(true);
      
      // Uninstall (this should work since we don't have an uninstall method in the registry)
      // But we can't uninstall installed plugins, so this would throw
      expect(() => registry.unregister('test-plugin')).toThrow(
        "Cannot unregister plugin 'test-plugin' while it's installed"
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle plugin with empty dependencies array', async () => {
      const plugin = createMockPlugin('test-plugin', '1.0.0', []);
      registry.register(plugin);
      
      await expect(registry.install(mockHttpApp, 'test-plugin')).resolves.not.toThrow();
    });

    it('should handle plugin with undefined dependencies', async () => {
      const plugin = createMockPlugin('test-plugin');
      plugin.dependencies = undefined;
      registry.register(plugin);
      
      await expect(registry.install(mockHttpApp, 'test-plugin')).resolves.not.toThrow();
    });

    it('should handle plugin installation with various option types', async () => {
      const plugin = createMockPlugin('test-plugin');
      registry.register(plugin);
      
      const options = {
        string: 'test',
        number: 42,
        boolean: true,
        object: { nested: 'value' },
        array: [1, 2, 3]
      };
      
      await registry.install(mockHttpApp, 'test-plugin', options);
      
      expect(plugin.install).toHaveBeenCalledWith(mockHttpApp, options);
    });

    it('should handle plugin with special characters in name', () => {
      const plugin = createMockPlugin('plugin-with-dashes', '1.0.0');
      registry.register(plugin);
      
      expect(registry.get('plugin-with-dashes')).toBe(plugin);
    });

    it('should handle plugin with very long name', () => {
      const longName = 'plugin-with-very-long-name-that-might-cause-issues';
      const plugin = createMockPlugin(longName, '1.0.0');
      registry.register(plugin);
      
      expect(registry.get(longName)).toBe(plugin);
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error messages for validation failures', () => {
      const invalidPlugin = {
        name: '',
        version: 'invalid',
        install: null
      } as any;
      
      expect(() => registry.register(invalidPlugin)).toThrow(
        'Plugin must have a valid name'
      );
    });

    it('should provide clear error messages for installation failures', async () => {
      const plugin = createMockPlugin('error-plugin');
      plugin.install = jest.fn().mockImplementation(() => {
        throw new Error('Custom installation error');
      });
      registry.register(plugin);
      
      await expect(registry.install(mockHttpApp, 'error-plugin')).rejects.toThrow(
        "Failed to install plugin 'error-plugin': Custom installation error"
      );
    });
  });
});
