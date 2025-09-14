import { DIContainer } from "../../common";
import { Middleware, MiddlewareRegistry } from "../common";
import { MetricsCollector, MetricsConfig, MetricsMiddleware } from "./metrics";
import { MemoryMonitor, MemoryMonitoringMiddleware } from "./monitoring";
import { HttpAppPlugin, PluginManager } from "./plugins/plugin";
import { Route } from "./route";
import { RouteGroup } from "./route.group";
import { RouteRegistry } from "./route.registry";
import { Router } from "./router";
import { SecurityMiddleware } from "./security";

export interface HttpApp<AppType> {
    registerController(...controllers:any[]);
    registerRouter(...routers: Router[]);
    registerRoute(...routes: Route[]);
    registerRouteGroup(...groups: RouteGroup[]);
    registerMiddleware(middleware: Middleware, ready: boolean);
    getRouteRegistry(): RouteRegistry;
    getMiddlewareRegistry(): MiddlewareRegistry;
    useMetrics(collector: MetricsCollector);
    getMetricsCollector(): MetricsCollector | undefined;
    getMetricsMiddleware(): MetricsMiddleware | undefined;
    useMemoryMonitoring(monitor: MemoryMonitor);
    getMemoryMonitor(): MemoryMonitor | undefined;
    getMemoryMiddleware(): MemoryMonitoringMiddleware | undefined;
    useSecurity(config: SecurityMiddleware);
    getSecurityMiddleware(): SecurityMiddleware | undefined
  
    // Plugin management methods
    usePlugin(plugin: HttpAppPlugin, options?: any): this;
    loadPlugin(pluginName: string, options?: any): Promise<this>;
    unloadPlugin(pluginName: string): this;
    listPlugins(): HttpAppPlugin[];
    getPlugin(pluginName: string): HttpAppPlugin | undefined;
    isPluginLoaded(pluginName: string): boolean;
    loadPluginsFromDirectory(dir: string): Promise<this>;
    getPluginManager(): PluginManager;

    start(port: number);
    getApp(): AppType;
    getServer<T>(): T;
    registerService<T>(token: string, service: new (...args: any[]) => T);
    registerClass<T>(service: new (...args: any[]) => T, token?: string | symbol);
    registerValue<T>(token: string, value: T);
    registerFactory<T>(token: string, factory: (...args: any[]) => T);
    getService<T>(token: string): T;
    hasService(token: string): boolean;
    getContainer(): DIContainer;
    destroy();
  }
  