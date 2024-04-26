/* eslint-disable @typescript-eslint/no-explicit-any */
import { MiddlewareProvider } from "../middleware-provider";
import { WebFrameworkMiddleware } from "../../web-framework";
import { RateLimiter, RateLimiterOptions } from "./rate-limiter";

/**
 * Provides middleware for rate limiting.
 */
export class RateLimiterMiddlewareProvider implements MiddlewareProvider {
  /**
   * Creates an instance of RateLimiterMiddlewareProvider.
   * @param {RateLimiter} limiter - The rate limiter instance to use for middleware.
   */
  constructor(private limiter: RateLimiter) {}

  /**
   * Gets the middleware for rate limiting based on the provided options.
   * @param {RateLimiterOptions} options - The options for rate limiting.
   * @returns {WebFrameworkMiddleware} - The middleware function for rate limiting.
   */
  public getMiddleware(options: RateLimiterOptions): WebFrameworkMiddleware {
    return (request, response, next) => {
      const isAllowed = this.limiter.checkRequest(request, options);
      if (isAllowed) {
        next();
      } else {
        response.status(429).send("Too Many Requests");
      }
    };
  }
}
