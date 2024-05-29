/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Interface representing an authentication strategy.
 */
export interface AuthStrategy {
  /**
   * Initializes the authentication strategy.
   * @param {...unknown[]} args - The arguments needed for initialization.
   */
  init(...args: unknown[]): any;
}
