import { Result } from "../common/result";

/**
 * Concurrency control interface for CQRS
 * Handles optimistic locking and version conflicts
 */
export interface ConcurrencyControl {
  /**
   * Check if a version conflict exists
   */
  checkVersionConflict(
    aggregateId: string,
    expectedVersion: number,
    currentVersion: number
  ): Promise<Result<boolean>>;
  
  /**
   * Resolve version conflict
   */
  resolveVersionConflict(
    aggregateId: string,
    expectedVersion: number,
    currentVersion: number
  ): Promise<Result<number>>;
  
  /**
   * Get current version for an aggregate
   */
  getCurrentVersion(aggregateId: string): Promise<Result<number>>;
  
  /**
   * Increment version for an aggregate
   */
  incrementVersion(aggregateId: string): Promise<Result<number>>;
}

/**
 * Version conflict error
 */
export class VersionConflictError extends Error {
  constructor(
    public readonly aggregateId: string,
    public readonly expectedVersion: number,
    public readonly currentVersion: number
  ) {
    super(`Version conflict for aggregate ${aggregateId}: expected ${expectedVersion}, got ${currentVersion}`);
    this.name = 'VersionConflictError';
  }
}

/**
 * Optimistic locking interface
 */
export interface OptimisticLock {
  /**
   * Acquire a lock
   */
  acquire(aggregateId: string, timeout?: number): Promise<Result<void>>;
  
  /**
   * Release a lock
   */
  release(aggregateId: string): Promise<Result<void>>;
  
  /**
   * Check if a lock exists
   */
  isLocked(aggregateId: string): Promise<Result<boolean>>;
  
  /**
   * Get lock information
   */
  getLockInfo(aggregateId: string): Promise<Result<LockInfo>>;
}

/**
 * Lock information
 */
export interface LockInfo {
  /**
   * Aggregate ID that is locked
   */
  readonly aggregateId: string;
  
  /**
   * When the lock was acquired
   */
  readonly acquiredAt: Date;
  
  /**
   * Lock timeout
   */
  readonly timeout: number;
  
  /**
   * Who acquired the lock
   */
  readonly acquiredBy?: string;
}

/**
 * Base concurrency control implementation
 */
export abstract class BaseConcurrencyControl implements ConcurrencyControl {
  
  /**
   * Check if a version conflict exists
   */
  async checkVersionConflict(
    aggregateId: string,
    expectedVersion: number,
    currentVersion: number
  ): Promise<Result<boolean>> {
    try {
      const hasConflict = expectedVersion !== currentVersion;
      return Result.withSuccess(hasConflict);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  /**
   * Resolve version conflict
   */
  async resolveVersionConflict(
    aggregateId: string,
    expectedVersion: number,
    currentVersion: number
  ): Promise<Result<number>> {
    try {
      // Default strategy: return current version
      // Subclasses can implement more sophisticated conflict resolution
      return Result.withSuccess(currentVersion);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  /**
   * Get current version for an aggregate
   */
  abstract getCurrentVersion(aggregateId: string): Promise<Result<number>>;
  
  /**
   * Increment version for an aggregate
   */
  abstract incrementVersion(aggregateId: string): Promise<Result<number>>;
} 