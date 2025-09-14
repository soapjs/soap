
import { SecurityConfig, defaultSecurityConfig, SecurityContext } from './types';
import { SecurityHeadersMiddleware } from './headers-middleware';
import { CSRFMiddleware } from './csrf-middleware';
import { SanitizationMiddleware } from './sanitization-middleware';
import { HttpContext, HttpRequest, HttpResponse } from '../types';

export class SecurityMiddleware<Req extends HttpRequest = HttpRequest, Res extends HttpResponse = HttpResponse> {
  private config: SecurityConfig;
  private headersMiddleware: SecurityHeadersMiddleware<Req, Res>;
  private csrfMiddleware: CSRFMiddleware<Req, Res>;
  private sanitizationMiddleware: SanitizationMiddleware<Req, Res>;

  constructor(config: SecurityConfig = defaultSecurityConfig) {
    this.config = { ...defaultSecurityConfig, ...config };
    
    // Initialize sub-middlewares
    this.headersMiddleware = new SecurityHeadersMiddleware<Req, Res>(this.config.headers);
    this.csrfMiddleware = new CSRFMiddleware<Req, Res>(this.config.csrf);
    this.sanitizationMiddleware = new SanitizationMiddleware<Req, Res>(this.config.sanitization);
  }

  // Generic middleware function that works with any framework
  middleware() {
    return (req: Req, res: Res, next: () => void) => {
      if (!this.config.enabled) {
        return next();
      }

      // Add security context to request
      this.addSecurityContext(req);

      // Apply security headers
      this.headersMiddleware.middleware()(req, res, () => {
        // Apply CSRF protection
        this.csrfMiddleware.middleware()(req, res, () => {
          // Apply input sanitization
          this.sanitizationMiddleware.middleware()(req, res, next);
        });
      });
    };
  }

  // Alternative method that accepts HttpContext directly
  process(context: HttpContext): void {
    const { req, res, next } = context;
    
    if (!this.config.enabled) {
      return next();
    }

    // Add security context to request
    this.addSecurityContext(req);

    // Apply security headers
    this.headersMiddleware.process({ req, res, next: () => {
      // Apply CSRF protection
      this.csrfMiddleware.process({ req, res, next: () => {
        // Apply input sanitization
        this.sanitizationMiddleware.process({ req, res, next });
      }});
    }});
  }

  // Add security context to request
  private addSecurityContext(req: HttpRequest): void {
    const context: SecurityContext = {
      isSecure: req.secure || req.headers['x-forwarded-proto'] === 'https',
      userAgent: req.headers['user-agent'] as string,
      ip: req.ip || req.connection?.remoteAddress,
      referer: req.headers.referer as string,
      origin: req.headers.origin as string
    };

    // Attach to request
    (req as any).securityContext = context;
  }

  // Get security headers middleware
  getHeadersMiddleware(): SecurityHeadersMiddleware<Req, Res> {
    return this.headersMiddleware;
  }

  // Get CSRF middleware
  getCSRFMiddleware(): CSRFMiddleware<Req, Res> {
    return this.csrfMiddleware;
  }

  // Get sanitization middleware
  getSanitizationMiddleware(): SanitizationMiddleware<Req, Res> {
    return this.sanitizationMiddleware;
  }

  // Get security violations
  getSecurityViolations() {
    return this.sanitizationMiddleware.getViolations();
  }

  // Get security statistics
  getSecurityStats() {
    return {
      violations: this.sanitizationMiddleware.getViolationStats(),
      config: this.config
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update sub-middlewares
    if (newConfig.headers) {
      this.headersMiddleware.updateConfig(newConfig.headers);
    }
    if (newConfig.csrf) {
      this.csrfMiddleware.updateConfig(newConfig.csrf);
    }
    if (newConfig.sanitization) {
      this.sanitizationMiddleware.updateConfig(newConfig.sanitization);
    }
  }

  // Get current configuration
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Clear security violations
  clearViolations(): void {
    this.sanitizationMiddleware.clearViolations();
  }
}

// Factory function
export function createSecurityMiddleware<Req extends HttpRequest = HttpRequest, Res extends HttpResponse = HttpResponse>(
  config?: SecurityConfig
): SecurityMiddleware<Req, Res> {
  return new SecurityMiddleware<Req, Res>(config);
}

// Security endpoints helper - generic version
export function createSecurityEndpoints(securityMiddleware: SecurityMiddleware) {
  return {
    // CSRF token endpoint
    csrfToken: (req: HttpRequest, res: HttpResponse) => {
      const csrfMiddleware = securityMiddleware.getCSRFMiddleware();
      const token = csrfMiddleware.generateToken();
      res.json({ csrfToken: token });
    },

    // Security violations endpoint
    violations: (req: HttpRequest, res: HttpResponse) => {
      const violations = securityMiddleware.getSecurityViolations();
      const stats = securityMiddleware.getSecurityStats();
      
      res.json({
        violations,
        stats,
        timestamp: new Date().toISOString()
      });
    },

    // Security status endpoint
    status: (req: HttpRequest, res: HttpResponse) => {
      const config = securityMiddleware.getConfig();
      const stats = securityMiddleware.getSecurityStats();
      
      res.json({
        enabled: config.enabled,
        features: {
          headers: config.headers?.enabled || false,
          csrf: config.csrf?.enabled || false,
          sanitization: config.sanitization?.enabled || false
        },
        stats,
        timestamp: new Date().toISOString()
      });
    }
  };
}

// Express-specific adapter for backward compatibility
export function createExpressSecurityEndpoints(securityMiddleware: SecurityMiddleware) {
  return {
    // CSRF token endpoint
    csrfToken: (req: any, res: any) => {
      const csrfMiddleware = securityMiddleware.getCSRFMiddleware();
      const token = csrfMiddleware.generateToken();
      res.json({ csrfToken: token });
    },

    // Security violations endpoint
    violations: (req: any, res: any) => {
      const violations = securityMiddleware.getSecurityViolations();
      const stats = securityMiddleware.getSecurityStats();
      
      res.json({
        violations,
        stats,
        timestamp: new Date().toISOString()
      });
    },

    // Security status endpoint
    status: (req: any, res: any) => {
      const config = securityMiddleware.getConfig();
      const stats = securityMiddleware.getSecurityStats();
      
      res.json({
        enabled: config.enabled,
        features: {
          headers: config.headers?.enabled || false,
          csrf: config.csrf?.enabled || false,
          sanitization: config.sanitization?.enabled || false
        },
        stats,
        timestamp: new Date().toISOString()
      });
    }
  };
}
