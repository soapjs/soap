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
  WebContext,
  SocketContext,
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
      | WebContext<EntityType, DocumentType>
      | SocketContext<EntityType, DocumentType>
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

      // Check cache first if available (only for DatabaseContext)
      if (DatabaseContext.isDatabaseContext(this.context) && this.context.isCacheEnabled()) {
        const cacheKey = this.context.getCacheKey('aggregate', query);
        const cached = await this.context.cache!.get<ResultType>(cacheKey);
        
        if (cached) {
          return Result.withSuccess(cached);
        }
      }

      const aggregation = await this.context.source.aggregate(query);
      const conversionMapper = mapper || this.context.mapper;

      let result: ResultType;
      if (Array.isArray(aggregation)) {
        result = aggregation.map((document) =>
          conversionMapper.toEntity(<AggregationType & DocumentType>document)
        ) as ResultType;
      } else {
        result = conversionMapper.toEntity(aggregation) as ResultType;
      }

      // Cache the result if cache is enabled (only for DatabaseContext)
      if (DatabaseContext.isDatabaseContext(this.context) && this.context.isCacheEnabled()) {
        const cacheKey = this.context.getCacheKey('aggregate', query);
        await this.context.cache!.set(cacheKey, result);
      }

      return Result.withSuccess(result);
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

      // Check cache first if available (only for DatabaseContext)
      if (DatabaseContext.isDatabaseContext(this.context) && this.context.isCacheEnabled()) {
        const cacheKey = this.context.getCacheKey('count', query);
        const cached = await this.context.cache!.get<number>(cacheKey);
        
        if (cached !== null) {
          return Result.withSuccess(cached);
        }
      }

      const count = await this.context.source.count(query);

      // Cache the result if cache is enabled (only for DatabaseContext)
      if (DatabaseContext.isDatabaseContext(this.context) && this.context.isCacheEnabled()) {
        const cacheKey = this.context.getCacheKey('count', query);
        await this.context.cache!.set(cacheKey, count);
      }

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

      // Check cache first if available (only for DatabaseContext)
      if (DatabaseContext.isDatabaseContext(this.context) && this.context.isCacheEnabled()) {
        const cacheKey = this.context.getCacheKey('find', query);
        const cached = await this.context.cache!.get<EntityType[]>(cacheKey);
        
        if (cached) {
          return Result.withSuccess(cached);
        }
      }

      const documents = await this.context.source.find(query);
      const entities = documents.map((document) => this.context.mapper.toEntity(document));

      // Cache the result if cache is enabled (only for DatabaseContext)
      if (DatabaseContext.isDatabaseContext(this.context) && this.context.isCacheEnabled()) {
        const cacheKey = this.context.getCacheKey('find', query);
        await this.context.cache!.set(cacheKey, entities);
      }

      return Result.withSuccess(entities);
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