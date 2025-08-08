/* eslint-disable @typescript-eslint/no-unused-vars */
import { AnyObject } from "./types";

/**
 * Represents a unique identifier for an entity.
 * Can be either a string (UUID, custom string IDs) or a number (auto-increment).
 */
export type EntityId = string | number;

/**
 * Represents an Entity interface.
 * @interface
 * @template TId - The type of the entity ID (string or number).
 */
export interface Entity<TId extends EntityId = EntityId> {
  /**
   * The unique identifier of the entity.
   * @type {TId}
   */
  readonly id: TId;
}
