import { EventBase } from "./event-base";
import { EventBus } from "./event-bus";
import { ExternalEvent } from "./external-event";

/**
 * Options for configuring the EventDispatcher.
 */
export interface EventDispatcherOptions {
  /**
   * Maximum number of retry attempts for failed dispatches.
   * Default: 3
   */
  maxRetries?: number;
  
  /**
   * Delay between retries in milliseconds.
   * Default: 1000
   */
  retryDelay?: number;
  
  /**
   * Whether to enable exponential backoff for retries.
   * Default: false
   */
  exponentialBackoff?: boolean;
  
  /**
   * Callbacks for monitoring dispatch operations.
   */
  callbacks?: {
    onSuccess?: (externalEvent: ExternalEvent) => void;
    onError?: (error: Error, externalEvent: ExternalEvent) => void;
    onRetry?: (event: string, attempt: number, error: Error) => void;
  };
  
  /**
   * Custom correlation ID generator function.
   * Default: uses crypto.randomUUID() or Math.random()
   */
  correlationIdGenerator?: () => string;
  
  /**
   * Custom timestamp generator function.
   * Default: uses new Date().toISOString()
   */
  timestampGenerator?: () => string;
}

export class EventDispatcher {
  private readonly options: Required<EventDispatcherOptions>;

  constructor(
    private readonly eventBus: EventBus<unknown, Record<string, unknown>, string>,
    options: EventDispatcherOptions = {}
  ) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      exponentialBackoff: options.exponentialBackoff ?? false,
      callbacks: options.callbacks ?? {},
      correlationIdGenerator: options.correlationIdGenerator ?? generateCorrelationId,
      timestampGenerator: options.timestampGenerator ?? (() => new Date().toISOString()),
    };
  }

  /**
   * Dispatches an external event to the event bus.
   * Automatically attaches default headers like correlation ID and timestamp.
   * Includes retry logic and error handling.
   */
  async dispatch(externalEvent: ExternalEvent): Promise<void> {
    // Validate inputs
    this.validateDispatchInputs(externalEvent);

    const enrichedHeaders: Record<string, unknown> = {
      eventId: externalEvent.id,
      eventType: externalEvent.type,
      correlationId: externalEvent.correlationId,
      causationId: externalEvent.causationId,
      source: externalEvent.source,
      destination: externalEvent.destination,
      timestamp: externalEvent.timestamp.toISOString(),
      ...externalEvent.metadata
    };

    const eventBase: EventBase<unknown, Record<string, unknown>> = {
      message: externalEvent.data,
      headers: enrichedHeaders,
    };

    await this.dispatchWithRetry(eventBase, externalEvent);
  }

  /**
   * Dispatches an event with retry logic.
   */
  private async dispatchWithRetry(
    eventBase: EventBase<unknown, Record<string, unknown>>,
    externalEvent: ExternalEvent
  ): Promise<void> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        await this.eventBus.publish(externalEvent.type, eventBase);
        this.options.callbacks.onSuccess?.(externalEvent);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === this.options.maxRetries) {
          this.options.callbacks.onError?.(lastError, externalEvent);
          throw new Error(`Failed to dispatch event '${externalEvent.type}' after ${attempt} attempts: ${lastError.message}`);
        }
        
        this.options.callbacks.onRetry?.(externalEvent.type, attempt, lastError);
        
        // Calculate delay with optional exponential backoff
        const delay = this.options.exponentialBackoff 
          ? this.options.retryDelay * Math.pow(2, attempt - 1)
          : this.options.retryDelay;
        
        await this.sleep(delay);
      }
    }
  }

  /**
   * Validates dispatch inputs.
   */
  private validateDispatchInputs(externalEvent: ExternalEvent): void {
    if (!externalEvent) {
      throw new Error('External event is required');
    }
    
    if (!externalEvent.type) {
      throw new Error('Event type is required');
    }
    
    if (!externalEvent.correlationId) {
      throw new Error('Correlation ID is required');
    }
    
    if (!externalEvent.source) {
      throw new Error('Event source is required');
    }
  }

  /**
   * Utility method for sleeping/delaying execution.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets the current configuration options.
   */
  getOptions(): Required<EventDispatcherOptions> {
    return { ...this.options };
  }
}

function generateCorrelationId(): string {
  // Use crypto.randomUUID if available (Node.js 14.17.0+), otherwise fallback to Math.random
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
}
