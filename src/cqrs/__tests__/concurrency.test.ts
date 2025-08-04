import { BaseConcurrencyControl, ConcurrencyControl, VersionConflictError, OptimisticLock, LockInfo } from '../concurrency';
import { Result } from '../../common/result';

class TestConcurrencyControl extends BaseConcurrencyControl {
    private versions = new Map<string, number>();

    async getCurrentVersion(aggregateId: string): Promise<Result<number>> {
      const version = this.versions.get(aggregateId) || 0;
      return Result.withSuccess(version);
    }

    async incrementVersion(aggregateId: string): Promise<Result<number>> {
      const currentVersion = this.versions.get(aggregateId) || 0;
      const newVersion = currentVersion + 1;
      this.versions.set(aggregateId, newVersion);
      return Result.withSuccess(newVersion);
    }
  }

describe('Concurrency Control', () => {
  describe('BaseConcurrencyControl', () => {
    

    it('should check version conflict correctly', async () => {
      const control = new TestConcurrencyControl();
      
      const result1 = await control.checkVersionConflict('agg-1', 1, 1);
      expect(result1.isSuccess()).toBe(true);
      expect(result1.content).toBe(false); // No conflict
      
      const result2 = await control.checkVersionConflict('agg-1', 1, 2);
      expect(result2.isSuccess()).toBe(true);
      expect(result2.content).toBe(true); // Conflict
    });

    it('should resolve version conflict by returning current version', async () => {
      const control = new TestConcurrencyControl();
      
      const result = await control.resolveVersionConflict('agg-1', 1, 2);
      
      expect(result.isSuccess()).toBe(true);
      expect(result.content).toBe(2); // Returns current version
    });

    it('should get current version', async () => {
      const control = new TestConcurrencyControl();
      
      const result = await control.getCurrentVersion('agg-1');
      
      expect(result.isSuccess()).toBe(true);
      expect(result.content).toBe(0); // Default version
    });

    it('should increment version', async () => {
      const control = new TestConcurrencyControl();
      
      const result = await control.incrementVersion('agg-1');
      
      expect(result.isSuccess()).toBe(true);
      expect(result.content).toBe(1);
    });
  });

  describe('VersionConflictError', () => {
    it('should create version conflict error with correct message', () => {
      const error = new VersionConflictError('agg-1', 1, 2);
      
      expect(error.name).toBe('VersionConflictError');
      expect(error.message).toBe('Version conflict for aggregate agg-1: expected 1, got 2');
      expect(error.aggregateId).toBe('agg-1');
      expect(error.expectedVersion).toBe(1);
      expect(error.currentVersion).toBe(2);
    });
  });

  describe('OptimisticLock', () => {
    class MockOptimisticLock implements OptimisticLock {
      private locks = new Map<string, LockInfo>();

      async acquire(aggregateId: string, timeout: number = 5000): Promise<Result<void>> {
        if (this.locks.has(aggregateId)) {
          return Result.withFailure(new Error('Lock already acquired'));
        }

        const lockInfo: LockInfo = {
          aggregateId,
          acquiredAt: new Date(),
          timeout,
          acquiredBy: 'test-user'
        };

        this.locks.set(aggregateId, lockInfo);
        return Result.withSuccess();
      }

      async release(aggregateId: string): Promise<Result<void>> {
        if (!this.locks.has(aggregateId)) {
          return Result.withFailure(new Error('Lock not found'));
        }

        this.locks.delete(aggregateId);
        return Result.withSuccess();
      }

      async isLocked(aggregateId: string): Promise<Result<boolean>> {
        return Result.withSuccess(this.locks.has(aggregateId));
      }

      async getLockInfo(aggregateId: string): Promise<Result<LockInfo>> {
        const lockInfo = this.locks.get(aggregateId);
        if (!lockInfo) {
          return Result.withFailure(new Error('Lock not found'));
        }
        return Result.withSuccess(lockInfo);
      }
    }

    it('should acquire lock successfully', async () => {
      const lock = new MockOptimisticLock();
      
      const result = await lock.acquire('agg-1');
      
      expect(result.isSuccess()).toBe(true);
    });

    it('should fail to acquire lock when already locked', async () => {
      const lock = new MockOptimisticLock();
      
      await lock.acquire('agg-1');
      const result = await lock.acquire('agg-1');
      
      expect(result.isFailure()).toBe(true);
      expect(result.failure.error.message).toBe('Lock already acquired');
    });

    it('should release lock successfully', async () => {
      const lock = new MockOptimisticLock();
      
      await lock.acquire('agg-1');
      const result = await lock.release('agg-1');
      
      expect(result.isSuccess()).toBe(true);
    });

    it('should fail to release non-existent lock', async () => {
      const lock = new MockOptimisticLock();
      
      const result = await lock.release('agg-1');
      
      expect(result.isFailure()).toBe(true);
      expect(result.failure.error.message).toBe('Lock not found');
    });

    it('should check if aggregate is locked', async () => {
      const lock = new MockOptimisticLock();
      
      const result1 = await lock.isLocked('agg-1');
      expect(result1.isSuccess()).toBe(true);
      expect(result1.content).toBe(false);
      
      await lock.acquire('agg-1');
      
      const result2 = await lock.isLocked('agg-1');
      expect(result2.isSuccess()).toBe(true);
      expect(result2.content).toBe(true);
    });

    it('should get lock information', async () => {
      const lock = new MockOptimisticLock();
      
      await lock.acquire('agg-1', 10000);
      
      const result = await lock.getLockInfo('agg-1');
      
      expect(result.isSuccess()).toBe(true);
      expect(result.content.aggregateId).toBe('agg-1');
      expect(result.content.timeout).toBe(10000);
      expect(result.content.acquiredBy).toBe('test-user');
      expect(result.content.acquiredAt).toBeInstanceOf(Date);
    });

    it('should fail to get lock info for non-existent lock', async () => {
      const lock = new MockOptimisticLock();
      
      const result = await lock.getLockInfo('agg-1');
      
      expect(result.isFailure()).toBe(true);
      expect(result.failure.error.message).toBe('Lock not found');
    });
  });

  describe('LockInfo', () => {
    it('should have correct lock information structure', () => {
      const lockInfo: LockInfo = {
        aggregateId: 'agg-1',
        acquiredAt: new Date(),
        timeout: 5000,
        acquiredBy: 'test-user'
      };
      
      expect(lockInfo.aggregateId).toBe('agg-1');
      expect(lockInfo.acquiredAt).toBeInstanceOf(Date);
      expect(lockInfo.timeout).toBe(5000);
      expect(lockInfo.acquiredBy).toBe('test-user');
    });
  });

  describe('ConcurrencyControl Interface', () => {
    it('should implement ConcurrencyControl interface', () => {
      const control: ConcurrencyControl = new TestConcurrencyControl();
      
      expect(typeof control.checkVersionConflict).toBe('function');
      expect(typeof control.resolveVersionConflict).toBe('function');
      expect(typeof control.getCurrentVersion).toBe('function');
      expect(typeof control.incrementVersion).toBe('function');
    });
  });
}); 