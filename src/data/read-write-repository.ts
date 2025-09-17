import { Failure } from "../common/failure";
import { RepositoryQuery } from "../domain/repository-query";
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
  WebContext,
  SocketContext,
} from "./repository-data-contexts";
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
      | WebContext<EntityType, DocumentType>
      | SocketContext<EntityType, DocumentType>
      | BlockchainContext<EntityType, DocumentType>
      | AnyContext<EntityType, DocumentType>
  ) {
    super(context);
  }

  /**
   * Updates entities in the data source.
   *
   * @param {UpdateParams<Partial<EntityType>> | RepositoryQuery} paramsOrQuery The parameters or RepositoryQuery for the update operation.
   *
   * @returns {Promise<Result<UpdateStats>>} The result of the update operation, containing the update statistics or an error.
   */
  public async update(paramsOrQuery: UpdateParams<Partial<EntityType>> | RepositoryQuery): Promise<Result<UpdateStats>>;
  
  /**
   * Updates entities in the data source.
   *
   * @param {Partial<EntityType>[]} entities The entities to be updated.
   *
   * @returns {Promise<Result<UpdateStats>>} The result of the update operation, containing the update statistics or an error.
   */
  public async update(...entities: Partial<EntityType>[]): Promise<Result<UpdateStats>>;
  
  public async update(
    paramsOrQueryOrEntity: UpdateParams<Partial<EntityType>> | RepositoryQuery | Partial<EntityType>,
    ...moreEntities: Partial<EntityType>[]
  ): Promise<Result<UpdateStats>> {
    try {
      let query: any;

      if (moreEntities.length > 0) {
        const allEntities = [paramsOrQueryOrEntity, ...moreEntities];
        const documents = allEntities.map((entity) =>
          this.context.mapper.toModel(entity as EntityType)
        );
        query = { updates: documents };
      } else if (UpdateParams.isUpdateParams(paramsOrQueryOrEntity)) {
        const { updates, ...rest } = paramsOrQueryOrEntity;
        const documents = updates.map((update) =>
          this.context.mapper.toModel(update as EntityType)
        );
        query = { updates: documents, ...rest };
      } else if (RepositoryQuery.isQueryBuilder(paramsOrQueryOrEntity)) {
        query = paramsOrQueryOrEntity.build();
      } else {
        const documents = [this.context.mapper.toModel(paramsOrQueryOrEntity as EntityType)];
        query = { updates: documents };
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
  public async add(...entities: EntityType[]): Promise<Result<EntityType[]>> {
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
   * @param {RemoveParams | RepositoryQuery} paramsOrQuery The parameters or RepositoryQuery for the remove operation.
   *
   * @returns {Promise<Result<RemoveStats>>} The result of the remove operation, containing the removal statistics or an error.
   */
  public async remove(paramsOrQuery: RemoveParams | RepositoryQuery): Promise<Result<RemoveStats>>;
  
  /**
   * Removes entities from the data source.
   *
   * @param {EntityType[]} additionalEntities Additional entities to be removed.
   *
   * @returns {Promise<Result<RemoveStats>>} The result of the remove operation, containing the removal statistics or an error.
   */
  public async remove(...additionalEntities: EntityType[]): Promise<Result<RemoveStats>>;
  
  public async remove(
    paramsOrQueryOrEntity: RemoveParams | RepositoryQuery | EntityType,
    ...moreEntities: EntityType[]
  ): Promise<Result<RemoveStats>> {
    try {
      let query: any;

      if (moreEntities.length > 0) {
        const allEntities = [paramsOrQueryOrEntity as EntityType, ...moreEntities];
        const documents = allEntities.map((entity) =>
          this.context.mapper.toModel(entity)
        );
        query = { entities: documents };
      } else if (RemoveParams.isRemoveParams(paramsOrQueryOrEntity)) {
        query = paramsOrQueryOrEntity;
      } else if (RepositoryQuery.isQueryBuilder(paramsOrQueryOrEntity)) {
        query = paramsOrQueryOrEntity.build();
      } else {
        const documents = [this.context.mapper.toModel(paramsOrQueryOrEntity as EntityType)];
        query = { entities: documents };
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
