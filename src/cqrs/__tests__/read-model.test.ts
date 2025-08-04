import { BaseReadModel, ReadModel } from '../read-model';
import { Result } from '../../common/result';

describe('Read Model Pattern', () => {
  interface TestReadModelData {
    name: string;
    count: number;
    active: boolean;
  }

  class TestReadModel extends BaseReadModel<TestReadModelData> {
    constructor(id: string, data: TestReadModelData, version: number = 0) {
      super(id, data, version);
    }
  }

  describe('BaseReadModel', () => {
    it('should create read model with basic properties', () => {
      const data: TestReadModelData = {
        name: 'test',
        count: 42,
        active: true
      };
      
      const readModel = new TestReadModel('test-id', data, 1);
      
      expect(readModel.id).toBe('test-id');
      expect(readModel.data).toEqual(data);
      expect(readModel.version).toBe(1);
      expect(readModel.lastUpdated).toBeInstanceOf(Date);
    });

    it('should create read model with default version', () => {
      const data: TestReadModelData = {
        name: 'test',
        count: 0,
        active: false
      };
      
      const readModel = new TestReadModel('test-id', data);
      
      expect(readModel.version).toBe(0);
    });

    it('should update read model data', () => {
      const data: TestReadModelData = {
        name: 'test',
        count: 0,
        active: false
      };
      
      const readModel = new TestReadModel('test-id', data);
      const originalLastUpdated = readModel.lastUpdated;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        readModel.update({ count: 42, active: true });
        
        expect(readModel.data.count).toBe(42);
        expect(readModel.data.active).toBe(true);
        expect(readModel.data.name).toBe('test'); // unchanged
        expect(readModel.lastUpdated.getTime()).toBeGreaterThan(originalLastUpdated.getTime());
      }, 1);
    });

    it('should increment version', () => {
      const data: TestReadModelData = {
        name: 'test',
        count: 0,
        active: false
      };
      
      const readModel = new TestReadModel('test-id', data, 1);
      
      readModel.incrementVersion();
      
      expect(readModel.version).toBe(2);
    });

    it('should return correct last updated timestamp', () => {
      const data: TestReadModelData = {
        name: 'test',
        count: 0,
        active: false
      };
      
      const readModel = new TestReadModel('test-id', data);
      
      expect(readModel.lastUpdated).toBeInstanceOf(Date);
      expect(readModel.lastUpdated.getTime()).toBeCloseTo(Date.now(), -2); // Within 100ms
    });
  });

  describe('Read Model Interface', () => {
    it('should implement ReadModel interface', () => {
      const data: TestReadModelData = {
        name: 'test',
        count: 0,
        active: false
      };
      
      const readModel: ReadModel<TestReadModelData> = new TestReadModel('test-id', data);
      
      expect(readModel.id).toBeDefined();
      expect(readModel.data).toBeDefined();
      expect(readModel.version).toBeDefined();
      expect(readModel.lastUpdated).toBeDefined();
    });
  });

  describe('Read Model Repository Interface', () => {
    interface ReadModelRepository<T> {
      findById(id: string): Promise<Result<T | null>>;
      find(criteria?: any): Promise<Result<T[]>>;
      save(model: T): Promise<Result<T>>;
      delete(id: string): Promise<Result<void>>;
      count(criteria?: any): Promise<Result<number>>;
    }

    class MockReadModelRepository implements ReadModelRepository<TestReadModel> {
      private models = new Map<string, TestReadModel>();

      async findById(id: string): Promise<Result<TestReadModel | null>> {
        const model = this.models.get(id) || null;
        return Result.withSuccess(model);
      }

      async find(criteria?: any): Promise<Result<TestReadModel[]>> {
        const models = Array.from(this.models.values());
        return Result.withSuccess(models);
      }

      async save(model: TestReadModel): Promise<Result<TestReadModel>> {
        this.models.set(model.id, model);
        return Result.withSuccess(model);
      }

      async delete(id: string): Promise<Result<void>> {
        this.models.delete(id);
        return Result.withSuccess();
      }

      async count(criteria?: any): Promise<Result<number>> {
        return Result.withSuccess(this.models.size);
      }
    }

    it('should save and retrieve read model', async () => {
      const repository = new MockReadModelRepository();
      const data: TestReadModelData = {
        name: 'test',
        count: 42,
        active: true
      };
      
      const readModel = new TestReadModel('test-id', data);
      
      const saveResult = await repository.save(readModel);
      expect(saveResult.isSuccess()).toBe(true);
      
      const findResult = await repository.findById('test-id');
      expect(findResult.isSuccess()).toBe(true);
      expect(findResult.content).toEqual(readModel);
    });

    it('should return null for non-existent read model', async () => {
      const repository = new MockReadModelRepository();
      
      const result = await repository.findById('non-existent');
      
      expect(result.isSuccess()).toBe(true);
      expect(result.content).toBeNull();
    });

    it('should delete read model', async () => {
      const repository = new MockReadModelRepository();
      const data: TestReadModelData = {
        name: 'test',
        count: 0,
        active: false
      };
      
      const readModel = new TestReadModel('test-id', data);
      await repository.save(readModel);
      
      const deleteResult = await repository.delete('test-id');
      expect(deleteResult.isSuccess()).toBe(true);
      
      const findResult = await repository.findById('test-id');
      expect(findResult.content).toBeNull();
    });

    it('should count read models', async () => {
      const repository = new MockReadModelRepository();
      const data: TestReadModelData = {
        name: 'test',
        count: 0,
        active: false
      };
      
      await repository.save(new TestReadModel('id1', data));
      await repository.save(new TestReadModel('id2', data));
      
      const countResult = await repository.count();
      
      expect(countResult.isSuccess()).toBe(true);
      expect(countResult.content).toBe(2);
    });
  });
}); 