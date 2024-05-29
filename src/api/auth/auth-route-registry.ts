import { AuthRoute } from "./auth.route";

export class AuthRouteRegistry {
  /**
   * A map of routes used by the authentication strategy.
   * @type {Map<string, AuthRoute>}
   */
  protected routes = new Map<string, AuthRoute>();

  getRoutes(): AuthRoute[] {
    return Array.from(this.routes.values());
  }

  getRoute(filter?: string): AuthRoute | undefined {
    if (typeof filter === "string") {
      return this.routes.get(filter);
    }
  }

  setRoute(name: string, route: AuthRoute) {
    return this.routes.set(name, route);
  }
}
