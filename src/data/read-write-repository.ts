import { Failure } from "../common/failure";
import { QueryBuilder } from "../domain/query-builder";
import { Repository } from "../domain/repository";
import { Result } from "../common/result";
import { UpdateStats, RemoveStats } from "../domain/types";
import {
  RemoveParams,
  UpdateParams,
} from "../domain/params";
import {
  AnyContext,
  BlockchainContext,
  DatabaseContext,
  HttpContext,
  WebSocketContext,
} from "./repository-data-contexts";
import { RepositoryMethodError } from "../domain/errors";
import { ReadRepository } from "./read-repository";

/**
 * @class
 * Represents a read-write repository for managing database interactions.
 *
 * This repository extends ReadRepository and adds write operations (add, update, remove).
 * It should be used when you need both read and write capabilities.
 */
export class ReadWriteRepository<EntityType, DocumentType = unknown>
  extends ReadRepository<EntityType, DocumentType>
  implements Repository<EntityType, DocumentType>
{
  constructor(
    context:
      | DatabaseContext<EntityType, DocumentType>
      | HttpContext<EntityType, DocumentType>
      | WebSocketContext<EntityType, DocumentType>
      | BlockchainContext<EntityType, DocumentType>
      | AnyContext<EntityType, DocumentType>
  ) {
    super(context);
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
      let query: any;

      if (UpdateParams.isUpdateParams(paramsOrBuilder)) {
        const { updates, ...rest } = paramsOrBuilder;
        const documents = updates.map((update) =>
          this.context.mapper.toModel(update as EntityType)
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
        this.context.mapper.toModel(entity)
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
      let query: any;

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
}

export const isReadWriteRepository = <T = unknown>(
  value: unknown
): value is ReadWriteRepository<T> => {
  return typeof value === "object" && Object.hasOwn(value, "context");
}; 