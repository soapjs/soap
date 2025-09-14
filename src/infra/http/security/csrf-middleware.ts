import { CSRFConfig, defaultCSRFConfig, generateCSRFToken, hashToken, verifyCSRFToken } from './types';
import { HttpContext, HttpRequest, HttpResponse } from '../types';

export class CSRFMiddleware<Req extends HttpRequest = HttpRequest, Res extends HttpResponse = HttpResponse> {
  private config: CSRFConfig;

  constructor(config: CSRFConfig = defaultCSRFConfig) {
    this.config = { ...defaultCSRFConfig, ...config };
  }

  // Generic middleware function that works with any framework
  middleware() {
    return (req: Req, res: Res, next: () => void) => {
      if (!this.config.enabled) {
        return next();
      }

      // Skip CSRF check for ignored methods and paths
      if (this.shouldSkipCSRF(req)) {
        return next();
      }

      // Generate and set CSRF token if not present
      this.ensureCSRFToken(req, res);

      // Verify CSRF token for state-changing methods
      if (this.requiresCSRFVerification(req)) {
        if (!this.verifyCSRFToken(req)) {
          return this.handleCSRFError(res);
        }
      }

      next();
    };
  }

  // Alternative method that accepts HttpContext directly
  process(context: HttpContext): void {
    const { req, res, next } = context;
    
    if (!this.config.enabled) {
      return next();
    }

    // Skip CSRF check for ignored methods and paths
    if (this.shouldSkipCSRF(req)) {
      return next();
    }

    // Generate and set CSRF token if not present
    this.ensureCSRFToken(req, res);

    // Verify CSRF token for state-changing methods
    if (this.requiresCSRFVerification(req)) {
      if (!this.verifyCSRFToken(req)) {
        return this.handleCSRFError(res);
      }
    }

    next();
  }

  // Check if request should skip CSRF verification
  private shouldSkipCSRF(req: HttpRequest): boolean {
    // Skip ignored paths
    if (this.config.ignorePaths) {
      for (const path of this.config.ignorePaths) {
        if (req.path.startsWith(path)) {
          return true;
        }
      }
    }

    return false;
  }

  // Check if request requires CSRF verification
  private requiresCSRFVerification(req: HttpRequest): boolean {
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    return stateChangingMethods.includes(req.method);
  }

  // Ensure CSRF token is present in request
  private ensureCSRFToken(req: HttpRequest, res: HttpResponse): void {
    const cookieName = this.config.cookieName!;
    let token = req.cookies?.[cookieName];

    if (!token) {
      // Generate new token
      token = generateCSRFToken(this.config.tokenLength!);
      const hashedToken = hashToken(token, this.config.secret);
      
      // Set cookie with hashed token
      res.cookie(cookieName, hashedToken, {
        ...this.config.cookieOptions,
        secure: this.config.cookieOptions?.secure ?? false,
        httpOnly: this.config.cookieOptions?.httpOnly ?? true,
        sameSite: this.config.cookieOptions?.sameSite ?? 'strict',
        maxAge: this.config.cookieOptions?.maxAge ?? 3600000
      });

      // Store token in response for client access
      res.locals.csrfToken = token;
    } else {
      // Token exists, verify it's valid
      const isValid = this.verifyStoredToken(token);
      if (!isValid) {
        // Generate new token if stored one is invalid
        token = generateCSRFToken(this.config.tokenLength!);
        const hashedToken = hashToken(token, this.config.secret);
        
        res.cookie(cookieName, hashedToken, {
          ...this.config.cookieOptions,
          secure: this.config.cookieOptions?.secure ?? false,
          httpOnly: this.config.cookieOptions?.httpOnly ?? true,
          sameSite: this.config.cookieOptions?.sameSite ?? 'strict',
          maxAge: this.config.cookieOptions?.maxAge ?? 3600000
        });
      }
      
      res.locals.csrfToken = token;
    }
  }

