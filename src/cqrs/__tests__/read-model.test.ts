import { BaseReadModel, ReadModel } from '../read-model';
import { Result } from '../../common/result';
import { ReadWriteRepository } from '../../data/read-write-repository';
import { DatabaseContext } from '../../data/repository-data-contexts';
import { Source } from '../../data/source';
import { Where } from '../../domain/where';

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

  describe('Read Model with Repository', () => {
    const createMockContext = (): DatabaseContext<TestReadModel> => ({
      isDatabaseContext: true,
      source: {
        find: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        update: jest.fn(),
        insert: jest.fn(),
        remove: jest.fn(),
      } as unknown as Source,
      mapper: {
        toEntity: jest.fn((doc: any) => doc as TestReadModel),
        toModel: jest.fn((entity: any) => entity),
      },
      sessions: {
        transactionScope: null,
        createSession: jest.fn(),
        deleteSession: jest.fn(),
        getSession: jest.fn(),
        hasSession: jest.fn(),
      },
      isCacheEnabled: jest.fn().mockReturnValue(false),
      getCacheKey: jest.fn().mockReturnValue('test-key'),
    });

    let repository: ReadWriteRepository<TestReadModel>;
    let context: DatabaseContext<TestReadModel>;

    beforeEach(() => {
      context = createMockContext();
      repository = new ReadWriteRepository(context);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should save and retrieve read model', async () => {
      const data: TestReadModelData = {
        name: 'test',
        count: 42,
        active: true
      };
      
      const readModel = new TestReadModel('test-id', data);
      
      // Mock the repository methods
      (context.source.insert as jest.Mock).mockResolvedValue([readModel]);
      (context.source.find as jest.Mock).mockResolvedValue([readModel]);
      
      const saveResult = await repository.add(readModel);
      expect(saveResult.isSuccess()).toBe(true);
      
      const findResult = await repository.find({ where: new Where().valueOf('id').isEq('test-id') });
      expect(findResult.isSuccess()).toBe(true);
      expect(findResult.content).toEqual([readModel]);
    });

    it('should return empty array for non-existent read model', async () => {
      (context.source.find as jest.Mock).mockResolvedValue([]);
      
      const result = await repository.find({ where: new Where().valueOf('id').isEq('non-existent') });
      
      expect(result.isSuccess()).toBe(true);
      expect(result.content).toEqual([]);
    });

    it('should delete read model', async () => {
      const data: TestReadModelData = {
        name: 'test',
        count: 0,
        active: false
      };
      
      const readModel = new TestReadModel('test-id', data);
      
      // Mock the repository methods
      (context.source.insert as jest.Mock).mockResolvedValue([readModel]);
      (context.source.remove as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      (context.source.find as jest.Mock).mockResolvedValue([]);
      
      await repository.add(readModel);
      
      const deleteResult = await repository.remove({ where: new Where().valueOf('id').isEq('test-id') });
      expect(deleteResult.isSuccess()).toBe(true);
      
      const findResult = await repository.find({ where: new Where().valueOf('id').isEq('test-id') });
      expect(findResult.content).toEqual([]);
    });

    it('should count read models', async () => {
      const data: TestReadModelData = {
        name: 'test',
        count: 0,
        active: false
      };
      
      const readModel1 = new TestReadModel('id1', data);
      const readModel2 = new TestReadModel('id2', data);
      
      // Mock the repository methods
      (context.source.insert as jest.Mock).mockResolvedValue([readModel1, readModel2]);
      (context.source.count as jest.Mock).mockResolvedValue(2);
      
      await repository.add(readModel1, readModel2);
      
      const countResult = await repository.count();
      
      expect(countResult.isSuccess()).toBe(true);
      expect(countResult.content).toBe(2);
    });
  });
}); 