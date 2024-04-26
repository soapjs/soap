/* eslint-disable @typescript-eslint/no-explicit-any */
import { MiddlewareProvider } from "../middleware-provider";
import { WebFrameworkMiddleware } from "../../web-framework";
import { Auth, AuthOptions } from "./auth";

/**
 * Provides middleware for authentication.
 */
export class AuthMiddlewareProvider implements MiddlewareProvider {
  /**
   * Creates an instance of AuthMiddlewareProvider.
   * @param {Auth} auth - The authentication instance to use for middleware.
   */
  constructor(private auth: Auth) {}

  /**
   * Gets the middleware for authentication based on the provided options.
   * @param {AuthOptions} options - The options for authentication.
   * @returns {WebFrameworkMiddleware} - The middleware function for authentication.
   */
  public getMiddleware(options: AuthOptions): WebFrameworkMiddleware {
    return (request, response, next) => {
      const isAuthenticated = this.auth.authenticate(request, options);
      if (isAuthenticated) {
        next();
      } else {
        response.status(401).send("Unauthorized");
      }
    };
  }
}
