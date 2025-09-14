import { DefaultEventProcessingStrategy } from "./defaults";
import { EventParsingError, EventValidationError } from "./errors";
import {
  EventBase,
} from "./event-base";
import { EventBus } from "./event-bus";
import { EventProcessingStrategy, EventProcessorOptions } from "./types";

/**
 * A multi-handler event processor for managing and processing messages from an event bus.
 * It supports multiple event handlers with routing, customizable strategies for event processing,
 * retry handling, dead letter queue (DLQ) management, and graceful shutdown.
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
  private processingQueue: Array<{
    event: EventIdType;
    eventData: EventBase<PayloadType, HeadersType>;
    retryCount?: number;
  }> = [];
  private activeHandlers = 0;
  private eventHandlers = new Map<EventIdType, (event: EventBase<PayloadType, HeadersType>) => Promise<void>>();
  private isStarted = false;

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
   * Adds a handler for a specific event type.
   *
   * @param {EventIdType} event - The event identifier to handle.
   * @param {(event: EventBase<PayloadType, HeadersType>) => Promise<void>} handler - The handler function to process the event.
   * @returns {Promise<void>} A promise that resolves when the handler is registered.
   */
  async addHandler(
    event: EventIdType,
    handler: (event: EventBase<PayloadType, HeadersType>) => Promise<void>
  ): Promise<void> {
    this.eventHandlers.set(event, handler);
    
    // Subscribe to the event if processor is already started
    if (this.isStarted) {
      await this.subscribeToEvent(event);
    }
  }

  /**
   * Starts processing events for all registered handlers.
   *
   * @returns {Promise<void>} A promise that resolves when all subscriptions are established.
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      throw new Error("EventProcessor is already started");
    }

    this.isStarted = true;

    // Subscribe to all registered events
    for (const event of this.eventHandlers.keys()) {
      await this.subscribeToEvent(event);
    }
  }

  /**
   * Subscribes to a specific event.
   *
   * @private
   * @param {EventIdType} event - The event to subscribe to.
   * @returns {Promise<void>} A promise that resolves when the subscription is established.
   */
  private async subscribeToEvent(event: EventIdType): Promise<void> {
    const strategy =
      this.options.processingStrategy ||
      new DefaultEventProcessingStrategy<PayloadType, HeadersType>();

    const maxParallelism = this.options.maxParallelism || 1;

    await this.eventBus.subscribe(event, async (rawEvent) => {
      if (this.isShuttingDown || !this.isStarted) return;
      this.processingQueue.push({ event, eventData: rawEvent, retryCount: 0 });
      this.processNext(strategy, maxParallelism);
    });
  }

  /**
   * Processes the next message in the queue.
   *
   * @private
   * @param {EventProcessingStrategy<PayloadType, HeadersType>} strategy - The strategy to process the event message.
   * @param {number} maxParallelism - The maximum number of concurrent message handlers.
   * @returns {Promise<void>} A promise that resolves when processing is complete.
   */
  private async processNext(
    strategy: EventProcessingStrategy<PayloadType, HeadersType>,
    maxParallelism: number
  ): Promise<void> {
    if (
      this.activeHandlers >= maxParallelism ||
      this.processingQueue.length === 0
    ) {
      return;
    }

    const queueItem = this.processingQueue.shift();
    if (!queueItem) {
      return;
    }

    const { event, eventData, retryCount = 0 } = queueItem;
    const handler = this.eventHandlers.get(event);
    
    if (!handler) {
      console.warn(`No handler found for event: ${event}`);
      return;
    }

    this.activeHandlers++;

    try {
      await strategy.process(eventData, handler);
      this.options.callbacks?.onSuccess?.(eventData);
    } catch (error) {
      await this.handleError(queueItem, error);
    } finally {
      this.activeHandlers--;
      this.processNext(strategy, maxParallelism);
    }
  }

  /**
   * Handles errors during message processing with retry logic.
   *
   * @private
   * @param {Object} queueItem - The queue item containing event data and retry count.
   * @param {Error} error - The error that occurred.
   * @returns {Promise<void>} A promise that resolves when error handling is complete.
   */
  private async handleError(
    queueItem: { event: EventIdType; eventData: EventBase<PayloadType, HeadersType>; retryCount?: number },
    error: Error
  ): Promise<void> {
    const { event, eventData, retryCount = 0 } = queueItem;
    const maxRetries = this.options.retries ?? 3;

    // Non-retriable errors
    if (
      error instanceof EventValidationError ||
      error instanceof EventParsingError
    ) {
      console.error("Non-retriable error:", error.message);
      eventData.error = error;
      this.options.callbacks?.onError?.(error, eventData);
      return;
    }

    // Call onError callback for every error (not just after max retries)
    this.options.callbacks?.onError?.(error, eventData);

    // Check if we should retry
    if (retryCount < maxRetries) {
      const nextRetryCount = retryCount + 1;
      const delay = this.calculateRetryDelay(retryCount);
      
      console.log(`Retrying event ${event} (attempt ${nextRetryCount}/${maxRetries}) after ${delay}ms`);
      
      // Call onRetry callback
      this.options.callbacks?.onRetry?.(error, eventData, nextRetryCount);
      
      // Schedule retry
      setTimeout(() => {
        if (!this.isShuttingDown) {
          this.processingQueue.push({
            event,
            eventData,
            retryCount: nextRetryCount
          });
          this.processNext(
            this.options.processingStrategy || new DefaultEventProcessingStrategy<PayloadType, HeadersType>(),
            this.options.maxParallelism || 1
          );
        }
      }, delay);
    } else {
      // Max retries exceeded
      console.error(`Max retries (${maxRetries}) exceeded for event ${event}:`, error.message);
      eventData.error = error;

      // Send to DLQ if enabled
      if (this.options.dlq?.enabled) {
        await this.eventBus.publish(this.options.dlq.topic as EventIdType, {
          ...eventData,
          error,
        });
      }
    }
  }

  /**
   * Calculates the delay for the next retry attempt.
   *
   * @private
   * @param {number} retryCount - The current retry count (0-based).
   * @returns {number} The delay in milliseconds.
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.options.retryDelay ?? 1000;
    const backoff = this.options.backoff ?? { type: "exponential", multiplier: 2, jitter: true };

    let delay: number;

    if (backoff.type === "exponential") {
      const multiplier = backoff.multiplier ?? 2;
      delay = baseDelay * Math.pow(multiplier, retryCount);
    } else {
      delay = baseDelay;
    }

    // Apply max delay limit
    if (backoff.maxDelay && delay > backoff.maxDelay) {
      delay = backoff.maxDelay;
    }

    // Apply jitter if enabled
    if (backoff.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(0, Math.floor(delay));
  }

  /**
   * Removes a handler for a specific event type.
   *
   * @param {EventIdType} event - The event identifier to remove handler for.
   * @returns {Promise<void>} A promise that resolves when the handler is removed.
   */
  async removeHandler(event: EventIdType): Promise<void> {
    this.eventHandlers.delete(event);
    // Note: We don't unsubscribe from EventBus as it might be used by other handlers
  }

  /**
   * Gets all registered event types.
   *
   * @returns {EventIdType[]} Array of registered event types.
   */
  getRegisteredEvents(): EventIdType[] {
    return Array.from(this.eventHandlers.keys());
  }

  /**
   * Checks if a handler is registered for the given event.
   *
   * @param {EventIdType} event - The event identifier to check.
   * @returns {boolean} True if handler is registered, false otherwise.
   */
  hasHandler(event: EventIdType): boolean {
    return this.eventHandlers.has(event);
  }

  /**
   * Resets the processor state without shutting down.
   * Clears the processing queue and resets internal state.
   *
   * @returns {Promise<void>} A promise that resolves when reset is complete.
   */
  async reset(): Promise<void> {
    if (this.isStarted) {
      throw new Error("Cannot reset while processor is running. Call shutdown() first.");
    }

    // Clear processing queue
    this.processingQueue = [];
    this.activeHandlers = 0;
    this.isShuttingDown = false;
  }

  /**
   * Restarts the processor after shutdown.
   * Equivalent to calling shutdown() followed by start().
   *
   * @returns {Promise<void>} A promise that resolves when restart is complete.
   */
  async restart(): Promise<void> {
    if (this.isStarted) {
      await this.shutdown();
    }

    // Wait a bit to ensure clean shutdown
    await new Promise(resolve => setTimeout(resolve, 100));

    await this.start();
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
    
    // Reset state to allow restart
    this.isStarted = false;
    this.isShuttingDown = false;
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
