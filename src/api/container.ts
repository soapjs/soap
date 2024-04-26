/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Simple container implementation for dependency injection.
 */
export class Container {
  private container: Map<string, any> = new Map();

  /**
   * Binds a value to a key in the container.
   * @param {string} key - The key to bind the value to.
   * @param {any} value - The value to bind.
   */
  public bind(key: string, value: any) {
    this.container.set(key, value);
  }

  /**
   * Checks if the container has a value bound to the specified key.
   * @param {string} key - The key to check.
   * @returns {boolean} - True if the key is present in the container, false otherwise.
   */
  public has(key: string): boolean {
    return this.container.has(key);
  }

  /**
   * Retrieves the value bound to the specified key from the container.
   * @param {string} key - The key of the value to retrieve.
   * @returns {T | undefined} - The value bound to the key, or undefined if the key is not found.
   */
  public get<T>(key: string): T {
    return this.container.get(key);
  }
}
