import { DatabaseSession } from "./database-session";
import { TransactionStorage } from "./transaction-storage";

/**
 * Interface representing a registry for managing database sessions.
 */
export interface DatabaseSessionRegistry {
  /**
   * The transaction storage instance used for managing transaction contexts.
   * @type {TransactionStorage}
   */
  readonly transactionStorage: TransactionStorage;

  /**
   * Creates a new database session.
   *
   * @param {...unknown[]} args - Additional arguments required for session creation.
   * @returns {DatabaseSession} - The created database session.
   */
  createSession(...args: unknown[]): DatabaseSession;

  /**
   * Deletes a database session by its identifier.
   *
   * @param {string} id - The unique identifier of the session to be deleted.
   * @param {...unknown[]} args - Additional arguments required for session deletion.
   */
  deleteSession(id: string, ...args: unknown[]): void;

  /**
   * Retrieves a database session by its identifier.
   *
   * @param {string} id - The unique identifier of the session to be retrieved.
   * @param {...unknown[]} args - Additional arguments required for session retrieval.
   * @returns {DatabaseSession | undefined} - The retrieved database session, or undefined if no session exists for the given identifier.
   */
  getSession(id: string, ...args: unknown[]): DatabaseSession | undefined;

  /**
   * Checks if a session exists for the given identifier.
   *
   * @param {string} id - The unique identifier of the session to be checked.
   * @returns {boolean} - True if a session exists for the given identifier, otherwise false.
   */
  hasSession(id: string): boolean;
}
