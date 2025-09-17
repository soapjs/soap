import { HttpPlugin, HttpApp, HttpRequest, HttpResponse, RequestMethod } from '../types';
import { 
  MemoryMonitor, 
  MemoryMonitoringMiddleware, 
  createMemoryMonitoringMiddleware,
  MemoryMonitoringConfig,
  MemoryStats,
  MemoryLeakInfo,
  MemorySnapshot,
  defaultMemoryConfig
} from '../monitoring';
import { Route } from '../route';
import { Middleware } from '../../common';
import { ConsoleLogger, Logger } from '../../../common';

export interface MemoryMonitoringPluginOptions extends Partial<MemoryMonitoringConfig> {
  /**
   * Whether to expose memory monitoring endpoints
   */
  exposeEndpoints?: boolean;
  
  /**
   * Base path for memory monitoring endpoints (default: '/memory')
   */
  basePath?: string;
  
  /**
   * Whether to include memory info in request context
   */
  includeInRequest?: boolean;
  
  /**
   * Whether to enable automatic garbage collection on threshold
   */
  autoGC?: boolean;
  
  /**
   * GC threshold percentage (default: 90%)
   */
  gcThreshold?: number;
}

export class MemoryMonitoringPlugin implements HttpPlugin {
  readonly name = 'memory-monitoring';

  private monitor: MemoryMonitor;
  private memoryMiddleware: MemoryMonitoringMiddleware;
  public config: MemoryMonitoringPluginOptions;
  private startTime: number;
  private logger: Logger;

  constructor(options: Partial<MemoryMonitoringPluginOptions> = {}, logger?: Logger) {
    this.config = {
      exposeEndpoints: true,
      basePath: '/memory',
      includeInRequest: true,
      autoGC: false,
      gcThreshold: 90,
      ...defaultMemoryConfig,
      ...options
    };
    this.logger = logger || new ConsoleLogger();
    // Ensure all required properties are present for MemoryMonitor
    const monitorConfig: MemoryMonitoringConfig = {
      enabled: this.config.enabled ?? defaultMemoryConfig.enabled,
      interval: this.config.interval ?? defaultMemoryConfig.interval,
      threshold: this.config.threshold ?? defaultMemoryConfig.threshold,
      leakDetection: this.config.leakDetection ?? defaultMemoryConfig.leakDetection,
      onLeak: this.config.onLeak,
      onThreshold: this.config.onThreshold,
      customLabels: this.config.customLabels
    };
    
    this.monitor = new MemoryMonitor(monitorConfig);
    this.memoryMiddleware = createMemoryMonitoringMiddleware(monitorConfig);
    this.startTime = Date.now();
    
    // Setup auto GC if enabled
    if (this.config.autoGC) {
      this.setupAutoGC();
    }
  }

  async install<Framework>(
    app: HttpApp<Framework>,
    options?: MemoryMonitoringPluginOptions
  ): Promise<void> {
    // Merge options
    if (options) {
      this.config = { ...this.config, ...options };
      this.monitor.updateConfig(this.config);
    }

    // Register memory monitoring middleware
    if (this.config.includeInRequest) {
      const memoryMiddlewareAdapter: Middleware = {
        name: 'memory-monitoring',
        isDynamic: false,
        use: this.memoryMiddleware.middleware()
      };
      app.useMiddleware(memoryMiddlewareAdapter);
    }

    // Register memory monitoring endpoints if enabled
    if (this.config.exposeEndpoints) {
      this.registerMemoryEndpoints(app);
    }

    this.logger.info(`MemoryMonitoring plugin installed with base path: ${this.config.basePath}`);
  }

  uninstall<Framework>(app: HttpApp<Framework>): void {
    // Cleanup monitor and middleware
    this.monitor.destroy();
    this.memoryMiddleware.destroy();
    
    // Remove memory endpoints
    if (this.config.exposeEndpoints) {
      this.removeMemoryEndpoints(app);
    }

    this.logger.info(`MemoryMonitoring plugin uninstalled`);
  }

  beforeStart<Framework>(app: HttpApp<Framework>): void {
    this.logger.debug('MemoryMonitoring plugin: Application starting...');
  }

  afterStart<Framework>(app: HttpApp<Framework>): void {
    this.logger.debug('MemoryMonitoring plugin: Application started successfully');
  }

