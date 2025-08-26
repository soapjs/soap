/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Represents the configuration for a specific route in SoapExpress.
 */
export type RouteConfig = {
  /**
   * The path of the route (e.g., "/auth/login").
   */
  path: string;

  /**
   * The HTTP method for the route.
   */
  method:
    | "PUT"
    | "POST"
    | "GET"
    | "DELETE"
    | "PATCH"
    | "CONNECT"
    | "HEAD"
    | "OPTIONS"
    | "TRACE"
    | "ALL";
} & RouteAdditionalOptions;

export type RouteAdditionalOptions = {
  /**
   * Cross-Origin Resource Sharing (CORS) options.
   */
  cors?: RouteCorsOptions;

  /**
   * Security options, such as Content Security Policy (CSP).
   */
  security?: RouteSecurityOptions;

  /**
   * Rate limiting options for the route.
   */
  rateLimit?: RouteRateLimitOptions;

  /**
   * Validation options for request payloads.
   */
  validation?: RouteValidationOptions;

  /**
   * Session management configuration.
   */
  session?: {
    /**
     * Defines the session storage type.
     */
    store?: "memory" | "file" | "db";

    /**
     * The duration of the session in seconds.
     */
    duration?: number;

    [key: string]: any;
  };

  /**
   * Caching configuration for route responses.
   */
  cache?: {
    /**
     * The cache expiration time in seconds.
     */
    ttl: number;

    /**
     * The cache storage type.
     */
    store?: "memory" | "db" | "file";

    [key: string]: any;
  };

  /**
   * Logging configuration for incoming requests.
   */
  logging?: {
    /**
     * The log level.
     */
    level?: "info" | "debug" | "warn" | "error";

    /**
     * A list of headers to exclude from logs.
     */
    excludeHeaders?: string[];

    [key: string]: any;
  };

  /**
   * Analytics configuration for request tracking.
   */
  analytics?: {
    /**
     * The analytics provider.
     */
    provider?: string;

    /**
     * A list of routes to exclude from tracking.
     */
    excludeRoutes?: string[];

    [key: string]: any;
  };

  /**
   * Audit logging configuration for tracking user actions.
   */
  audit?: {
    /**
     * Specifies where to store audit logs.
     */
    store?: "db" | "file";

    /**
     * Fields to redact in the logs (e.g., passwords).
     */
    redactFields?: string[];

    [key: string]: any;
  };

  /**
   * Role-based access control settings.
   */
  roles?: {
    /**
     * Whether the route requires authentication.
     * If `true`, only authenticated users can access the route.
     * Defaults to `false` (public access).
     */
    authenticatedOnly?: boolean;

    /**
     * A list of roles allowed to access this route.
     */
    allow?: string[];

    /**
     * A list of roles denied access to this route.
     */
    deny?: string[];

    /**
     * If set to `true`, only the owner of the resource can access it.
     */
    selfOnly?: boolean | AnyHandler;

    [key: string]: any;
  };

  /**
   * Middleware configuration for the route.
   */
  middlewares?: {
    /**
     * Middleware functions to execute before the main handler.
     */
    pre?: MiddlewareFunction[];

    /**
     * Middleware functions to execute after the main handler.
     */
    post?: MiddlewareFunction[];

    [key: string]: any;
  };

  /**
   * Response compression options.
   */
  compression?: RouteCompressionOptions;

  [key: string]: unknown;
};

/**
 * Represents the configuration for all routes in the application.
 */
export type RoutesConfig = {
  login?: RouteConfig;
  logout?: RouteConfig;
  refresh?: RouteConfig;
  [key: string]: RouteConfig | undefined;
};

/**
 * Represents a generic middleware function.
 */
export type MiddlewareFunction = (...args: any[]) => any;

/**
 * Represents options for response compression.
 *
 * @typedef {Object} RouteCompressionOptions
 * @property {number} [chunkSize] - The size of the chunks.
 * @property {AnyFilter} [filter] - A function to decide if the response should be compressed.
 * @property {number} [level] - The level of compression.
 * @property {number} [memLevel] - The memory level of compression.
 * @property {number} [strategy] - The compression strategy.
 * @property {number} [threshold] - The threshold for compression.
 * @property {number} [windowBits] - The window bits for compression.
 * @property {Object.<string, any>} [key] - Additional properties.
 */
export type RouteCompressionOptions = {
  chunkSize?: number;
  filter?: AnyFilter;
  level?: number;
  memLevel?: number;
  strategy?: number;
  threshold?: number;
  windowBits?: number;
  [key: string]: any;
};

/**
 * Configuration for Cross-Origin Resource Sharing (CORS).
 */
export type RouteCorsOptions = {
  origin?: string | string[] | RegExp;
  methods?: string | string[];
  headers?: string | string[];
  credentials?: boolean;
  exposedHeaders?: string | string[];
  maxAge?: number;
  [key: string]: any;
};

/**
 * Security options for HTTP headers and policies.
 */
export type RouteSecurityOptions = {
  contentSecurityPolicy?: any;
  crossOriginEmbedderPolicy?: any;
  crossOriginOpenerPolicy?: any;
  crossOriginResourcePolicy?: any;
  originAgentCluster?: any;
  referrerPolicy?: any;
  [key: string]: any;
};

/**
 * Configuration for rate limiting requests.
 */
export type RouteRateLimitOptions = {
  maxRequests?: number;
  windowMs?: number;
  [key: string]: any;
};

/**
 * Validation options for request payloads.
 */
export type ValidationOptions = {
  /**
   * The name of the validator to be used.
   */
  validator?: string;
  schema?: any;
  [key: string]: any;
};

/**
 * Route validation options.
 */
export type RouteValidationOptions = {
  request?: ValidationOptions;
  response?: ValidationOptions;
};

/**
 * Represents a generic handler.
 *
 * @typedef {Function} AnyHandler
 * @template T
 * @param {...any[]} args - Arguments passed to the handler.
 * @returns {T} - The return value of the handler.
 */
export type AnyHandler<T = any> = (...args: any[]) => T;
export type AnyFilter = AnyHandler;
export type HandlerResult<T = unknown> = {
  content?: T;
  error?: Error;
};

export type RequestMethod =
  | "PUT"
  | "POST"
  | "GET"
  | "DELETE"
  | "PATCH"
  | "CONNECT"
  | "HEAD"
  | "OPTIONS"
  | "TRACE"
  | "ALL";
