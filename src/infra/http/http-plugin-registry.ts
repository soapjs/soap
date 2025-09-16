import { HttpApp, HttpPlugin, PluginRegistry } from "./types";

export class HttpPluginRegistry implements PluginRegistry {
  private plugins = new Map<string, HttpPlugin>();
  private installedPlugins = new Set<string>();

  register(plugin: HttpPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already registered`);
    }

    // Validate plugin
    this.validatePlugin(plugin);

    this.plugins.set(plugin.name, plugin);
  }

  unregister(pluginName: string): void {
    if (this.installedPlugins.has(pluginName)) {
      throw new Error(`Cannot unregister plugin '${pluginName}' while it's installed`);
    }
    
    this.plugins.delete(pluginName);
  }

  get(pluginName: string): HttpPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  list(): HttpPlugin[] {
    return Array.from(this.plugins.values());
  }

  async install<Framework = any>(app: HttpApp<Framework>, pluginName: string, options?: any): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin '${pluginName}' not found`);
    }

    if (this.installedPlugins.has(pluginName)) {
      throw new Error(`Plugin '${pluginName}' is already installed`);
    }

    // Check dependencies
    this.checkDependencies(plugin);

    try {
      this.installedPlugins.add(pluginName);
      plugin.installed = true;
      plugin.enabled = true;

      await plugin.install<Framework>(app, options);

      console.log(`Plugin '${pluginName}' installed successfully`);
    } catch (error) {
      this.installedPlugins.delete(pluginName);
      plugin.installed = false;
      plugin.enabled = false;
      throw new Error(`Failed to install plugin '${pluginName}': ${error.message}`);
    }
  }


  isInstalled(pluginName: string): boolean {
    return this.installedPlugins.has(pluginName);
  }

  getInstalled(): HttpPlugin[] {
    return Array.from(this.installedPlugins)
      .map(name => this.plugins.get(name))
      .filter(Boolean) as HttpPlugin[];
  }

  private validatePlugin(plugin: HttpPlugin): void {
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must have a valid name');
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error('Plugin must have a valid version');
    }

    if (!plugin.install || typeof plugin.install !== 'function') {
      throw new Error('Plugin must implement install method');
    }

    // Validate version format (semantic versioning)
    const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    if (!versionRegex.test(plugin.version)) {
      throw new Error('Plugin version must follow semantic versioning format');
    }
  }

  private checkDependencies(plugin: HttpPlugin): void {
    if (!plugin.dependencies) {
      return;
    }

    for (const dependency of plugin.dependencies) {
      if (!this.installedPlugins.has(dependency)) {
        throw new Error(`Plugin '${plugin.name}' requires dependency '${dependency}' to be installed first`);
      }
    }
  }
}
