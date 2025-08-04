import { Entity } from "../domain/entity";
import { DomainEvent, BaseDomainEvent } from "./event";
import { Result } from "../common/result";

/**
 * Aggregate Root interface for CQRS pattern
 * Aggregate roots are the entry points for commands and the source of domain events
 */
export interface AggregateRoot<EntityType = unknown> extends Entity<EntityType> {
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
export abstract class BaseAggregateRoot<EntityType = unknown> 
  implements AggregateRoot<EntityType> {
  
  public readonly version: number = 0;
  public readonly uncommittedEvents: DomainEvent[] = [];
  public id?: string;
  public rest?: EntityType;

  constructor(id?: string) {
    this.id = id;
  }

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
        super(eventType, aggregateId, version);
        Object.assign(this, eventData);
      }
    }();
  }

  /**
   * Get the aggregate ID
   */
  protected get aggregateId(): string {
    return this.id || '';
  }

  /**
   * Get the current version
   */
  protected get currentVersion(): number {
    return this.version;
  }

  /**
   * Convert to JSON representation
   */
  public toJson(): EntityType {
    return this.rest || {} as EntityType;
  }
} 