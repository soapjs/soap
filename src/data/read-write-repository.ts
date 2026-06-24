import { Failure } from "../common/failure";
import { RepositoryQuery } from "../domain/repository-query";
import { Repository } from "../domain/repository";
import { Result } from "../common/result";
import { UpdateStats, RemoveStats } from "../domain/types";
import {
  RemoveParams,
  UpdateMethod,
  UpdateParams,
} from "../domain/params";
import { Where } from "../domain/where";
import { RepositoryMethodError } from "../domain/errors";
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
  public async update(entities: Partial<EntityType>[]): Promise<Result<UpdateStats>>;
  
  /**
   * Updates entities in the data source.
   *
   * @param {Partial<EntityType>[]} entities The entities to be updated.
   *
   * @returns {Promise<Result<UpdateStats>>} The result of the update operation, containing the update statistics or an error.
   */
  public async update(...entities: Partial<EntityType>[]): Promise<Result<UpdateStats>>;
  
  public async update(
    paramsOrQueryOrEntity: UpdateParams<Partial<EntityType>> | RepositoryQuery | Partial<EntityType> | Partial<EntityType>[],
    ...moreEntities: Partial<EntityType>[]
  ): Promise<Result<UpdateStats>> {
    try {
      let query: any;

      if (Array.isArray(paramsOrQueryOrEntity) || moreEntities.length > 0) {
        query = this.createUpdateQueryFromEntities(
          paramsOrQueryOrEntity as Partial<EntityType> | Partial<EntityType>[],
          moreEntities
        );
      } else if (UpdateParams.isUpdateParams(paramsOrQueryOrEntity)) {
        const { updates, ...rest } = paramsOrQueryOrEntity;
        const documents = updates.map((update) =>
          this.context.mapper.toModel(update as EntityType)
        );
        query = { updates: documents, ...rest };
      } else if (RepositoryQuery.isQueryBuilder(paramsOrQueryOrEntity)) {
        query = paramsOrQueryOrEntity.build();
      } else {
        query = this.createUpdateQueryFromEntities(paramsOrQueryOrEntity);
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
   * @param {EntityType[]} entities The entities to be removed.
   *
   * @returns {Promise<Result<RemoveStats>>} The result of the remove operation, containing the removal statistics or an error.
   */
  public async remove(entities: EntityType[]): Promise<Result<RemoveStats>>;
  
  /**
   * Removes entities from the data source.
   *
   * @param {EntityType[]} additionalEntities Additional entities to be removed.
   *
   * @returns {Promise<Result<RemoveStats>>} The result of the remove operation, containing the removal statistics or an error.
   */
  public async remove(...additionalEntities: EntityType[]): Promise<Result<RemoveStats>>;
  
  public async remove(
    paramsOrQueryOrEntity: RemoveParams | RepositoryQuery | EntityType | EntityType[],
    ...moreEntities: EntityType[]
  ): Promise<Result<RemoveStats>> {
    try {
      let query: any;

      if (Array.isArray(paramsOrQueryOrEntity) || moreEntities.length > 0) {
        query = this.createRemoveQueryFromEntities(
          paramsOrQueryOrEntity as EntityType | EntityType[],
          moreEntities
        );
      } else if (RemoveParams.isRemoveParams(paramsOrQueryOrEntity)) {
        query = paramsOrQueryOrEntity;
      } else if (RepositoryQuery.isQueryBuilder(paramsOrQueryOrEntity)) {
        query = paramsOrQueryOrEntity.build();
      } else {
        query = this.createRemoveQueryFromEntities(paramsOrQueryOrEntity as EntityType);
      }

      const stats = await this.context.source.remove(query);

      return Result.withSuccess(stats);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  private createUpdateQueryFromEntities(
    firstEntityOrEntities: Partial<EntityType> | Partial<EntityType>[],
    moreEntities: Partial<EntityType>[] = []
  ) {
    const entities = this.normalizeEntities(firstEntityOrEntities, moreEntities);
    const ids = entities.map((entity) => this.getEntityId(entity, "update"));
    const documents = entities.map((entity) =>
      this.context.mapper.toModel(entity as EntityType)
    );

    return {
      updates: documents,
      where: ids.map((id) => new Where().valueOf("id").isEq(id)),
      methods: ids.map(() => UpdateMethod.UpdateOne),
    };
  }

  private createRemoveQueryFromEntities(
    firstEntityOrEntities: EntityType | EntityType[],
    moreEntities: EntityType[] = []
  ) {
    const entities = this.normalizeEntities(firstEntityOrEntities, moreEntities);
    const ids = entities.map((entity) => this.getEntityId(entity, "remove"));
    const where =
      ids.length === 1
        ? new Where().valueOf("id").isEq(ids[0])
        : new Where().valueOf("id").isIn(ids);

    return { where };
  }

  private normalizeEntities<T>(
    firstEntityOrEntities: T | T[],
    moreEntities: T[] = []
  ): T[] {
    const entities = Array.isArray(firstEntityOrEntities)
      ? [...firstEntityOrEntities, ...moreEntities]
      : [firstEntityOrEntities, ...moreEntities];

    if (entities.length === 0) {
      throw new RepositoryMethodError("No entities were provided.");
    }

    return entities;
  }

  private getEntityId(
    entity: Partial<EntityType> | EntityType,
    operation: "update" | "remove"
  ): unknown {
    const id = (entity as { id?: unknown } | null | undefined)?.id;

    if (id === undefined || id === null) {
      throw new RepositoryMethodError(
        `Cannot ${operation} entity without an id.`
      );
    }

    return id;
  }
}

export const isReadWriteRepository = <T = unknown>(
  value: unknown
): value is ReadWriteRepository<T> => {
  return typeof value === "object" && Object.hasOwn(value, "context");
};
