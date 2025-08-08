/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Represents a property transformer that converts between the EntityType and the DocumentType.
 * EntityType is the domain entity type used in the business logic layer.
 * DocumentType is the document type used in the database layer.
 */
export type PropertyTransformer = {
  /** Converts from EntityType to DocumentType (during toModel) */
  to?: (value: unknown, context?: any) => unknown;
  /** Converts from DocumentType to EntityType (during toEntity) */
  from?: (value: unknown, context?: any) => unknown;
};

/**
 * Represents a map of property transformers.
 */
export type TransformersMap = Record<string, PropertyTransformer>;