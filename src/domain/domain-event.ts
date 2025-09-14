import { Event, EventMetadata } from "../common";

export interface DomainEvent<TData = Record<string, unknown>> extends Event<TData> {
  readonly aggregateId: string;
  readonly version: number;
  readonly metadata?: EventMetadata;
  readonly eventStoreId?: string;
  readonly projectionVersion?: number;
}

/**
 * Base implementation of Domain Event
 */
export abstract class BaseDomainEvent<TData = Record<string, unknown>> implements DomainEvent<TData> {
  public readonly id: string;
  public readonly type: string;
  public readonly timestamp: Date;
  public readonly data: TData;
  public readonly aggregateId: string;
  public readonly version: number;
  public readonly metadata?: EventMetadata;
  public readonly eventStoreId?: string;
  public readonly projectionVersion?: number;
  
  constructor(
    type: string,
    aggregateId: string,
    data: TData,
    version: number = 1,
    metadata?: EventMetadata,
    eventStoreId?: string,
    projectionVersion?: number
  ) {
    this.id = this.generateId();
    this.type = type;
    this.timestamp = new Date();
    this.data = data;
    this.aggregateId = aggregateId;
    this.version = version;
    this.metadata = metadata;
    this.eventStoreId = eventStoreId;
    this.projectionVersion = projectionVersion;
  }

  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}