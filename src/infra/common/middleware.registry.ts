/* eslint-disable @typescript-eslint/no-explicit-any */

import { MiddlewareFunction } from "./middleware.types";
import { Middleware } from "./middleware";
import { MiddlewareTools } from "./middleware.tools";

/**
 * Middleware registry for managing middleware instances.
 */
export class MiddlewareRegistry {
  private list: Map<
    string,
    { middleware: Middleware | MiddlewareFunction; ready: boolean }
  > = new Map();

  /**
   * Adds a middleware to the registry.
   * @param {Middleware | MiddlewareFunction} middleware - The middleware instance(s).
   * @param {boolean} ready - Specifies whether the middleware is already initialized.
   */
  protected addSingleMiddleware(
    middleware: Middleware | MiddlewareFunction,
    ready?: boolean
  ) {
    const name = MiddlewareTools.isMiddlewareFunction(middleware)
      ? middleware.name || "anonymousMiddleware"
      : middleware.name;

    this.list.set(name, {
      middleware,
      ready: MiddlewareTools.isMiddlewareFunction(middleware)
        ? true
        : ready || middleware.isDynamic,
    });
  }

  /**
   * Adds a middleware(s) to the registry.
   * @param {Middleware | Middleware[]} middleware - The middleware instance(s).
   * @param {boolean} ready - Specifies whether the middleware(s) is/are already initialized.
   */
  add(middleware: Middleware | Middleware[], ready?: boolean): void {
    if (Array.isArray(middleware)) {
      middleware.forEach((m) => {
        if (m) {
          this.addSingleMiddleware(m, ready);
        }
      });
    } else {
      if (middleware) {
        this.addSingleMiddleware(middleware, ready);
      }
    }
  }

  /**
   * Initializes a middleware if it is not already ready.
   * @param {string} name - The name or type of the middleware.
   * @param {...unknown[]} args - The arguments required for initialization.
   */
  init(name: string, ...args: unknown[]): void {
    const entry = this.list.get(name);
    if (typeof entry.middleware === "function") {
      entry.ready = true;
    } else if (!entry.ready && entry.middleware.init) {
      entry.middleware.init(...args);
      entry.ready = true;
    }
  }

  /**
   * Uses a middleware function, ensuring it is ready before use.
   * @param {string} name - The name or type of the middleware.
   * @param {...unknown[]} args - The arguments required to apply the middleware.
   * @returns {MiddlewareFunction} - The result of the middleware's use function.
   * @throws {Error} - If the middleware is not found or not ready.
   */
  use(name: string, ...args: unknown[]): MiddlewareFunction {
    const entry = this.list.get(name);

    if (!entry) {
      throw new Error(`Middleware ${name} not found`);
    }

    if (MiddlewareTools.isMiddlewareFunction(entry.middleware)) {
      return entry.middleware(...args);
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
  get(name: string, onlyReady = false): Middleware | MiddlewareFunction {
    const entry = this.list.get(name);

    if (
      MiddlewareTools.isMiddlewareFunction(entry?.middleware) ||
      (MiddlewareTools.isMiddlewareObject(entry?.middleware) &&
        ((onlyReady && entry?.ready) || !onlyReady))
    ) {
      return entry.middleware;
    }

    return null;
  }

  /**
   * Checks if the middleware is present in the registry.
   * @param {string} name - The name or type of the middleware.
   * @param {boolean} onlyReady - Return true only if it is ready.
   * @returns {boolean} - True if the middleware is found, false otherwise.
   */
  has(name: string, onlyReady = false): boolean {
    const entry = this.list.get(name);

    if (
      MiddlewareTools.isMiddlewareFunction(entry?.middleware) ||
      (MiddlewareTools.isMiddlewareObject(entry?.middleware) &&
        ((onlyReady && entry?.ready) || !onlyReady))
    ) {
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
    return MiddlewareTools.isMiddlewareFunction(entry?.middleware)
      ? true
      : Boolean(entry?.ready);
  }
}