  beforeStop<Framework>(app: HttpApp<Framework>): void {
    this.logger.debug('MemoryMonitoring plugin: Application stopping...');
  }

  afterStop<Framework>(app: HttpApp<Framework>): void {
    this.logger.debug('MemoryMonitoring plugin: Application stopped');
  }

  async gracefulShutdown<Framework>(app: HttpApp<Framework>, signals?: string[]): Promise<void> {
    const signalText = signals && signals.length > 0 ? ` (${signals.join(', ')})` : '';
    this.logger.debug(`MemoryMonitoring plugin: Graceful shutdown initiated${signalText}`);
    
    try {
      // Stop monitoring
      this.monitor.destroy();
      
      // Cleanup auto GC interval if it exists
      if ((this as any).autoGCInterval) {
        clearInterval((this as any).autoGCInterval);
        (this as any).autoGCInterval = null;
      }
      
      // Final memory stats
      const finalStats = this.monitor.getStats();
      this.logger.debug('MemoryMonitoring plugin: Final memory stats:', {
        heapUsed: finalStats.current?.heapUsed,
        rss: finalStats.current?.rss,
        percentage: finalStats.current?.percentage,
        timestamp: new Date().toISOString()
      });
      
        this.logger.debug('MemoryMonitoring plugin: Graceful shutdown completed');
    } catch (error) {
      this.logger.error('MemoryMonitoring plugin: Error during graceful shutdown:', error);
      this.logger.debug('MemoryMonitoring plugin: Graceful shutdown completed with errors');
    }
  }

  // Get the memory monitor instance
  getMonitor(): MemoryMonitor {
    return this.monitor;
  }

  // Get current memory statistics
  getMemoryStats(): MemoryStats {
    return this.monitor.getStats();
  }

  // Get memory summary
  getMemorySummary(): {
    current: any;
    status: 'healthy' | 'warning' | 'critical';
    leaks: number;
    uptime: number;
    lastCheck: number;
  } {
    return this.monitor.getSummary();
  }

  // Get detected memory leaks
  getMemoryLeaks(): MemoryLeakInfo[] {
    return this.monitor.getLeaks();
  }

  // Get memory history
  getMemoryHistory(): MemorySnapshot[] {
    return this.monitor.getHistory();
  }

  // Force garbage collection
  forceGC(): void {
    this.monitor.forceGC();
  }

