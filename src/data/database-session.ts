import { AnyObject } from "../domain/types";

/**
 * Interface representing a database session.
 */
export interface DatabaseSession {
  /**
   * Session ID
   * @type {string}
   */
  id: string;

  /**
   * Abstract method to end a database session.
   *
   * @param {AnyObject} [options] Session options.
   * @returns {Promise<void>} A promise that resolves when the session ends.
   */
  end(options?: AnyObject): Promise<void>;

  /**
   * Abstract method to start a database transaction.
   *
   * @param {AnyObject} [options] Transaction options.
   * @returns {Promise<any>} A promise that resolves when the transaction starts.
   */
  startTransaction(options?: AnyObject): Promise<any>;

  /**
   * Abstract method to commit a database transaction.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction commits.
   */
  commitTransaction(): Promise<void>;

  /**
   * Abstract method to rollback a database transaction.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction rollbacks.
   */
  rollbackTransaction(): Promise<void>;
}
