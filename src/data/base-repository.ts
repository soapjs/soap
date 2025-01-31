import { Failure } from "../common/failure";
import { QueryBuilder } from "../domain/query-builder";
import { Repository } from "../domain/repository";
import { Result } from "../common/result";
import { Mapper } from "./mapper";
import { UpdateStats, RemoveStats, Query } from "../domain/types";
import {
  FindParams,
  RemoveParams,
  UpdateParams,
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
 * Represents a generic repository for managing database interactions.
 *
 * Note: This repository should be used when we do not want to provide methods to modify the contents of collections in the database.
 */
export class BaseRepository<EntityType, DocumentType = unknown>
  implements Repository<EntityType, DocumentType>
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
      let query: Query;

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
   * Updates entities in the data source.
   *
   * @param {UpdateParams<Partial<EntityType>> | QueryBuilder} paramsOrBuilder The parameters or QueryBuilder for the update operation.
   *
   * @returns {Promise<Result<UpdateStats>>} The result of the update operation, containing the update statistics or an error.
   */
  public async update(
    paramsOrBuilder: UpdateParams<Partial<EntityType>> | QueryBuilder
  ): Promise<Result<UpdateStats>> {
    try {
      let query: Query;

      if (UpdateParams.isUpdateParams(paramsOrBuilder)) {
        const { updates, ...rest } = paramsOrBuilder;
        const documents = updates.map((update) =>
          this.context.mapper.fromEntity(update as EntityType)
        );
        query = { updates: documents, ...rest };
      } else if (QueryBuilder.isQueryBuilder(paramsOrBuilder)) {
        query = paramsOrBuilder.build();
      } else {
        throw new RepositoryMethodError(
          "paramsOrBuilder is neither a QueryBuilder nor a UpdateParams"
        );
      }

      const stats = await this.context.source.update(query);

      return Result.withSuccess(stats);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Adds entities to the data source.
   *
   * @param {EntityType[]} entities The entities to be added.
   *
   * @returns {Promise<Result<EntityType[]>>} The result of the add operation, containing the added entities or an error.
   */
  public async add(entities: EntityType[]): Promise<Result<EntityType[]>> {
    try {
      const documents = entities.map((entity) =>
        this.context.mapper.fromEntity(entity)
      );
      const inserted = await this.context.source.insert(documents);
      const newEntities = inserted.map((document) =>
        this.context.mapper.toEntity(document)
      );

      return Result.withSuccess(newEntities);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Removes entities from the data source.
   *
   * @param {RemoveParams | QueryBuilder} paramsOrBuilder The parameters or QueryBuilder for the remove operation.
   *
   * @returns {Promise<Result<RemoveStats>>} The result of the remove operation, containing the removal statistics or an error.
   */
  public async remove(
    paramsOrBuilder: RemoveParams | QueryBuilder
  ): Promise<Result<RemoveStats>> {
    try {
      let query: Query;

      if (RemoveParams.isRemoveParams(paramsOrBuilder)) {
        query = paramsOrBuilder;
      } else if (QueryBuilder.isQueryBuilder(paramsOrBuilder)) {
        query = paramsOrBuilder.build();
      } else {
        throw new RepositoryMethodError(
          "paramsOrBuilder is neither a QueryBuilder nor a RemoveParams"
        );
      }

      const stats = await this.context.source.remove(query);

      return Result.withSuccess(stats);
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
      let query: Query;

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
      let query: Query;
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

export const isRepository = <T = unknown>(
  value: unknown
): value is BaseRepository<T> => {
  return typeof value === "object" && Object.hasOwn(value, "context");
};
