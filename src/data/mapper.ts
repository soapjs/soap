/* eslint-disable @typescript-eslint/no-explicit-any */

import { TransformersMap } from "./property-transformer";

/**
 * Represents a mapper that converts between the EntityType and the DocumentType.
 * EntityType is the domain entity type used in the business logic layer.
 * DocumentType is the document type used in the database layer.
 */
export interface Mapper<EntityType = unknown, ModelType = unknown> {
  /**
   * Converts a document from the database layer to a domain entity.
   *
   * @param {ModelType} model The document from the database layer.
   * @returns {EntityType} The domain entity.
   */
  toEntity?(model: ModelType, ...args: any[]): EntityType;

  /**
   * Converts a domain entity from the business logic layer to a database document.
   *
   * @param {EntityType} entity The domain entity from the business logic layer.
   * @returns {ModelType} The document for the database layer.
   */
  toModel?(entity: EntityType, ...args: any[]): ModelType;

  /**
   * The transformers for the mapper.
   */
  transformers?: TransformersMap;
}

/**
 * Represents a property mapping that maps a key to a mapper function.
 */
export type PropertyMapping = {
  /**
   * The key associated with the property mapping.
   */
  key: string;

  /**
   * The mapper function that transforms the property value.
   *
   * @param value - The value of the property to be transformed.
   * @returns The transformed value.
   */
  mapper: (value: unknown) => unknown;
};
