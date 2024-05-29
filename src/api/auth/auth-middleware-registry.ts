import { Middleware } from "../middleware";

export abstract class AuthMiddlewareRegistry {
  /**
   * A map of middleware used by the authentication strategy.
   * @type {Map<string, Middleware>}
   */
  protected middlewares = new Map<string, Middleware>();

  /**
   * Retrieves middleware(s) based on the provided filter.
   *
   * @param {string | { onlyGlobal?: boolean; onlyDynamic?: boolean }} [filter] - The filter to apply.
   * @returns {Middleware | Middleware[] | undefined} The middleware(s) that match the filter.
   */
  getMiddlewares(
    filter?: string | { onlyGlobal?: boolean; onlyDynamic?: boolean }
  ): Middleware | Middleware[] | undefined {
    if (!filter) {
      return Array.from(this.middlewares.values());
    }

    if (typeof filter === "string") {
      return this.middlewares.get(filter);
    }

    if (filter?.onlyGlobal) {
      return Array.from(this.middlewares.values()).filter(
        (middleware) => middleware.isDynamic === false
      );
    }

    if (filter?.onlyDynamic) {
      return Array.from(this.middlewares.values()).filter(
        (middleware) => middleware.isDynamic
      );
    }
  }

  setMiddleware(name: string, middleware: Middleware) {
    this.middlewares.set(name, middleware);
  }
}
