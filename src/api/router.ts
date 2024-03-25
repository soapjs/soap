import { Route } from "./route";

type WebFrameworkMethods<T = unknown> = {
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

export interface Router {
  mount(data: Route | Route[]);
  configure(...args: unknown[]): void;
}
