import { BaseAggregateRoot, AggregateRoot } from '../aggregate-root';
import { BaseDomainEvent, DomainEvent } from '../event';
import { Result } from '../../common/result';

describe('Aggregate Root Pattern', () => {
  interface TestEntityData {
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

  class TestAggregate extends BaseAggregateRoot<TestEntityData> {
    private _name: string = '';
    private _value: number = 0;

    constructor(id?: string) {
      super(id);
    }

    get name(): string {
      return this._name;
    }

    get value(): number {
      return this._value;
    }

    setName(name: string): void {
      this._name = name;
      const event = new TestEvent(`Name changed to: ${name}`, this.id, this.version);
      this.addDomainEvent(event);
    }

    setValue(value: number): void {
      this._value = value;
      const event = new TestEvent(`Value changed to: ${value}`, this.id, this.version);
      this.addDomainEvent(event);
    }

    protected apply(event: DomainEvent): void {
      if (event instanceof TestEvent) {
        // Simulate applying event
        (this as any).version++;
      }
    }

    toJson(): TestEntityData {
      return {
        name: this._name,
        value: this._value
      };
    }
  }

  describe('BaseAggregateRoot', () => {
    it('should create aggregate with ID', () => {
      const aggregate = new TestAggregate('test-id');
      
      expect(aggregate.id).toBe('test-id');
      expect(aggregate.version).toBe(0);
      expect(aggregate.uncommittedEvents).toHaveLength(0);
    });

    it('should add domain events to uncommitted events', () => {
      const aggregate = new TestAggregate('test-id');
      
      aggregate.setName('test name');
      
      expect(aggregate.uncommittedEvents).toHaveLength(1);
      expect(aggregate.uncommittedEvents[0]).toBeInstanceOf(TestEvent);
    });

    it('should mark events as committed', () => {
      const aggregate = new TestAggregate('test-id');
      
      aggregate.setName('test name');
      aggregate.setValue(42);
      
      expect(aggregate.uncommittedEvents).toHaveLength(2);
      
      aggregate.markEventsAsCommitted();
      
      expect(aggregate.uncommittedEvents).toHaveLength(0);
    });

    it('should load from history', () => {
      const aggregate = new TestAggregate('test-id');
      const events = [
        new TestEvent('event1', 'test-id', 1),
        new TestEvent('event2', 'test-id', 2)
      ];
      
      aggregate.loadFromHistory(events);
      
      // The apply method increments version for each event
      expect(aggregate.version).toBe(2);
    });

    it('should create domain events with correct properties', () => {
      const aggregate = new TestAggregate('test-id');
      
      aggregate.setName('test name');
      
      const event = aggregate.uncommittedEvents[0] as TestEvent;
      expect(event.aggregateId).toBe('test-id');
      expect(event.version).toBe(0);
      expect(event.data).toBe('Name changed to: test name');
    });

    it('should return correct aggregate ID', () => {
      const aggregate = new TestAggregate('test-id');
      
      expect(aggregate['aggregateId']).toBe('test-id');
    });

    it('should return correct current version', () => {
      const aggregate = new TestAggregate('test-id');
      
      expect(aggregate['currentVersion']).toBe(0);
    });

    it('should convert to JSON', () => {
      const aggregate = new TestAggregate('test-id');
      aggregate.setName('test name');
      aggregate.setValue(42);
      
      const json = aggregate.toJson();
      
      expect(json).toEqual({
        name: 'test name',
        value: 42
      });
    });
  });

  describe('Aggregate Root Interface', () => {
    it('should implement AggregateRoot interface', () => {
      const aggregate: AggregateRoot<TestEntityData> = new TestAggregate('test-id');
      
      expect(aggregate.id).toBeDefined();
      expect(aggregate.version).toBeDefined();
      expect(aggregate.uncommittedEvents).toBeDefined();
      expect(typeof aggregate.markEventsAsCommitted).toBe('function');
      expect(typeof aggregate.loadFromHistory).toBe('function');
      expect(typeof aggregate.toJson).toBe('function');
    });
  });
}); 