import { Result } from "../common/result";

/**
 * Base interface for all domain events in CQRS pattern
 * Events represent something that happened in the domain
 */
export interface DomainEvent {
  /**
   * Unique identifier for the event
   */
  readonly eventId: string;
  
  /**
   * Type/name of the event
   */
  readonly eventType: string;
  
  /**
   * Timestamp when the event occurred
   */
  readonly occurredOn: Date;
  
  /**
   * Version of the aggregate that produced this event
   */
  readonly version?: number;
  
  /**
   * Aggregate ID that produced this event
   */
  readonly aggregateId?: string;
  
  /**
   * Correlation ID for tracking related operations
   */
  readonly correlationId?: string;
  
  /**
   * User or system that initiated the operation that led to this event
   */
  readonly initiatedBy?: string;
}

/**
 * Base class for domain events with common properties
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly occurredOn: Date;
  public readonly version?: number;
  public readonly aggregateId?: string;
  public readonly correlationId?: string;
  public readonly initiatedBy?: string;

  constructor(
    eventType: string,
    aggregateId?: string,
    version?: number,
    initiatedBy?: string,
    correlationId?: string
  ) {
    this.eventId = this.generateEventId();
    this.eventType = eventType;
    this.occurredOn = new Date();
    this.version = version;
    this.aggregateId = aggregateId;
    this.correlationId = correlationId;
    this.initiatedBy = initiatedBy;
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Event handler interface
 * Handlers process domain events
 */
export interface EventHandler<TEvent extends DomainEvent> {
  /**
   * Handle the domain event
   */
  handle(event: TEvent): Promise<Result<void>>;
}

/**
 * Event bus interface for publishing events
 */
export interface DomainEventBus {
  /**
   * Publish a domain event
   */
  publish(event: DomainEvent): Promise<Result<void>>;
  
  /**
   * Subscribe to a specific event type
   */
  subscribe<TEvent extends DomainEvent>(
    eventType: new (...args: any[]) => TEvent,
    handler: EventHandler<TEvent>
  ): void;
  
  /**
   * Unsubscribe from a specific event type
   */
  unsubscribe<TEvent extends DomainEvent>(
    eventType: new (...args: any[]) => TEvent,
    handler: EventHandler<TEvent>
  ): void;
} 