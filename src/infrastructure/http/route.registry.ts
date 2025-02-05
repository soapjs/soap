import { Route } from "./route";
import { RouteGroup } from "./route.group";
import { RequestMethod } from "./types";

/**
 * RouteRegistry is a central registry for managing API routes and route groups.
 * It allows registering, retrieving, and organizing routes efficiently.
 *
 * The registry supports both individual routes and grouped routes,
 * enabling developers to structure their API endpoints logically.
 */
export class RouteRegistry {
  private static groups = new Map<string, RouteGroup>();
  private static routes = new Map<string, Map<string, Route>>();

  /**
   * Registers a route group in the registry.
   * All routes within the group will be automatically registered.
   *
   * @param {RouteGroup} group - The route group to be registered.
   */
  private static registerGroup(group: RouteGroup): void {
    this.groups.set(group.path, group);
    group.routes.forEach((route) => {
      this.registerRoute(route);
    });
  }

  /**
   * Registers a single route in the registry.
   *
   * @param {Route} route - The route to be registered.
   */
  private static registerRoute(route: Route): void {
    if (Array.isArray(route.path)) {
      route.path.forEach((path) => {
        const routeByMetod = this.routes.get(path);

        if (routeByMetod) {
          routeByMetod.set(`${route.method}`, route);
        } else {
          this.routes.set(
            path,
            new Map<string, Route>([[`${route.method}`, route]])
          );
        }
      });
    } else {
      const routeByMetod = this.routes.get(route.path);

      if (routeByMetod) {
        routeByMetod.set(`${route.method}`, route);
      } else {
        this.routes.set(
          route.path,
          new Map<string, Route>([[`${route.method}`, route]])
        );
      }
    }
  }

  /**
   * Registers a route or a route group.
   * If a route group is provided, all contained routes will be registered.
   *
   * @param {Route | RouteGroup} item - The route or route group to register.
   */
  public static register(item: Route | RouteGroup): void {
    if (item instanceof RouteGroup) {
      this.registerGroup(item);
    } else {
      this.registerRoute(item);
    }
  }

  /**
   * Retrieves all registered route groups.
   *
   * @returns {RouteGroup[]} An array of all registered route groups.
   */
  public static getAllGroups(): RouteGroup[] {
    return Array.from(this.groups.values());
  }

  /**
   * Retrieves all registered routes.
   *
   * @returns {Route[]} An array of all registered routes.
   */
  public static getAllRoutes(): Route[] {
    const routes: Route[] = [];
    this.routes.forEach((map) => {
      routes.push(...map.values());
    });

    return routes;
  }

  /**
   * Retrieves a specific route group by its path.
   *
   * @param {string} path - The path of the route group.
   * @returns {RouteGroup | undefined} The matching route group or `undefined` if not found.
   */
  public static getGroup(path: string): RouteGroup | undefined {
    return this.groups.get(path);
  }

  /**
   * Retrieves a specific route by its path.
   *
   * @param {RequestMethod | RequestMethod[]} method - The HTTP RouteRequest method of the route.
   * @param {string} path - The path of the route.
   * @returns {Route | undefined} The matching route or `undefined` if not found.
   */
  public static getRoute(
    method: RequestMethod | RequestMethod[],
    path: string
  ): Route | undefined {
    return this.routes.get(path)?.get(`${method}`);
  }

  /**
   * Clears all registered routes and groups.
   * Useful for dynamic reloading or resetting the registry.
   */
  public static clear(): void {
    this.routes.clear();
    this.groups.clear();
  }
}
