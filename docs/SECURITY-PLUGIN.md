# Security Plugin

The Security Plugin provides comprehensive security features for SoapExpress applications, including CSRF protection, security headers, input sanitization, and security monitoring.

## Features

- **CSRF Protection**: Prevents Cross-Site Request Forgery attacks
- **Security Headers**: Adds security headers like CSP, X-Frame-Options, etc.
- **Input Sanitization**: Sanitizes user input to prevent XSS, SQL injection, and path traversal attacks
- **Security Monitoring**: Monitors and logs security violations
- **Configurable Endpoints**: Exposes security information endpoints (optional)
- **Rate Limiting**: Built-in rate limiting support
- **CORS Configuration**: Cross-Origin Resource Sharing configuration

## Installation

```typescript
import { SecurityPlugin } from '@soapjs/soap';
import { HttpApp } from '@soapjs/soap';

const app = new SoapExpress();
const plugin = new SecurityPlugin({
  enabled: true,
  exposeEndpoints: true,
  endpointsPath: '/security'
});

app.usePlugin(plugin);
```

## Configuration

### Basic Configuration

```typescript
const securityPlugin = new SecurityPlugin({
  enabled: true,                    // Enable/disable security features
  exposeEndpoints: true,           // Expose security endpoints
  endpointsPath: '/security',      // Base path for security endpoints
  enableMonitoring: true,          // Enable security monitoring
  onViolation: (violation) => {    // Custom violation handler
    console.log('Security violation:', violation);
  }
});
```

### Advanced Configuration

```typescript
const securityPlugin = new SecurityPlugin({
  enabled: true,
  exposeEndpoints: false, // Disable in production
  
  // Security Headers
  headers: {
    enabled: true,
    headers: {
      contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'",
      frameOptions: 'DENY',
      contentTypeOptions: true,
      xssProtection: '1; mode=block',
      referrerPolicy: 'strict-origin-when-cross-origin',
      strictTransportSecurity: 'max-age=31536000; includeSubDomains'
    }
  },
  
  // CSRF Protection
  csrf: {
    enabled: true,
    secret: process.env.CSRF_SECRET || 'change-in-production',
    cookieName: '_csrf',
    cookieOptions: {
      httpOnly: true,
      secure: true, // Set to true in production with HTTPS
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    },
    ignorePaths: ['/health', '/metrics']
  },
  
  // Input Sanitization
  sanitization: {
    enabled: true,
    options: {
      stripHtml: true,
      escapeHtml: true,
      escapeSql: true,
      preventPathTraversal: true,
      validateFileUploads: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf']
    }
  },
  
  // Rate Limiting
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    skipSuccessfulRequests: false
  },
  
  // CORS Configuration
  cors: {
    enabled: true,
    origin: ['https://yourdomain.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
  }
});
```

## Security Endpoints

When `exposeEndpoints` is enabled, the following endpoints are available:

### GET /security/csrf-token
Returns a CSRF token for forms.

**Response:**
```json
{
  "csrfToken": "abc123def456..."
}
```

### GET /security/violations
Returns security violations and statistics.

