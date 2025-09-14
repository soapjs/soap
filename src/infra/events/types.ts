import { EventBase } from "./event-base";

/**
 * Options for configuring backoff strategy in retry policies.
 */
export type BackoffOptions = {
  /**
   * The maximum delay (in milliseconds) between retries.
   * Optional, defaults to no limit.
   */
  maxDelay?: number;

  /**
   * The multiplier for exponential backoff.
   * Optional, only used if `type` is `"exponential"`.
   */
  multiplier?: number;

  /**
   * Adds jitter (randomized variation) to the delay.
   * Optional, defaults to `false`.
   */
  jitter?: boolean;

  /**
   * The type of backoff strategy to use.
   * - `"fixed"`: Constant delay between retries.
   * - `"exponential"`: Delay increases exponentially with each retry.
   */
  type: "fixed" | "exponential";
};

/**
 * Options for configuring the EventProcessor.
 */
export interface EventProcessorOptions<
  MessageType,
  HeadersType = Record<string, unknown>
> {
  /**
   * Maximum number of retry attempts for failed message processing.
   * Default: 3
   */
  retries?: number;
  
  /**
   * Delay between retries in milliseconds.
   * Default: 1000
   */
  retryDelay?: number;
  
  /**
   * Backoff strategy for retries.
   * Default: { type: "exponential", multiplier: 2, jitter: true }
   */
  backoff?: BackoffOptions;
  
  dlq?: {
    enabled: boolean;
    topic: string;
  };
  maxParallelism?: number;
  processingStrategy?: EventProcessingStrategy<MessageType, HeadersType>;
  callbacks?: {
    onError?: (
      error: Error,
      event: EventBase<MessageType, HeadersType>
    ) => void;
    onSuccess?: (event: EventBase<MessageType, HeadersType>) => void;
    onClose?: () => void;
    onRetry?: (
      error: Error,
      event: EventBase<MessageType, HeadersType>,
      attempt: number
    ) => void;
  };
}

/**
 * Interface for message processing strategies.
 */
export interface EventProcessingStrategy<
  MessageType,
  HeadersType = Record<string, unknown>
> {
  process(
    event: EventBase<MessageType, HeadersType>,
    handler: (event: EventBase<MessageType, HeadersType>) => Promise<void>
  ): Promise<void>;
}
