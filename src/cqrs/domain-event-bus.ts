import { DomainEvent } from "../domain/domain-event";

/**
 * Receives a single {@link DomainEvent} of a known type. The shape mirrors
 * the framework's `@EventHandler`-decorated consumers so a wiring helper
 * (`wireEvents`) can subscribe them without an additional adapter layer.
 *
 * Returning a Promise is supported — adapters that talk to a real broker
 * (Kafka, RabbitMQ, SQS) will `await` the consumer before committing the
 * underlying message.
 */
export interface DomainEventConsumer<TEvent extends DomainEvent = DomainEvent> {
  handle(event: TEvent): Promise<void> | void;
}

/**
 * Framework port for publishing and subscribing to domain events.
 *
 * This is the contract every CQRS app exposes to its application layer.
 * Two adapters ship with the framework:
 *
 * - {@link InMemoryDomainEventBus} — synchronous in-process fan-out, the
 *   default and the right answer for monoliths and tests.
 * - `KafkaDomainEventBus` (in `@soapjs/soap-node-kafka`) — durable, ordered
 *   per-aggregate broker delivery for multi-instance deployments.
 *
 * Both implement the same `publish` / `subscribe` API, so swapping is a
 * single-line wiring change in the composition root.
 */
export abstract class DomainEventBus {
  /**
   * DI token used by `bootstrap()` / `wireEvents()` to resolve the bus
   * implementation from the container. Bind your adapter under this token
   * before calling `wireEvents`, or pass an explicit instance through
   * `wireCqrs({ eventBus })`.
   */
  static readonly Token = "DomainEventBus";

  /**
   * Publishes a single domain event to every subscribed consumer for the
   * event's type. Implementations must guarantee at-least-once delivery
   * to in-process consumers and surface broker errors to the caller —
   * silent drops are a correctness bug.
   */
  abstract publish(event: DomainEvent): Promise<void>;

  /**
   * Subscribes a consumer to a specific event type. Implementations should
   * be idempotent across (eventType, consumer) pairs — calling twice with
   * the same args must not produce duplicate deliveries.
   *
   * `subscribe` is intentionally allowed to return a Promise so async
   * adapters (Kafka, RabbitMQ) can lazily open a consumer on first
   * subscription. Sync adapters (in-memory) return `void`.
   */
  abstract subscribe<TEvent extends DomainEvent>(
    eventType: new (...args: unknown[]) => TEvent,
    consumer: DomainEventConsumer<TEvent>,
  ): Promise<void> | void;
}

/**
 * The default, synchronous, single-process implementation.
 *
 * Holds a `Map<eventType.name, consumer[]>` and dispatches each `publish`
 * to every consumer of that type. Errors thrown by one consumer are
 * isolated so they don't sabotage the rest of the fan-out.
 *
 * Use this for monoliths, tests, and any deployment where one event-bus
 * process owns the whole consumer set. Reach for a broker-backed adapter
 * when you need durability or multi-instance scale-out.
 */
export class InMemoryDomainEventBus extends DomainEventBus {
  private readonly subscribers: Map<string, DomainEventConsumer[]> = new Map();

  async publish(event: DomainEvent): Promise<void> {
    const key = event.constructor.name;
    const consumers = this.subscribers.get(key);
    if (!consumers || consumers.length === 0) return;

    // Snapshot to immunise against concurrent subscribe/unsubscribe during dispatch.
    const snapshot = [...consumers];
    for (const consumer of snapshot) {
      try {
        await consumer.handle(event);
      } catch (error) {
        // Don't let one failing consumer break the rest. The framework
        // logger (if available) would catch this, but here we deliberately
        // keep the adapter free of logger coupling — pass-through for tests.
        const consoleErr = (globalThis as { console?: { error?: (...a: unknown[]) => void } })
          .console?.error;
        consoleErr?.(`InMemoryDomainEventBus consumer for ${key} threw:`, error);
      }
    }
  }

  subscribe<TEvent extends DomainEvent>(
    eventType: new (...args: unknown[]) => TEvent,
    consumer: DomainEventConsumer<TEvent>,
  ): void {
    const key = eventType.name;
    const existing = this.subscribers.get(key);
    if (existing) {
      if (!existing.includes(consumer as DomainEventConsumer)) {
        existing.push(consumer as DomainEventConsumer);
      }
    } else {
      this.subscribers.set(key, [consumer as DomainEventConsumer]);
    }
  }

  /**
   * Returns the number of consumers subscribed to the given event type —
   * useful in tests and observability hooks.
   */
  consumerCount(eventType: new (...args: unknown[]) => DomainEvent): number {
    return this.subscribers.get(eventType.name)?.length ?? 0;
  }
}
