/**
 * Framework-agnostic API documentation fragment attached to a route.
 * Adapters (e.g. `@soapjs/soap-openapi`) may extend this with richer OpenAPI types.
 */
export interface ApiDocSecurityRef {
  name: string;
  scopes?: string[];
}

export interface ApiDocResponseRef {
  description: string;
  content?: Record<string, { schema?: unknown; example?: unknown }>;
  [key: string]: unknown;
}

export interface ApiDocFragment {
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  operationId?: string;
  requestBody?: unknown;
  parameters?: unknown[];
  responses?: Record<string, ApiDocResponseRef>;
  security?: ApiDocSecurityRef[];
  [key: string]: unknown;
}
