/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import "reflect-metadata";

import { FieldInfo } from "../types";
import { AutoTransaction } from "./auto-transaction";
import { TransactionRunner } from "./transaction-runner";

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

/**
 * Options for `UseSession` decorator.
 */
export type UseSessionOptions = {
  type?: string;
  priority?: number;
  scope?: string;
};

/**
 * Decorator that marks a class property as requiring a session.
 * Metadata is stored under the key "useSession" on the property.
 *
 * @param {UseSessionOptions} [options] - Additional session-related options.
 * @returns {PropertyDecorator} - The property decorator that defines session metadata.
 */
export const UseSession = (options?: UseSessionOptions) => {
  return function (target: any, propertyKey: string | symbol) {
    Reflect.defineMetadata("useSession", options || true, target, propertyKey);
  };
};

/**
 * Options for the `IsTransaction` decorator.
 */
export type IsTransactionOptions = {
  tag?: string;
};

/**
 * Class decorator that automatically wraps an `execute()` method in a transaction. Designed for Use Case components.
 * It retrieves a `TransactionRunner` singleton (tagged if needed) and executes the original method
 * via an `AutoTransaction`.
 *
 * @param {IsTransactionOptions} [options] - Optional configuration (e.g., tag for the runner).
 * @returns {ClassDecorator} - A class decorator that replaces `execute()` with a transaction-wrapped version.
 */
export const IsTransaction = (
  options?: IsTransactionOptions
): ClassDecorator => {
  return function (constructor: Function) {
    const prototype = constructor.prototype;

    const descriptor = Object.getOwnPropertyDescriptor(prototype, "execute");
    if (!descriptor) return;

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return TransactionRunner.getInstance(options?.tag).run(
        new AutoTransaction(this, originalMethod, args)
      );
    };

    Object.defineProperty(prototype, "execute", descriptor);
  };
};

/**
 * Method decorator that marks a method to be executed within a transaction.
 *
 * It allows specifying which components (e.g., repositories or services) should use database sessions.
 * The decorator initializes sessions for these components and ensures their lifecycle is managed within the transaction context.
 *
 * @param {Object} [options] - Configuration options for the transaction.
 * @param {string[]} [options.sessionComponents] - A list of property names (keys in the `UseCase` instance) that require sessions.
 * @param {string} [options.tag] - An optional tag for the `TransactionRunner` instance, used for managing multiple runners.
 * @returns {MethodDecorator} - The method decorator.
 */
export function Transactional(options?: {
  sessionComponents?: string[];
  tag?: string;
}): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const sessionComponents: any[] = [];

      if (options?.sessionComponents) {
        for (const componentName of options.sessionComponents) {
          const component = this[componentName];
          if (!component) {
            throw new Error(
              `Component ${componentName} is not defined on ${this.constructor.name}.`
            );
          }
          sessionComponents.push(component);
        }
      }

      return TransactionRunner.getInstance(options?.tag).run(
        new AutoTransaction(this, originalMethod, args, sessionComponents)
      );
    };

    return descriptor;
  };
}

export const INJECTABLE_METADATA_KEY = Symbol("soapjs:injectable");
export const INJECT_METADATA_KEY = Symbol("soapjs:inject");

/**
 * Options for `Injectable` decorator.
 */
export type InjectableOptions = {
  /**
   * Optionally, specify a DI "scope" or a "lifecycle":
   * - 'singleton'
   * - 'transient'
   * - 'request'
   * etc., depending on your container's features.
   */
  scope?: string;

  /**
   * Any additional config needed
   * to unify usage across different containers (e.g. tags).
   */
  tags?: string[];

  /**
   * Any other fields relevant for your DI strategy
   */
  [key: string]: any;
};

/**
 * Decorator that marks a class as injectable, storing DI-related metadata (id, scope, etc.).
 * Used by a DI container or an adapter to bind or resolve the class.
 *
 * @param {string | symbol} [id] - The identifier used by the DI container to register or resolve this class.
 * @param {InjectableOptions} [options] - Optional DI metadata (scope, tags, etc.).
 * @returns {ClassDecorator} - A class decorator that defines DI metadata on the target.
 */
export function Injectable(
  /**
   * The identifier used by the DI container
   * to register or resolve this class.
   * If not provided, default to the class name.
   */
  id?: string | Symbol,
  options?: InjectableOptions
): ClassDecorator {
  return function (target: Function) {
    const metadata = options
      ? {
          id,
          ...options,
        }
      : { id };

    Reflect.defineMetadata(INJECTABLE_METADATA_KEY, metadata, target);
  };
}

/**
 * Decorator that indicates a property or parameter should be injected with a given token or identifier.
 *
 * @param {any} id - The identifier or token that the DI container will resolve and inject.
 * @returns {ParameterDecorator & PropertyDecorator} - A decorator that sets injection metadata.
 */
export function Inject(id?: any): ParameterDecorator & PropertyDecorator {
  return function (
    target: Object,
    propertyKey?: string | symbol,
    parameterIndex?: number
  ) {
    let finalId = id;

    if (!finalId) {
      const constructorName =
        target && (target as Function).name ? (target as Function).name : "";
      if (typeof parameterIndex === "number") {
        finalId = constructorName || "UnknownParam";
      } else if (propertyKey) {
        finalId = propertyKey.toString();
      } else {
        finalId = "UnknownInject";
      }
    }

    const metadata: Record<number | string | symbol, any> =
      Reflect.getMetadata(INJECT_METADATA_KEY, target) || {};

    if (typeof parameterIndex === "number") {
      metadata[parameterIndex] = finalId;
    } else if (propertyKey) {
      metadata[propertyKey] = finalId;
    }

    Reflect.defineMetadata(INJECT_METADATA_KEY, metadata, target);
  };
}

/**
 * Checks if a class is marked as injectable.
 *
 * @param {any} target - The class (constructor) to check.
 * @returns {boolean} - True if the class has injectable metadata, otherwise false.
 */
export const isInjectable = (target: any): boolean => {
  return Reflect.getMetadata(INJECTABLE_METADATA_KEY, target) === true;
};

/**
 * Retrieves injection tokens from a class or prototype.
 * This can be parameters or property-based injection definitions.
 *
 * @param {any} target - The class (constructor) or prototype to retrieve injection info from.
 * @returns {Record<number | string | symbol, any>} - A map of parameter index or propertyKey to token/identifier.
 */
export const getInjectionTokens = (
  target: any
): Record<number | string | symbol, any> => {
  let constructor = target;
  let prototype = target.prototype;

  if (!prototype && target.constructor) {
    constructor = target.constructor;
    prototype = constructor.prototype;
  }

  const constructorTokens =
    Reflect.getMetadata(INJECT_METADATA_KEY, constructor) || {};
  const prototypeTokens =
    Reflect.getMetadata(INJECT_METADATA_KEY, prototype) || {};

  return { ...constructorTokens, ...prototypeTokens };
};
