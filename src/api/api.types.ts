/* eslint-disable @typescript-eslint/no-explicit-any */
import { Socket } from "net";
import { RouteIO } from "./route-io";

export type RouteResponse<T = unknown> = {
  body?: T;
  status: number;
  type?: string;
  headers?: object;
  socket?: Socket;
};

export interface RouteRequest<
  BodyType = unknown,
  ParamsType = object,
  QueryType = unknown
> {
  body: BodyType;
  params: ParamsType;
  query: QueryType;
  headers: object;
  [key: string]: unknown;
}

export type RouteHooks = {
  pre?: <T = Request>(request: T) => unknown;
  post?: (output?: any) => unknown;
};

export type ValidationResult = {
  valid: boolean;
  message?: string;
  code?: number;
  errors?: string[];
};

export type CorsOptions = {
  origin?: string | string[] | RegExp;
  methods?: string | string[];
  headers?: string | string[];
  credentials?: boolean;
  exposedHeaders?: string | string[];
  maxAge?: number;
};

export type RateLimiterOptions = {
  maxRequests?: number;
  windowMs?: number;
  mandatory?: boolean;
};

export type ValidatorOptions = {
  validator: string;
  schema: any;
};

export type AuthOptions = {
  authenticator: string;
  type: string;
  secretOrKey?: string;
  algorithm?: string;
  issuer?: string;
  audience?: string | string[];
  tokenExpiresIn?: string | number;
  apiKeyHeader?: string;
  apiKeyQueryParam?: string;
};

export type RouteOptions = {
  io?: RouteIO;
  validator?: ValidatorOptions;
  authorization?: AuthOptions;
  cors?: CorsOptions;
  limiter?: RateLimiterOptions;
  middlewares?: RouteMiddleware[];
};

export type RouteCors = (...args: unknown[]) => any;
export type RouteValidator = (data: any, schema: any) => ValidationResult;
export type RouteAuthorization = (...args: unknown[]) => any;
export type RouteMiddleware = (...args: unknown[]) => any;

export type RouteHandler = (input?: any, ...args: unknown[]) => any;
