import { RouteRequest } from "../../route.types";

/**
 * Represents options for authentication.
 */
export type AuthOptions = {
  authenticator: string;  // The name of the authenticator.
  type: string;           // The type of authentication.
  secretOrKey?: string;   // The secret or key for authentication (optional).
  algorithm?: string;     // The algorithm used for authentication (optional).
  issuer?: string;        // The issuer for authentication (optional).
  audience?: string | string[];  // The audience for authentication (optional).
  tokenExpiresIn?: string | number;  // Token expiration time for authentication (optional).
  apiKeyHeader?: string;  // The header field for API key authentication (optional).
  apiKeyQueryParam?: string;  // The query parameter for API key authentication (optional).
};

/**
 * Abstract class representing authentication functionality.
 */
export abstract class Auth {
  /**
   * Initializes an authenticator of the specified type.
   * @param {string} type - The type of authenticator to initialize.
   */
  abstract initializeAuthenticator(type: string): void;

  /**
   * Checks if an authenticator of the specified type exists.
   * @param {string} type - The type of authenticator to check.
   * @returns {boolean} - True if the authenticator exists, false otherwise.
   */
  abstract hasAuthenticator(type: string): boolean;

  /**
   * Authenticates the request based on the provided options.
   * @param {RouteRequest} request - The request to authenticate.
   * @param {AuthOptions} options - The options for authentication.
   * @returns {boolean} - True if authentication is successful, false otherwise.
   */
  abstract authenticate(request: RouteRequest, options: AuthOptions): boolean;
}
