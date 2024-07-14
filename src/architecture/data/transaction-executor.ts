import { Result } from "../domain/result";
import { DatabaseSession } from "./database-session";
import { Transaction } from "./transaction";
import { TransactionStorage } from "./transaction-storage";

/**
 * Class responsible for executing transactions.
 */
export class TransactionExecutor {
  /**
   * Creates an instance of TransactionExecutor.
   *
   * @param {TransactionStorage} transactionStorage - The transaction storage instance.
   */
  constructor(private transactionStorage: TransactionStorage) {}
  /**
   * Executes the transaction, ensuring that all sessions are properly committed or rolled back.
   *
   * @param {Transaction<T>} transaction - The transaction to be executed.
   * @returns {Promise<Result<T>>} - The result of the transaction.
   */
  async execute<T = unknown>(transaction: Transaction<T>): Promise<Result<T>> {
    let result: Result<T>;
    let sessions: DatabaseSession[];

    return this.transactionStorage.run(transaction.id, async () => {
      try {
        sessions = transaction.init();
        result = await transaction.perform();

        for (const session of sessions) {
          await session.commitTransaction();
          await session.end();
        }
      } catch (error) {
        for (const session of sessions) {
          await session.rollbackTransaction();
          await session.end();
        }
        result = Result.withFailure(error);
      } finally {
        transaction.dispose();
      }

      return result;
    });
  }
}
