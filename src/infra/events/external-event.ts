import { Event, EventMetadata } from "../../common";

/**
 * Represents an external event for inter-service communication via message brokers (RabbitMQ, Kafka, etc.).
 * 
 * This interface extends the base Event with additional fields required for distributed systems:
 * - Correlation tracking across services
 * - Source/destination identification
 * - Event chain tracking for saga patterns
 * 
 * @template TData - The type of the event's payload data
 */
export interface ExternalEvent<TData = Record<string, unknown>> extends Event<TData> {
  /**
   * Optional unique identifier for the event.
   * Usually provided by the message broker when the event is received.
   * Not required when sending events as brokers typically generate their own IDs.
   */
  readonly id?: string;
  
  /**
   * Correlation ID for tracing events across multiple services.
   * Used to group related events in distributed systems.
   * Required for debugging and monitoring event flows.
   */
  readonly correlationId: string;
  
  /**
   * Optional causation ID for event chain tracking.
   * Points to the event that caused this event to be created.
   * Used in saga patterns and event sourcing for maintaining event causality.
   */
  readonly causationId?: string;
  
  /**
   * Required identifier of the service/application that sent the event.
   * Examples: "user-service", "payment-service", "notification-service"
   * Used for tracing, debugging, and audit purposes.
   */
  readonly source: string;
  
  /**
   * Optional target service/application for the event.
   * Examples: "notification-service", "analytics-service"
   * Used for routing and filtering events to specific consumers.
   */
  readonly destination?: string;
  
  /**
   * Optional additional metadata for the event.
   * Can include custom fields like version, priority, tags, etc.
   */
  readonly metadata?: EventMetadata;
}
