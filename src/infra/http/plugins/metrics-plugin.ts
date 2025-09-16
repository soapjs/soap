import { HttpPlugin, HttpApp, HttpRequest, HttpResponse } from '../types';
import { BaseMetricsCollector } from '../metrics/collector';
import { MetricsMiddleware, createMetricsMiddleware, defaultMetricsConfig } from '../metrics/middleware';
import { MetricsConfig, MetricsCollector } from '../metrics/types';
import { Route } from '../route';
import { Middleware } from '../../common';

export interface MetricsPluginOptions extends MetricsConfig {
  /**
   * Whether to expose a metrics endpoint
   */
  exposeEndpoint?: boolean;
  
  /**
   * Path for the metrics endpoint (default: '/metrics')
   */
  metricsPath?: string;
  
  /**
   * Format for metrics endpoint response
   */
  metricsFormat?: 'prometheus' | 'json' | 'text';
  
  /**
   * Whether to include built-in system metrics
   */
  includeSystemMetrics?: boolean;
}

export class MetricsPlugin implements HttpPlugin {
  readonly name = 'metrics';

  private collector: MetricsCollector;
  public config: MetricsPluginOptions;
  private metricsMiddleware: MetricsMiddleware;
  private startTime: number;

  constructor(options: Partial<MetricsPluginOptions> = {}) {
    this.config = {
      exposeEndpoint: true,
      metricsPath: '/metrics',
      metricsFormat: 'prometheus',
      includeSystemMetrics: true,
      ...defaultMetricsConfig,
      ...options
    };
    
    this.collector = new BaseMetricsCollector(this.config);
    this.metricsMiddleware = createMetricsMiddleware(this.collector);
    this.startTime = Date.now();
  }

  async install<Framework>(
    app: HttpApp<Framework>,
    options?: MetricsPluginOptions
  ): Promise<void> {
    if (options) {
      this.config = { ...this.config, ...options };
    }

    const metricsMiddlewareAdapter: Middleware = {
      name: 'metrics',
      isDynamic: false,
      use: this.metricsMiddleware.middleware()
    };
    app.useMiddleware(metricsMiddlewareAdapter);

    if (this.config.exposeEndpoint) {
      this.registerMetricsEndpoint(app);
    }

    if (this.config.includeSystemMetrics) {
      this.registerSystemMetrics();
    }

    console.log(`Metrics plugin installed with path: ${this.config.metricsPath}`);
  }

  uninstall<Framework>(app: HttpApp<Framework>): void {
    this.collector.destroy();
    
    if (this.config.exposeEndpoint) {
      this.removeMetricsEndpoint(app);
    }

    console.log(`Metrics plugin uninstalled`);
  }

  beforeStart<Framework>(app: HttpApp<Framework>): void {
    console.log('Metrics plugin: Application starting...');
  }

  afterStart<Framework>(app: HttpApp<Framework>): void {
    console.log('Metrics plugin: Application started successfully');
  }

  beforeStop<Framework>(app: HttpApp<Framework>): void {
    console.log('Metrics plugin: Application stopping...');
  }

  afterStop<Framework>(app: HttpApp<Framework>): void {
    console.log('Metrics plugin: Application stopped');
  }

  // Get the metrics collector for custom metrics
  getCollector(): MetricsCollector {
    return this.collector;
  }

  // Get current metrics data
  getMetricsData(): any {
    return {
      uptime: Date.now() - this.startTime,
      timestamp: new Date().toISOString(),
      config: this.config
    };
  }

