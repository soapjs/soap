import { DIContainer } from "../../common";
import { Middleware, MiddlewareRegistry } from "../common";
import { HttpApp,HttpPlugin, PluginManager } from "./types";
import { Route } from "./route";
import { RouteGroup } from "./route.group";
import { RouteRegistry } from "./route.registry";
import { Router } from "./router";
import { HttpPluginManager } from "./http-plugin-manager";

/**
 * Abstract base class for HTTP applications
 * Provides framework-agnostic functionality for all HTTP frameworks
 */
export abstract class BaseHttpApp<Framework = any> implements HttpApp<Framework> {
  // Brand property for runtime type checking
  readonly __isHttpApp = true;

  protected routeRegistry: RouteRegistry;
  protected middlewareRegistry: MiddlewareRegistry;
  protected container: DIContainer;
  protected pluginManager: PluginManager;
  protected state: 'stopped' | 'starting' | 'started' | 'stopping' = 'stopped';

  constructor(
    protected routes: Router,
  ) {
    this.container = new DIContainer();
    this.routeRegistry = new RouteRegistry();
    this.middlewareRegistry = new MiddlewareRegistry();
    this.pluginManager = new HttpPluginManager();
  }

  // Abstract methods that must be implemented by concrete classes
  abstract start(port: number): Promise<void>;
  abstract stop(): Promise<void>;
  abstract getApp(): Framework;
  abstract getServer<T>(): T;
  abstract initializeFramework(): void;

  getRouteRegistry(): RouteRegistry {
    return this.routeRegistry;
  }

  getMiddlewareRegistry(): MiddlewareRegistry {
    return this.middlewareRegistry;
  }

  getContainer(): DIContainer {
    return this.container;
  }

  // Route registration methods
  register(...item: (Route | RouteGroup)[]): this {
    item.forEach(item => {
      this.routeRegistry.register(item);
    });

    return this;
  }

  useMiddleware(...middlewares: Middleware[]): this {
    middlewares.forEach(middleware => {
      this.middlewareRegistry.add(middleware);
    });
    return this;
  }

  // Plugin management methods
  usePlugin(plugin: HttpPlugin, options?: any): this {
    this.pluginManager.usePlugin(plugin, options);
    return this;
  }

  getPlugin(pluginName: string): HttpPlugin | undefined {
    return this.pluginManager.getPlugin(pluginName);
  }

  listPlugins(): HttpPlugin[] {
    return this.pluginManager.listPlugins();
  }

  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  isStaging(): boolean {
    return process.env.NODE_ENV === 'staging';
  }

  protected async beforeStart(): Promise<void> {
    const installedPlugins = this.pluginManager.listPlugins();
    for (const plugin of installedPlugins) {
      if (plugin.beforeStart) {
        await plugin.beforeStart(this);
      }
    }
  }

  protected async afterStart(): Promise<void> {
    const installedPlugins = this.pluginManager.listPlugins();
    for (const plugin of installedPlugins) {
      if (plugin.afterStart) {
        await plugin.afterStart(this);
      }
    }
  }

  protected async beforeStop(): Promise<void> {
    const installedPlugins = this.pluginManager.listPlugins();
    for (const plugin of installedPlugins) {
      if (plugin.beforeStop) {
        await plugin.beforeStop(this);
      }
    }
  }

  protected async afterStop(): Promise<void> {
    const installedPlugins = this.pluginManager.listPlugins();
    for (const plugin of installedPlugins) {
      if (plugin.afterStop) {
        await plugin.afterStop(this);
      }
    }
  }
}
