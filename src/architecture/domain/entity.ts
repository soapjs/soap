/* eslint-disable @typescript-eslint/no-unused-vars */
import { UnknownObject } from './types';

/**
 * Represents an abstract Entity class.
 * @abstract
 * @template ObjectType - The type of the JSON representation of the entity.
 * @template RestType - The type of additional properties in the entity.
 */
export abstract class Entity<ObjectType = UnknownObject, RestType = UnknownObject> {
  /**
   * The unique identifier of the entity.
   * @type {string}
   */
  public id?: string;

  /**
   * Additional properties of the entity.
   * @type {RestType | undefined}
   */
  public rest?: RestType;

  /**
   * Converts the entity to its JSON representation.
   * @abstract
   * @returns {ObjectType} The JSON representation of the entity.
   */
  public abstract toObject(): ObjectType;
}
