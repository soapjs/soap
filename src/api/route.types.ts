/* eslint-disable @typescript-eslint/no-explicit-any */
import { RouteIO } from "./route-io";
import { Result, UnknownObject } from "../architecture";
import { ValidationOptions } from "./middlewares/validation.middleware";
import { Middleware } from "./middlewares";
import { HttpError } from "./api.errors";
import { Route } from "./route";

export interface RouteResponse {
  status(code: number): RouteResponse;
  end(...args: any[]): void;
  send(body?: any): any;
  sendFile(content?: any): any;
  json(body?: any): any;
  setHeader(name: string, value: string): any;
  getHeader(name: string): string | string[] | undefined;
  removeHeader(name: string): any;
  locals: any;
  [key: string]: any;
}

export interface RouteRequest<
  BodyType = any,
  ParamsType = any,
  QueryType = any
> {
  body: BodyType;
  params: ParamsType;
  query: QueryType;
  headers: any;
  method: string;
  path: string;
  url: string;
  ip: string;
  hostname: string;
  protocol: string;
  secure: boolean;
  cookies: any;
  signedCookies: any;
  get(field: string): string | undefined;
  [key: string]: any;
}

/**
 * Represents options for rate limiting.
 */
export type RouteRateLimitOptions = {
  maxRequests?: number; // Maximum number of requests allowed within the specified window.
  windowMs?: number; // The time window in milliseconds during which the maximum number of requests are allowed.
  mandatory?: boolean; // Whether rate limiting is mandatory.
  [key: string]: any;
};

/**
 * Represents options for Cross-Origin Resource Sharing (CORS).
 */
export type RouteCorsOptions = {
  origin?: string | string[] | RegExp; // Allowed origins for CORS.
  methods?: string | string[]; // Allowed HTTP methods for CORS.
  headers?: string | string[]; // Allowed headers for CORS.
  credentials?: boolean; // Whether credentials are allowed for CORS.
  exposedHeaders?: string | string[]; // Exposed headers for CORS.
  maxAge?: number; // Maximum age for CORS preflight requests.
  [key: string]: any;
};

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
 * Represents options for authentication.
 */
export type RouteAuthOptions = {
  type?: string; // The type of authentication.
  secretOrKey?: string; // The secret or key for authentication (optional).
  algorithm?: string; // The algorithm used for authentication (optional).
  issuer?: string; // The issuer for authentication (optional).
  audience?: string | string[]; // The audience for authentication (optional).
  tokenExpiresIn?: string | number; // Token expiration time for authentication (optional).
  tokenHeader?: string; // The header field for token authentication (optional).
  tokenQueryParam?: string; // The query parameter for token authentication (optional).
  apiKeyHeader?: string; // The header field for API key authentication (optional).
  apiKeyQueryParam?: string; // The query parameter for API key authentication (optional).
  [key: string]: any;
};

export type RouteRestrictionOptions = {
  authenticatedOnly?: boolean;
  authorizedOnly?: boolean;
  nonAuthenticatedOnly?: boolean;
  selfOnly?: boolean;
  [key: string]: any;
};

/**
 * Represents options for session.
 */
export type RouteSessionOptions = {
  secret?: string;
  resave?: boolean;
  saveUninitialized?: boolean;
  [key: string]: any;
};

export type RouteOptions = {
  version?: string;
  io?: RouteIO;
  validation?: ValidationOptions;
  auth?: RouteAuthOptions;
  restrictions?: RouteRestrictionOptions;
  cors?: RouteCorsOptions;
  rateLimit?: RouteRateLimitOptions;
  session?: RouteSessionOptions;
  compression?: RouteCompressionOptions;
  security?: RouteSecurityOptions;
  middlewares?: Middleware[];
};

export type AnyFunction<T = any> = (...args: any[]) => T;
export type ErrorHandler<T = Error> = (error: T, ...args: any[]) => any;
