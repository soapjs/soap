import { PropertyTransformer } from "./data";

/**
 * Represents a constructor signature for a class.
 * This type defines a constructor function that can be instantiated to create
 * an object of type T with any number of arguments.
 *
 * @template T - The type of object to be constructed.
 */
export type ConstructorOf<T> = new (...args: unknown[]) => T;

/**
 * Type that can represent either a string type name or a constructor function
 */
export type TypeReference = string | (new (...args: any[]) => any);

/**
 * Converts a TypeReference to a string representation
 * @param typeRef - The type reference to convert
 * @returns The string representation of the type
 */
export function typeToString(typeRef: TypeReference): string {
  if (typeof typeRef === 'string') {
    return typeRef;
  }
  return typeRef.name;
}

/**
 * Represents detailed information about a model property.
 * This includes the name of the property as used in the database and the type of the property.
 *
 * @property {string} name - The name of the field as represented in the database.
 * @property {TypeReference} type - The type of the field, which can be a primitive type string, custom type string like 'ObjectId', or a constructor function.
 * @property {unknown} default - The default value of the field.
 * @property {boolean} nullable - Whether the field can be null.
 * @property {boolean} unique - Whether the field is unique.
 * @property {boolean} index - Whether the field is indexed.
 * @property {PropertyTransformer} transformer - The transformer for the field.
 */
export type PropertyInfo = {
  name: string;
  type: TypeReference;
  default?: unknown;
  nullable?: boolean;
  unique?: boolean;
  index?: boolean;
  transformer?: PropertyTransformer;
};
