/* eslint-disable @typescript-eslint/no-explicit-any */

import { DIContainer } from "../../common";
import { IO, Middleware, MiddlewareFunction, MiddlewareRegistry } from "../common";
import { Route } from "./route";
import { RouteGroup } from "./route.group";
import { RouteRegistry } from "./route.registry";

/**
 * Enum representing different types of middleware.
 *
 * @enum {string}
 */
export enum MiddlewareType {
  Security = "security",
  Session = "session",
  Compression = "compression",
  Cors = "cors",
  RateLimit = "rate_limit",
  Validation = "validation",
  AuthenticatedOnly = "authenticated_only",
  AuthorizedOnly = "authenticated_only",
  NonAuthenticatedOnly = "non_authenticated_only",
  SelfOnly = "self_only",
}

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
  origin?: string | string[] | RegExp | boolean;
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

/**
 * Represents an authenticated user with basic identity and authorization information.
 * This interface defines the structure of user data that can be accessed in authenticated requests.
 * 
 * @interface AuthUser
 * @property {string | number} id - Unique identifier for the user
 * @property {string} [email] - User's email address (optional)
 * @property {string} [username] - User's username (optional)
 * @property {string[]} [roles] - Array of role names assigned to the user (optional)
 * @property {string[]} [permissions] - Array of permission strings granted to the user (optional)
 * @property {any} [key] - Additional custom properties can be added dynamically
 */
export interface AuthUser {
  id: string | number;
  email?: string;
  username?: string;
  roles?: string[];
  permissions?: string[];
  [key: string]: any;
}

/**
 * Extended request interface that includes authentication and session information.
 * This interface extends the base request object with user authentication data,
 * session information, and authorization details.
 * 
 * @interface AuthRequest
 * @property {AuthUser} [user] - Authenticated user information (optional)
 * @property {Object} [auth] - Authentication metadata (optional)
 * @property {string} [auth.token] - Authentication token (JWT, API key, etc.)
 * @property {string} [auth.type] - Type of authentication used (jwt, api_key, etc.)
 * @property {any} [auth.payload] - Decoded token payload or authentication data
 * @property {any} [session] - Session data object (optional)
 * @property {string} [sessionID] - Unique session identifier (optional)
 * @property {any} [key] - Additional custom properties can be added dynamically
 */
export interface AuthRequest {
  user?: AuthUser;
  auth?: {
    token?: string;
    type?: string;
    payload?: any;
  };
  session?: any;
  sessionID?: string;
  [key: string]: any;
}

/**
 * Enumeration of supported authentication types.
 * Defines the different authentication strategies that can be used in the application.
 * 
 * @enum {string} AuthType
 * @property {string} JWT - JSON Web Token authentication
 * @property {string} LOCAL - Local username/password authentication
 * @property {string} GOOGLE - Google OAuth authentication
 * @property {string} GITHUB - GitHub OAuth authentication
 * @property {string} FACEBOOK - Facebook OAuth authentication
 * @property {string} API_KEY - API key-based authentication
 * @property {string} SESSION - Session-based authentication
 * @property {string} BASIC - HTTP Basic authentication
 */
export enum AuthType {
  JWT = 'jwt',
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github',
  FACEBOOK = 'facebook',
  API_KEY = 'api_key',
  SESSION = 'session',
  BASIC = 'basic'
}

/**
 * Interface for defining authentication strategies.
 * This interface is used to implement custom authentication strategies that can be
 * integrated with the authentication system, typically using Passport.js.
 * 
 * @interface AuthStrategy
 * @property {string} name - Unique name identifier for the strategy
 * @property {Function} configure - Method to configure the strategy with Passport instance
 * @param {any} passport - Passport.js instance for configuration
 * @property {Function} middleware - Method that returns Express middleware for the strategy
 * @param {any} [options] - Optional configuration options for the middleware
 * @returns {any} Express middleware function
 * @property {Function} [serializeUser] - Optional method to serialize user data for sessions
 * @param {any} user - User object to serialize
 * @param {any} done - Callback function to call when serialization is complete
 * @property {Function} [deserializeUser] - Optional method to deserialize user data from sessions
 * @param {any} id - User identifier to deserialize
 * @param {any} done - Callback function to call when deserialization is complete
 */
export interface AuthStrategy {
  name: string;
  configure(passport: any): void;
  middleware(options?: any): any;
  serializeUser?(user: any, done: any): void;
  deserializeUser?(id: any, done: any): void;
}

