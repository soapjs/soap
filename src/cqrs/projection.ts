import { Result } from "../common/result";
import { DomainEvent } from "../domain/domain-event";
import { ReadModel } from "./read-model";

/**
 * Projection interface for building read models from events
 */
export interface Projection<TReadModel extends ReadModel> {
  /**
   * Project an event to update the read model
   */
  project(event: DomainEvent, readModel?: TReadModel): Promise<Result<TReadModel>>;
  
  /**
   * Get the read model type this projection handles
   */
  getReadModelType(): new (...args: any[]) => TReadModel;
  
  /**
   * Get the event types this projection handles
   */
  getEventTypes(): string[];
  
  /**
   * Initialize a new read model
   */
  initialize(id: string): Promise<Result<TReadModel>>;
}

/**
 * Projection Manager for managing multiple projections
 */
export interface ProjectionManager {
  /**
   * Register a projection
   */
  register<TReadModel extends ReadModel>(
    projection: Projection<TReadModel>
  ): void;
  
  /**
   * Process an event through all registered projections
   */
  processEvent(event: DomainEvent): Promise<Result<void>>;
  
  /**
   * Process multiple events
   */
  processEvents(events: DomainEvent[]): Promise<Result<void>>;
  
  /**
   * Get all projections
   */
  getProjections(): Projection<any>[];
  
  /**
   * Get projections for a specific event type
   */
  getProjectionsForEventType(eventType: string): Projection<any>[];
}

/**
 * Base projection implementation
 */
export abstract class BaseProjection<TReadModel extends ReadModel> 
  implements Projection<TReadModel> {
  
  /**
   * Project an event to update the read model
   */
  abstract project(event: DomainEvent, readModel?: TReadModel): Promise<Result<TReadModel>>;
  
  /**
   * Get the read model type this projection handles
   */
  abstract getReadModelType(): new (...args: any[]) => TReadModel;
  
  /**
   * Get the event types this projection handles
   */
  abstract getEventTypes(): string[];
  
  /**
   * Initialize a new read model
   */
  async initialize(id: string): Promise<Result<TReadModel>> {
    try {
      const ReadModelClass = this.getReadModelType();
      const readModel = new ReadModelClass(id, {} as any, 0);
      return Result.withSuccess(readModel);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  /**
   * Check if this projection handles a specific event type
   */
  handlesEventType(eventType: string): boolean {
    return this.getEventTypes().includes(eventType);
  }
} 