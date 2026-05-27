import { InMemoryQueryBus } from '../query-bus.impl';
import { BaseQuery, QueryHandler } from '../query';
import { Result } from '../../common/result';

class GetUserQuery extends BaseQuery<string> {
  constructor(public readonly userId: string) {
    super();
  }
}

class GetUserHandler implements QueryHandler<GetUserQuery, string> {
  async handle(query: GetUserQuery): Promise<Result<string>> {
    return Result.withSuccess(`name-of-${query.userId}`);
  }
}

describe('InMemoryQueryBus', () => {
  let bus: InMemoryQueryBus;

  beforeEach(() => {
    bus = new InMemoryQueryBus();
  });

  it('dispatches a query to a registered handler', async () => {
    bus.register(GetUserQuery, new GetUserHandler());

    const result = await bus.dispatch(new GetUserQuery('u1'));

    expect(result.isSuccess()).toBe(true);
    expect(result.content).toBe('name-of-u1');
  });

  it('returns failure when no handler is registered', async () => {
    const result = await bus.dispatch(new GetUserQuery('u2'));

    expect(result.isFailure()).toBe(true);
    expect(result.failure?.error.message).toMatch(/No handler registered for query/);
  });
});
