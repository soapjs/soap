import { Result } from "../common/result";
import { DatabaseSession } from "../data/database-session";
import { Transaction } from "./transaction";
import { TransactionScope } from "./transaction-scope";

/**
 * Class responsible for executing transactions.
 */
export class TransactionRunner {
  private static instances: Map<string, TransactionRunner> = new Map();

  /**
   * Private constructor to ensure singleton pattern.
   */
  private constructor(private transactionScope: TransactionScope) {}

  /**
   * Gets the singleton instance of the TransactionRunner.
   *
   * @returns {TransactionRunner} - The singleton instance.
   */
  public static getInstance(tag = "default"): TransactionRunner {
    if (this.instances.has(tag)) {
      return this.instances.get(tag);
    }

    const instance = new TransactionRunner(TransactionScope.getInstance());
    this.instances = this.instances.set(tag, instance);

    return instance;
  }
  /**
   * Executes the transaction, ensuring that all sessions are properly committed or rolled back.
   *
   * @param {Transaction<T>} transaction - The transaction to be executed.
   * @returns {Promise<Result<T>>} - The result of the transaction.
   */
  async run<T = unknown>(transaction: Transaction<T>): Promise<Result<T>> {
    let result: Result<T>;
    let sessions: DatabaseSession[];

    return this.transactionScope.run(transaction.id, async () => {
      try {
        sessions = transaction.init();
        result = await transaction.execute();

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
