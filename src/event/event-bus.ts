/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * EventBus interface that defines methods for connecting, publishing, and subscribing to events.
 */
export interface EventBus {
  /**
   * Connects to the event bus.
   * @returns {Promise<void>} A promise that resolves when the connection is established.
   */
  connect(...args: unknown[]): Promise<void>;

  /**
   * Publishes an event with associated data to the event bus.
   * @param {string} event - The name of the event to publish.
   * @param {any} data - The data to associate with the event.
   * @returns {Promise<void>} A promise that resolves when the event has been published.
   */
  publish(event: string, data: any, ...args: unknown[]): Promise<void>;

  /**
   * Subscribes to an event with a handler to process the event data.
   * @param {string} event - The name of the event to subscribe to.
   * @param {(data: any) => void} handler - The handler function to process the event data.
   * @returns {Promise<void>} A promise that resolves when the subscription is established.
   */
  subscribe(event: string, handler: (data: any) => void): Promise<void>;
}
