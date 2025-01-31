/* eslint-disable @typescript-eslint/no-explicit-any */
import { Result } from "../common/result";
import { DatabaseContext } from "../data/repository-data-contexts";
import { isRepository } from "../data/base-repository";
import { DatabaseSession } from "../data/database-session";

/**
 * Abstract class representing a transaction.
 * Manages the lifecycle of database sessions and ensures that transactions are properly committed or rolled back.
 *
 * @template T - The type of the result returned by the perform method.
 */
export abstract class Transaction<T = unknown> {
  /** Unique identifier for the transaction executor instance. */
  public readonly id: string = Math.random().toString(36).substring(2, 15);

  /** List of database sessions associated with the transaction. */
  protected sessions: DatabaseSession[] = [];
  protected components: unknown[] = [];

  /**
   * Creates an instance of Transaction.
   * Prepares database sessions based on the provided components.
   *
   * @param {...unknown[]} args - The components to be checked for session creation.
   */
  constructor(...args: unknown[]) {
    const components = [...args];
    const propertyNames = Object.getOwnPropertyNames(this) as (keyof this)[];
    for (const propertyName of propertyNames) {
      const propertyValue = this[propertyName];
      if (Reflect.getMetadata("useSession", this, <string>propertyName)) {
        components.push(propertyValue);
      }
    }
    this.components = components;
  }

  /**
   * Initializes the database sessions based on the provided components.
   * @returns {DatabaseSession[]} - The list of initialized database sessions.
   */
  public init(): DatabaseSession[] {
    this.components.forEach((component) => {
      if (Reflect.getMetadata("useSession", component)) {
        if (
          isRepository(component) &&
          DatabaseContext.isDatabaseContext(component.context) &&
          !component.context.sessions.hasSession(this.id)
        ) {
          const session = component.context.sessions.createSession(this.id);
          this.sessions.push(session);
        }
      }
    });

    return this.sessions;
  }

  /**
   * Disposes of the database sessions.
   */
  dispose() {
    this.sessions = [];
  }

  /**
   * Abstract method to perform the actual transaction operations.
   * This method must be implemented by subclasses.
   *
   * @param {...unknown[]} args - The arguments required for the transaction operation.
   * @returns {Promise<Result<T>>} - The result of the transaction operation.
   */
  public abstract execute(...args: unknown[]): Promise<Result<T>>;

  /**
   * Aborts the transaction by throwing an error with the given message.
   *
   * @param {string} [message] - The message to be included in the error.
   * @throws {Error} - Throws an error with the provided message.
   */
  abort(message?: string) {
    throw new Error(message);
  }
}
