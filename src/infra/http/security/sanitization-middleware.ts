
import { 
  InputSanitizationConfig, 
  defaultInputSanitizationConfig, 
  SecurityViolation,
  sanitizeHtml, 
  escapeHtml, 
  escapeSql, 
  preventPathTraversal, 
  validateMimeType, 
  validateFileSize,
} from './types';
import { HttpContext, HttpRequest, HttpResponse } from '../types';

export class SanitizationMiddleware<Req extends HttpRequest = HttpRequest, Res extends HttpResponse = HttpResponse> {
  private config: InputSanitizationConfig;
  private violations: SecurityViolation[] = [];

  constructor(config: InputSanitizationConfig = defaultInputSanitizationConfig) {
    this.config = { ...defaultInputSanitizationConfig, ...config };
  }

  // Generic middleware function that works with any framework
  middleware() {
    return (req: Req, res: Res, next: () => void) => {
      if (!this.config.enabled) {
        return next();
      }

      try {
        // Sanitize request body
        if (req.body) {
          req.body = this.sanitizeObject(req.body, 'body');
        }

        // Sanitize query parameters
        if (req.query) {
          req.query = this.sanitizeObject(req.query, 'query');
        }

        // Sanitize route parameters
        if (req.params) {
          req.params = this.sanitizeObject(req.params, 'params');
        }

        // Validate file uploads
        if (this.config.options.validateFileUploads && req.files) {
          this.validateFileUploads(req);
        }

        // Validate JSON if enabled
        if (this.config.options.validateJson && req.body) {
          this.validateJson(req);
        }

        next();
      } catch (error) {
        this.handleSanitizationError(error, req, res);
      }
    };
  }

  // Alternative method that accepts HttpContext directly
  process(context: HttpContext): void {
    const { req, res, next } = context;
    
    if (!this.config.enabled) {
      return next();
    }

    try {
      // Sanitize request body
      if (req.body) {
        req.body = this.sanitizeObject(req.body, 'body');
      }

      // Sanitize query parameters
      if (req.query) {
        req.query = this.sanitizeObject(req.query, 'query');
      }

      // Sanitize route parameters
      if (req.params) {
        req.params = this.sanitizeObject(req.params, 'params');
      }

      // Validate file uploads
      if (this.config.options.validateFileUploads && req.files) {
        this.validateFileUploads(req);
      }

      // Validate JSON if enabled
      if (this.config.options.validateJson && req.body) {
        this.validateJson(req);
      }

      next();
    } catch (error) {
      this.handleSanitizationError(error, req, res);
    }
  }

