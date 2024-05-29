/* eslint-disable @typescript-eslint/no-explicit-any */

import { Logger } from "../common";
import { AnyFunction } from "./route.types";
import { Middleware } from "./middleware";

/**
 * Enum representing different types of middleware.
 *
 * @enum {string}
 */
export enum MiddlewareType {
  Security = "security",
  Session = "session",
  Compression = "compression",
  Cors = "cors",
  RateLimit = "rate_limit",
  Validation = "validation",
  AuthenticatedOnly = "authenticated_only",
  AuthorizedOnly = "authenticated_only",
  NonAuthenticatedOnly = "non_authenticated_only",
  SelfOnly = "self_only",
}

/**
 * Middleware registry for managing middleware instances.
 */
export class MiddlewareRegistry {
  private list: Map<string, { middleware: Middleware; ready: boolean }> =
    new Map();

  /**
   * Creates an instance of MiddlewareRegistry.
   * @param {Logger} logger - Logger instance for logging messages.
   */
  constructor(private logger: Logger) {}

  /**
   * Adds a middleware to the registry.
   * @param {Middleware} middleware - The middleware instance(s).
   * @param {boolean} ready - Specifies whether the middleware is already initialized.
   */
  protected addSingleMiddleware(middleware: Middleware, ready?: boolean) {
    if (this.list.has(middleware.name)) {
      this.logger.warn(
        `[Override Warning] Middleware named ${middleware.name} found`
      );
    }
    this.list.set(middleware.name, {
      middleware,
      ready: ready || middleware.isDynamic,
    });
  }

  /**
   * Adds a middleware(s) to the registry.
   * @param {Middleware | Middleware[]} middleware - The middleware instance(s).
   * @param {boolean} ready - Specifies whether the middleware(s) is/are already initialized.
   */
  add(middleware: Middleware | Middleware[], ready?: boolean): void {
    if (Array.isArray(middleware)) {
      middleware.forEach((m) => this.addSingleMiddleware(m, ready));
    } else {
      this.addSingleMiddleware(middleware, ready);
    }
  }

  /**
   * Initializes a middleware if it is not already ready.
   * @param {string} name - The name or type of the middleware.
   * @param {...unknown[]} args - The arguments required for initialization.
   */
  init(name: string, ...args: unknown[]): void {
    const entry = this.list.get(name);
    if (entry && !entry.ready && entry.middleware.init) {
      entry.middleware.init(...args);
      entry.ready = true;
    }
  }

  /**
   * Uses a middleware function, ensuring it is ready before use.
   * @param {string} name - The name or type of the middleware.
   * @param {...unknown[]} args - The arguments required to apply the middleware.
   * @returns {AnyFunction} - The result of the middleware's use function.
   * @throws {Error} - If the middleware is not found or not ready.
   */
  use(name: string, ...args: unknown[]): AnyFunction {
    const entry = this.list.get(name);

    if (!entry) {
      throw new Error(`Middleware ${name} not found`);
    }

    if (!entry.ready) {
      throw new Error(`Middleware ${name} not ready`);
    }

    return entry.middleware.use(...args);
  }

  /**
   * Returns the middleware if present in the registry.
   * @param {string} name - The name or type of the middleware.
   * @param {boolean} onlyReady - Return middleware only if it is ready.
   * @returns {Middleware}
   */
  get(name: string, onlyReady = false): Middleware {
    const entry = this.list.get(name);
    if (entry?.middleware && ((onlyReady && entry?.ready) || !onlyReady)) {
      return entry.middleware;
    }
  }

  /**
   * Checks if the middleware is present in the registry.
   * @param {string} name - The name or type of the middleware.
   * @param {boolean} onlyReady - Return true only if it is ready.
   * @returns {boolean} - True if the middleware is found, false otherwise.
   */
  has(name: string, onlyReady = false): boolean {
    const entry = this.list.get(name);
    if (entry?.middleware && ((onlyReady && entry?.ready) || !onlyReady)) {
      return true;
    }

    return false;
  }

  /**
   * Checks if the middleware is ready to use.
   * @param {string} name - The name or type of the middleware.
   * @returns {boolean} - True if the middleware is found and ready, false otherwise.
   */
  isReady(name: string): boolean {
    const entry = this.list.get(name);
    return entry && entry.ready;
  }
}
