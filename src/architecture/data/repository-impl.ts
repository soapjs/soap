import { Failure } from "../domain/failure";
import { QueryBuilder } from "../domain/queries/query-builder";
import { Repository } from "../domain/repository";
import { Result } from "../domain/result";
import { Mapper } from "./mapper";
import { UpdateStats, RemoveStats, Query } from "../domain/types";
import { AggregationParams } from "../domain/queries/params/aggregation-params";
import { CountParams } from "../domain/queries/params/count-params";
import { FindParams, RemoveParams, UpdateParams } from "../domain/queries";
import { DataContext } from "./data-context";

/**
 * @class
 * Represents a generic repository for managing database interactions.
 *
 * Note: This repository should be used when we do not want to provide methods to modify the contents of collections in the database.
 */
export class RepositoryImpl<EntityType, DocumentType = unknown>
  implements Repository<EntityType, DocumentType>
{
  /**
   * @constructor
   * Creates a new RepositoryImpl instance.
   *
   */
  constructor(protected context: DataContext<EntityType, DocumentType>) {}

  /**
   * Executes an aggregation operation on the data source.
   *
   * @param {AggregationParams | QueryBuilder} paramsOrBuilder The parameters or QueryBuilder for the aggregation operation.
   * @param {Mapper<ResultType, AggregationType>?} mapper The Mapper used for ResultType-AggregationType transformations (optional).
   *
   * @returns {Promise<Result<ResultType, Error>>} The result of the aggregation operation.
   */
  public async aggregate<
    ResultType = EntityType | EntityType[],
    AggregationType = DocumentType
  >(
    paramsOrBuilder: AggregationParams | QueryBuilder,
    mapper?: Mapper<ResultType, AggregationType>
  ): Promise<Result<ResultType, Error>> {
    try {
      let query: Query;

      if (paramsOrBuilder instanceof AggregationParams) {
        query = this.context.queries.createAggregationQuery(paramsOrBuilder);
      } else {
        query = paramsOrBuilder.build();
      }

      const aggregation = await this.context.collection.aggregate(query);
      const conversionMapper = mapper || this.context.mapper;

      if (Array.isArray(aggregation)) {
        return Result.withContent(
          aggregation.map((document) =>
            conversionMapper.toEntity(<AggregationType & DocumentType>document)
          ) as ResultType
        );
      }

      return Result.withContent(
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
   * @returns {Promise<Result<UpdateStats, Error>>} The result of the update operation, containing the update statistics or an error.
   */
  public async update(
    paramsOrBuilder: UpdateParams<Partial<EntityType>> | QueryBuilder
  ): Promise<Result<UpdateStats, Error>> {
    try {
      let query: Query;

      if (paramsOrBuilder instanceof UpdateParams) {
        const { updates, where, methods } = paramsOrBuilder;
        const documents = updates.map((update) =>
          this.context.mapper.fromEntity(update as EntityType)
        );

        query = this.context.queries.createUpdateQuery(
          documents,
          where,
          methods
        );
      } else {
        query = paramsOrBuilder.build();
      }

      const stats = await this.context.collection.update(query);

      return Result.withContent(stats);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Adds entities to the data source.
   *
   * @param {EntityType[]} entities The entities to be added.
   *
   * @returns {Promise<Result<EntityType[], Error>>} The result of the add operation, containing the added entities or an error.
   */
  public async add(
    entities: EntityType[]
  ): Promise<Result<EntityType[], Error>> {
    try {
      const documents = entities.map((entity) =>
        this.context.mapper.fromEntity(entity)
      );
      const inserted = await this.context.collection.insert(documents);
      const newEntities = inserted.map((document) =>
        this.context.mapper.toEntity(document)
      );

      return Result.withContent(newEntities);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Removes entities from the data source.
   *
   * @param {RemoveParams | QueryBuilder} paramsOrBuilder The parameters or QueryBuilder for the remove operation.
   *
   * @returns {Promise<Result<RemoveStats, Error>>} The result of the remove operation, containing the removal statistics or an error.
   */
  public async remove(
    paramsOrBuilder: RemoveParams | QueryBuilder
  ): Promise<Result<RemoveStats, Error>> {
    try {
      let query: Query;

      if (paramsOrBuilder instanceof RemoveParams) {
        query = this.context.queries.createRemoveQuery(paramsOrBuilder);
      } else {
        query = paramsOrBuilder.build();
      }

      const stats = await this.context.collection.remove(query);

      return Result.withContent(stats);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Counts the entities in the data source.
   *
   * @param {CountParams | QueryBuilder} paramsOrBuilder The parameters or QueryBuilder for the count operation (optional).
   *
   * @returns {Promise<Result<number, Error>>} The result of the count operation, containing the number of entities or an error.
   */
  public async count(
    paramsOrBuilder?: CountParams | QueryBuilder
  ): Promise<Result<number, Error>> {
    try {
      let query: Query;

      if (paramsOrBuilder instanceof CountParams) {
        query = this.context.queries.createCountQuery(paramsOrBuilder);
      } else if (paramsOrBuilder?.build) {
        query = paramsOrBuilder.build();
      } else {
        query = {};
      }

      const count = await this.context.collection.count(query);

      return Result.withContent(count);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Finds entities in the data source.
   *
   * @param {FindParams | QueryBuilder} paramsOrBuilder The parameters or QueryBuilder for the find operation (optional).
   *
   * @returns {Promise<Result<EntityType[], Error>>} The result of the find operation, containing the found entities or an error.
   */
  public async find(
    paramsOrBuilder?: FindParams | QueryBuilder
  ): Promise<Result<EntityType[], Error>> {
    try {
      let query: Query;
      if (paramsOrBuilder instanceof FindParams) {
        query = this.context.queries.createFindQuery(paramsOrBuilder);
      } else if (paramsOrBuilder?.build) {
        query = paramsOrBuilder.build();
      } else {
        query = {};
      }

      const documents = await this.context.collection.find(query);

      return Result.withContent(
        documents.map((document) => this.context.mapper.toEntity(document))
      );
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }
}