  // Sanitize object recursively
  private sanitizeObject(obj: any, context: string): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj, context);
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) => this.sanitizeObject(item, `${context}[${index}]`));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeString(key, `${context}.key`);
        sanitized[sanitizedKey] = this.sanitizeObject(value, `${context}.${key}`);
      }
      return sanitized;
    }

    return obj;
  }

  // Sanitize string based on configuration
  private sanitizeString(input: string, context: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }

    let sanitized = input;

    // HTML sanitization
    if (this.config.options.stripHtml) {
      const originalLength = sanitized.length;
      sanitized = sanitizeHtml(sanitized, this.config.options.allowedTags || []);
      
      if (sanitized.length !== originalLength) {
        this.recordViolation('xss', `HTML content stripped in ${context}`, 'medium', context);
      }
    }

    // HTML escaping
    if (this.config.options.escapeHtml) {
      sanitized = escapeHtml(sanitized);
    }

    // SQL injection prevention
    if (this.config.options.escapeSql) {
      sanitized = escapeSql(sanitized);
    }

    // Path traversal prevention
    if (this.config.options.preventPathTraversal) {
      const originalPath = sanitized;
      sanitized = preventPathTraversal(sanitized);
      
      if (sanitized !== originalPath) {
        this.recordViolation('path_traversal', `Path traversal attempt prevented in ${context}`, 'high', context);
      }
    }

    // Apply custom sanitizers
    if (this.config.customSanitizers) {
      for (const [key, sanitizer] of Object.entries(this.config.customSanitizers)) {
        if (context.includes(key)) {
          try {
            sanitized = sanitizer(sanitized);
          } catch (error) {
            this.recordViolation('xss', `Custom sanitizer failed for ${key} in ${context}`, 'medium', context);
          }
        }
      }
    }

    return sanitized;
  }

  // Validate file uploads
  private validateFileUploads(req: HttpRequest): void {
    const files = req.files;
    if (!files) return;

    const maxSize = this.config.options.maxFileSize || 10 * 1024 * 1024; // 10MB
    const allowedTypes = this.config.options.allowedMimeTypes || ['image/jpeg', 'image/png', 'image/gif'];

    const validateFile = (file: any, context: string) => {
      // Check file size
      if (!validateFileSize(file.size, maxSize)) {
        this.recordViolation('file_upload', `File too large: ${file.originalname}`, 'medium', context);
        throw new Error(`File ${file.originalname} exceeds maximum size of ${maxSize} bytes`);
      }

      // Check MIME type
      if (!validateMimeType(file.mimetype, allowedTypes)) {
        this.recordViolation('file_upload', `Invalid file type: ${file.originalname} (${file.mimetype})`, 'high', context);
        throw new Error(`File type ${file.mimetype} is not allowed`);
      }

      // Sanitize filename
      file.originalname = this.sanitizeString(file.originalname, `${context}.filename`);
    };

    if (Array.isArray(files)) {
      files.forEach((file, index) => validateFile(file, `files[${index}]`));
    } else if (typeof files === 'object') {
      Object.entries(files).forEach(([fieldName, fileArray]) => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach((file, index) => validateFile(file, `${fieldName}[${index}]`));
        } else {
          validateFile(fileArray, fieldName);
        }
      });
    }
  }

  // Validate JSON
  private validateJson(req: HttpRequest): void {
    const maxSize = this.config.options.maxJsonSize || 1024 * 1024; // 1MB
    
    if (req.body && typeof req.body === 'object') {
      const jsonString = JSON.stringify(req.body);
      if (jsonString.length > maxSize) {
        this.recordViolation('file_upload', `JSON payload too large: ${jsonString.length} bytes`, 'medium', 'body');
        throw new Error(`JSON payload exceeds maximum size of ${maxSize} bytes`);
      }
    }
  }

  // Record security violation
  private recordViolation(
    type: SecurityViolation['type'],
    message: string,
    severity: SecurityViolation['severity'],
    context: string
  ): void {
    const violation: SecurityViolation = {
      type,
      message,
      severity,
      timestamp: Date.now(),
      path: context
    };

    this.violations.push(violation);

    // Log violation
    console.warn(`Security violation [${severity.toUpperCase()}]: ${message}`, {
      type,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Handle sanitization error
  private handleSanitizationError(error: any, req: HttpRequest, res: HttpResponse): void {
    console.error('Sanitization error:', error);
    
    res.status(400).json({
      error: 'Input sanitization failed',
      message: error.message || 'Invalid input detected',
      code: 'SANITIZATION_ERROR'
    });
  }

  // Get security violations
  getViolations(): SecurityViolation[] {
    return [...this.violations];
  }

  // Clear violations
  clearViolations(): void {
    this.violations = [];
  }

  // Get violation statistics
  getViolationStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const stats = {
      total: this.violations.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>
    };

    this.violations.forEach(violation => {
      stats.byType[violation.type] = (stats.byType[violation.type] || 0) + 1;
      stats.bySeverity[violation.severity] = (stats.bySeverity[violation.severity] || 0) + 1;
    });

    return stats;
  }

  // Update configuration
  updateConfig(newConfig: Partial<InputSanitizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): InputSanitizationConfig {
    return { ...this.config };
  }
}

// Factory function
export function createSanitizationMiddleware<Req extends HttpRequest = HttpRequest, Res extends HttpResponse = HttpResponse>(
  config?: InputSanitizationConfig
): SanitizationMiddleware<Req, Res> {
  return new SanitizationMiddleware<Req, Res>(config);
}

// Security violation endpoint helper - generic version
export function createSecurityViolationsEndpoint(sanitizationMiddleware: SanitizationMiddleware) {
  return (req: HttpRequest, res: HttpResponse) => {
    const violations = sanitizationMiddleware.getViolations();
    const stats = sanitizationMiddleware.getViolationStats();
    
    res.json({
      violations,
      stats,
      timestamp: new Date().toISOString()
    });
  };
}

// Express-specific adapter for backward compatibility
export function createExpressSecurityViolationsEndpoint(sanitizationMiddleware: SanitizationMiddleware) {
  return (req: any, res: any) => {
    const violations = sanitizationMiddleware.getViolations();
    const stats = sanitizationMiddleware.getViolationStats();
    
    res.json({
      violations,
      stats,
      timestamp: new Date().toISOString()
    });
  };
}
