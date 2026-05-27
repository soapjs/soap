import { InMemoryEventStore } from '../event-store.impl';
import { BaseDomainEvent } from '../../domain/domain-event';

class OrderPlaced extends BaseDomainEvent {
  constructor(aggregateId: string, version: number) {
    super('OrderPlaced', aggregateId, { amount: 100 }, version);
  }
}

class OrderShipped extends BaseDomainEvent {
  constructor(aggregateId: string, version: number) {
    super('OrderShipped', aggregateId, { carrier: 'DHL' }, version);
  }
}

describe('InMemoryEventStore', () => {
  let store: InMemoryEventStore;

  beforeEach(() => {
    store = new InMemoryEventStore();
  });

  it('appends and retrieves events', async () => {
    const e1 = new OrderPlaced('order-1', 1);
    await store.appendEvents('order-1', 0, [e1]);

    const result = await store.getEvents('order-1');
    expect(result.isSuccess()).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('OrderPlaced');
  });

  it('returns empty array for unknown aggregate', async () => {
    const result = await store.getEvents('unknown');
    expect(result.isSuccess()).toBe(true);
    expect(result.content).toHaveLength(0);
  });

  it('enforces optimistic locking on append', async () => {
    const e1 = new OrderPlaced('order-2', 1);
    await store.appendEvents('order-2', 0, [e1]);

    // expectedVersion=0 but current=1 → conflict
    const conflict = await store.appendEvents('order-2', 0, [new OrderShipped('order-2', 2)]);
    expect(conflict.isFailure()).toBe(true);
    expect(conflict.failure?.error.message).toMatch(/Version conflict/);
  });

  it('returns events from a given version', async () => {
    const events = [
      new OrderPlaced('order-3', 1),
      new OrderShipped('order-3', 2),
    ];
    await store.appendEvents('order-3', 0, events);

    const result = await store.getEventsFromVersion('order-3', 1);
    expect(result.isSuccess()).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('OrderShipped');
  });

  it('returns events by type', async () => {
    await store.appendEvents('order-4', 0, [new OrderPlaced('order-4', 1)]);
    await store.appendEvents('order-5', 0, [new OrderPlaced('order-5', 1), new OrderShipped('order-5', 2)]);

    const result = await store.getEventsByType('OrderPlaced');
    expect(result.isSuccess()).toBe(true);
    expect(result.content).toHaveLength(2);
  });

  it('returns events in time range', async () => {
    const before = new Date(Date.now() - 1000);
    await store.appendEvents('order-6', 0, [new OrderPlaced('order-6', 1)]);
    const after = new Date(Date.now() + 1000);

    const result = await store.getEventsInTimeRange(before, after);
    expect(result.isSuccess()).toBe(true);
    expect(result.content.length).toBeGreaterThan(0);
  });
});
