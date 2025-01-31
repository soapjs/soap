/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Middleware interface for initializing and using middleware functions.
 *
 * @interface Middleware
 */
export interface Middleware {
  readonly name: string;
  /**
   * Indicates whether the middleware can be applied dynamically on specific routes.
   * If true, the middleware can be configured and applied at the route level without
   * requiring global initialization.
   *
   * @type {boolean}
   * @readonly
   */
  readonly isDynamic: boolean;
  /**
   * Optional initialization method for the middleware.
   *
   * @param {...any[]} args - Arguments required for initialization.
   * @returns {void | Promise<void>} - Can return void or a Promise that resolves to void.
   */
  init?(...args: any[]): void | Promise<void>;

  /**
   * Optional method to apply the middleware function.
   *
   * @param {...any[]} args - Arguments required to apply the middleware.
   * @returns {any} - Can return any type based on the middleware implementation.
   */
  use?(...args: any[]): any;

  /**
   * Optional cleanup function when middleware is removed.
   */
  destroy?(): Promise<void> | void;
}
