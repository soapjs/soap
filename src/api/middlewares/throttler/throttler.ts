import { RouteRequest } from "../../route.types";

/**
 * Represents options for throttling requests.
 */
export type ThrottlerOptions = {
  maxRequestsPerSecond?: number; // Maximum number of requests per second allowed for a client.
  maxRequestsPerMinute?: number; // Maximum number of requests per minute allowed for a client.
  resetTimeMs?: number; // The time limit in milliseconds after which request counters are reset.
  identifier?: string; // Optional identifier for the client, useful for applying restrictions at the user level.
  eventHandlers?: {
    // Optional event handlers for handling events such as limit exceeded.
    onLimitExceeded?: (identifier: string) => void; // Handler for when the request limit is exceeded.
  };
};

/**
 * Interface representing throttling functionality.
 */
export interface Throttler {
  /**
   * Checks if a request is allowed based on the provided options.
   * @param {RouteRequest} request - The request to check.
   * @param {ThrottlerOptions} options - The options for throttling.
   * @returns {boolean} - Whether the request is allowed (true) or not (false).
   */
  checkRequest(request: RouteRequest, options: ThrottlerOptions): boolean;
}
