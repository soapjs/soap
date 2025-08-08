import { BaseAggregateRoot, AggregateRoot } from '../aggregate-root';
import { BaseDomainEvent, DomainEvent } from '../event';
import { Entity } from '../../domain/entity';
import { Result } from '../../common/result';

describe('Aggregate Root Pattern', () => {
  interface TestEntity extends Entity<string> {
    name: string;
    value: number;
  }

  class TestEvent extends BaseDomainEvent {
    constructor(
      public readonly data: string,
      aggregateId?: string,
      version?: number
    ) {
      super('TestEvent', aggregateId, version);
    }
  }

  class TestAggregate extends BaseAggregateRoot<TestEntity> {
    constructor(entity: TestEntity) {
      super(entity);
    }

    get name(): string {
      return this.entity.name;
    }

    get value(): number {
      return this.entity.value;
    }

    setName(name: string): void {
      const updatedEntity: TestEntity = {
        ...this.entity,
        name
      };
      const event = new TestEvent(`Name changed to: ${name}`, this.entity.id, this.version);
      this.addDomainEvent(event);
    }

    setValue(value: number): void {
      const updatedEntity: TestEntity = {
        ...this.entity,
        value
      };
      const event = new TestEvent(`Value changed to: ${value}`, this.entity.id, this.version);
      this.addDomainEvent(event);
    }

    protected apply(event: DomainEvent): void {
      if (event instanceof TestEvent) {
        // Simulate applying event
        (this as any).version++;
      }
    }
  }

  describe('BaseAggregateRoot', () => {
    it('should create aggregate with entity', () => {
      const entity: TestEntity = {
        id: 'test-id',
        name: 'test',
        value: 42
      };
      const aggregate = new TestAggregate(entity);
      
      expect(aggregate.entity).toBe(entity);
      expect(aggregate.entity.id).toBe('test-id');
      expect(aggregate.name).toBe('test');
      expect(aggregate.value).toBe(42);
      expect(aggregate.version).toBe(0);
      expect(aggregate.uncommittedEvents).toHaveLength(0);
    });

    it('should add domain events to uncommitted events', () => {
      const entity: TestEntity = {
        id: 'test-id',
        name: 'test',
        value: 42
      };
      const aggregate = new TestAggregate(entity);
      
      aggregate.setName('test name');
      
      expect(aggregate.uncommittedEvents).toHaveLength(1);
      expect(aggregate.uncommittedEvents[0]).toBeInstanceOf(TestEvent);
    });

    it('should mark events as committed', () => {
      const entity: TestEntity = {
        id: 'test-id',
        name: 'test',
        value: 42
      };
      const aggregate = new TestAggregate(entity);
      
      aggregate.setName('test name');
      aggregate.setValue(100);
      
      expect(aggregate.uncommittedEvents).toHaveLength(2);
      
      aggregate.markEventsAsCommitted();
      
      expect(aggregate.uncommittedEvents).toHaveLength(0);
    });

    it('should load from history', () => {
      const entity: TestEntity = {
        id: 'test-id',
        name: 'test',
        value: 42
      };
      const aggregate = new TestAggregate(entity);
      const events = [
        new TestEvent('event1', 'test-id', 1),
        new TestEvent('event2', 'test-id', 2)
      ];

      aggregate.loadFromHistory(events);

      // The apply method increments version for each event
      expect((aggregate as any).version).toBe(2);
    });

    it('should create domain events with correct properties', () => {
      const entity: TestEntity = {
        id: 'test-id',
        name: 'test',
        value: 42
      };
      const aggregate = new TestAggregate(entity);
      
      aggregate.setName('new name');
      
      const event = aggregate.uncommittedEvents[0];
      expect(event.aggregateId).toBe('test-id');
      expect(event.version).toBe(0);
      expect(event.eventType).toBe('TestEvent');
    });
  });

  describe('Entity Interface', () => {
    it('should implement Entity interface correctly', () => {
      const entity: TestEntity = {
        id: 'test-id',
        name: 'test',
        value: 42
      };
      const aggregate = new TestAggregate(entity);
      
      expect(aggregate.entity.id).toBe('test-id');
      expect(aggregate.entity.name).toBe('test');
      expect(aggregate.entity.value).toBe(42);
    });
  });

  describe('Type Safety', () => {
    it('should work with different ID types', () => {
      // String ID
      interface StringEntity extends Entity<string> {
        name: string;
      }

      class StringAggregate extends BaseAggregateRoot<StringEntity> {
        constructor(entity: StringEntity) {
          super(entity);
        }
      }

      const stringEntity: StringEntity = { id: 'test-id', name: 'test' };
      const stringAggregate = new StringAggregate(stringEntity);
      expect(typeof stringAggregate.entity.id).toBe('string');

      // Number ID
      interface NumberEntity extends Entity<number> {
        name: string;
      }

      class NumberAggregate extends BaseAggregateRoot<NumberEntity> {
        constructor(entity: NumberEntity) {
          super(entity);
        }
      }

      const numberEntity: NumberEntity = { id: 123, name: 'test' };
      const numberAggregate = new NumberAggregate(numberEntity);
      expect(typeof numberAggregate.entity.id).toBe('number');
    });
  });
}); 