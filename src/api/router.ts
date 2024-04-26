/* eslint-disable @typescript-eslint/no-explicit-any */

import { Route } from "./route";

/**
 * Interface for the router.
 */
export interface Router {
  /**
   * Mounts a route or a set of routes.
   * @param data Route or set of routes to mount.
   */
  mount(data: Route | Route[]): void;

  /**
   * Configures the router.
   * @param args Configuration arguments.
   */
  configure(...args: unknown[]): void;
}
