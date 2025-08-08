import { Failure } from "../common/failure";
import { QueryBuilder } from "../domain/query-builder";
import { ReadOnlyRepository } from "../domain/repository";
import { Result } from "../common/result";
import { Mapper } from "./mapper";
import { DbQuery } from "../domain/types";
import {
  FindParams,
  CountParams,
  AggregationParams,
} from "../domain/params";
import {
  AnyContext,
  BlockchainContext,
  DatabaseContext,
  HttpContext,
  WebSocketContext,
} from "./repository-data-contexts";
import { RepositoryMethodError } from "../domain/errors";

/**
 * @class
 * Represents a read-only repository for querying database data.
 *
 * This repository provides only read operations and should be used when
 * you need to query data without modifying the database contents.
 */
export class ReadRepository<EntityType, DocumentType = unknown>
  implements ReadOnlyRepository<EntityType>
{
  constructor(
    public readonly context:
      | DatabaseContext<EntityType, DocumentType>
      | HttpContext<EntityType, DocumentType>
      | WebSocketContext<EntityType, DocumentType>
      | BlockchainContext<EntityType, DocumentType>
      | AnyContext<EntityType, DocumentType>
  ) {}

  /**
   * Executes an aggregation operation on the data source.
   *
   * @param {AggregationParams | QueryBuilder} paramsOrBuilder The parameters or QueryBuilder for the aggregation operation.
   * @param {Mapper<ResultType, AggregationType>?} mapper The Mapper used for ResultType-AggregationType transformations (optional).
   *
   * @returns {Promise<Result<ResultType>>} The result of the aggregation operation.
   */
  public async aggregate<
    ResultType = EntityType | EntityType[],
    AggregationType = DocumentType
  >(
    paramsOrBuilder: AggregationParams | QueryBuilder,
    mapper?: Mapper<ResultType, AggregationType>
  ): Promise<Result<ResultType>> {
    try {
      let query: DbQuery;

      if (AggregationParams.isAggregationParams(paramsOrBuilder)) {
        query = paramsOrBuilder;
      } else if (QueryBuilder.isQueryBuilder(paramsOrBuilder)) {
        query = paramsOrBuilder.build();
      } else {
        throw new RepositoryMethodError(
          "paramsOrBuilder is neither a QueryBuilder nor a AggregationParams"
        );
      }

      const aggregation = await this.context.source.aggregate(query);
      const conversionMapper = mapper || this.context.mapper;

      if (Array.isArray(aggregation)) {
        return Result.withSuccess(
          aggregation.map((document) =>
            conversionMapper.toEntity(<AggregationType & DocumentType>document)
          ) as ResultType
        );
      }

      return Result.withSuccess(
        conversionMapper.toEntity(aggregation) as ResultType
      );
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Counts the entities in the data source.
   *
   * @param {CountParams | QueryBuilder} paramsOrBuilder The parameters or QueryBuilder for the count operation (optional).
   *
   * @returns {Promise<Result<number>>} The result of the count operation, containing the number of entities or an error.
   */
  public async count(
    paramsOrBuilder?: CountParams | QueryBuilder
  ): Promise<Result<number>> {
    try {
      let query: DbQuery;

      if (CountParams.isCountParams(paramsOrBuilder)) {
        query = paramsOrBuilder;
      } else if (QueryBuilder.isQueryBuilder(paramsOrBuilder)) {
        query = paramsOrBuilder.build();
      } else {
        query = {};
      }

      const count = await this.context.source.count(query);

      return Result.withSuccess(count);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Finds entities in the data source.
   *
   * @param {FindParams | QueryBuilder} paramsOrBuilder The parameters or QueryBuilder for the find operation (optional).
   *
   * @returns {Promise<Result<EntityType[]>>} The result of the find operation, containing the found entities or an error.
   */
  public async find(
    paramsOrBuilder?: FindParams | QueryBuilder
  ): Promise<Result<EntityType[]>> {
    try {
      let query: DbQuery;
      if (FindParams.isFindParams(paramsOrBuilder)) {
        query = paramsOrBuilder;
      } else if (QueryBuilder.isQueryBuilder(paramsOrBuilder)) {
        query = paramsOrBuilder.build();
      } else {
        query = {};
      }

      const documents = await this.context.source.find(query);

      return Result.withSuccess(
        documents.map((document) => this.context.mapper.toEntity(document))
      );
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }
}

export const isReadRepository = <T = unknown>(
  value: unknown
): value is ReadRepository<T> => {
  return typeof value === "object" && Object.hasOwn(value, "context");
}; 