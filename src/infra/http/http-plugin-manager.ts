import { HttpApp, HttpPlugin, PluginManager, PluginRegistry } from './types';
import { HttpPluginRegistry } from './http-plugin-registry';

export class HttpPluginManager implements PluginManager {
  private registry: PluginRegistry;

  constructor(registry?: PluginRegistry) {
    this.registry = registry || new HttpPluginRegistry();
  }

  usePlugin(plugin: HttpPlugin, options?: any): void {
    // Register plugin if not already registered
    if (!this.registry.get(plugin.name)) {
      this.registry.register(plugin);
    }

    // Install plugin
    this.registry.install(this.getApp(), plugin.name, options);
  }


  listPlugins(): HttpPlugin[] {
    return this.registry.list();
  }

  getPlugin(pluginName: string): HttpPlugin | undefined {
    return this.registry.get(pluginName);
  }

  isPluginLoaded(pluginName: string): boolean {
    return this.registry.isInstalled(pluginName);
  }

  getInstalled(): HttpPlugin[] {
    return this.registry.getInstalled();
  }


  private getApp(): HttpApp {
    return this.getAppInstance();
  }

  // Method to set the app instance (called by SoapExpressApp)
  setApp(app: HttpApp): void {
    (this as any).app = app;
  }

  private getAppInstance(): HttpApp {
    return (this as any).app;
  }
}
