import { Failure } from "../common/failure";
import { RepositoryQuery } from "../domain/repository-query";
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
   * @param {AggregationParams | RepositoryQuery} paramsOrQuery The parameters or RepositoryQuery for the aggregation operation.
   * @param {Mapper<ResultType, AggregationType>?} mapper The Mapper used for ResultType-AggregationType transformations (optional).
   *
   * @returns {Promise<Result<ResultType>>} The result of the aggregation operation.
   */
  public async aggregate<
    ResultType = EntityType | EntityType[],
    AggregationType = DocumentType
  >(
    paramsOrQuery: AggregationParams | RepositoryQuery,
    mapper?: Mapper<ResultType, AggregationType>
  ): Promise<Result<ResultType>> {
    try {
      let query: DbQuery;

      if (AggregationParams.isAggregationParams(paramsOrQuery)) {
        query = paramsOrQuery;
      } else if (RepositoryQuery.isQueryBuilder(paramsOrQuery)) {
        query = paramsOrQuery.build();
      } else {
        throw new RepositoryMethodError(
          "paramsOrQuery is neither a RepositoryQuery nor a AggregationParams"
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
   * @param {CountParams | RepositoryQuery} paramsOrQuery The parameters or RepositoryQuery for the count operation (optional).
   *
   * @returns {Promise<Result<number>>} The result of the count operation, containing the number of entities or an error.
   */
  public async count(
    paramsOrQuery?: CountParams | RepositoryQuery
  ): Promise<Result<number>> {
    try {
      let query: DbQuery;

      if (CountParams.isCountParams(paramsOrQuery)) {
        query = paramsOrQuery;
      } else if (RepositoryQuery.isQueryBuilder(paramsOrQuery)) {
        query = paramsOrQuery.build();
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
   * @param {FindParams | RepositoryQuery} paramsOrQuery The parameters or RepositoryQuery for the find operation (optional).
   *
   * @returns {Promise<Result<EntityType[]>>} The result of the find operation, containing the found entities or an error.
   */
  public async find(
    paramsOrQuery?: FindParams | RepositoryQuery
  ): Promise<Result<EntityType[]>> {
    try {
      let query: DbQuery;
      if (FindParams.isFindParams(paramsOrQuery)) {
        query = paramsOrQuery;
      } else if (RepositoryQuery.isQueryBuilder(paramsOrQuery)) {
        query = paramsOrQuery.build();
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