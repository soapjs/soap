/* eslint-disable @typescript-eslint/no-unused-vars */
import { AnyObject } from "./types";

/**
 * Represents an Entity interface.
 * @interface
 * @template ObjectType - The type of the JSON representation of the entity.
 * @template RestType - The type of additional properties in the entity.
 */
export interface Entity<ObjectType = AnyObject, RestType = AnyObject> {
  /**
   * The unique identifier of the entity.
   * @type {string}
   */
  id?: string;

  /**
   * Additional properties of the entity.
   * @type {RestType | undefined}
   */
  rest?: RestType;

  /**
   * Converts the entity to its JSON representation.
   * @interface
   * @returns {ObjectType} The JSON representation of the entity.
   */
  toJson(): ObjectType;
}
