/* eslint-disable @typescript-eslint/no-explicit-any */

import { Middleware } from "./middleware";
import { AnyFunction } from "../route.types";

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
  middlewares: AnyFunction[];

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

/**
 * Interface representing an authentication strategy.
 */
export interface AuthStrategy {
  /**
   * Initializes the authentication strategy.
   * @param {...unknown[]} args - The arguments needed for initialization.
   */
  initialize(...args: unknown[]): void;

  /**
   * Authenticates a request.
   * @param {...unknown[]} args - The arguments needed for authentication.
   * @returns {any} Middleware function for authentication.
   */
  authenticate(...args: unknown[]): any;

  /**
   * Gets the routes required for this authentication strategy.
   * @returns {AuthRoute[]} An array of routes.
   */
  getRoutes(): AuthRoute[];
}

/**
 * Interface representing an authentication module.
 */
export interface AuthModule {
  /**
   * A dictionary of authentication strategies by name.
   * @type {{ [key: string]: AuthStrategy }}
   */
  strategies: Map<string, AuthStrategy>;

  /**
   * Adds a new authentication strategy to the module.
   * @param {string} name - The name of the strategy.
   * @param {AuthStrategy} strategy - The strategy to add.
   */
  addStrategy(name: string, strategy: AuthStrategy): void;

  /**
   * Gets an authentication strategy by name.
   * @param {string} name - The name of the strategy.
   * @returns {AuthStrategy | undefined} The authentication strategy, or undefined if not found.
   */
  getStrategy(name: string): AuthStrategy | undefined;

  /**
   * Gets the middleware for a specific authentication strategy.
   * @param {string} name - The name of the strategy.
   * @returns {any} The middleware function.
   */
  getMiddleware(name: string): any;

  /**
   * Gets all routes required for all registered authentication strategies.
   * @returns {AuthRoute[]} An array of routes.
   */
  getRoutes(): AuthRoute[];
}
/**
 * Middleware class for managing authentication using different strategies.
 */
export class AuthMiddleware implements Middleware {
  /**
   * Creates an instance of AuthMiddleware.
   * @param {AuthModule} authModule - The authentication module.
   */
  constructor(protected authModule: AuthModule) {}

  /**
   * Uses the specified authentication strategy.
   * @param {string} strategyName - The name of the strategy to use.
   * @param {...unknown[]} args - The arguments needed for authentication.
   * @returns {any} Middleware function for the specified strategy.
   * @throws {Error} If the strategy is not found.
   */
  use(strategyName: string, ...args: unknown[]) {
    const strategy = this.authModule.getStrategy(strategyName);
    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }
    return strategy.authenticate(...args);
  }
}
