import { Result } from "../common/result";
import { DomainEvent } from "./event";

/**
 * Event Store interface for CQRS pattern
 * Stores and retrieves domain events for event sourcing
 */
export interface EventStore {
  /**
   * Append events to the event store
   */
  appendEvents(
    aggregateId: string,
    expectedVersion: number,
    events: DomainEvent[]
  ): Promise<Result<void>>;
  
  /**
   * Get all events for an aggregate
   */
  getEvents(aggregateId: string): Promise<Result<DomainEvent[]>>;
  
  /**
   * Get events for an aggregate from a specific version
   */
  getEventsFromVersion(
    aggregateId: string, 
    fromVersion: number
  ): Promise<Result<DomainEvent[]>>;
  
  /**
   * Get events by type
   */
  getEventsByType(eventType: string): Promise<Result<DomainEvent[]>>;
  
  /**
   * Get events by correlation ID
   */
  getEventsByCorrelationId(correlationId: string): Promise<Result<DomainEvent[]>>;
  
  /**
   * Get events in a time range
   */
  getEventsInTimeRange(
    fromDate: Date,
    toDate: Date
  ): Promise<Result<DomainEvent[]>>;
}

/**
 * Event Store Entry - wrapper for storing events
 */
export interface EventStoreEntry {
  /**
   * Unique identifier for the event store entry
   */
  readonly id: string;
  
  /**
   * Aggregate ID that produced this event
   */
  readonly aggregateId: string;
  
  /**
   * Version of the aggregate when this event was produced
   */
  readonly aggregateVersion: number;
  
  /**
   * The actual domain event
   */
  readonly event: DomainEvent;
  
  /**
   * Timestamp when the event was stored
   */
  readonly storedAt: Date;
  
  /**
   * Stream name (optional, for organizing events)
   */
  readonly streamName?: string;
} 