  // Get current configuration
  getConfig(): MemoryMonitoringPluginOptions {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(newConfig: Partial<MemoryMonitoringPluginOptions>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Ensure all required properties are present for MemoryMonitor
    const monitorConfig: MemoryMonitoringConfig = {
      enabled: this.config.enabled ?? defaultMemoryConfig.enabled,
      interval: this.config.interval ?? defaultMemoryConfig.interval,
      threshold: this.config.threshold ?? defaultMemoryConfig.threshold,
      leakDetection: this.config.leakDetection ?? defaultMemoryConfig.leakDetection,
      onLeak: this.config.onLeak,
      onThreshold: this.config.onThreshold,
      customLabels: this.config.customLabels
    };
    
    this.monitor.updateConfig(monitorConfig);
  }

  private setupAutoGC(): void {
    // Monitor memory and trigger GC when threshold is reached
    const checkInterval = setInterval(() => {
      try {
        const summary = this.monitor.getSummary();
        if (summary && summary.status === 'critical' && summary.current && summary.current.percentage > this.config.gcThreshold!) {
          this.logger.debug(`Auto GC triggered at ${summary.current.percentage.toFixed(2)}% memory usage`);
          this.monitor.forceGC();
        }
      } catch (error) {
        this.logger.warn('Error in auto GC check:', error.message);
      }
    }, 10000); // Check every 10 seconds

    // Store interval reference for cleanup
    (this as any).autoGCInterval = checkInterval;
  }

  private registerMemoryEndpoints<Framework>(app: HttpApp<Framework>): void {
    const basePath = this.config.basePath!;
    const routeRegistry = app.getRouteRegistry();
    
    // Helper function to create plugin metadata
    const getPluginMetadata = () => ({
      name: this.name,
      uptime: Date.now() - this.startTime
    });

    // Memory stats endpoint
    const statsHandler = async (req: HttpRequest, res: HttpResponse) => {
      try {
        const stats = this.monitor.getStats();
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
          ...stats,
          plugin: getPluginMetadata()
        });
      } catch (error) {
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
          error: 'Failed to get memory stats',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Memory summary endpoint
    const summaryHandler = async (req: HttpRequest, res: HttpResponse) => {
      try {
        const summary = this.monitor.getSummary();
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
          ...summary,
          plugin: getPluginMetadata()
        });
      } catch (error) {
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
          error: 'Failed to get memory summary',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Memory leaks endpoint
    const leaksHandler = async (req: HttpRequest, res: HttpResponse) => {
      try {
        const leaks = this.monitor.getLeaks();
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
          leaks,
          count: leaks.length,
          plugin: getPluginMetadata()
        });
      } catch (error) {
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
          error: 'Failed to get memory leaks',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Memory history endpoint
    const historyHandler = async (req: HttpRequest, res: HttpResponse) => {
      try {
        const history = this.monitor.getHistory();
        const limit = parseInt(req.query.limit as string) || 50;
        const limitedHistory = history.slice(-limit);
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
          history: limitedHistory,
          count: limitedHistory.length,
          total: history.length,
          plugin: getPluginMetadata()
        });
      } catch (error) {
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
          error: 'Failed to get memory history',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Force garbage collection endpoint
    const gcHandler = async (req: HttpRequest, res: HttpResponse) => {
      try {
        const beforeGC = this.monitor.getCurrentMemoryInfo();
        this.monitor.forceGC();
        const afterGC = this.monitor.getCurrentMemoryInfo();
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
          message: 'Garbage collection triggered',
          before: beforeGC,
          after: afterGC,
          freed: {
            heapUsed: beforeGC.heapUsed - afterGC.heapUsed,
            rss: beforeGC.rss - afterGC.rss,
            external: beforeGC.external - afterGC.external
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
          error: 'Failed to trigger garbage collection',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Memory health check endpoint (compatible with health check plugin)
    const healthHandler = async (req: HttpRequest, res: HttpResponse) => {
      try {
        const summary = this.monitor.getSummary();
        const status = summary.status === 'healthy' ? 'healthy' : 
                      summary.status === 'warning' ? 'degraded' : 'unhealthy';
        
        res.setHeader('Content-Type', 'application/json');
        res.status(status === 'healthy' ? 200 : 503).json({
          status,
          message: `Memory usage: ${summary.current.percentage.toFixed(2)}%`,
          data: {
            current: summary.current,
            leaks: summary.leaks,
            uptime: summary.uptime
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.setHeader('Content-Type', 'application/json');
        res.status(503).json({
          status: 'unhealthy',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Register all routes
    const routes = [
      new Route('GET', `${basePath}/stats`, statsHandler, { cors: { origin: '*' } }),
      new Route('GET', `${basePath}/summary`, summaryHandler, { cors: { origin: '*' } }),
      new Route('GET', `${basePath}/leaks`, leaksHandler, { cors: { origin: '*' } }),
      new Route('GET', `${basePath}/history`, historyHandler, { cors: { origin: '*' } }),
      new Route('POST', `${basePath}/gc`, gcHandler, { cors: { origin: '*' } }),
      new Route('GET', `${basePath}/health`, healthHandler, { cors: { origin: '*' } })
    ];

    routes.forEach(route => routeRegistry.register(route));
  }

  private removeMemoryEndpoints<Framework>(app: HttpApp<Framework>): void {
    const routeRegistry = app.getRouteRegistry();
    const basePath = this.config.basePath!;
    
    const endpoints = [
      { method: 'GET', path: `${basePath}/stats` },
      { method: 'GET', path: `${basePath}/summary` },
      { method: 'GET', path: `${basePath}/leaks` },
      { method: 'GET', path: `${basePath}/history` },
      { method: 'POST', path: `${basePath}/gc` },
      { method: 'GET', path: `${basePath}/health` }
    ];
    
    // Remove memory monitoring routes from registry
    endpoints.forEach(({ method, path }) => {
      const removed = routeRegistry.removeRoute(method as RequestMethod, path);
      if (removed) {
        this.logger.info(`Memory monitoring route removed: ${method} ${path}`);
      }
    });
  }
}

// Export default instance
export default MemoryMonitoringPlugin;
