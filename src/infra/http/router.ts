import { Route } from "./route";
import { RouteGroup } from "./route.group";

/**
 * Router interface.
 */
export interface Router {
  /**
   * Optional prefix for the API routes.
   * @type {string}
   */
  readonly prefix?: string;
  /**
   * Optional version prefix for the router. If provided, each route path will be prefixed with this value (e.g., 'v1').
   * If not provided, routes will not be prefixed.
   * @type {string}
   */
  readonly apiVersion?: string;

  /**
   * Initializes the router with required components.
   * @param args Configuration arguments.
   */
  initialize(...args: unknown[]);

  /**
   * Sets up the routes for the router.
   * @param args Configuration arguments.
   */
  setupRoutes(...args: unknown[]): void;

  /**
   * Reloads all routes, clearing cache and reloading dynamically.
   */
  reloadRoutes(...args: unknown[]): Promise<void>;

  /**
   * Mounts a route or a set of routes.
   * @param data Route or set of routes to mount.
   */
  mount(data: Route | Route[] | RouteGroup | RouteGroup[]);
}

export const isRouter = (value: any): value is Router => {
  return value && 
  typeof value === 'object' &&
  typeof value.mount === 'function' &&
  typeof value.prefix === 'string' &&
  typeof value.apiVersion === 'string' &&
  typeof value.initialize === 'function' &&
  typeof value.setupRoutes === 'function' &&
  typeof value.reloadRoutes === 'function';
};