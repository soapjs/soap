import { RequestMethod } from "./api.enums";
import { RouteHandler, RouteOptions } from "./route.types";

/**
 * Represents a route in the web framework.
 */
export class Route {
  /**
   * Mounts the route on the specified server.
   * @template ServerType, RequestType, ResponseType
   * @param {ServerType} app - The server instance to mount the route on.
   * @param {Route} route - The route instance to be mounted.
   * @returns {ServerType} The modified server instance with the mounted route.
   */

  /**
   * Creates a new Route instance.
   * @param {RequestMethod} method - The HTTP RouteRequest method of the route.
   * @param {string | string[]} path - The path or paths of the route.
   * @param {RouteHandler} handler - The handler function for the route.
   * @param {RouteOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly method: RequestMethod,
    public readonly path: string | string[],
    public readonly handler: RouteHandler,
    public readonly options?: RouteOptions
  ) {}
}

/**
 * Represents a GET route in the web framework.
 */
export class GetRoute extends Route {
  /**
   * Creates a new GetRoute instance.
   * @param {string | string[]} path - The path or paths of the route.
   * @param {RouteHandler} handler - The handler function for the route.
   * @param {RouteOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: RouteHandler,
    public readonly options?: RouteOptions
  ) {
    super("GET", path, handler, options);
  }
}

/**
 * Represents a POST route in the web framework.
 */
export class PostRoute extends Route {
  /**
   * Creates a new PostRoute instance.
   * @param {string | string[]} path - The path or paths of the route.
   * @param {RouteHandler} handler - The handler function for the route.
   * @param {RouteOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: RouteHandler,
    public readonly options?: RouteOptions
  ) {
    super("POST", path, handler, options);
  }
}

/**
 * Represents a PATCH route in the web framework.
 */
export class PatchRoute extends Route {
  /**
   * Creates a new PatchRoute instance.
   * @param {string | string[]} path - The path or paths of the route.
   * @param {RouteHandler} handler - The handler function for the route.
   * @param {RouteOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: RouteHandler,
    public readonly options?: RouteOptions
  ) {
    super("PATCH", path, handler, options);
  }
}

/**
 * Represents a PUT route in the web framework.
 */
export class PutRoute extends Route {
  /**
   * Creates a new PutRoute instance.
   * @param {string | string[]} path - The path or paths of the route.
   * @param {RouteHandler} handler - The handler function for the route.
   * @param {RouteOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: RouteHandler,
    public readonly options?: RouteOptions
  ) {
    super("PUT", path, handler, options);
  }
}

/**
 * Represents a DELETE route in the web framework.
 */
export class DeleteRoute extends Route {
  /**
   * Creates a new DeleteRoute instance.
   * @param {string | string[]} path - The path or paths of the route.
   * @param {RouteHandler} handler - The handler function for the route.
   * @param {RouteOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: RouteHandler,
    public readonly options?: RouteOptions
  ) {
    super("DELETE", path, handler, options);
  }
}
