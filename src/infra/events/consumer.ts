import { EventBase } from "./event-base";

/**
 * Where a consumer should begin reading when it has no committed offset
 * for its group (or when an explicit reset is requested on start).
 *
 * Broker-agnostic: a Kafka adapter maps `timestamp`/`offset` to
 * `consumer.seek`, an AMQP adapter may ignore positions it cannot honor.
 */
export type StartPosition =
  | { type: "beginning" }
  | { type: "latest" }
  /** Epoch milliseconds. Consumer starts at the first offset at/after this time. */
  | { type: "timestamp"; timestamp: number }
  /** Explicit per-partition offset. */
  | { type: "offset"; partition: number; offset: string };

/**
 * Target for an explicit seek on an already-running consumer.
 * Enables replay / skip-ahead without restarting the process.
 */
export type SeekTarget =
  | { type: "timestamp"; timestamp: number; partition?: number }
  | { type: "offset"; partition: number; offset: string }
  | { type: "beginning"; partition?: number }
  | { type: "latest"; partition?: number };

/**
 * How messages are delivered to a handler.
 *
 * - `"single"`     one message at a time (1-on-1), strict ordering per partition.
 * - `"concurrent"` up to `concurrency` messages in flight at once (bounded fan-out).
 * - `"batch"`      a slice of messages handed to the handler together
 *                  (maps to Kafka `eachBatch` with manual offset resolution).
 */
export type ConsumptionScenario = "single" | "concurrent" | "batch";

/**
 * Fetch / back-pressure tuning passed down to the underlying broker driver.
 *
 * These exist to prevent the failure mode where a consumer drains a large
 * backlog faster than it can process, buffering everything in memory until
 * the pod is OOM-killed. Cap how much is fetched and how much is buffered
 * locally before the driver is told to pause.
 */
export interface BackpressureOptions {
  /** Max bytes the broker returns per fetch across all partitions. */
  maxBytes?: number;
  /** Max bytes returned per partition per fetch. */
  maxBytesPerPartition?: number;
  /** Min bytes the broker waits to accumulate before responding to a fetch. */
  minBytes?: number;
  /** Max time (ms) the broker waits before responding to a fetch. */
  maxWaitTimeMs?: number;
  /**
   * Number of partitions processed concurrently.
   * Maps to KafkaJS `partitionsConsumedConcurrently`.
   */
  partitionsConsumedConcurrently?: number;
  /**
   * Upper bound on messages buffered locally before the adapter pauses
   * fetching. A coarse guard against unbounded memory growth while draining
   * a backlog — counts messages, not bytes.
   */
  maxInFlight?: number;
  /**
   * Memory-pressure watchdog. A more robust OOM guard than {@link maxInFlight}
   * because it reacts to actual process memory rather than a message count.
   * The adapter samples memory and pauses fetching when over the high
   * watermark, resuming when it falls back under the low watermark.
   */
  memoryGuard?: MemoryGuardOptions;
}

/**
 * Memory-pressure watchdog configuration for back-pressure.
 *
 * The adapter periodically samples `process.memoryUsage()` and pauses the
 * consumer when the watched figure crosses the high watermark, resuming it
 * once it drops below the low watermark. The two-watermark (hysteresis)
 * design prevents rapid pause/resume flapping when usage hovers near a single
 * threshold.
 *
 * Provide thresholds either in absolute bytes (`pauseAboveBytes` /
 * `resumeBelowBytes`) or as a heap fraction (`pauseAboveHeapFraction` /
 * `resumeBelowHeapFraction`). For full control, supply {@link shouldPause}.
 */