  private registerMetricsEndpoint<Framework>(app: HttpApp<Framework>): void {
    const metricsPath = this.config.metricsPath!;

    const metricsHandler = async (req: HttpRequest, res: HttpResponse) => {
      try {
        const metricsData = await this.collectMetrics();
        
        switch (this.config.metricsFormat) {
          case 'prometheus':
            res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
            res.status(200);
            res.send(this.formatPrometheusMetrics(metricsData));
            break;
            
          case 'json':
            res.setHeader('Content-Type', 'application/json');
            res.status(200);
            res.json(metricsData);
            break;
            
          case 'text':
            res.setHeader('Content-Type', 'text/plain');
            res.status(200);
            res.send(this.formatTextMetrics(metricsData));
            break;
            
          default:
            res.setHeader('Content-Type', 'application/json');
            res.status(200);
            res.json(metricsData);
        }
      } catch (error) {
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({
          error: 'Failed to collect metrics',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Create Route instance
    const metricsRoute = new Route(
      'GET',
      metricsPath,
      metricsHandler,
      {
        cors: { origin: '*' },
        logging: { level: 'info' }
      }
    );

    // Register route using RouteRegistry
    const routeRegistry = app.getRouteRegistry();
    routeRegistry.register(metricsRoute);
  }

  private removeMetricsEndpoint<Framework>(app: HttpApp<Framework>): void {
    const routeRegistry = app.getRouteRegistry();
    const metricsPath = this.config.metricsPath!;
    
    const removed = routeRegistry.removeRoute('GET', metricsPath);
    if (removed) {
      console.log(`Metrics route removed from path: ${metricsPath}`);
    }
  }

  private registerSystemMetrics(): void {
    this.collector.gauge('application_start_time', this.startTime);
    this.collector.gauge('application_uptime_seconds', 0);
    
    setInterval(() => {
      const uptime = Math.floor((Date.now() - this.startTime) / 1000);
      this.collector.gauge('application_uptime_seconds', uptime);
    }, 1000);
  }

  private async collectMetrics(): Promise<any> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      process: {
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version,
        arch: process.arch
      },
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      config: {
        enabled: this.config.enabled,
        metrics: this.config.metrics,
        collectInterval: this.config.collectInterval
      }
    };
  }

  private formatPrometheusMetrics(data: any): string {
    let metrics = '';
    
    metrics += `# HELP application_uptime_seconds Application uptime in seconds\n`;
    metrics += `# TYPE application_uptime_seconds gauge\n`;
    metrics += `application_uptime_seconds ${data.uptime / 1000}\n\n`;
    
    metrics += `# HELP process_memory_bytes Process memory usage in bytes\n`;
    metrics += `# TYPE process_memory_bytes gauge\n`;
    metrics += `process_memory_bytes{type="rss"} ${data.memory.rss}\n`;
    metrics += `process_memory_bytes{type="heapTotal"} ${data.memory.heapTotal}\n`;
    metrics += `process_memory_bytes{type="heapUsed"} ${data.memory.heapUsed}\n`;
    metrics += `process_memory_bytes{type="external"} ${data.memory.external}\n\n`;
    
    metrics += `# HELP process_cpu_usage_microseconds Process CPU usage in microseconds\n`;
    metrics += `# TYPE process_cpu_usage_microseconds gauge\n`;
    metrics += `process_cpu_usage_microseconds{type="user"} ${data.cpu.user}\n`;
    metrics += `process_cpu_usage_microseconds{type="system"} ${data.cpu.system}\n\n`;
    
    return metrics;
  }

  private formatTextMetrics(data: any): string {
    let text = `Metrics Report\n`;
    text += `==============\n\n`;
    text += `Timestamp: ${data.timestamp}\n`;
    text += `Uptime: ${data.uptime}ms\n\n`;
    
    text += `Process Info:\n`;
    text += `  PID: ${data.process.pid}\n`;
    text += `  Platform: ${data.process.platform}\n`;
    text += `  Node Version: ${data.process.nodeVersion}\n`;
    text += `  Architecture: ${data.process.arch}\n\n`;
    
    text += `Memory Usage:\n`;
    text += `  RSS: ${data.memory.rss} bytes\n`;
    text += `  Heap Total: ${data.memory.heapTotal} bytes\n`;
    text += `  Heap Used: ${data.memory.heapUsed} bytes\n`;
    text += `  External: ${data.memory.external} bytes\n\n`;
    
    text += `CPU Usage:\n`;
    text += `  User: ${data.cpu.user} microseconds\n`;
    text += `  System: ${data.cpu.system} microseconds\n`;
    
    return text;
  }
}

// Export default instance
export default MetricsPlugin;
