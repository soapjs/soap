/* eslint-disable @typescript-eslint/no-explicit-any */

import { Route } from "./route";

export type WebFrameworkMethods<T = unknown> = {
  post: (
    path: string | string[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
  put: (
    path: string | string[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
  patch: (
    path: string | string[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
  get: (
    path: string | string[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
  delete: (
    path: string | string[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
};

export abstract class Router {
  abstract mount(data: Route | Route[]);
  abstract configure(...args: unknown[]): void;
}