export interface MemoryGuardOptions {
  /** Enable the watchdog. Default: `false`. */
  enabled?: boolean;
  /** Which `process.memoryUsage()` figure to watch. Default: `"rss"`. */
  metric?: "rss" | "heapUsed" | "external";
  /** How often to sample, in ms. Default: `1000`. */
  checkIntervalMs?: number;
  /** High watermark in bytes — pause when the watched figure exceeds this. */
  pauseAboveBytes?: number;
  /**
   * Low watermark in bytes — resume when the watched figure drops below this.
   * Should be lower than {@link pauseAboveBytes}. Defaults to ~90% of the high
   * watermark when omitted.
   */
  resumeBelowBytes?: number;
  /**
   * High watermark as a fraction (0..1) of `heapTotal` — pause when
   * `heapUsed / heapTotal` exceeds this. Ignored if {@link pauseAboveBytes} is set.
   */
  pauseAboveHeapFraction?: number;
  /** Low watermark as a heap fraction (0..1). Pairs with {@link pauseAboveHeapFraction}. */
  resumeBelowHeapFraction?: number;
  /**
   * Custom predicate for full control. When provided it overrides the
   * watermark logic; return `true` to pause, `false` to resume.
   */
  shouldPause?: (usage: NodeJS.MemoryUsage) => boolean;
}

/**
 * Offset-commit behavior. Defaults favor at-least-once delivery.
 */
export interface CommitOptions {
  /**
   * Let the driver commit offsets automatically.
   * Default `true`. Set `false` for explicit at-least-once control where the
   * handler commits only after successful processing.
   */
  autoCommit?: boolean;
  /** Auto-commit interval in ms (driver-specific). */
  autoCommitIntervalMs?: number;
  /** Commit after this many resolved messages (driver-specific). */
  autoCommitThreshold?: number;
}

/**
 * Batch shaping for the `"batch"` scenario.
 */
export interface BatchOptions {
  /** Max messages handed to the handler in a single batch. */
  maxSize?: number;
  /** Flush a partial batch after this many ms even if `maxSize` is not reached. */
  maxWaitMs?: number;
}

/**
 * Per-message controls handed to a `"single"` / `"concurrent"` handler.
 * The handler uses these for manual ack/commit, heartbeating long work,
 * and applying back-pressure on its own partition.
 */
export interface MessageControls {
  /**
   * Acknowledge this message as processed. With `autoCommit: false` this
   * resolves the offset so it can be committed.
   */
  ack(): Promise<void>;
  /**
   * Negatively acknowledge. `requeue` requests redelivery where the broker
   * supports it; on Kafka this typically seeks back to the message offset.
   */
  nack(requeue?: boolean): Promise<void>;
  /**
   * Send a heartbeat / extend the processing lease so a long-running handler
   * does not trigger a consumer-group rebalance.
   */
  heartbeat(): Promise<void>;
  /** Pause consumption of this message's topic/partition. */
  pause(): void;
  /** Resume consumption previously paused via {@link pause}. */
  resume(): void;
}

/**
 * Context handed to a `"batch"` handler. Mirrors KafkaJS `eachBatch`
 * ergonomics in a broker-agnostic shape: resolve offsets as you go, commit
 * and heartbeat explicitly, and bail out early on rebalance/shutdown.
 */
export interface BatchContext<MessageType, HeadersType = Record<string, unknown>> {
  /** The messages in this batch. */
  events: EventBase<MessageType, HeadersType>[];
  /**
   * Mark a single event as processed so its offset can be committed.
   * Call in delivery order to preserve at-least-once semantics.
   */
  resolve(event: EventBase<MessageType, HeadersType>): void;
  /** Commit all currently resolved offsets. */
  commit(): Promise<void>;
  /** Send a heartbeat to avoid a rebalance during a long batch. */
  heartbeat(): Promise<void>;
  /**
   * Returns `false` once a shutdown or rebalance has been requested.
   * Long batch loops should check this and stop early, committing progress.
   */
  isRunning(): boolean;
  /** Returns `true` if this batch became stale due to a rebalance. */
  isStale(): boolean;
  /** Pause this partition; returns a function that resumes it. */
  pause(): () => void;
}

/**
 * Handler for `"single"` / `"concurrent"` scenarios.
 */
export type SingleMessageHandler<MessageType, HeadersType = Record<string, unknown>> = (
  event: EventBase<MessageType, HeadersType>,
  controls: MessageControls
) => Promise<void>;

/**
 * Handler for the `"batch"` scenario.
 */
export type BatchMessageHandler<MessageType, HeadersType = Record<string, unknown>> = (
  context: BatchContext<MessageType, HeadersType>
) => Promise<void>;

