/* eslint-disable @typescript-eslint/no-explicit-any */
import { Result } from "../common/result";
import { Query, QueryBus, QueryHandler } from "./query";

export class InMemoryQueryBus implements QueryBus {
  private handlers = new Map<string, QueryHandler<any, any>>();

  register<TQuery extends Query<TResult>, TResult>(
    queryType: new (...args: any[]) => TQuery,
    handler: QueryHandler<TQuery, TResult>
  ): void {
    this.handlers.set(queryType.name, handler);
  }

  async dispatch<TResult>(query: Query<TResult>): Promise<Result<TResult>> {
    const handlerKey = query.constructor.name;
    const handler = this.handlers.get(handlerKey);

    if (!handler) {
      return Result.withFailure(
        new Error(`No handler registered for query: ${handlerKey}`)
      );
    }

    return handler.handle(query as any);
  }
}
