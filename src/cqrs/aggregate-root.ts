import { Entity } from "../domain/entity";
import { DomainEvent, BaseDomainEvent } from "../domain/domain-event";

/**
 * Aggregate Root interface for CQRS pattern
 * Aggregate roots are the entry points for commands and the source of domain events
 */
export interface AggregateRoot<TEntity extends Entity<any>> {
  /**
   * The underlying entity
   */
  readonly entity: TEntity;
  
  /**
   * Current version of the aggregate
   */
  readonly version: number;
  
  /**
   * List of uncommitted domain events
   */
  readonly uncommittedEvents: DomainEvent[];
  
  /**
   * Mark all events as committed
   */
  markEventsAsCommitted(): void;
  
  /**
   * Load aggregate from events (for event sourcing)
   */
  loadFromHistory(events: DomainEvent[]): void;
}

/**
 * Base implementation of Aggregate Root
 */
export abstract class BaseAggregateRoot<TEntity extends Entity<any>> 
  implements AggregateRoot<TEntity> {
  
  public readonly version: number = 0;
  public readonly uncommittedEvents: DomainEvent[] = [];

  constructor(public readonly entity: TEntity) {}

  /**
   * Add a domain event to the uncommitted events list
   */
  protected addDomainEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
  }

  /**
   * Mark all events as committed
   */
  public markEventsAsCommitted(): void {
    this.uncommittedEvents.length = 0;
  }

  /**
   * Load aggregate from history (for event sourcing)
   */
  public loadFromHistory(events: DomainEvent[]): void {
    events.forEach(event => {
      this.apply(event);
    });
  }

  /**
   * Apply a domain event to the aggregate
   * This method should be overridden by subclasses
   */
  protected apply(event: DomainEvent): void {
    // Override in subclasses to handle specific events
  }

  /**
   * Create a domain event with common properties
   */
  protected createDomainEvent(
    eventType: string,
    eventData: any = {}
  ): DomainEvent {
    const aggregateId = this.aggregateId;
    const version = this.version;
    
    return new class extends BaseDomainEvent {
      constructor() {
        super(eventType, aggregateId, eventData, version);
      }
    }();
  }

  /**
   * Get the aggregate ID
   */
  protected get aggregateId(): string {
    return String(this.entity.id);
  }

  /**
   * Get the current version
   */
  protected get currentVersion(): number {
    return this.version;
  }
} 