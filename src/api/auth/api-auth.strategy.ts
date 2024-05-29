import { AuthStrategy } from "../../auth";
import { AuthMiddlewareRegistry } from "./auth-middleware-registry";
import { AuthRouteRegistry } from "./auth-route-registry";

export interface ApiAuthStrategy extends AuthStrategy {
  /**
   * A map of middleware used by the authentication strategy.
   * @type {Map<string, Middleware>}
   */
  middlewares: AuthMiddlewareRegistry;

  /**
   * A map of routes used by the authentication strategy.
   * @type {AuthRouteRegistry}
   */
  routes: AuthRouteRegistry;
}
