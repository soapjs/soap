import { EventBus } from "./event-bus";
import { GracefulShutdownOptions } from "./consumer";

/**
 * A resource that can be drained and closed during shutdown.
 * {@link EventBus} satisfies this when it implements `gracefulShutdown`,
 * but any database connection / pool can be registered too so a single
 * SIGTERM tears everything down in the right order.
 */
export interface Drainable {
  /** Drain in-flight work and release the resource. */
  gracefulShutdown?(options?: GracefulShutdownOptions): Promise<void>;
  /** Fallback hard close when {@link gracefulShutdown} is unavailable. */
  disconnect?(): Promise<void>;
  /** Alternative hard-close name used by some adapters (e.g. Mongo). */
  close?(): Promise<void>;
}

/**
 * Options for {@link registerGracefulShutdown}.
 */
export interface RegisterGracefulShutdownOptions extends GracefulShutdownOptions {
  /** Process signals to listen for. Default: `["SIGTERM", "SIGINT"]`. */
  signals?: NodeJS.Signals[];
  /** Called once all resources have been drained. */
  onComplete?: () => void;
  /** Called if draining a resource throws. */
  onError?: (error: Error, resource: Drainable) => void;
  /**
   * Whether to call `process.exit` after draining. Default: `true`.
   * Disable in tests or when another supervisor owns process lifetime.
   */
  exitProcess?: boolean;
}

/**
 * Drains a single resource, preferring `gracefulShutdown` over a hard
 * `disconnect`/`close`. Never throws; surfaces errors via `onError`.
 */
async function drainResource(
  resource: Drainable,
  options: GracefulShutdownOptions,
  onError?: (error: Error, resource: Drainable) => void
): Promise<void> {
  try {
    if (typeof resource.gracefulShutdown === "function") {
      await resource.gracefulShutdown(options);
    } else if (typeof resource.disconnect === "function") {
      await resource.disconnect();
    } else if (typeof resource.close === "function") {
      await resource.close();
    }
  } catch (error) {
    onError?.(
      error instanceof Error ? error : new Error(String(error)),
      resource
    );
  }
}

/**
 * Wires process termination signals to graceful shutdown of one or more
 * resources (event buses, database connections). On the first signal it
 * drains every resource — in registration order — then optionally exits.
 *
 * This is the recommended way to avoid the failure mode where a rolling
 * deploy sends SIGTERM and the runtime tears down a live broker/DB
 * connection while messages are still being processed.
 *
 * @param resources - Resources to drain. Each is drained via its
 *   `gracefulShutdown`, falling back to `disconnect`/`close`.
 * @param options - Signals, drain timeout, commit behavior, and callbacks.
 * @returns A cleanup function that removes the registered signal listeners.
 *
 * @example
 * ```typescript
 * registerGracefulShutdown([eventBus, mongo], {
 *   timeoutMs: 25000,
 *   onComplete: () => console.log("drained"),
 * });
 * ```
 */
export function registerGracefulShutdown(
  resources: Drainable | Drainable[],
  options: RegisterGracefulShutdownOptions = {}
): () => void {
  const list = Array.isArray(resources) ? resources : [resources];
  const signals = options.signals ?? ["SIGTERM", "SIGINT"];
  const exitProcess = options.exitProcess ?? true;
  const drainOptions: GracefulShutdownOptions = {
    timeoutMs: options.timeoutMs,
    commitOnShutdown: options.commitOnShutdown,
    onDraining: options.onDraining,
    onTimeout: options.onTimeout,
  };

  let shuttingDown = false;

  const handler = async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    options.onDraining?.();

    for (const resource of list) {
      await drainResource(resource, drainOptions, options.onError);
    }

    options.onComplete?.();

    if (exitProcess) {
      process.exit(0);
    }
  };

  const listeners = signals.map((signal) => {
    const listener = () => {
      void handler();
    };
    process.on(signal, listener);
    return { signal, listener };
  });

  return () => {
    for (const { signal, listener } of listeners) {
      process.removeListener(signal, listener);
    }
  };
}

/**
 * Type guard: does this {@link EventBus} support scenario-driven consumption?
 * Useful for adapters/processors that want to opt into the richer API only
 * when the underlying bus provides it.
 */
export function supportsConsumerScenarios<M, H, E>(
  bus: EventBus<M, H, E>
): bus is EventBus<M, H, E> &
  Required<Pick<EventBus<M, H, E>, "consume">> {
  return typeof bus.consume === "function";
}
