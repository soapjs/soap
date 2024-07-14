import { AsyncLocalStorage } from "async_hooks";

/**
 * Class for managing transaction storage using AsyncLocalStorage.
 */
export class TransactionStorage {
  private static instance: TransactionStorage;
  private asyncLocalStorage: AsyncLocalStorage<string>;

  /**
   * Private constructor to ensure singleton pattern.
   */
  private constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage<string>();
  }

  /**
   * Gets the singleton instance of the TransactionStorage.
   *
   * @returns {TransactionStorage} - The singleton instance.
   */
  public static getInstance(): TransactionStorage {
    if (!this.instance) {
      this.instance = new TransactionStorage();
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
