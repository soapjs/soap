import { BaseDomainEvent, DomainEvent } from '../../domain/domain-event';
import { Result } from '../../common/result';

describe('Event Pattern', () => {
  describe('BaseDomainEvent', () => {
    class TestEvent extends BaseDomainEvent<{ data: string }> {
      constructor(
        data: string,
        aggregateId: string = 'test-aggregate',
        version: number = 1
      ) {
        super('TestEvent', aggregateId, { data }, version);
      }

      get eventData(): string {
        return this.data.data;
      }
    }

    it('should create an event with unique ID', () => {
      const event = new TestEvent('test data');
      
      expect(event.id).toBeDefined();
      expect(event.id).toMatch(/^evt_\d+_[a-z0-9]+$/);
      expect(event.type).toBe('TestEvent');
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should create an event with all properties', () => {
      const event = new TestEvent('test data', 'agg-123', 5);
      
      expect(event.aggregateId).toBe('agg-123');
      expect(event.version).toBe(5);
      expect(event.eventData).toBe('test data');
    });

    it('should have different IDs for different events', () => {
      const event1 = new TestEvent('data1');
      const event2 = new TestEvent('data2');
      
      expect(event1.id).not.toBe(event2.id);
    });
  });

  describe('EventHandler', () => {
    class TestEvent extends BaseDomainEvent<{ data: string }> {
      constructor(data: string) {
        super('TestEvent', 'test-aggregate', { data });
      }

      get eventData(): string {
        return this.data.data;
      }
    }

    class TestEventHandler {
      async handle(event: TestEvent): Promise<Result<void>> {
        // Simulate processing
        return Result.withSuccess();
      }
    }

    it('should handle event and return success result', async () => {
      const handler = new TestEventHandler();
      const event = new TestEvent('test data');
      
      const result = await handler.handle(event);
      
      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('Event Bus', () => {
    class TestEvent extends BaseDomainEvent<{ data: string }> {
      constructor(data: string) {
        super('TestEvent', 'test-aggregate', { data });
      }

      get eventData(): string {
        return this.data.data;
      }
    }

    class TestEventHandler {
      public handledEvents: TestEvent[] = [];

      async handle(event: TestEvent): Promise<Result<void>> {
        this.handledEvents.push(event);
        return Result.withSuccess();
      }
    }

    class MockEventBus {
      private handlers = new Map<string, TestEventHandler[]>();

      async publish(event: DomainEvent): Promise<Result<void>> {
        const handlers = this.handlers.get(event.type) || [];
        
        for (const handler of handlers) {
          await handler.handle(event as unknown as TestEvent);
        }
        
        return Result.withSuccess();
      }

      subscribe(eventType: string, handler: TestEventHandler): void {
        if (!this.handlers.has(eventType)) {
          this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType)!.push(handler);
      }

      unsubscribe(eventType: string, handler: TestEventHandler): void {
        const handlers = this.handlers.get(eventType) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }

    it('should publish events to subscribed handlers', async () => {
      const bus = new MockEventBus();
      const handler = new TestEventHandler();
      
      bus.subscribe('TestEvent', handler);
      
      const event = new TestEvent('test data');
      const result = await bus.publish(event);
      
      expect(result.isSuccess()).toBe(true);
      expect(handler.handledEvents).toHaveLength(1);
      expect(handler.handledEvents[0]).toBe(event);
    });

    it('should handle multiple handlers for the same event type', async () => {
      const bus = new MockEventBus();
      const handler1 = new TestEventHandler();
      const handler2 = new TestEventHandler();
      
      bus.subscribe('TestEvent', handler1);
      bus.subscribe('TestEvent', handler2);
      
      const event = new TestEvent('test data');
      const result = await bus.publish(event);
      
      expect(result.isSuccess()).toBe(true);
      expect(handler1.handledEvents).toHaveLength(1);
      expect(handler2.handledEvents).toHaveLength(1);
    });

    it('should unsubscribe handlers', async () => {
      const bus = new MockEventBus();
      const handler = new TestEventHandler();
      
      bus.subscribe('TestEvent', handler);
      bus.unsubscribe('TestEvent', handler);
      
      const event = new TestEvent('test data');
      const result = await bus.publish(event);
      
      expect(result.isSuccess()).toBe(true);
      expect(handler.handledEvents).toHaveLength(0);
    });
  });
}); 