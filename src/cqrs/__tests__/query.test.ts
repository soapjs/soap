import { BaseQuery, Query, QueryHandler, QueryBus } from '../query';
import { Result } from '../../common/result';

describe('Query Pattern', () => {
  describe('BaseQuery', () => {
    class TestQuery extends BaseQuery<string> {
      constructor(
        public readonly filter: string,
        initiatedBy?: string,
        correlationId?: string
      ) {
        super(initiatedBy, correlationId);
      }
    }

    it('should create a query with unique ID', () => {
      const query = new TestQuery('test filter');
      
      expect(query.queryId).toBeDefined();
      expect(query.queryId).toMatch(/^qry_\d+_[a-z0-9]+$/);
      expect(query.timestamp).toBeInstanceOf(Date);
    });

    it('should create a query with custom initiatedBy and correlationId', () => {
      const query = new TestQuery('test filter', 'user-123', 'corr-456');
      
      expect(query.initiatedBy).toBe('user-123');
      expect(query.correlationId).toBe('corr-456');
    });

    it('should have different IDs for different queries', () => {
      const query1 = new TestQuery('filter1');
      const query2 = new TestQuery('filter2');
      
      expect(query1.queryId).not.toBe(query2.queryId);
    });
  });

  describe('QueryHandler', () => {
    class TestQuery extends BaseQuery<string> {
      constructor(public readonly filter: string) {
        super();
      }
    }

    class TestQueryHandler implements QueryHandler<TestQuery, string> {
      async handle(query: TestQuery): Promise<Result<string>> {
        return Result.withSuccess(`Query result for: ${query.filter}`);
      }
    }

    it('should handle query and return success result', async () => {
      const handler = new TestQueryHandler();
      const query = new TestQuery('test filter');
      
      const result = await handler.handle(query);
      
      expect(result.isSuccess()).toBe(true);
      expect(result.content).toBe('Query result for: test filter');
    });
  });

  describe('QueryBus', () => {
    class TestQuery extends BaseQuery<string> {
      constructor(public readonly filter: string) {
        super();
      }
    }

    class TestQueryHandler implements QueryHandler<TestQuery, string> {
      async handle(query: TestQuery): Promise<Result<string>> {
        return Result.withSuccess(`Query result for: ${query.filter}`);
      }
    }

    class MockQueryBus implements QueryBus {
      private handlers = new Map<string, QueryHandler<any, any>>();

      async dispatch<TResult>(query: Query<TResult>): Promise<Result<TResult>> {
        const handler = this.handlers.get(query.constructor.name);
        if (!handler) {
          return Result.withFailure(new Error('No handler registered'));
        }
        return handler.handle(query);
      }

      register<TQuery extends Query<TResult>, TResult>(
        queryType: new (...args: any[]) => TQuery,
        handler: QueryHandler<TQuery, TResult>
      ): void {
        this.handlers.set(queryType.name, handler);
      }
    }

    it('should register and dispatch queries', async () => {
      const bus = new MockQueryBus();
      const handler = new TestQueryHandler();
      
      bus.register(TestQuery, handler);
      
      const query = new TestQuery('test filter');
      const result = await bus.dispatch(query);
      
      expect(result.isSuccess()).toBe(true);
      expect(result.content).toBe('Query result for: test filter');
    });

    it('should return failure when no handler is registered', async () => {
      const bus = new MockQueryBus();
      const query = new TestQuery('test filter');
      
      const result = await bus.dispatch(query);
      
      expect(result.isFailure()).toBe(true);
      expect(result.failure.error.message).toBe('No handler registered');
    });
  });
}); 