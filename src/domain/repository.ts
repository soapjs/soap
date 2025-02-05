/* eslint-disable @typescript-eslint/no-unused-vars */
import { QueryBuilder } from "./query-builder";
import { Result } from "../common/result";
import { RemoveStats, UpdateStats } from "./types";
import { Mapper } from "../data/mapper";
import {
  AggregationParams,
  CountParams,
  FindParams,
  RemoveParams,
  UpdateParams,
} from "./params";

/**
 * Represents a ReadOnlyRepository interface.
 * @abstract
 * @template EntityType - The type of the entity in the repository.
 */
export abstract class ReadOnlyRepository<EntityType = unknown> {
  /**
   * Retrieves the count of entities based on the provided parameters or query builder.
   * @interface
   * @param {CountParams | QueryBuilder} paramsOrBuilder - The parameters or query builder for counting entities.
   * @returns {Promise<Result<number>>} A promise that resolves to the count of entities.
   */
  abstract count(
    paramsOrBuilder?: CountParams | QueryBuilder
  ): Promise<Result<number>>;

  /**
   * Finds entities based on the provided parameters or query builder.
   * @interface
   * @param {FindParams | QueryBuilder} paramsOrBuilder - The parameters or query builder for finding entities.
   * @returns {Promise<Result<EntityType[]>>} A promise that resolves to an array of found entities.
   */
  abstract find(
    paramsOrBuilder?: FindParams | QueryBuilder
  ): Promise<Result<EntityType[]>>;
}

/**
 * Represents a Repository interface.
 * @interface
 * @template EntityType - The type of the entity in the repository.
 * @template DocumentType - The type of the document in the repository.
 */
export abstract class Repository<
  EntityType = unknown,
  DocumentType = unknown
> extends ReadOnlyRepository<EntityType> {
  /**
   * Executes an aggregation operation on the data source.
   *
   * @param {AggregationParams | QueryBuilder} paramsOrBuilder The parameters or QueryBuilder for the aggregation operation.
   * @param {Mapper<ResultType, AggregationType>?} mapper The Mapper used for ResultType-AggregationType transformations (optional).
   *
   * @returns {Promise<Result<ResultType, Error>>} The result of the aggregation operation.
   */
  abstract aggregate<
    ResultType = EntityType | EntityType[],
    AggregationType = DocumentType
  >(
    paramsOrBuilder: AggregationParams | QueryBuilder,
    mapper?: Mapper<ResultType, AggregationType>
  ): Promise<Result<ResultType>>;

  /**
   * Updates entities based on the provided parameters or query builder.
   * @abstract
   * @param {UpdateParams | QueryBuilder} paramsOrBuilder - The parameters or query builder for updating entities.
   * @returns {Promise<Result<UpdateStats>>} A promise that resolves to the update statistics.
   */
  abstract update(
    paramsOrBuilder: UpdateParams | QueryBuilder
  ): Promise<Result<UpdateStats>>;

  /**
   * Adds entities to the repository.
   * @abstract
   * @param {EntityType[]} entities - An array of entities to be added.
   * @returns {Promise<Result<EntityType[]>>} A promise that resolves to an array of added entities.
   */
  abstract add(entities: EntityType[]): Promise<Result<EntityType[]>>;

  /**
   * Removes entities based on the provided parameters or query builder.
   * @abstract
   * @param {RemoveParams | QueryBuilder} paramsOrBuilder - The parameters or query builder for removing entities.
   * @returns {Promise<Result<RemoveStats>>} A promise that resolves to the remove statistics.
   */
  abstract remove(
    paramsOrBuilder: RemoveParams | QueryBuilder
  ): Promise<Result<RemoveStats>>;
}
