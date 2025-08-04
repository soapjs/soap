import { BaseDomainEvent, DomainEvent, EventHandler, DomainEventBus } from '../event';
import { Result } from '../../common/result';

describe('Event Pattern', () => {
  describe('BaseDomainEvent', () => {
    class TestEvent extends BaseDomainEvent {
      constructor(
        public readonly data: string,
        aggregateId?: string,
        version?: number,
        initiatedBy?: string,
        correlationId?: string
      ) {
        super('TestEvent', aggregateId, version, initiatedBy, correlationId);
      }
    }

    it('should create an event with unique ID', () => {
      const event = new TestEvent('test data');
      
      expect(event.eventId).toBeDefined();
      expect(event.eventId).toMatch(/^evt_\d+_[a-z0-9]+$/);
      expect(event.eventType).toBe('TestEvent');
      expect(event.occurredOn).toBeInstanceOf(Date);
    });

    it('should create an event with all properties', () => {
      const event = new TestEvent('test data', 'agg-123', 5, 'user-456', 'corr-789');
      
      expect(event.aggregateId).toBe('agg-123');
      expect(event.version).toBe(5);
      expect(event.initiatedBy).toBe('user-456');
      expect(event.correlationId).toBe('corr-789');
    });

    it('should have different IDs for different events', () => {
      const event1 = new TestEvent('data1');
      const event2 = new TestEvent('data2');
      
      expect(event1.eventId).not.toBe(event2.eventId);
    });
  });

  describe('EventHandler', () => {
    class TestEvent extends BaseDomainEvent {
      constructor(public readonly data: string) {
        super('TestEvent');
      }
    }

    class TestEventHandler implements EventHandler<TestEvent> {
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

  describe('DomainEventBus', () => {
    class TestEvent extends BaseDomainEvent {
      constructor(public readonly data: string) {
        super('TestEvent');
      }
    }

    class TestEventHandler implements EventHandler<TestEvent> {
      public handledEvents: TestEvent[] = [];

      async handle(event: TestEvent): Promise<Result<void>> {
        this.handledEvents.push(event);
        return Result.withSuccess();
      }
    }

    class MockDomainEventBus implements DomainEventBus {
      private handlers = new Map<string, EventHandler<any>[]>();

      async publish(event: DomainEvent): Promise<Result<void>> {
        const handlers = this.handlers.get(event.eventType) || [];
        
        for (const handler of handlers) {
          await handler.handle(event);
        }
        
        return Result.withSuccess();
      }

      subscribe<TEvent extends DomainEvent>(
        eventType: new (...args: any[]) => TEvent,
        handler: EventHandler<TEvent>
      ): void {
        const eventTypeName = eventType.name;
        if (!this.handlers.has(eventTypeName)) {
          this.handlers.set(eventTypeName, []);
        }
        this.handlers.get(eventTypeName)!.push(handler);
      }

      unsubscribe<TEvent extends DomainEvent>(
        eventType: new (...args: any[]) => TEvent,
        handler: EventHandler<TEvent>
      ): void {
        const eventTypeName = eventType.name;
        const handlers = this.handlers.get(eventTypeName) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }

    it('should publish events to subscribed handlers', async () => {
      const bus = new MockDomainEventBus();
      const handler = new TestEventHandler();
      
      bus.subscribe(TestEvent, handler);
      
      const event = new TestEvent('test data');
      const result = await bus.publish(event);
      
      expect(result.isSuccess()).toBe(true);
      expect(handler.handledEvents).toHaveLength(1);
      expect(handler.handledEvents[0]).toBe(event);
    });

    it('should handle multiple handlers for the same event type', async () => {
      const bus = new MockDomainEventBus();
      const handler1 = new TestEventHandler();
      const handler2 = new TestEventHandler();
      
      bus.subscribe(TestEvent, handler1);
      bus.subscribe(TestEvent, handler2);
      
      const event = new TestEvent('test data');
      const result = await bus.publish(event);
      
      expect(result.isSuccess()).toBe(true);
      expect(handler1.handledEvents).toHaveLength(1);
      expect(handler2.handledEvents).toHaveLength(1);
    });

    it('should unsubscribe handlers', async () => {
      const bus = new MockDomainEventBus();
      const handler = new TestEventHandler();
      
      bus.subscribe(TestEvent, handler);
      bus.unsubscribe(TestEvent, handler);
      
      const event = new TestEvent('test data');
      const result = await bus.publish(event);
      
      expect(result.isSuccess()).toBe(true);
      expect(handler.handledEvents).toHaveLength(0);
    });
  });
}); 