/**
 * Configuration interface for the authentication system.
 * Defines the overall authentication setup including strategies, session configuration,
 * and default authentication method.
 * 
 * @interface AuthConfig
 * @property {AuthStrategy[]} strategies - Array of authentication strategies to use
 * @property {SessionConfig} [session] - Optional session configuration for session-based auth
 * @property {string} [defaultStrategy] - Optional name of the default authentication strategy
 */
export interface AuthConfig {
  strategies: AuthStrategy[];
  session?: SessionConfig;
  defaultStrategy?: string;
}

/**
 * Configuration interface for role-based access control (RBAC).
 * Defines authorization rules and permissions for different user roles and resources.
 * 
 * @interface RoleConfig
 * @property {boolean} [authenticatedOnly] - Whether only authenticated users can access the resource
 * @property {string[]} [allow] - Array of role names that are allowed to access the resource
 * @property {string[]} [deny] - Array of role names that are explicitly denied access
 * @property {boolean | Function} [selfOnly] - Whether users can only access their own resources
 * @param {AuthUser} user - The authenticated user
 * @param {string} resourceId - The ID of the resource being accessed
 * @returns {boolean} True if user can access the resource
 * @property {Function} [customCheck] - Custom authorization function for complex permission logic
 * @param {AuthUser} user - The authenticated user
 * @param {AuthRequest} req - The request object with additional context
 * @returns {boolean | Promise<boolean>} True if user is authorized, can be async
 */
export interface RoleConfig {
  authenticatedOnly?: boolean;
  allow?: string[];
  deny?: string[];
  selfOnly?: boolean | ((user: AuthUser, resourceId: string) => boolean);
  customCheck?: (user: AuthUser, req: AuthRequest) => boolean | Promise<boolean>;
}

/**
 * Comprehensive configuration interface for session management.
 * Supports multiple session stores (memory, Redis, MongoDB, file) with extensive
 * customization options for security, performance, and behavior.
 * 
 * @interface SessionConfig
 * @property {string} secret - Secret key used to sign session cookies (required)
 * @property {string} [name] - Name of the session cookie (default: 'connect.sid')
 * @property {'memory' | 'db' | 'file'} [store] - Type of session store to use
 * @property {Object} [cookie] - Cookie configuration options
 * @property {boolean} [cookie.secure] - Whether to send cookies only over HTTPS
 * @property {boolean} [cookie.httpOnly] - Whether to prevent client-side access to cookies
 * @property {number} [cookie.maxAge] - Maximum age of the cookie in milliseconds
 * @property {'strict' | 'lax' | 'none'} [cookie.sameSite] - SameSite attribute for CSRF protection
 * @property {string} [cookie.domain] - Domain for which the cookie is valid
 * @property {string} [cookie.path] - Path for which the cookie is valid
 * @property {boolean} [resave] - Whether to save session data even if not modified
 * @property {boolean} [saveUninitialized] - Whether to save uninitialized sessions
 * @property {boolean} [rolling] - Whether to reset expiration on each request
 * @property {'destroy' | 'keep'} [unset] - What to do when session is unset
 * 
 * @property {Object} [redis] - Redis store configuration
 * @property {string} [redis.url] - Redis connection URL
 * @property {string} [redis.host] - Redis server hostname
 * @property {number} [redis.port] - Redis server port
 * @property {string} [redis.password] - Redis server password
 * @property {number} [redis.db] - Redis database number
 * @property {string} [redis.prefix] - Prefix for session keys in Redis
 * 
 * @property {Object} [mongodb] - MongoDB store configuration
 * @property {string} [mongodb.url] - MongoDB connection URL
 * @property {string} [mongodb.collection] - MongoDB collection name for sessions
 * @property {number} [mongodb.touchAfter] - Interval in seconds to touch sessions
 * @property {number} [mongodb.ttl] - Time-to-live for sessions in seconds
 * 
 * @property {Object} [file] - File store configuration
 * @property {string} [file.path] - Directory path for storing session files
 * @property {number} [file.ttl] - Time-to-live for session files in seconds
 * @property {number} [file.reapInterval] - Interval in seconds to clean up expired sessions
 * 
 * @property {Function} [genid] - Function to generate unique session IDs
 * @returns {string} Unique session identifier
 * @property {boolean} [proxy] - Whether to trust proxy headers
 * @property {number} [touchAfter] - Interval in seconds to touch sessions
 */
export interface SessionConfig {
  secret: string;
  name?: string;
  store?: 'memory' | 'db' | 'file';
  cookie?: {
    secure?: boolean;
    httpOnly?: boolean;
    maxAge?: number;
    sameSite?: 'strict' | 'lax' | 'none';
    domain?: string;
    path?: string;
  };
  resave?: boolean;
  saveUninitialized?: boolean;
  rolling?: boolean;
  unset?: 'destroy' | 'keep';
  
