/* eslint-disable @typescript-eslint/no-explicit-any */
import { MiddlewareProvider } from "../middleware-provider";
import { WebFrameworkMiddleware } from "../../web-framework";
import { Throttler, ThrottlerOptions } from "./throttler";

/**
 * Provides middleware for throttling requests.
 */
export class ThrottlerMiddlewareProvider implements MiddlewareProvider {
  /**
   * Constructs a new ThrottlerMiddlewareProvider.
   * @param {Throttler} throttler - The throttler instance to be used for request throttling.
   */
  constructor(private throttler: Throttler) {}

  /**
   * Gets the middleware function for throttling requests.
   * @param {ThrottlerOptions} options - The options for throttling.
   * @returns {WebFrameworkMiddleware} - The middleware function for throttling requests.
   */
  public getMiddleware(options: ThrottlerOptions): WebFrameworkMiddleware {
    return (request, response, next) => {
      const isAllowed = this.throttler.checkRequest(request, options);
      if (isAllowed) {
        next();
      } else {
        response.status(429).send("Too Many Requests");
      }
    };
  }
}
