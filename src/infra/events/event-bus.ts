/* eslint-disable @typescript-eslint/no-explicit-any */

import { EventBase } from "./event-base";
import { BackoffOptions } from "./types";

/**
 * Represents the base structure of an event, including its message payload and headers.
 *
 * @template MessageType - The type of the message payload.
 * @template HeadersType - The type of the headers metadata (default: Record<string, unknown>).
 */
export interface EventBus<MessageType, HeadersType, EventIdType = string> {
  /**
   * Connects to the event bus.
   * @returns {Promise<void>} A promise that resolves when the connection is established.
   */
  connect(...args: unknown[]): Promise<void>;

  /**
   * Disconnects from the messaging system.
   *
   * @returns {Promise<void>} A promise that resolves when the disconnection is complete.
   */
  disconnect(): Promise<void>;

  /**
   * Checks the health status of the connection to the messaging system.
   *
   * @returns {Promise<boolean>} A promise that resolves to `true` if the connection is healthy, otherwise `false`.
   */
  checkHealth(): Promise<boolean>;

  /**
   * Publishes an event with associated data to the event bus.
   * @param {EventIdType} event - The name of the event to publish.
   * @param {EventBase<MessageType>} eventData - The data to associate with the event.
   * @returns {Promise<void>} A promise that resolves when the event has been published.
   */
  publish(
    event: EventIdType,
    eventData: EventBase<MessageType, HeadersType>,
    ...args: unknown[]
  ): Promise<void>;

  /**
   * Subscribes to an event with a handler to process the event data.
   * @param {EventIdType} event - The name of the event to subscribe to.
   * @param {(data: any) => void} handler - The handler function to process the event data.
   * @returns {Promise<void>} A promise that resolves when the subscription is established.
   */
  subscribe(
    event: EventIdType,
    handler: (data: EventBase<MessageType, HeadersType>) => void // Unified event base
  ): Promise<void>;

  /**
   * Unsubscribes from a previously registered event subscription.
   *
   * @param {string} subscriptionId - The ID of the subscription to unsubscribe from.
   * @returns {Promise<void>} A promise that resolves when the subscription is successfully removed.
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * Acknowledges the processing of a message.
   *
   * @param {string} messageId - The ID of the message to acknowledge.
   * @returns {Promise<void>} A promise that resolves when the message is acknowledged.
   */
  acknowledge?(messageId: string): Promise<void>;

  /**
   * Rejects a message and optionally requeues it for processing.
   *
   * @param {string} messageId - The ID of the message to reject.
   * @param {boolean} [requeue=false] - Whether to requeue the message for processing.
   * @returns {Promise<void>} A promise that resolves when the message is rejected.
   */
  reject?(messageId: string, requeue?: boolean): Promise<void>;

  /**
   * Configures the retry policy for operations (e.g., publish, subscribe).
   *
   * @param {number} retries - The maximum number of retries.
   * @param {number} delay - The delay (in milliseconds) between retries.
   * @param {BackoffOptions} [backoff] - Configuration for backoff strategy.
   */
  setRetryPolicy?(
    retries: number,
    delay: number,
    backoff?: BackoffOptions
  ): void;

  /**
   * Subscribes to events matching a specific pattern.
   *
   * @param {string} pattern - The pattern to match (e.g., `user.*`).
   * @param {(eventId: EventIdType, event: EventBase<MessageType, HeadersType>) => void} handler - The handler function for matched events.
   * @returns {Promise<string>} A promise that resolves with a subscription ID.
   */
  subscribeToPattern?(
    pattern: string,
    handler: (
      eventId: EventIdType,
      event: EventBase<MessageType, HeadersType>
    ) => void
  ): Promise<string>;

  /**
   * Subscribes to an event with batch processing.
   *
   * @param {EventIdType} event - The name of the event to subscribe to.
   * @param {(events: EventBase<MessageType, HeadersType>[]) => void} handler - The handler function to process batches of event data.
   * @returns {Promise<string>} A promise that resolves with a subscription ID.
   */
  subscribeBatch?(
    event: EventIdType,
    handler: (events: EventBase<MessageType, HeadersType>[]) => void
  ): Promise<string>;
}
