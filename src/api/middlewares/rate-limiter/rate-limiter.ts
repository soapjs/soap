import { RouteRequest } from "../../route.types";

/**
 * Represents options for rate limiting.
 */
export type RateLimiterOptions = {
  maxRequests?: number; // Maximum number of requests allowed within the specified window.
  windowMs?: number; // The time window in milliseconds during which the maximum number of requests are allowed.
  mandatory?: boolean; // Whether rate limiting is mandatory.
};

/**
 * Interface representing rate limiting functionality.
 */
export interface RateLimiter {
  /**
   * Checks if a request is allowed based on the provided options.
   * @param {RouteRequest} request - The request to check.
   * @param {RateLimiterOptions} options - The options for rate limiting.
   * @returns {boolean} - True if the request is allowed, false otherwise.
   */
  checkRequest(request: RouteRequest, options: RateLimiterOptions): boolean;
}