  // Store-specific options
  redis?: {
    url?: string;
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    prefix?: string;
  };
  
  mongodb?: {
    url?: string;
    collection?: string;
    touchAfter?: number;
    ttl?: number;
  };
  
  file?: {
    path?: string;
    ttl?: number;
    reapInterval?: number;
  };
  
  // Security options
  genid?: () => string;
  proxy?: boolean;
  touchAfter?: number;
}

// Generic HTTP context interfaces for framework abstraction
export interface HttpRequest {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  query?: Record<string, any>;
  params?: Record<string, any>;
  files?: any;
  cookies?: Record<string, string>;
  secure?: boolean;
  ip?: string;
  memoryInfo?: any;
  connection?: { remoteAddress?: string };
  [key: string]: any;
}

export interface HttpResponse {
  status(code: number): HttpResponse;
  json(data: any): HttpResponse;
  cookie(name: string, value: string, options?: any): HttpResponse;
  setHeader(name: string, value: string): HttpResponse;
  locals?: Record<string, any>;
  [key: string]: any;
}

export interface HttpContext {
  req: HttpRequest;
  res: HttpResponse;
  next: () => void;
}

export interface RouteMetadata {
  method: RequestMethod;
  path: string;
  middlewares: MiddlewareMetadata[];
  useCase?: any;
  routeIO?: IO;
  handler?: AnyHandler;
  options?: RouteAdditionalOptions;
}

export interface MiddlewareMetadata {
  type: string;
  options: any;
  order: number;
  middleware?: any;
}

export interface ControllerMetadata {
  basePath: string;
  middlewares: MiddlewareMetadata[];
  type?: 'http' | 'websocket';
  options?: {
    apiDoc?: {
      tags?: string[];
      description?: string;
      externalDocs?: {
        description?: string;
        url: string;
      };
      responses?: Record<string, any>;
      parameters?: any[];
      summary?: string;
      deprecated?: boolean;
      operationId?: string;
      examples?: Record<string, any>;
      security?: any[];
    };
  };
}

export interface PluginLifecycle {
  install<Framework>(app: HttpApp<Framework>, options?: any): Promise<void>;
  uninstall?<Framework>(app: HttpApp<Framework>): void;
  beforeStart?<Framework>(app: HttpApp<Framework>): void;
  afterStart?<Framework>(app: HttpApp<Framework>): void;
  beforeStop?<Framework>(app: HttpApp<Framework>): void;
  afterStop?<Framework>(app: HttpApp<Framework>): void;
  gracefulShutdown?<Framework>(app: HttpApp<Framework>, signals?: string[]): Promise<void>;
}

export interface PluginMetadata {
  name: string;
  version?: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  peerDependencies?: string[];
  tags?: string[];
  category?: string;
}

export interface HttpPlugin extends PluginLifecycle, PluginMetadata {
  middleware?: MiddlewareMetadata[];
  routes?: RouteMetadata[];
  config?: Record<string, any>;
  installed?: boolean;
  enabled?: boolean;
  
  install<Framework>(app: HttpApp<Framework>, options?: any): Promise<void>;
}

export interface PluginRegistry {
  register(plugin: HttpPlugin): void;
  unregister(pluginName: string): void;
  get(pluginName: string): HttpPlugin | undefined;
  list(): HttpPlugin[];
  install<Framework>(app: HttpApp<Framework>, pluginName: string, options?: any): Promise<void>;
  isInstalled(pluginName: string): boolean;
  getInstalled(): HttpPlugin[];
}

export interface PluginManager {
  usePlugin(plugin: HttpPlugin, options?: any): void;
  listPlugins(): HttpPlugin[];
  getPlugin(pluginName: string): HttpPlugin | undefined;
  isPluginLoaded(pluginName: string): boolean;
}

export interface HttpApp<Framework = any> {
  start(port: number): Promise<void>;
  stop(): Promise<void>;
  gracefulShutdown(signals?: string[]): Promise<void>;
  getApp(): Framework;
  getServer<T>(): T;
  getRouteRegistry(): RouteRegistry;
  getMiddlewareRegistry(): MiddlewareRegistry;
  getContainer(): DIContainer;
  register(...item: (Route | RouteGroup)[]): this;
  useMiddleware(...middlewares: Middleware[]): this;
  usePlugin(plugin: HttpPlugin, options?: any): this;
  getPlugin(pluginName: string): HttpPlugin | undefined;
  listPlugins(): HttpPlugin[];
  isDevelopment(): boolean;
  isProduction(): boolean;
  isTest(): boolean;
  isStaging(): boolean;
}
  