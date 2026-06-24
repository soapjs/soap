import { Result } from "../common/result";
import { DatabaseSession } from "../data/database-session";
import { Transaction, TransactionSessionRef } from "./transaction";
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
    return this.transactionScope.run(transaction.id, async () => {
      let result: Result<T>;
      let sessions: DatabaseSession[] = [];
      const startedSessions: DatabaseSession[] = [];
      let transactionError: unknown;
      let cleanupError: unknown;

      try {
        sessions = transaction.init();

        for (const session of sessions) {
          await session.startTransaction();
          startedSessions.push(session);
        }

        result = await transaction.execute();

        for (const session of sessions) {
          await session.commitTransaction();
        }
      } catch (error) {
        transactionError = error;

        for (const session of startedSessions) {
          try {
            await session.rollbackTransaction();
          } catch {
            // Preserve the original transaction failure.
          }
        }

        result = Result.withFailure(this.toError(error));
      } finally {
        cleanupError = await this.deleteTransactionSessions(
          transaction.getSessionRefs()
        );
        transaction.dispose();
      }

      if (!transactionError && cleanupError) {
        return Result.withFailure(this.toError(cleanupError));
      }

      return result;
    });
  }

  private async deleteTransactionSessions(
    sessionRefs: TransactionSessionRef[]
  ): Promise<unknown> {
    let firstError: unknown;

    for (const sessionRef of sessionRefs) {
      try {
        await sessionRef.registry.deleteSession(sessionRef.session.id);
      } catch (error) {
        if (!firstError) {
          firstError = error;
        }
      }
    }

    return firstError;
  }

  private toError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    return new Error(String(error));
  }
}
