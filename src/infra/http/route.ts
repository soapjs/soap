import { IO } from "../common";
import { AnyHandler, RouteAdditionalOptions, RequestMethod } from "./types";

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
   * @param {RequestMethod | RequestMethod[]} method - The HTTP RouteRequest method of the route.
   * @param {string | string[]} path - The path or paths of the route.
   * @param {AnyHandler} handler - The handler function for the route.
   * @param {RouteAdditionalOptions} [options] - Optional route configuration options.
   * @param {IO} [io] - Optional route input & output mappers.
   */
  constructor(
    public readonly method: RequestMethod | RequestMethod[],
    public readonly path: string | string[],
    public readonly handler: AnyHandler,
    public readonly options?: RouteAdditionalOptions,
    public readonly io?: IO
  ) {}
}

/**
 * Represents a GET route in the web framework.
 */
export class GetRoute extends Route {
  /**
   * Creates a new GetRoute instance.
   * @param {string | string[]} path - The path or paths of the route.
   * @param {AnyHandler} handler - The handler function for the route.
   * @param {RouteAdditionalOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: AnyHandler,
    public readonly options?: RouteAdditionalOptions
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
   * @param {AnyHandler} handler - The handler function for the route.
   * @param {RouteAdditionalOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: AnyHandler,
    public readonly options?: RouteAdditionalOptions
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
   * @param {AnyHandler} handler - The handler function for the route.
   * @param {RouteAdditionalOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: AnyHandler,
    public readonly options?: RouteAdditionalOptions
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
   * @param {AnyHandler} handler - The handler function for the route.
   * @param {RouteAdditionalOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: AnyHandler,
    public readonly options?: RouteAdditionalOptions
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
   * @param {AnyHandler} handler - The handler function for the route.
   * @param {RouteAdditionalOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: AnyHandler,
    public readonly options?: RouteAdditionalOptions
  ) {
    super("DELETE", path, handler, options);
  }
}

/**
 * Represents a ALL route in the web framework.
 */
export class AllRoute extends Route {
  /**
   * Creates a new AllRoute instance.
   * @param {string | string[]} path - The path or paths of the route.
   * @param {AnyHandler} handler - The handler function for the route.
   * @param {RouteAdditionalOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: AnyHandler,
    public readonly options?: RouteAdditionalOptions
  ) {
    super("ALL", path, handler, options);
  }
}

/**
 * Represents a HEAD route in the web framework.
 */
export class HeadRoute extends Route {
  /**
   * Creates a new HeadRoute instance.
   * @param {string | string[]} path - The path or paths of the route.
   * @param {AnyHandler} handler - The handler function for the route.
   * @param {RouteAdditionalOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: AnyHandler,
    public readonly options?: RouteAdditionalOptions
  ) {
    super("HEAD", path, handler, options);
  }
}

/**
 * Represents a OPTIONS route in the web framework.
 */
export class OptionsRoute extends Route {
  /**
   * Creates a new OptionsRoute instance.
   * @param {string | string[]} path - The path or paths of the route.
   * @param {AnyHandler} handler - The handler function for the route.
   * @param {RouteAdditionalOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: AnyHandler,
    public readonly options?: RouteAdditionalOptions
  ) {
    super("OPTIONS", path, handler, options);
  }
}

/**
 * Represents a TRACE route in the web framework.
 */
export class TraceRoute extends Route {
  /**
   * Creates a new TraceRoute instance.
   * @param {string | string[]} path - The path or paths of the route.
   * @param {AnyHandler} handler - The handler function for the route.
   * @param {RouteAdditionalOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: AnyHandler,
    public readonly options?: RouteAdditionalOptions
  ) {
    super("TRACE", path, handler, options);
  }
}

/**
 * Represents a CONNECT route in the web framework.
 */
export class ConnectRoute extends Route {
  /**
   * Creates a new ConnectRoute instance.
   * @param {string | string[]} path - The path or paths of the route.
   * @param {AnyHandler} handler - The handler function for the route.
   * @param {RouteAdditionalOptions} [options] - Optional route configuration options.
   */
  constructor(
    public readonly path: string | string[],
    public readonly handler: AnyHandler,
    public readonly options?: RouteAdditionalOptions
  ) {
    super("CONNECT", path, handler, options);
  }
}
