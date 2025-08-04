import { Result } from "../common/result";

/**
 * Read Model interface for CQRS pattern
 * Read models are optimized for querying and don't contain business logic
 */
export interface ReadModel<TData = unknown> {
  /**
   * Unique identifier for the read model
   */
  readonly id: string;
  
  /**
   * Data contained in the read model
   */
  readonly data: TData;
  
  /**
   * Version of the read model
   */
  readonly version: number;
  
  /**
   * Timestamp when the read model was last updated
   */
  readonly lastUpdated: Date;
}

/**
 * Base implementation of Read Model
 */
export abstract class BaseReadModel<TData = unknown> implements ReadModel<TData> {
  public readonly id: string;
  public readonly data: TData;

  private _version: number;
  private _lastUpdated: Date;

  constructor(id: string, data: TData, version: number = 0) {
    this.id = id;
    this.data = data;
    this._version = version;
    this._lastUpdated = new Date();
  }

  get lastUpdated(): Date {
    return this._lastUpdated;
  }

  get version(): number {
    return this._version;
  }

  /**
   * Update the read model with new data
   */
  public update(newData: Partial<TData>): void {
    Object.assign(this.data, newData);
    this._lastUpdated = new Date();
  }

  /**
   * Increment the version
   */
  public incrementVersion(): void {
    this._version++;
  }
}

/**
 * Read Model Repository interface
 * Specialized for read models with optimized query methods
 */
export interface ReadModelRepository<TReadModel extends ReadModel> {
  /**
   * Find a read model by ID
   */
  findById(id: string): Promise<Result<TReadModel | null>>;
  
  /**
   * Find multiple read models
   */
  find(criteria?: any): Promise<Result<TReadModel[]>>;
  
  /**
   * Save or update a read model
   */
  save(readModel: TReadModel): Promise<Result<TReadModel>>;
  
  /**
   * Delete a read model
   */
  delete(id: string): Promise<Result<void>>;
  
  /**
   * Count read models
   */
  count(criteria?: any): Promise<Result<number>>;
}
