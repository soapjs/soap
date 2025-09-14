import { HttpAppPlugin, PluginManager, PluginRegistry, PluginDiscovery } from './plugin';
import { HttpApp } from '../http-app';
import { HttpAppPluginRegistry } from './plugin-registry';
import { BasePluginDiscovery } from './plugin-discovery';

export class HttpAppPluginManager<T> implements PluginManager<T> {
  private registry: PluginRegistry<T>;
  private discovery: PluginDiscovery<T>;

  constructor(registry?: PluginRegistry<T>, discovery?: PluginDiscovery<T>) {
    this.registry = registry || new HttpAppPluginRegistry<T>();
    this.discovery = discovery || new BasePluginDiscovery();
  }

  usePlugin(plugin: HttpAppPlugin<T>, options?: any): void {
    // Register plugin if not already registered
    if (!this.registry.get(plugin.name)) {
      this.registry.register(plugin);
    }

    // Install plugin
    this.registry.install(this.getApp(), plugin.name, options);
  }

  async loadPlugin(pluginName: string, options?: any): Promise<void> {
    // Try to load plugin from registry first
    let plugin = this.registry.get(pluginName);
    
    if (!plugin) {
      // Try to discover and load plugin
      try {
        plugin = await this.discovery.load(pluginName);
        this.registry.register(plugin);
      } catch (error) {
        throw new Error(`Failed to load plugin '${pluginName}': ${error.message}`);
      }
    }

    // Install plugin
    this.registry.install(this.getApp(), pluginName, options);
  }

  unloadPlugin(pluginName: string): void {
    this.registry.uninstall(this.getApp(), pluginName);
  }

  listPlugins(): HttpAppPlugin<T>[] {
    return this.registry.list();
  }

  getPlugin(pluginName: string): HttpAppPlugin<T> | undefined {
    return this.registry.get(pluginName);
  }

  isPluginLoaded(pluginName: string): boolean {
    return this.registry.isInstalled(pluginName);
  }

  getInstalled(): HttpAppPlugin<T>[] {
    return this.registry.getInstalled();
  }

  async loadPluginsFromDirectory(dir: string): Promise<void> {
    try {
      const plugins = await this.discovery.discover(dir);
      
      for (const plugin of plugins) {
        // Register plugin
        this.registry.register(plugin);
        
        // Install plugin if it should be auto-loaded
        if (this.shouldAutoLoad(plugin)) {
          this.registry.install(this.getApp(), plugin.name);
        }
      }

    } catch (error) {
      throw new Error(`Failed to load plugins from directory '${dir}': ${error.message}`);
    }
  }

  private shouldAutoLoad(plugin: HttpAppPlugin<T>): boolean {
    // Check if plugin has autoLoad configuration
    if (plugin.config && typeof plugin.config.autoLoad === 'boolean') {
      return plugin.config.autoLoad;
    }

    // Default to true for most plugins
    return true;
  }

  private getApp(): HttpApp<T> {
    return this.getAppInstance();
  }

  // Method to set the app instance (called by SoapExpressApp)
  setApp(app: HttpApp<T>): void {
    (this as any).app = app;
  }

  private getAppInstance(): HttpApp<T> {
    return (this as any).app;
  }
}
