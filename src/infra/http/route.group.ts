import { join } from "path";
import { Route } from "./route";
import { RouteAdditionalOptions } from "./types";
import { IO } from "../common";

const normalizePath = (path: string): string => path.replace(/\/+/g, "/");

/**
 * RouteGroup is a container for organizing multiple routes under a common prefix.
 * It allows applying shared options (e.g., security, rate limiting, middleware) 
 * to all routes within the group.
 *
 * This is useful for grouping related API endpoints, such as `/users` or `/products`.
 */
export class RouteGroup {
  /**
   * Creates a new RouteGroup instance.
   *
   * @param {string} path - The base path for all routes in the group (e.g., "/users").
   * @param {RouteAdditionalOptions} [options={}] - Optional settings applied to all routes in the group.
   * @param {Route[]} [_routes=[]] - An initial set of routes within the group.
   */
  constructor(
    public readonly path: string,
    public readonly options: RouteAdditionalOptions = {},
    public readonly io?: IO,
    private _routes: Route[] = []
  ) {}

  /**
   * Adds a route to the group, automatically adjusting its path.
   *
   * @param {Route} route - The route to be added to the group.
   */
  public add(route: Route) {
    const paths: string[] = [];

    if (Array.isArray(route.path)) {
      route.path.reduce((arr, path) => {
        arr.push(normalizePath(join(this.path, path)));
        return arr;
      }, paths);
    } else {
      paths.push(normalizePath(join(this.path, route.path)));
    }

    const options = route.options
      ? { ...this.options, ...route.options }
      : this.options;
    this._routes.push(
      new Route(
        route.method,
        paths,
        route.handler,
        options,
        route.io || this.io
      )
    );
  }

  /**
   * Retrieves all routes within the group.
   *
   * @returns {Route[]} An array of routes that belong to this group.
   */
  get routes(): Route[] {
    return [...this._routes];
  }
}