**Response:**
```json
{
  "violations": [...],
  "stats": {
    "violations": [...],
    "config": {...}
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### GET /security/status
Returns security status and configuration.

**Response:**
```json
{
  "enabled": true,
  "features": {
    "headers": true,
    "csrf": true,
    "sanitization": true
  },
  "stats": {...},
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### GET /security/info
Returns detailed security information.

**Response:**
```json
{
  "plugin": {
    "name": "security",
    "version": "1.0.0",
    "description": "Comprehensive security plugin for SoapExpress",
    "uptime": 12345,
    "violationCount": 0
  },
  "config": {
    "enabled": true,
    "exposeEndpoints": true,
    "enableMonitoring": true,
    "features": {
      "headers": true,
      "csrf": true,
      "sanitization": true,
      "rateLimit": true,
      "cors": true
    }
  },
  "stats": {...},
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## Usage Examples

### Development Setup

```typescript
import { SecurityPlugin } from '@soapjs/soap';

const devSecurityPlugin = new SecurityPlugin({
  enabled: true,
  exposeEndpoints: true, // Enable for testing
  endpointsPath: '/dev/security',
  enableMonitoring: true,
  csrf: {
    enabled: false // Disable CSRF in development for easier testing
  }
});
```

### Production Setup

```typescript
const prodSecurityPlugin = new SecurityPlugin({
  enabled: true,
  exposeEndpoints: false, // Disable for security
  enableMonitoring: true,
  csrf: {
    enabled: true,
    secret: process.env.CSRF_SECRET!,
    cookieOptions: {
      secure: true, // HTTPS only
      httpOnly: true,
      sameSite: 'strict'
    }
  },
  headers: {
    enabled: true,
    headers: {
      strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload'
    }
  }
});
```

### API-Only Setup

```typescript
const apiSecurityPlugin = new SecurityPlugin({
  enabled: true,
  exposeEndpoints: false,
  csrf: {
    enabled: true,
    ignorePaths: ['/api/auth/login', '/api/auth/register']
  },
  cors: {
    enabled: true,
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000,
    max: 1000 // Higher limit for API
  }
});
```

## Plugin Lifecycle

The Security Plugin implements the standard plugin lifecycle:

- **install()**: Registers middleware and endpoints
- **uninstall()**: Removes middleware and endpoints, cleans up resources
- **beforeStart()**: Called before application starts
- **afterStart()**: Called after application starts
- **beforeStop()**: Called before application stops
- **afterStop()**: Called after application stops

## Monitoring and Violations

### Custom Violation Handler

```typescript
const securityPlugin = new SecurityPlugin({
  onViolation: (violation) => {
    // Log to external service
    console.error('Security violation:', {
      type: violation.type,
      message: violation.message,
      severity: violation.severity,
      timestamp: violation.timestamp,
      ip: violation.ip,
      userAgent: violation.userAgent
    });
    
    // Send alert
    if (violation.severity === 'critical') {
      // Send critical alert
    }
  }
});
```

### Getting Security Statistics

```typescript
const stats = securityPlugin.getSecurityStats();
console.log('Security stats:', {
  uptime: stats.uptime,
  violationCount: stats.violationCount,
  timestamp: stats.timestamp
});
```

### Clearing Violations

```typescript
securityPlugin.clearSecurityViolations();
```

## Integration with Other Plugins

The Security Plugin works well with other SoapExpress plugins:

- **Health Check Plugin**: Automatically excludes `/health` from CSRF protection
- **Metrics Plugin**: Automatically excludes `/metrics` from CSRF protection
- **Any custom plugins**: Can be configured to exclude specific paths

## Security Best Practices

1. **Production Configuration**:
   - Set `exposeEndpoints: false` in production
   - Use strong CSRF secrets
   - Enable HTTPS-only cookies
   - Configure strict CORS policies

2. **Monitoring**:
   - Enable security monitoring
   - Set up custom violation handlers
   - Monitor security endpoints regularly
   - Log security violations

3. **Regular Updates**:
   - Keep the plugin updated
   - Review security configurations regularly
   - Test security features in staging

## Troubleshooting

### Common Issues

1. **CSRF Token Errors**: Ensure CSRF is properly configured and tokens are included in requests
2. **CORS Issues**: Check CORS configuration and allowed origins
3. **Rate Limiting**: Adjust rate limits if legitimate requests are being blocked
4. **Security Headers**: Verify headers are being set correctly

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
const securityPlugin = new SecurityPlugin({
  enableMonitoring: true,
  onViolation: (violation) => {
    console.log('Security violation detected:', violation);
  }
});
```

## API Reference

### SecurityPlugin Class

#### Constructor
```typescript
new SecurityPlugin(options?: Partial<SecurityPluginOptions>)
```

#### Methods

- `install(app: HttpApp<any>, context: PluginContext, options?: SecurityPluginOptions): void`
- `uninstall(app: HttpApp<any>): void`
- `beforeStart(app: HttpApp<any>): void`
- `afterStart(app: HttpApp<any>): void`
- `beforeStop(app: HttpApp<any>): void`
- `afterStop(app: HttpApp<any>): void`
- `getSecurityMiddleware(): SecurityMiddleware`
- `getSecurityStats(): any`
- `getConfig(): SecurityPluginOptions`
- `updateConfig(newConfig: Partial<SecurityPluginOptions>): void`
- `getSecurityViolations(): any[]`
- `clearSecurityViolations(): void`

#### Properties

- `name: string` - Plugin name
- `version: string` - Plugin version
- `description: string` - Plugin description
- `author: string` - Plugin author
- `category: string` - Plugin category
- `tags: string[]` - Plugin tags
- `config: SecurityPluginOptions` - Plugin configuration
