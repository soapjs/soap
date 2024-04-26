import { RouteRequest, RouteResponse } from "../../route.types";

/**
 * Represents options for Cross-Origin Resource Sharing (CORS).
 */
export type CorsOptions = {
  origin?: string | string[] | RegExp; // Allowed origins for CORS.
  methods?: string | string[]; // Allowed HTTP methods for CORS.
  headers?: string | string[]; // Allowed headers for CORS.
  credentials?: boolean; // Whether credentials are allowed for CORS.
  exposedHeaders?: string | string[]; // Exposed headers for CORS.
  maxAge?: number; // Maximum age for CORS preflight requests.
};

/**
 * Interface representing Cross-Origin Resource Sharing (CORS) functionality.
 */
export interface Cors {
  /**
   * Applies CORS headers to the response based on the provided options.
   * @param {RouteRequest} request - The request to apply CORS headers to.
   * @param {RouteResponse} response - The response to apply CORS headers to.
   * @param {CorsOptions} options - The options for CORS.
   */
  apply(
    request: RouteRequest,
    response: RouteResponse,
    options: CorsOptions
  ): void;
}
/*
  const { origin, methods, headers, credentials, maxAge } = options;
  if (origin === "string") {
    response.setHeader("Access-Control-Allow-Origin", origin);
  } else if (Array.isArray(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin.join(","));
  } else if (origin instanceof RegExp) {
    response.setHeader("Access-Control-Allow-Origin", origin.source);
  } else {
    response.setHeader("Access-Control-Allow-Origin", "*");
  }

  if (Array.isArray(methods)) {
    response.setHeader("Access-Control-Allow-Methods", methods.join(","));
  }

  if (Array.isArray(headers)) {
    response.setHeader("Access-Control-Allow-Headers", headers.join(","));
  } else if (typeof headers === "string") {
    response.setHeader("Access-Control-Allow-Headers", headers);
  }

  if (typeof credentials === "boolean") {
    response.setHeader(
      "Access-Control-Allow-Credentials",
      `${credentials}`
    );
  }

  if (maxAge) {
    response.setHeader(
      "Access-Control-Allow-Credentials",
      maxAge.toString()
    );
  }
*/
