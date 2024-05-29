import { Query, RemoveStats, AnyObject, UpdateStats } from "../domain/types";
import { QueryFactory } from "./query-factory";

/**
 * @interface
 * Represents a general interface for the data sources in the application.
 *
 * This interface should be implemented by concrete data source classes that interact with a specific type of database.
 */
export interface Source<DocumentType = unknown> {
  collectionName: string;
  queries: QueryFactory;

  /**
   * Abstract method to find documents in the data source that match the provided query.
   *
   * @param {Query} [query] The search criteria.
   * @returns {Promise<DocumentType[]>} A promise that resolves to an array of documents
   */
  find(query?: Query): Promise<DocumentType[]>;

  /**
   * Abstract method to count documents in the data source that match the provided query.
   *
   * @param {Query} [query] The search criteria.
   * @returns {Promise<number>} A promise that resolves to the count of documents.
   */
  count(query?: Query): Promise<number>;

  /**
   * Abstract method to perform an aggregation operation on the data source.
   *
   * @param {Query} query The aggregation criteria.
   * @returns {Promise<T[]>} A promise that resolves to the result of the aggregation operation.
   */
  aggregate<T = DocumentType>(query: Query): Promise<T[]>;

  /**
   * Abstract method to update documents in the data source.
   *
   * @param {Query} query The update criteria and new document data.
   * @returns {Promise<UpdateStats>} A promise that resolves to the update statistics.
   */
  update(query: Query): Promise<UpdateStats>;

  /**
   * Abstract method to insert documents into the data source.
   *
   * @param {Query} query The documents to insert.
   * @returns {Promise<DocumentType[]>} A promise that resolves to the inserted documents.
   */
  insert(query: Query): Promise<DocumentType[]>;

  /**
   * Abstract method to remove documents from the data source.
   *
   * @param {Query} query The removal criteria.
   * @returns {Promise<RemoveStats>} A promise that resolves to the removal statistics.
   */
  remove(query: Query): Promise<RemoveStats>;

  /**
   * Abstract method to start a database transaction.
   *
   * @param {AnyObject} [options] Transaction options.
   * @returns {Promise<void>} A promise that resolves when the transaction starts.
   */
  startTransaction(options?: AnyObject): Promise<void>;

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
