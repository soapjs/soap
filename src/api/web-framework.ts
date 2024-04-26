/* eslint-disable @typescript-eslint/no-explicit-any */

import { RouteRequest, RouteResponse } from "./route.types";

export interface WebFrameworkMiddleware {
  (
    request: RouteRequest,
    response: RouteResponse,
    next?: () => void
  ): void | Promise<void>;
}

export type WebFrameworkMethods<T = unknown> = {
  post: (
    path: string | string[],
    middlewares: WebFrameworkMiddleware[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
  put: (
    path: string | string[],
    middlewares: WebFrameworkMiddleware[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
  patch: (
    path: string | string[],
    middlewares: WebFrameworkMiddleware[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
  get: (
    path: string | string[],
    middlewares: WebFrameworkMiddleware[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
  delete: (
    path: string | string[],
    middlewares: WebFrameworkMiddleware[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
};