/**
 * Lifecycle callbacks for a consumer subscription.
 */
export interface ConsumerCallbacks<MessageType, HeadersType = Record<string, unknown>> {
  onError?: (error: Error, event?: EventBase<MessageType, HeadersType>) => void;
  onRebalance?: (info: { assigned?: unknown; revoked?: unknown }) => void;
  onPause?: (reason: "backpressure" | "memory" | "manual") => void;
  onResume?: (reason: "backpressure" | "memory" | "manual") => void;
}

/**
 * Options common to every consumption scenario.
 */
export interface BaseConsumerOptions<MessageType, HeadersType = Record<string, unknown>> {
  /** Consumer group id. Falls back to the bus's configured group. */
  groupId?: string;
  /** Where to start when no committed offset exists. Default: `latest`. */
  startFrom?: StartPosition;
  /** Fetch / back-pressure tuning. */
  backpressure?: BackpressureOptions;
  /** Offset-commit behavior. */
  commit?: CommitOptions;
  /** Lifecycle callbacks. */
  callbacks?: ConsumerCallbacks<MessageType, HeadersType>;
}

/** Options for the `"single"` (one-at-a-time) scenario. */
export interface SingleConsumerOptions<MessageType, HeadersType = Record<string, unknown>>
  extends BaseConsumerOptions<MessageType, HeadersType> {
  scenario?: "single";
  handler: SingleMessageHandler<MessageType, HeadersType>;
}

/** Options for the `"concurrent"` (bounded fan-out) scenario. */
export interface ConcurrentConsumerOptions<MessageType, HeadersType = Record<string, unknown>>
  extends BaseConsumerOptions<MessageType, HeadersType> {
  scenario: "concurrent";
  /** Max messages processed in parallel. Must be >= 1. */
  concurrency: number;
  handler: SingleMessageHandler<MessageType, HeadersType>;
}

/** Options for the `"batch"` scenario. */
export interface BatchConsumerOptions<MessageType, HeadersType = Record<string, unknown>>
  extends BaseConsumerOptions<MessageType, HeadersType> {
  scenario: "batch";
  /** Batch shaping. */
  batch?: BatchOptions;
  handler: BatchMessageHandler<MessageType, HeadersType>;
}

/**
 * Discriminated union of consumer options. The `scenario` field selects the
 * delivery model and, with it, the handler signature.
 */
export type ConsumerOptions<MessageType, HeadersType = Record<string, unknown>> =
  | SingleConsumerOptions<MessageType, HeadersType>
  | ConcurrentConsumerOptions<MessageType, HeadersType>
  | BatchConsumerOptions<MessageType, HeadersType>;

/**
 * Lag for a single topic-partition.
 */
export interface PartitionLag {
  topic: string;
  partition: number;
  /** Messages behind the log end offset. */
  lag: number;
  committedOffset?: string;
  logEndOffset?: string;
}

/**
 * Snapshot of consumer health for observability (export to Prometheus, etc.).
 */
export interface ConsumerMetrics {
  topic?: string;
  groupId?: string;
  /** Messages currently being processed (buffered + in handler). */
  inFlight: number;
  /** Total successfully processed since start. */
  processed: number;
  /** Total failed (after retries) since start. */
  failed: number;
  /** Total retried since start. */
  retried: number;
  /** Epoch ms of the last successful offset commit. */
  lastCommittedAt?: number;
  /** Rolling throughput estimate, messages/second. */
  throughputPerSec?: number;
  /** Per-partition lag, when the adapter can compute it. */
  lag?: PartitionLag[];
  /** Sum of {@link lag} across partitions. */
  totalLag?: number;
}

/**
 * Options controlling graceful shutdown of a consumer/bus.
 */
export interface GracefulShutdownOptions {
  /** Max time (ms) to wait for in-flight handlers to finish. Default: 30000. */
  timeoutMs?: number;
  /** Commit resolved offsets before disconnecting. Default: `true`. */
  commitOnShutdown?: boolean;
  /** Called once draining begins (stop accepting new work, finish in-flight). */
  onDraining?: () => void;
  /** Called if the drain timed out and was forced. */
  onTimeout?: (inFlight: number) => void;
}
