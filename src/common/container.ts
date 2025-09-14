/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { DependencyRegistry } from './dependency-registry';
import { 
  getInjectableMetadata, 
  getInjectMetadata, 
  getParamTypes
} from './di-decorators';

/**
 * Simple container implementation for dependency injection.
 */
export class Container {
  private container: Map<string, any> = new Map();
  private registry: DependencyRegistry = new DependencyRegistry();

  /**
   * Binds a value to a key in the container.
   * @param {string} key - The key to bind the value to.
   * @param {any} value - The value to bind.
   */
  public bind(key: string, value: any) {
    this.container.set(key, value);
  }

  /**
   * Checks if the container has a value bound to the specified key.
   * @param {string} key - The key to check.
   * @returns {boolean} - True if the key is present in the container, false otherwise.
   */
  public has(key: string): boolean {
    return this.container.has(key);
  }

  /**
   * Retrieves the value bound to the specified key from the container.
   * @param {string} key - The key of the value to retrieve.
   * @returns {T | undefined} - The value bound to the key, or undefined if the key is not found.
   */
  public get<T>(key: string): T {
    return this.container.get(key);
  }

  /**
   * Registers a class as injectable with the container.
   * @param token - The token to register the class under
   * @param constructor - The class constructor
   * @param options - Registration options
   */
  public register<T>(
    token: string, 
    constructor: new (...args: any[]) => T,
    options?: { singleton?: boolean }
  ): void {
    const metadata = getInjectableMetadata(constructor);
    const singleton = options?.singleton ?? metadata?.singleton ?? true;

    this.registry.register(token, {
      factory: () => this.createInstance(constructor),
      singleton
    });
  }

  /**
   * Registers an instance with the container.
   * @param token - The token to register the instance under
   * @param instance - The instance to register
   */
  public registerInstance<T>(token: string, instance: T): void {
    this.container.set(token, instance);
  }

  /**
   * Resolves a dependency by token.
   * @param token - The token to resolve
   * @returns The resolved instance
   */
  public resolve<T>(token: string): T {
    // First check the simple container
    if (this.container.has(token)) {
      return this.container.get(token);
    }

    // Then check the registry
    const instance = this.registry.get<T>(token);
    if (instance) {
      return instance;
    }

    throw new Error(`No dependency registered for token: ${token}`);
  }

  /**
   * Creates an instance of a class with dependency injection.
   * @param constructor - The class constructor
   * @returns The created instance
   */
  private createInstance<T>(constructor: new (...args: any[]) => T): T {
    const paramTypes = getParamTypes(constructor);
    const injectMetadata = getInjectMetadata(constructor);
    
    const args: any[] = [];
    
    if (injectMetadata?.constructor) {
      for (let i = 0; i < paramTypes.length; i++) {
        const token = injectMetadata.constructor[i];
        if (token) {
          args[i] = this.resolve(token);
        } else {
          // If no injection token, try to resolve by type
          const paramType = paramTypes[i];
          if (paramType && paramType.name !== 'Object') {
            try {
              args[i] = this.resolve(paramType.name);
            } catch {
              // If can't resolve, pass undefined
              args[i] = undefined;
            }
          }
        }
      }
    }

    return new constructor(...args);
  }

  /**
   * Initializes all registered dependencies.
   */
  public async initializeAll(): Promise<void> {
    await this.registry.initializeAll();
  }

  /**
   * Gets the dependency registry.
   */
  public getRegistry(): DependencyRegistry {
    return this.registry;
  }
}
