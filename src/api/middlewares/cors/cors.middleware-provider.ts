/* eslint-disable @typescript-eslint/no-explicit-any */
import { MiddlewareProvider } from "../middleware-provider";
import { WebFrameworkMiddleware } from "../../web-framework";
import { Cors, CorsOptions } from "./cors";

/**
 * Provides middleware for Cross-Origin Resource Sharing (CORS).
 */
export class CorsMiddlewareProvider implements MiddlewareProvider {
  /**
   * Creates an instance of CorsMiddlewareProvider.
   * @param {Cors} cors - The CORS instance to use for middleware.
   */
  constructor(private cors: Cors) {}

  /**
   * Gets the middleware for Cross-Origin Resource Sharing (CORS) based on the provided options.
   * @param {CorsOptions} options - The options for CORS.
   * @returns {WebFrameworkMiddleware} - The middleware function for CORS.
   */
  public getMiddleware(options: CorsOptions): WebFrameworkMiddleware {
    return (request, response, next) => {
      this.cors.apply(request, response, options);
      next();
    };
  }
}
