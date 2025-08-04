/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AggregationParams,
  CountParams,
  FindParams,
  RemoveParams,
  UpdateMethod,
} from "../domain/params";
import { DbQuery } from "../domain/types";
import { Where } from "../domain/where";

/**
 * @class
 * Represents a collection of query builders for different types of operations.
 */
export interface DbQueryFactory {
  /**
   * Builds a query for find operations.
   *
   * @param {FindParams} params The parameters for the find operation.
   *
   * @returns {Query} The query for the find operation.
   */
  createFindQuery(params: FindParams, ...args: any[]): DbQuery;

  /**
   * Builds a query for count operations.
   *
   * @param {CountParams} params The parameters for the count operation.
   *
   * @returns {Query} The query for the count operation.
   */
  createCountQuery(params: CountParams, ...args: any[]): DbQuery;

  /**
   * Builds a query for update operations.
   *
   * @template UpdateType The type of updates being performed.
   * @param {UpdateType[]} updates An array of updates (entities or partial entity data to apply).
   * @param {Where[]} where An array of conditions to specify which documents to update.
   * @param {UpdateMethod[]} methods List of the methods used for updating the documents.
   *
   * @returns {Query} The query for the update operation.
   */
  createUpdateQuery<UpdateType = unknown>(
    updates: UpdateType[],
    where: Where[],
    methods: UpdateMethod[],
    ...args: any[]
  ): DbQuery;

  /**
   * Builds a query for remove operations.
   *
   * @param {RemoveParams} params The parameters for the remove operation.
   *
   * @returns {Query} The query for the remove operation.
   */
  createRemoveQuery(
    params: RemoveParams,
    ...args: any[]
  ): DbQuery;

  /**
   * Builds a query for aggregation operations.
   *
   * @param {AggregationParams} params The parameters for the aggregation operation.
   *
   * @returns {Query} The query for the aggregation operation.
   */
  createAggregationQuery(
    params: AggregationParams,
    ...args: any[]
  ): DbQuery;
}
