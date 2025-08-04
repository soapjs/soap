import { Result } from "../common/result";

/**
 * Base interface for all queries in CQRS pattern
 * Queries represent read operations that don't change the system state
 */
export interface Query<TResult = unknown> {
  /**
   * Unique identifier for the query
   */
  readonly queryId?: string;
  
  /**
   * Timestamp when the query was created
   */
  readonly timestamp?: Date;
  
  /**
   * User or system that initiated the query
   */
  readonly initiatedBy?: string;
  
  /**
   * Correlation ID for tracking related operations
   */
  readonly correlationId?: string;
}

/**
 * Base class for queries with common properties
 */
export abstract class BaseQuery<TResult = unknown> implements Query<TResult> {
  public readonly queryId: string;
  public readonly timestamp: Date;
  public readonly initiatedBy?: string;
  public readonly correlationId?: string;

  constructor(initiatedBy?: string, correlationId?: string) {
    this.queryId = this.generateQueryId();
    this.timestamp = new Date();
    this.initiatedBy = initiatedBy;
    this.correlationId = correlationId;
  }

  /**
   * Generate a unique query ID
   */
  private generateQueryId(): string {
    return `qry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Query handler interface
 * Handlers process queries and return results
 */
export interface QueryHandler<TQuery extends Query<TResult>, TResult = unknown> {
  /**
   * Handle the query and return a result
   */
  handle(query: TQuery): Promise<Result<TResult>>;
}

/**
 * Query bus interface for dispatching queries
 */
export interface QueryBus {
  /**
   * Dispatch a query to its handler
   */
  dispatch<TResult>(query: Query<TResult>): Promise<Result<TResult>>;
  
  /**
   * Register a query handler
   */
  register<TQuery extends Query<TResult>, TResult>(
    queryType: new (...args: any[]) => TQuery,
    handler: QueryHandler<TQuery, TResult>
  ): void;
} 