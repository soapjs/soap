/**
 * Represents a constructor signature for a model class.
 * This type defines a constructor function that can be instantiated to create
 * an object of type T with any number of arguments.
 *
 * @template T - The type of object to be constructed.
 */
export type ModelConstructor<T> = new (...args: unknown[]) => T;

/**
 * Represents detailed information about a field in a model.
 * This includes the name of the field as used in the database and the type of the field.
 *
 * @property {string} name - The name of the field as represented in the database.
 * @property {string} type - The type of the field, which can be a primitive type or a custom type like 'ObjectId'.
 */
export type FieldInfo = { name: string; type: string };
