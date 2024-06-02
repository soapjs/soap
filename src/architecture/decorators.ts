import "reflect-metadata";

import "reflect-metadata";
import { FieldInfo } from "./types";

/**
 * Decorator that assigns a domain-specific field name and captures the property type to a class property.
 * This metadata is used to map domain model fields to database-specific field names and to store type information.
 *
 * @param {string} domainFieldName - The name of the field as known in the domain model.
 * @returns {Function} - A decorator function that adds metadata to the class property.
 */
export const EntityField = (domainFieldName: string) => {
  return function (target: unknown, propertyKey: string) {
    const type = Reflect.getMetadata("design:type", target, propertyKey);
    Reflect.defineMetadata(
      "entityField",
      { name: domainFieldName, type: type?.name },
      target,
      propertyKey
    );
  };
};

/**
 * A utility class that provides a method to resolve database field names
 * based on domain field names using metadata defined by the `EntityField` decorator.
 */
export class FieldResolver<T> {
  private instance: T;

  constructor(modelClass: new () => T) {
    this.instance = new modelClass();
  }

  /**
   * Resolves the database field name and type for a given domain field name.
   *
   * @param {string} domainField - The domain field name to resolve.
   * @returns { FieldInfo | undefined } - The database field name and type if found, otherwise undefined.
   */
  resolveDatabaseField(domainField: string): FieldInfo | undefined {
    for (const key of Reflect.ownKeys(this.instance as object)) {
      const metadata = Reflect.getMetadata("entityField", this.instance, key);
      if (metadata?.name === domainField) {
        return { name: key as string, type: metadata.type };
      }
    }
    return undefined;
  }
}
