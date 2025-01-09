import { AsyncLocalStorage } from "async_hooks";

const _asyncLocalStorage = new AsyncLocalStorage<string>();

/**
 * Class for managing transaction scope using AsyncLocalStorage.
 */
export class TransactionScope {
  private static instance: TransactionScope;
  private asyncLocalStorage: AsyncLocalStorage<string>;

  /**
   * Private constructor to ensure singleton pattern.
   */
  private constructor(asyncLocalStorage = _asyncLocalStorage) {
    this.asyncLocalStorage = asyncLocalStorage;
  }

  /**
   * Gets the singleton instance of the TransactionScope.
   *
   * @returns {TransactionScope} - The singleton instance.
   */
  public static getInstance(): TransactionScope {
    if (!this.instance) {
      this.instance = new TransactionScope();
    }
    return this.instance;
  }

  /**
   * Runs a function within a specific transaction context.
   *
   * @param {string} transactionId - The transaction ID to be used as context.
   * @param {() => T} fn - The function to be executed within the transaction context.
   * @returns {T} - The result of the function execution.
   */
  public run<T>(transactionId: string, fn: () => T): T {
    return this.asyncLocalStorage.run(transactionId, fn);
  }

  /**
   * Retrieves the current transaction ID from the context.
   *
   * @returns {string | undefined} - The current transaction ID, or undefined if not set.
   */
  public getTransactionId(): string | undefined {
    return this.asyncLocalStorage.getStore();
  }
}
