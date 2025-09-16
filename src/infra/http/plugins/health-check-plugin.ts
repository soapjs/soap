import { HttpPlugin, HttpApp, HttpRequest, HttpResponse, RequestMethod } from '../types';
import { Route } from '../route';

export interface HealthCheckOptions {
  path?: string;
  method?: RequestMethod;
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

export class HealthCheckPlugin implements HttpPlugin {
  readonly name = 'health-check';

  private options: HealthCheckOptions;
  private startTime: number;

  constructor(options: HealthCheckOptions = {}) {
    this.options = {
      path: '/health',
      method: 'GET',
      timeout: 5000,
      responseFormat: 'json',
      checks: [],
      ...options
    };
    this.startTime = Date.now();
  }

  async install<Framework>(
    app: HttpApp<Framework>,
    options?: Record<string, any>
  ): Promise<void> {
    if (options) {
      this.options = { ...this.options, ...options };
    }

    this.addDefaultHealthChecks();
    this.registerHealthCheckRoute(app);

    console.log(`HealthCheck plugin installed with path: ${this.options.path}`);
  }

  uninstall<Framework>(app: HttpApp<Framework>): void {
    const { method, path } = this.options;
    const routeRegistry = app.getRouteRegistry();
    const removed = routeRegistry.removeRoute(method, path);

    if (removed) {
      console.log(`Health check route removed from path: ${path}`);
    }

    console.log(`HealthCheck plugin uninstalled`);
  }

  beforeStart<Framework>(app: HttpApp<Framework>): void {
    console.log('HealthCheck plugin: Application starting...');
  }

  afterStart<Framework>(app: HttpApp<Framework>): void {
    console.log('HealthCheck plugin: Application started successfully');
  }

  beforeStop<Framework>(app: HttpApp<Framework>): void {
    console.log('HealthCheck plugin: Application stopping...');
  }

  afterStop<Framework>(app: HttpApp<Framework>): void {
    console.log('HealthCheck plugin: Application stopped');
  }

  // Add a custom health check
  addHealthCheck(check: HealthCheck): void {
    this.options.checks = this.options.checks || [];
    this.options.checks.push(check);
  }

  // Remove a health check by name
  removeHealthCheck(name: string): void {
    if (this.options.checks) {
      this.options.checks = this.options.checks.filter(check => check.name !== name);
    }
  }

  // Get all health checks
  getHealthChecks(): HealthCheck[] {
    return this.options.checks || [];
  }

  private addDefaultHealthChecks(): void {
    // Basic uptime check
    this.addHealthCheck({
      name: 'uptime',
      check: () => ({
        status: 'healthy',
        message: 'Application is running',
        data: {
          uptime: Date.now() - this.startTime,
          uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000)
        },
        timestamp: new Date().toISOString()
      }),
      critical: true
    });

    // Memory usage check
    this.addHealthCheck({
      name: 'memory',
      check: () => {
        const memUsage = process.memoryUsage();
        const memUsageMB = {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        };

        return {
          status: 'healthy',
          message: 'Memory usage is normal',
          data: memUsageMB,
          timestamp: new Date().toISOString()
        };
      }
    });

    // Process check
    this.addHealthCheck({
      name: 'process',
      check: () => ({
        status: 'healthy',
        message: 'Process is running normally',
        data: {
          pid: process.pid,
          platform: process.platform,
          nodeVersion: process.version,
          arch: process.arch
        },
        timestamp: new Date().toISOString()
      })
    });
  }

  private registerHealthCheckRoute(app: HttpApp): void {
    const { method, path } = this.options;
    
    // Create health check handler
    const healthCheckHandler = async (req: HttpRequest, res: HttpResponse) => {
      try {
        const healthResponse = await this.performHealthChecks();
        
        if (this.options.responseFormat === 'text') {
          res.setHeader('Content-Type', 'text/plain');
          res.status(healthResponse.status === 'ok' ? 200 : 503);
          res.json(this.formatTextResponse(healthResponse));
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.status(healthResponse.status === 'ok' ? 200 : 503);
          res.json(healthResponse);
        }
      } catch (error) {
        const errorResponse: HealthCheckResponse = {
          status: 'error',
          timestamp: new Date().toISOString(),
          uptime: Date.now() - this.startTime,
          checks: {
            error: {
              status: 'unhealthy',
              message: error.message,
              timestamp: new Date().toISOString()
            }
          }
        };

        res.setHeader('Content-Type', 'application/json');
        res.status(503).json(errorResponse);
      }
    };

    // Create Route instance
    const healthRoute = new Route(
      method!,
      path!,
      healthCheckHandler,
      {
        cors: { origin: '*' },
        logging: { level: 'info' }
      }
    );

    // Register route using RouteRegistry
    const routeRegistry = app.getRouteRegistry();
    routeRegistry.register(healthRoute);
  }

  private async performHealthChecks(): Promise<HealthCheckResponse> {
    const checks: Record<string, HealthCheckResult> = {};
    let overallStatus: 'ok' | 'error' | 'degraded' = 'ok';

    if (!this.options.checks || this.options.checks.length === 0) {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        checks: {}
      };
    }

    // Run all health checks
    for (const check of this.options.checks) {
      try {
        const result = await this.runHealthCheck(check);
        checks[check.name] = result;

        // Update overall status
        if (result.status === 'unhealthy' && check.critical) {
          overallStatus = 'error';
        } else if (result.status === 'unhealthy' && overallStatus === 'ok') {
          overallStatus = 'degraded';
        } else if (result.status === 'degraded' && overallStatus === 'ok') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        checks[check.name] = {
          status: 'unhealthy',
          message: error.message,
          timestamp: new Date().toISOString()
        };

        if (check.critical) {
          overallStatus = 'error';
        } else if (overallStatus === 'ok') {
          overallStatus = 'degraded';
        }
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      checks,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  private async runHealthCheck(check: HealthCheck): Promise<HealthCheckResult> {
    const timeout = check.timeout || this.options.timeout || 5000;
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Health check '${check.name}' timed out after ${timeout}ms`));
      }, timeout);

      try {
        const result = check.check();
        
        if (result instanceof Promise) {
          result
            .then((res) => {
              clearTimeout(timer);
              resolve({
                ...res,
                timestamp: res.timestamp || new Date().toISOString()
              });
            })
            .catch((error) => {
              clearTimeout(timer);
              reject(error);
            });
        } else {
          clearTimeout(timer);
          resolve({
            ...result,
            timestamp: result.timestamp || new Date().toISOString()
          });
        }
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  private formatTextResponse(response: HealthCheckResponse): string {
    let text = `Status: ${response.status}\n`;
    text += `Timestamp: ${response.timestamp}\n`;
    text += `Uptime: ${response.uptime}ms\n`;
    
    if (response.version) {
      text += `Version: ${response.version}\n`;
    }
    
    if (response.environment) {
      text += `Environment: ${response.environment}\n`;
    }

    if (Object.keys(response.checks).length > 0) {
      text += '\nChecks:\n';
      for (const [name, check] of Object.entries(response.checks)) {
        text += `  ${name}: ${check.status}`;
        if (check.message) {
          text += ` - ${check.message}`;
        }
        text += '\n';
      }
    }

    return text;
  }
}
