/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { Scope, DIOptions } from './di-types';

const INJECTABLE_METADATA_KEY = 'soap:injectable';
const INJECT_METADATA_KEY = 'soap:inject';

/**
 * Options for the @Injectable decorator
 */
export interface InjectableOptions extends DIOptions {
  scope?: Scope;
  token?: string;
}

/**
 * Class decorator that marks a class as injectable.
 * Stores metadata about the class for dependency injection.
 * 
 * @param options - Configuration options for the injectable class
 * @returns Class decorator function
 */
export function Injectable(options?: InjectableOptions): ClassDecorator {
  return function (target: any) {
    const token = options?.token || target.name;
    const metadata = {
      token,
      scope: options?.scope || Scope.SINGLETON,
      factory: options?.factory,
      dependencies: options?.dependencies || [],
    };

    Reflect.defineMetadata(INJECTABLE_METADATA_KEY, metadata, target);
    
    // Store the constructor for later instantiation
    Reflect.defineMetadata('design:paramtypes', Reflect.getMetadata('design:paramtypes', target) || [], target);
  };
}

/**
 * Universal decorator for dependency injection.
 * Works for both constructor parameters and class properties.
 * 
 * @param token - The token/key to inject
 * @returns Decorator function that works for both parameters and properties
 */
export function Inject(token: string): PropertyDecorator & ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex?: number) {
    // Check if this is a parameter decorator (parameterIndex is provided)
    if (typeof parameterIndex === 'number') {
      // Parameter decorator - for constructor injection
      const existingTokens = Reflect.getMetadata(INJECT_METADATA_KEY, target) || {};
      if (!existingTokens.constructor) {
        existingTokens.constructor = [];
      }
      existingTokens.constructor[parameterIndex] = token;
      Reflect.defineMetadata(INJECT_METADATA_KEY, existingTokens, target);
      
      // Also store on the prototype for consistency
      const prototypeTokens = Reflect.getMetadata(INJECT_METADATA_KEY, target.prototype) || {};
      if (!prototypeTokens.constructor) {
        prototypeTokens.constructor = [];
      }
      prototypeTokens.constructor[parameterIndex] = token;
      Reflect.defineMetadata(INJECT_METADATA_KEY, prototypeTokens, target.prototype);
    } else {
      // Property decorator - for property injection
      const existingTokens = Reflect.getMetadata(INJECT_METADATA_KEY, target) || {};
      existingTokens[propertyKey!] = token;
      Reflect.defineMetadata(INJECT_METADATA_KEY, existingTokens, target);
    }
  };
}

/**
 * Gets the injectable metadata from a class
 */
export function getInjectableMetadata(target: any): any {
  return Reflect.getMetadata(INJECTABLE_METADATA_KEY, target);
}

/**
 * Gets the inject metadata from a class
 */
export function getInjectMetadata(target: any): Record<string | symbol, any> | undefined {
  // Try to get metadata from the constructor first (for parameter injection)
  let metadata = Reflect.getMetadata(INJECT_METADATA_KEY, target);
  
  // If not found, try to get from the prototype (for property injection)
  if (!metadata && target.prototype) {
    metadata = Reflect.getMetadata(INJECT_METADATA_KEY, target.prototype);
  }
  
  return metadata;
}

/**
 * Gets the parameter types metadata from a class
 */
export function getParamTypes(target: any): any[] {
  return Reflect.getMetadata('design:paramtypes', target) || [];
}
