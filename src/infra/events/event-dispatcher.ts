import { EventBase, EventBus } from "./types";

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
    onSuccess?: (event: string, payload: unknown) => void;
    onError?: (event: string, error: Error, payload: unknown) => void;
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

export class EventDispatcher<
  PayloadType = unknown,
  HeadersType = Record<string, unknown> & {
    correlation_id: string;
    timestamp: string;
  },
  EventIdType = string
> {
  private readonly options: Required<EventDispatcherOptions>;

  constructor(
    private readonly eventBus: EventBus<PayloadType, HeadersType, EventIdType>,
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
   * Dispatches an event to the event bus.
   * Automatically attaches default headers like correlation ID and timestamp.
   * Includes retry logic and error handling.
   */
  async dispatch(
    event: EventIdType,
    payload: PayloadType,
    headers: Partial<HeadersType> = {}
  ): Promise<void> {
    // Validate inputs
    this.validateDispatchInputs(event, payload, headers);

    const enrichedHeaders: HeadersType = {
      ...headers,
      correlation_id: this.options.correlationIdGenerator(),
      timestamp: this.options.timestampGenerator(),
    } as HeadersType;

    const eventBase: EventBase<PayloadType, HeadersType> = {
      message: payload,
      headers: enrichedHeaders,
    };

    await this.dispatchWithRetry(event, eventBase);
  }

  /**
   * Dispatches an event with retry logic.
   */
  private async dispatchWithRetry(
    event: EventIdType,
    eventBase: EventBase<PayloadType, HeadersType>
  ): Promise<void> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        await this.eventBus.publish(event, eventBase);
        this.options.callbacks.onSuccess?.(event as string, eventBase.message);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === this.options.maxRetries) {
          this.options.callbacks.onError?.(event as string, lastError, eventBase.message);
          throw new Error(`Failed to dispatch event '${event}' after ${attempt} attempts: ${lastError.message}`);
        }
        
        this.options.callbacks.onRetry?.(event as string, attempt, lastError);
        
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
  private validateDispatchInputs(
    event: EventIdType,
    payload: PayloadType,
    headers: Partial<HeadersType>
  ): void {
    if (!event) {
      throw new Error('Event identifier is required');
    }
    
    if (payload === undefined || payload === null) {
      throw new Error('Event payload is required');
    }
    
    // Validate headers structure if provided
    if (headers && typeof headers !== 'object') {
      throw new Error('Headers must be an object');
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
  return crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15);
}