  // Verify CSRF token from request
  private verifyCSRFToken(req: HttpRequest): boolean {
    const cookieName = this.config.cookieName!;
    const storedToken = req.cookies?.[cookieName];
    
    if (!storedToken) {
      return false;
    }

    // Get token from various sources
    const token = this.getTokenFromRequest(req);
    if (!token) {
      return false;
    }

    // Verify token
    return verifyCSRFToken(token, this.config.secret, storedToken);
  }

  // Get CSRF token from request
  private getTokenFromRequest(req: HttpRequest): string | null {
    // Check header first
    const headerName = this.config.headerName!;
    if (req.headers[headerName.toLowerCase()]) {
      return req.headers[headerName.toLowerCase()] as string;
    }

    // Check body
    const bodyName = this.config.bodyName!;
    if (req.body && req.body[bodyName]) {
      return req.body[bodyName];
    }

    // Check query
    const queryName = this.config.queryName!;
    if (req.query && req.query[queryName]) {
      return req.query[queryName] as string;
    }

    return null;
  }

  // Verify stored token format
  private verifyStoredToken(token: string): boolean {
    // Basic validation - should be hex string
    return /^[a-f0-9]{64}$/.test(token);
  }

  // Handle CSRF error
  private handleCSRFError(res: HttpResponse): void {
    res.status(403).json({
      error: 'CSRF token mismatch',
      message: 'Invalid or missing CSRF token',
      code: 'CSRF_TOKEN_MISMATCH'
    });
  }

  // Generate CSRF token for client
  generateToken(): string {
    return generateCSRFToken(this.config.tokenLength!);
  }

  // Verify CSRF token manually
  verifyToken(token: string, storedToken: string): boolean {
    return verifyCSRFToken(token, this.config.secret, storedToken);
  }

  // Update configuration
  updateConfig(newConfig: Partial<CSRFConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): CSRFConfig {
    return { ...this.config };
  }
}

// Factory function
export function createCSRFMiddleware<Req extends HttpRequest = HttpRequest, Res extends HttpResponse = HttpResponse>(
  config?: CSRFConfig
): CSRFMiddleware<Req, Res> {
  return new CSRFMiddleware<Req, Res>(config);
}

// CSRF token generation endpoint helper - generic version
export function createCSRFTokenEndpoint(csrfMiddleware: CSRFMiddleware) {
  return (req: HttpRequest, res: HttpResponse) => {
    const token = csrfMiddleware.generateToken();
    const hashedToken = hashToken(token, csrfMiddleware.getConfig().secret);
    
    res.cookie(csrfMiddleware.getConfig().cookieName!, hashedToken, {
      ...csrfMiddleware.getConfig().cookieOptions,
      secure: csrfMiddleware.getConfig().cookieOptions?.secure ?? false,
      httpOnly: csrfMiddleware.getConfig().cookieOptions?.httpOnly ?? true,
      sameSite: csrfMiddleware.getConfig().cookieOptions?.sameSite ?? 'strict',
      maxAge: csrfMiddleware.getConfig().cookieOptions?.maxAge ?? 3600000
    });

    res.json({ csrfToken: token });
  };
}

// Express-specific adapter for backward compatibility
export function createExpressCSRFTokenEndpoint(csrfMiddleware: CSRFMiddleware) {
  return (req: any, res: any) => {
    const token = csrfMiddleware.generateToken();
    const hashedToken = hashToken(token, csrfMiddleware.getConfig().secret);
    
    res.cookie(csrfMiddleware.getConfig().cookieName!, hashedToken, {
      ...csrfMiddleware.getConfig().cookieOptions,
      secure: csrfMiddleware.getConfig().cookieOptions?.secure ?? false,
      httpOnly: csrfMiddleware.getConfig().cookieOptions?.httpOnly ?? true,
      sameSite: csrfMiddleware.getConfig().cookieOptions?.sameSite ?? 'strict',
      maxAge: csrfMiddleware.getConfig().cookieOptions?.maxAge ?? 3600000
    });

    res.json({ csrfToken: token });
  };
}
