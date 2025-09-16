import { HttpPlugin, HttpApp, HttpRequest, HttpResponse, RequestMethod } from '../types';
import { 
  SecurityMiddleware, 
  createSecurityMiddleware, 
  createSecurityEndpoints,
  SecurityConfig,
  defaultSecurityConfig
} from '../security';
import { Route } from '../route';
import { Middleware } from '../../common';

export interface SecurityPluginOptions extends SecurityConfig {
  /**
   * Whether to expose security endpoints
   */
  exposeEndpoints?: boolean;
  
  /**
   * Base path for security endpoints (default: '/security')
   */
  endpointsPath?: string;
  
  /**
   * Whether to enable security monitoring and logging
   */
  enableMonitoring?: boolean;
  
  /**
   * Custom security violation handler
   */
  onViolation?: (violation: any) => void;
}

export class SecurityPlugin implements HttpPlugin {
  readonly name = 'security';

  private securityMiddleware: SecurityMiddleware;
  public config: SecurityPluginOptions;
  private startTime: number;
  private violationCount: number = 0;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(options: Partial<SecurityPluginOptions> = {}) {
    this.config = {
      exposeEndpoints: true,
      endpointsPath: '/security',
      enableMonitoring: true,
      ...defaultSecurityConfig,
      ...options
    };
    
    this.securityMiddleware = createSecurityMiddleware(this.config);
    this.startTime = Date.now();
  }

  async install<Framework>(
    app: HttpApp<Framework>,
    options?: SecurityPluginOptions
  ): Promise<void> {
    // Merge options
    if (options) {
      this.config = { ...this.config, ...options };
      this.securityMiddleware.updateConfig(this.config);
    }

    // Register security middleware
    const securityMiddlewareAdapter: Middleware = {
      name: 'security',
      isDynamic: false,
      use: this.securityMiddleware.middleware()
    };
    app.useMiddleware(securityMiddlewareAdapter);

    // Register security endpoints if enabled
    if (this.config.exposeEndpoints) {
      this.registerSecurityEndpoints(app);
    }

    // Enable monitoring if enabled
    if (this.config.enableMonitoring) {
      this.enableSecurityMonitoring();
    }

    console.log(`Security plugin installed with endpoints at: ${this.config.endpointsPath}`);
  }

  uninstall<Framework>(app: HttpApp<Framework>): void {
    // Remove security endpoints
    if (this.config.exposeEndpoints) {
      this.removeSecurityEndpoints(app);
    }

    // Clear security violations
    this.securityMiddleware.clearViolations();

    // Clear monitoring interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log('Security plugin uninstalled');
  }

  beforeStart<Framework>(app: HttpApp<Framework>): void {
    console.log('Security plugin: Application starting with security enabled...');
  }

  afterStart<Framework>(app: HttpApp<Framework>): void {
    console.log('Security plugin: Application started with security protection active');
  }

  beforeStop<Framework>(app: HttpApp<Framework>): void {
    console.log('Security plugin: Application stopping...');
  }

  afterStop<Framework>(app: HttpApp<Framework>): void {
    console.log('Security plugin: Application stopped');
  }

  // Get the security middleware for custom usage
  getSecurityMiddleware(): SecurityMiddleware {
    return this.securityMiddleware;
  }

  // Get security statistics
  getSecurityStats(): any {
    const stats = this.securityMiddleware.getSecurityStats();
    return {
      ...stats,
      uptime: Date.now() - this.startTime,
      violationCount: this.violationCount,
      timestamp: new Date().toISOString()
    };
  }

  // Get current configuration
  getConfig(): SecurityPluginOptions {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(newConfig: Partial<SecurityPluginOptions>): void {
    this.config = { ...this.config, ...newConfig };
    this.securityMiddleware.updateConfig(newConfig);
  }

  // Get security violations
  getSecurityViolations() {
    return this.securityMiddleware.getSecurityViolations();
  }

  // Clear security violations
  clearSecurityViolations(): void {
    this.securityMiddleware.clearViolations();
    this.violationCount = 0;
  }

  private registerSecurityEndpoints<Framework>(app: HttpApp<Framework>): void {
    const endpoints = createSecurityEndpoints(this.securityMiddleware);
    const basePath = this.config.endpointsPath!;
    const routeRegistry = app.getRouteRegistry();

    // CSRF token endpoint
    const csrfTokenHandler = (req: HttpRequest, res: HttpResponse) => {
      try {
        endpoints.csrfToken(req, res);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to generate CSRF token',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Security violations endpoint
    const violationsHandler = (req: HttpRequest, res: HttpResponse) => {
      try {
        endpoints.violations(req, res);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to retrieve security violations',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Security status endpoint
    const statusHandler = (req: HttpRequest, res: HttpResponse) => {
      try {
        endpoints.status(req, res);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to retrieve security status',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Additional security info endpoint
    const infoHandler = (req: HttpRequest, res: HttpResponse) => {
      try {
        const stats = this.getSecurityStats();
        const config = this.getConfig();
        
        res.json({
          plugin: {
            name: this.name,
            uptime: stats.uptime,
            violationCount: stats.violationCount
          },
          config: {
            enabled: config.enabled,
            exposeEndpoints: config.exposeEndpoints,
            enableMonitoring: config.enableMonitoring,
            features: {
              headers: config.headers?.enabled || false,
              csrf: config.csrf?.enabled || false,
              sanitization: config.sanitization?.enabled || false,
              rateLimit: config.rateLimit?.enabled || false,
              cors: config.cors?.enabled || false
            }
          },
          stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to retrieve security info',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Register all routes
    const routes = [
      new Route('GET', `${basePath}/csrf-token`, csrfTokenHandler, { cors: { origin: '*' } }),
      new Route('GET', `${basePath}/violations`, violationsHandler, { cors: { origin: '*' } }),
      new Route('GET', `${basePath}/status`, statusHandler, { cors: { origin: '*' } }),
      new Route('GET', `${basePath}/info`, infoHandler, { cors: { origin: '*' } })
    ];

    routes.forEach(route => routeRegistry.register(route));
  }

  private removeSecurityEndpoints<Framework>(app: HttpApp<Framework>): void {
    const routeRegistry = app.getRouteRegistry();
    const basePath = this.config.endpointsPath!;
    
    // List of endpoints to remove
    const endpoints = [
      { method: 'GET', path: `${basePath}/csrf-token` },
      { method: 'GET', path: `${basePath}/violations` },
      { method: 'GET', path: `${basePath}/status` },
      { method: 'GET', path: `${basePath}/info` }
    ];
    
    // Remove security endpoints from registry
    endpoints.forEach(({ method, path }) => {
      const removed = routeRegistry.removeRoute(method as RequestMethod, path);
      if (removed) {
        console.log(`Security endpoint removed: ${method} ${path}`);
      }
    });
  }

  private enableSecurityMonitoring(): void {
    // Monitor security violations
    const originalViolations = this.securityMiddleware.getSecurityViolations() || [];
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      const currentViolations = this.securityMiddleware.getSecurityViolations() || [];
      if (currentViolations.length > originalViolations.length) {
        this.violationCount += currentViolations.length - originalViolations.length;
        
        // Call custom violation handler if provided
        if (this.config.onViolation) {
          const newViolations = currentViolations.slice(originalViolations.length);
          newViolations.forEach(violation => this.config.onViolation!(violation));
        }
        
        // Log security violations
        console.warn(`Security violation detected: ${this.violationCount} total violations`);
      }
    }, 5000); // Check every 5 seconds
  }
}

// Export default instance
export default SecurityPlugin;
