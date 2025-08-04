/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Represents a Value Object interface.
 * Value Objects are immutable objects that model a conceptual whole by composing related attributes.
 * They are distinguished by their state/attributes rather than identity.
 * @interface
 * @template T - The type of the underlying value that this Value Object wraps
 */
export interface ValueObject<T> {
  /**
   * Checks equality between this Value Object and another.
   * Two Value Objects are considered equal if they have the same type and their values are equal.
   * @param {ValueObject<T>} other - Another Value Object to compare with
   * @returns {boolean} True if the Value Objects are equal, false otherwise
   */
  equals(other: ValueObject<T>): boolean;

  /**
   * Converts the Value Object to its underlying value.
   * @returns {T} The underlying value of type T
   */
  toValue(): T;
}
