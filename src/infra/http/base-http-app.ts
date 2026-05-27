import { DIContainer, Logger, ConsoleLogger } from "../../common";
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

  private static processHandlersRegistered = false;
  private static activeApps: Set<BaseHttpApp> = new Set();

  protected routeRegistry: RouteRegistry;
  protected middlewareRegistry: MiddlewareRegistry;
  protected container: DIContainer;
  protected pluginManager: PluginManager;
  protected logger: Logger;
  protected state: 'stopped' | 'starting' | 'started' | 'stopping' = 'stopped';

  constructor(
    protected routes: Router,
    logger?: Logger
  ) {
    this.container = new DIContainer();
    this.routeRegistry = new RouteRegistry();
    this.middlewareRegistry = new MiddlewareRegistry();
    this.pluginManager = new HttpPluginManager();
    this.logger = logger || new ConsoleLogger();

    BaseHttpApp.activeApps.add(this);
    BaseHttpApp.setupProcessHandlers(this.logger);
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

  /**
   * Registers process-level signal handlers once per process (not per instance).
   * Delegates shutdown to all active BaseHttpApp instances.
   */
  private static setupProcessHandlers(logger: Logger): void {
    if (BaseHttpApp.processHandlersRegistered) return;
    BaseHttpApp.processHandlersRegistered = true;

    const shutdown = async (signals: string[]) => {
      for (const app of BaseHttpApp.activeApps) {
        try {
          await app.gracefulShutdown(signals);
        } catch (error) {
          logger.error('Graceful shutdown failed:', error);
        }
      }
    };

    ['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach(signal => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, starting graceful shutdown...`);
        await shutdown([signal]);
        process.exit(0);
      });
    });

    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught Exception:', error);
      await shutdown(['uncaughtException']);
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      await shutdown(['unhandledRejection']);
      process.exit(1);
    });
  }

  /**
   * Performs graceful shutdown by calling gracefulShutdown on all plugins
   * @param signals - The signals that triggered the shutdown (SIGTERM, SIGINT, etc.)
   */
  async gracefulShutdown(signals?: string[]): Promise<void> {
    const signalText = signals && signals.length > 0 ? ` (${signals.join(', ')})` : '';
    this.logger.info(`Starting graceful shutdown${signalText}...`);
    
    try {
      // Call gracefulShutdown on all plugins
      const installedPlugins = this.pluginManager.listPlugins();
      const shutdownPromises = installedPlugins
        .filter(plugin => plugin.gracefulShutdown)
        .map(async (plugin) => {
          try {
            this.logger.debug(`Calling gracefulShutdown on plugin: ${plugin.name}`);
            await plugin.gracefulShutdown!(this, signals);
          } catch (error) {
            this.logger.error(`Error during graceful shutdown of plugin ${plugin.name}:`, error);
          }
        });

      // Wait for all plugin shutdowns to complete
      await Promise.all(shutdownPromises);
      
      // Call the regular stop method
      await this.stop();
      
      this.logger.info('Graceful shutdown completed successfully');
    } catch (error) {
      this.logger.error('Error during graceful shutdown:', error);
      this.logger.info('Graceful shutdown completed with errors');
    }
  }
}
