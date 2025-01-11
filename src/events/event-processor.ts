import { DefaultEventProcessingStrategy } from "./defaults";
import { EventParsingError, EventValidationError } from "./errors";
import {
  EventBase,
  EventBus,
  EventProcessingStrategy,
  EventProcessorOptions,
} from "./types";

/**
 * A generic event processor for managing and processing messages from an event bus.
 * It supports customizable strategies for event processing and prioritization,
 * as well as retry handling, dead letter queue (DLQ) management, and graceful shutdown.
 *
 * @template EventIdType - The type of the event identifier.
 * @template PayloadType - The type of the message payload.
 */
export class EventProcessor<
  PayloadType = unknown,
  HeadersType = Record<string, unknown>,
  EventIdType = string
> {
  private isShuttingDown = false;
  private processingQueue: EventBase<PayloadType, HeadersType>[] = [];
  private activeHandlers = 0;

  /**
   * Constructs an `EventProcessor` instance.
   *
   * @param {EventBus<PayloadType, HeadersType, EventIdType>} eventBus - The event bus instance to subscribe to and publish messages.
   * @param {EventProcessorOptions<PayloadType, HeadersType>} options - Configuration options for the processor.
   */
  constructor(
    private readonly eventBus: EventBus<PayloadType, HeadersType, EventIdType>,
    private readonly options: EventProcessorOptions<PayloadType, HeadersType>
  ) {}

  /**
   * Starts processing events from the specified event topic.
   *
   * @param {EventIdType} event - The event identifier to subscribe to.
   * @param {(payload: PayloadType) => Promise<void>} handler - The handler function to process the event payload.
   * @returns {Promise<void>} A promise that resolves when the subscription is established.
   */
  async start(
    event: EventIdType,
    handler: (payload: PayloadType) => Promise<void>
  ): Promise<void> {
    const strategy =
      this.options.processingStrategy ||
      new DefaultEventProcessingStrategy<PayloadType, HeadersType>();

    const maxParallelism = this.options.maxParallelism || 1;

    await this.eventBus.subscribe(event, async (rawEvent) => {
      if (this.isShuttingDown) return;
      this.processingQueue.push(rawEvent);
      this.processNext(strategy, handler, maxParallelism);
    });
  }

  /**
   * Processes the next message in the queue.
   *
   * @private
   * @param {EventProcessingStrategy<PayloadType, HeadersType>} strategy - The strategy to process the event message.
   * @param {(payload: PayloadType) => Promise<void>} handler - The handler function to process the event payload.
   * @param {number} maxParallelism - The maximum number of concurrent message handlers.
   * @returns {Promise<void>} A promise that resolves when processing is complete.
   */
  private async processNext(
    strategy: EventProcessingStrategy<PayloadType, HeadersType>,
    handler: (payload: PayloadType) => Promise<void>,
    maxParallelism: number
  ): Promise<void> {
    if (
      this.activeHandlers >= maxParallelism ||
      this.processingQueue.length === 0
    ) {
      return;
    }

    const event = this.processingQueue.shift();
    if (!event) {
      return;
    }

    this.activeHandlers++;

    try {
      await strategy.process(event, handler);
      this.options.callbacks?.onSuccess?.(event);
    } catch (error) {
      await this.handleError(event, error);
    } finally {
      this.activeHandlers--;
      this.processNext(strategy, handler, maxParallelism);
    }
  }

  /**
   * Handles errors during message processing.
   *
   * @private
   * @param {EventBase<PayloadType, HeadersType>} event - The event that caused the error.
   * @param {Error} error - The error that occurred.
   * @returns {Promise<void>} A promise that resolves when error handling is complete.
   */
  private async handleError(
    event: EventBase<PayloadType, HeadersType>,
    error: Error
  ): Promise<void> {
    if (event.error) {
      console.error("Event already has an error. Skipping retry:", event.error);
    } else if (
      error instanceof EventValidationError ||
      error instanceof EventParsingError
    ) {
      console.error("Non-retriable error:", error.message);
      event.error = error; // Attach error to the event
    } else {
      this.options.callbacks?.onError?.(error, event);

      if (this.options.dlq?.enabled) {
        await this.eventBus.publish(this.options.dlq.topic as EventIdType, {
          ...event,
          error,
        });
      }
    }
  }

  /**
   * Shuts down the processor gracefully, ensuring all in-progress handlers complete.
   *
   * @returns {Promise<void>} A promise that resolves when the processor is fully shut down.
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    await this.waitForActiveHandlers();
    await this.eventBus.disconnect();
    this.options.callbacks?.onClose?.();
  }

  /**
   * Waits for all active handlers to complete.
   *
   * @private
   * @returns {Promise<void>} A promise that resolves when there are no active handlers.
   */
  private async waitForActiveHandlers(): Promise<void> {
    while (this.activeHandlers > 0) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}
