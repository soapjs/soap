/* eslint-disable @typescript-eslint/no-explicit-any */
import { Container } from "./container";

/**
 * Singleton class for managing dependencies using a container.
 */
export class Singleton {
  private static container: Container;
  /**
   * Binds a value to a key in the container.
   * @param {string} key - The key to bind the value to.
   * @param {any} value - The value to bind.
   */
  static bind(key: string, value: any) {
    if (!Singleton.container) {
      Singleton.container = new Container();
    }
    Singleton.container.bind(key, value);
  }
  /**
   * Retrieves the value bound to the specified key from the container.
   * Throws an error if the key is not found in the container.
   * @param {string} key - The key of the value to retrieve.
   * @returns {T} - The value bound to the key.
   * @throws {Error} - Throws an error if the key is not found in the container.
   */
  static get<T>(key: string): T {
    if (!Singleton.container || Singleton.container.has(key) === false) {
      throw new Error(`Dependency '${key}' not registered`);
    }
    return Singleton.container.get(key);
  }
}
