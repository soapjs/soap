// Main security exports
export { 
  SecurityMiddleware, 
  createSecurityMiddleware, 
  createSecurityEndpoints,
  createExpressSecurityEndpoints 
} from './security-middleware';
export { 
  SecurityHeadersMiddleware, 
  createSecurityHeadersMiddleware, 
  securityPresets 
} from './headers-middleware';
export { 
  CSRFMiddleware, 
  createCSRFMiddleware, 
  createCSRFTokenEndpoint,
  createExpressCSRFTokenEndpoint 
} from './csrf-middleware';
export { 
  SanitizationMiddleware, 
  createSanitizationMiddleware, 
  createSecurityViolationsEndpoint,
  createExpressSecurityViolationsEndpoint 
} from './sanitization-middleware';

// Types
export type {
  SecurityConfig,
  SecurityHeadersConfig,
  CSRFConfig,
  InputSanitizationConfig,
  SecurityContext,
  SecurityViolation,
} from './types';

// Utilities
export {
  generateCSRFToken,
  hashToken,
  verifyCSRFToken,
  sanitizeHtml,
  escapeHtml,
  escapeSql,
  preventPathTraversal,
  validateMimeType,
  validateFileSize,
  defaultSecurityConfig,
  defaultSecurityHeadersConfig,
  defaultCSRFConfig,
  defaultInputSanitizationConfig
} from './types';
