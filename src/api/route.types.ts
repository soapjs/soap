/* eslint-disable @typescript-eslint/no-explicit-any */
import { RouteIO } from "./route-io";
import { Result } from "../architecture";
import { WebFrameworkMiddleware } from "./web-framework";
import { AuthOptions } from "./middlewares/auth/auth";
import { CorsOptions } from "./middlewares/cors/cors";
import { RateLimiterOptions } from "./middlewares/rate-limiter/rate-limiter";
import { ThrottlerOptions } from "./middlewares/throttler/throttler";
import { ValidationOptions } from "./middlewares/validation/validation";

export interface RouteResponse {
  status(code: number): RouteResponse;
  end(...args: any[]): void;
  send(body?: any): void;
  json(body?: any): void;
  setHeader(name: string, value: string): void;
  getHeader(name: string): string | string[] | undefined;
  removeHeader(name: string): void;
  locals: any;
  [key: string]: any;
}

export interface RouteRequest<
  BodyType = unknown,
  ParamsType = object,
  QueryType = object
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

export type RouteOptions = {
  io?: RouteIO;
  validation?: ValidationOptions;
  auth?: AuthOptions;
  cors?: CorsOptions;
  limiter?: RateLimiterOptions;
  throttler?: ThrottlerOptions;
  middlewares?: WebFrameworkMiddleware[];
};

export type RouteHandler<T = any> = (...args: unknown[]) => Result<T>;
export type AnyFunction<T = any> = (...args: any[]) => T;
