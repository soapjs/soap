import { Result } from "../domain/result";
import { Source } from "./source";

/**
 * Manages transactions across various data sources.
 */
export class TransactionManager<T> {
  private source: Source<T>;

  constructor(source: Source<T>) {
    this.source = source;
  }

  /**
   * Executes a series of operations within a transaction, using the provided source's transaction methods.
   * @param callback A function containing operations to be executed within the transaction context.
   * @returns A promise that resolves when the transaction has been committed, or rejects if the transaction is aborted.
   */
  async withinTransaction<R>(
    callback: () => Promise<Result<R>>
  ): Promise<Result<R>> {
    const session = await this.source.startSession();
    try {
      const result = await callback();
      await this.source.commitTransaction();
      return result;
    } catch (error) {
      await this.source.rollbackTransaction();
      return Result.withFailure(error);
    }
  }
}
