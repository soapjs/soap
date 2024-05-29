import { AnyFunction } from "..";

/**
 * Represents a route used for authentication purposes.
 */
export type AuthRoute = {
  /**
   * The path of the route.
   * @type {string}
   */
  path: string;

  /**
   * The HTTP method for the route (e.g., 'get', 'post').
   * @type {string}
   */
  method: string;

  /**
   * Array of middleware functions to be applied to the route.
   * @type {AnyFunction[]}
   */
  middlewares?: AnyFunction[];

  /**
   * The handler function for the route.
   * @type {AnyFunction}
   */
  handler: AnyFunction;

  /**
   * Additional properties that may be used in the route.
   * @type {Object}
   */
  [key: string]: unknown;
};
