import { DIContainer } from "../../../common";
import { MiddlewareRegistry } from "../../common";
import { RouteRegistry } from "../route.registry";
import { AuthStrategy, MiddlewareMetadata, RouteMetadata } from "../types";

// Enhanced plugin context for advanced plugin capabilities
export interface EnhancedPluginContext {
  // Access to DI container
  getContainer(): DIContainer;
  getService<T>(token: string): T;
  registerService<T>(token: string, service: new (...args: any[]) => T): void;
  
  // Access to Express app
  getExpressApp(): any;
  
  // Access to registries
  getRouteRegistry(): RouteRegistry;
  getMiddlewareRegistry(): MiddlewareRegistry;
  getAuthRegistry(): any;
  
  // Plugin-specific utilities
  createRoute(route: any): void;
  createMiddleware(middleware: any): void;
  createAuthStrategy(strategy: AuthStrategy): void;
}

// Plugin lifecycle hooks
export interface PluginLifecycle<AppType> {
  install(app: AppType, options?: any): void;
  uninstall?(app: AppType): void;
  beforeStart?(app: AppType): void;
  afterStart?(app: AppType): void;
  beforeStop?(app: AppType): void;
  afterStop?(app: AppType): void;
}

// Enhanced plugin lifecycle with context
export interface EnhancedPluginLifecycle<AppType> extends PluginLifecycle<AppType> {
  install(app: AppType, context: EnhancedPluginContext, options?: any): void;
}

// Plugin metadata
export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  peerDependencies?: string[];
  tags?: string[];
  category?: string;
}

// Service metadata for plugins
export interface ServiceMetadata {
  name: string;
  service: any;
  singleton?: boolean;
  dependencies?: string[];
}

// Plugin interface
export interface HttpAppPlugin<AppType = any> extends PluginLifecycle<AppType>, PluginMetadata {
  // Plugin identification
  readonly name: string;
  readonly version: string;
  
  // Plugin capabilities
  middleware?: MiddlewareMetadata[];
  routes?: RouteMetadata[];
  services?: ServiceMetadata[];
  
  // Plugin configuration
  config?: any;
  
  // Plugin state
  installed?: boolean;
  enabled?: boolean;
  
  // Enhanced capabilities
  provides?: {
    routes?: boolean;
    middlewares?: boolean;
    authStrategies?: boolean;
    services?: boolean;
  };
  
  install(app: AppType, context: EnhancedPluginContext, options?: any): void;
}

// Plugin registry interface
export interface PluginRegistry<T> {
  register(plugin: HttpAppPlugin<T>): void;
  unregister(pluginName: string): void;
  get(pluginName: string): HttpAppPlugin<T> | undefined;
  list(): HttpAppPlugin<T>[];
  install(app: any, pluginName: string, options?: any): void;
  uninstall(app: any, pluginName: string): void;
  isInstalled(pluginName: string): boolean;
  getInstalled(): HttpAppPlugin<T>[];
}

// Plugin manager interface
export interface PluginManager<AppType = any> {
  usePlugin(plugin: HttpAppPlugin<AppType>, options?: any): void;
  loadPlugin(pluginName: string, options?: any): Promise<void>;
  unloadPlugin(pluginName: string): void;
  listPlugins(): HttpAppPlugin<AppType>[];
  getPlugin(pluginName: string): HttpAppPlugin<AppType> | undefined;
  isPluginLoaded(pluginName: string): boolean;
  loadPluginsFromDirectory(dir: string): Promise<void>;
}

// Plugin discovery interface
export interface PluginDiscovery<AppType = any> {
  discover(directory: string): Promise<HttpAppPlugin<AppType>[]>;
  load(pluginPath: string): Promise<HttpAppPlugin<AppType>>;
  validate(plugin: HttpAppPlugin<AppType>): boolean;
}

// Plugin configuration
export interface PluginConfig {
  autoLoad?: boolean;
  pluginDirectory?: string;
  enabledPlugins?: string[];
  disabledPlugins?: string[];
  pluginOptions?: Record<string, any>;
}

// Health check plugin specific types
export interface HealthCheckOptions {
  path?: string;
  checks?: HealthCheck[];
  timeout?: number;
  responseFormat?: 'json' | 'text';
}

export interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult> | HealthCheckResult;
  timeout?: number;
  critical?: boolean;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  data?: any;
  timestamp?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: Record<string, HealthCheckResult>;
  version?: string;
  environment?: string;
}
