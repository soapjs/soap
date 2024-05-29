/* eslint-disable @typescript-eslint/no-explicit-any */

import { SessionConfig } from "../config";
import { Middleware } from "./middleware";
import { RouteIO } from "./route-io";
import { RouteValidationOptions } from "./validation/validation.middleware";

/**
 * Represents options for rate limiting.
 *
 * @typedef {Object} RouteRateLimitOptions
 * @property {number} [maxRequests] - Maximum number of requests allowed within the specified window.
 * @property {number} [windowMs] - The time window in milliseconds during which the maximum number of requests are allowed.
 * @property {boolean} [mandatory] - Whether rate limiting is mandatory.
 * @property {Object.<string, any>} [key] - Additional properties.
 */
export type RouteRateLimitOptions = {
  maxRequests?: number;
  windowMs?: number;
  mandatory?: boolean;
  [key: string]: any;
};

/**
 * Represents options for Cross-Origin Resource Sharing (CORS).
 *
 * @typedef {Object} RouteCorsOptions
 * @property {string | string[] | RegExp} [origin] - Allowed origins for CORS.
 * @property {string | string[]} [methods] - Allowed HTTP methods for CORS.
 * @property {string | string[]} [headers] - Allowed headers for CORS.
 * @property {boolean} [credentials] - Whether credentials are allowed for CORS.
 * @property {string | string[]} [exposedHeaders] - Exposed headers for CORS.
 * @property {number} [maxAge] - Maximum age for CORS preflight requests.
 * @property {Object.<string, any>} [key] - Additional properties.
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
 * Represents options for response compression.
 *
 * @typedef {Object} RouteCompressionOptions
 * @property {number} [chunkSize] - The size of the chunks.
 * @property {AnyFunction} [filter] - A function to decide if the response should be compressed.
 * @property {number} [level] - The level of compression.
 * @property {number} [memLevel] - The memory level of compression.
 * @property {number} [strategy] - The compression strategy.
 * @property {number} [threshold] - The threshold for compression.
 * @property {number} [windowBits] - The window bits for compression.
 * @property {Object.<string, any>} [key] - Additional properties.
 */
export type RouteCompressionOptions = {
  chunkSize?: number;
  filter?: AnyFunction;
  level?: number;
  memLevel?: number;
  strategy?: number;
  threshold?: number;
  windowBits?: number;
  [key: string]: any;
};

/**
 * Represents options for security middleware.
 *
 * @typedef {Object} RouteSecurityOptions
 * @property {any} [contentSecurityPolicy] - Configuration for Content Security Policy.
 * @property {any} [crossOriginEmbedderPolicy] - Configuration for Cross-Origin Embedder Policy.
 * @property {any} [crossOriginOpenerPolicy] - Configuration for Cross-Origin Opener Policy.
 * @property {any} [crossOriginResourcePolicy] - Configuration for Cross-Origin Resource Policy.
 * @property {any} [originAgentCluster] - Configuration for Origin-Agent-Cluster.
 * @property {any} [referrerPolicy] - Configuration for Referrer Policy.
 * @property {Object.<string, any>} [key] - Additional properties.
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
 * Represents options for route restrictions.
 *
 * @typedef {Object} RouteRestrictionOptions
 * @property {boolean} [authenticatedOnly] - Whether the route is accessible only to authenticated users.
 * @property {boolean} [authorizedOnly] - Whether the route is accessible only to authorized users.
 * @property {boolean} [nonAuthenticatedOnly] - Whether the route is accessible only to non-authenticated users.
 * @property {boolean} [selfOnly] - Whether the route is accessible only to the user themselves.
 * @property {Object.<string, any>} [key] - Additional properties.
 */
export type RouteRestrictionOptions = {
  authenticatedOnly?: boolean;
  authorizedOnly?: boolean;
  nonAuthenticatedOnly?: boolean;
  selfOnly?: boolean;
  [key: string]: any;
};

/**
 * Represents options for session middleware.
 *
 * @typedef {Object} RouteSessionOptions
 * @property {string} [secret] - Secret key for signing the session ID cookie.
 * @property {boolean} [resave] - Forces the session to be saved back to the session store, even if it was never modified during the request.
 * @property {boolean} [saveUninitialized] - Forces a session that is "uninitialized" to be saved to the store.
 * @property {Object.<string, any>} [key] - Additional properties.
 */
export type RouteSessionOptions = SessionConfig;

/**
 * Represents options for authentication middleware.
 *
 * @typedef {Object} RouteAuthOptions
 * @property {string} [type] - Authentication type.
 * @property {Object.<string, any>} [key] - Additional properties.
 */
export type RouteAuthOptions = {
  type?: string;
  [key: string]: any;
};

/**
 * Represents options for a route, including various middleware configurations.
 *
 * @typedef {Object} RouteOptions
 * @property {RouteIO} [io] - Optional input/output configuration for the route.
 * @property {RouteAuthOptions} [auth] - Optional authentication options for the route.
 * @property {RouteValidationOptions} [validation] - Optional validation options for the route.
 * @property {RouteRestrictionOptions} [restrictions] - Optional restriction options for the route.
 * @property {RouteCorsOptions} [cors] - Optional CORS options for the route.
 * @property {RouteRateLimitOptions} [rateLimit] - Optional rate limiting options for the route.
 * @property {RouteSessionOptions} [session] - Optional session options for the route.
 * @property {RouteCompressionOptions} [compression] - Optional compression options for the route.
 * @property {RouteSecurityOptions} [security] - Optional security options for the route.
 * @property {Middleware[]} [middlewares] - Optional list of middleware functions for the route.
 */
export type RouteOptions = {
  io?: RouteIO;
  auth?: RouteAuthOptions;
  validation?: RouteValidationOptions;
  restrictions?: RouteRestrictionOptions;
  cors?: RouteCorsOptions;
  rateLimit?: RouteRateLimitOptions;
  session?: RouteSessionOptions;
  compression?: RouteCompressionOptions;
  security?: RouteSecurityOptions;
  middlewares?: (Middleware | AnyFunction)[];
};

/**
 * Represents a generic function.
 *
 * @typedef {Function} AnyFunction
 * @template T
 * @param {...any[]} args - Arguments passed to the function.
 * @returns {T} - The return value of the function.
 */
export type AnyFunction<T = any> = (...args: any[]) => T;

/**
 * Represents an error handler function.
 *
 * @typedef {Function} ErrorHandler
 * @template T
 * @param {T} error - The error object.
 * @param {...any[]} args - Additional arguments.
 * @returns {any} - The return value of the error handler.
 */
export type ErrorHandler<T = Error> = (error: T, ...args: any[]) => any;
