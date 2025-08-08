import { DbQuery, RemoveStats, AnyObject, UpdateStats } from "../domain/types";
import { PropertyInfo, ConstructorOf } from "../types";
import { DbQueryFactory } from "./db-query-factory";

/**
 * Defines the options for a source handling data models.
 * This type allows specifying either a model class with `EntityProperty` decorators or a field mapping object, not both.
 * - Use `modelClass` if your data models are defined as classes and decorated with `EntityProperty`. This is the default approach.
 * - Use `modelFieldMappings` if your data models are defined as types, not classes, and you need explicit mapping between
 *   model properties and domain entity fields. This option is necessary when model definitions do not support decorators.
 *
 * @template T - The type of the model.
 * @property {ModelConstructor<T>?} modelClass - Optional. A constructor function for the model that should be used if
 *                                               models are defined as classes. Only specify this if you are using class-based models with decorators.
 * @property {{ [EntityProperty: string]: FieldInfo }?} modelFieldMappings - Optional. An object mapping domain model field names
 *                                                               to their corresponding `FieldInfo`, including database field names and types.
 *                                                               Use this if your models are type-based and cannot use decorators.
 */
export type SourceOptions<T> = {
  modelClass?: ConstructorOf<T>;
  modelFieldMappings?: Record<string, PropertyInfo>;
  queries?: DbQueryFactory;
  [key: string]: unknown;
};

/**
 * @interface
 * Represents a general interface for the data sources in the application.
 *
 * This interface should be implemented by concrete data source classes that interact with a specific type of database.
 */
export interface Source<DocumentType = unknown> {
  collectionName: string;
  options?: SourceOptions<DocumentType>;

  /**
   * Abstract method to find documents in the data source that match the provided query.
   *
   * @param {Query} [query] The search criteria.
   * @returns {Promise<DocumentType[]>} A promise that resolves to an array of documents
   */
  find(query?: DbQuery): Promise<DocumentType[]>;

  /**
   * Abstract method to count documents in the data source that match the provided query.
   *
   * @param {Query} [query] The search criteria.
   * @returns {Promise<number>} A promise that resolves to the count of documents.
   */
  count(query?: DbQuery): Promise<number>;

  /**
   * Abstract method to perform an aggregation operation on the data source.
   *
   * @param {Query} query The aggregation criteria.
   * @returns {Promise<T[]>} A promise that resolves to the result of the aggregation operation.
   */
  aggregate<T = DocumentType>(query: DbQuery): Promise<T[]>;

  /**
   * Abstract method to update documents in the data source.
   *
   * @param {Query} query The update criteria and new document data.
   * @returns {Promise<UpdateStats>} A promise that resolves to the update statistics.
   */
  update(query: DbQuery): Promise<UpdateStats>;

  /**
   * Abstract method to insert documents into the data source.
   *
   * @param {Query} query The documents to insert.
   * @returns {Promise<DocumentType[]>} A promise that resolves to the inserted documents.
   */
  insert(query: DbQuery): Promise<DocumentType[]>;

  /**
   * Abstract method to remove documents from the data source.
   *
   * @param {Query} query The removal criteria.
   * @returns {Promise<RemoveStats>} A promise that resolves to the removal statistics.
   */
  remove(query: DbQuery): Promise<RemoveStats>;
}
