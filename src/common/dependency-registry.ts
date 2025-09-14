/* eslint-disable @typescript-eslint/no-explicit-any */

export type DependencyEntry<T> = {
  instance: T | null;
  isReady: boolean;
  init?: () => Promise<T>;
  factory?: () => T;
  singleton?: boolean;
};

export type DependencyMetadata = {
  token: string;
  singleton?: boolean;
  factory?: () => any;
};

/**
 * Centralized Dependency Registry for managing shared instances
 */
export class DependencyRegistry {
  private dependencies: Map<string, DependencyEntry<any>> = new Map();

  /**
   * Registers a new dependency.
   */
  public register<T>(key: string, options?: {
    init?: () => Promise<T>;
    factory?: () => T;
    singleton?: boolean;
  }): void {
    const dependency = this.dependencies.get(key);

    if (dependency?.isReady !== true) {
      this.dependencies.set(key, { 
        instance: null, 
        isReady: false, 
        init: options?.init,
        factory: options?.factory,
        singleton: options?.singleton ?? true
      });
    }
  }

  /**
   * Initializes all dependencies that require async setup.
   */
  public async initializeAll(): Promise<void> {
    const promises = Array.from(this.dependencies.entries()).map(
      async ([key, entry]) => {
        if (entry.init && entry.isReady !== true) {
          try {
            entry.instance = await entry.init();
            entry.isReady = true;
          } catch (error) {
            console.error(`❌ Error initializing dependency "${key}":`, error);
          }
        }
      }
    );
    await Promise.all(promises);
  }

  /**
   * Retrieves a dependency instance.
   */
  public get<T>(key: string): T | null {
    const entry = this.dependencies.get(key);
    if (!entry) return null;

    // If it's a singleton and already instantiated, return the instance
    if (entry.singleton && entry.instance) {
      return entry.instance;
    }

    // If it has a factory, use it to create a new instance
    if (entry.factory) {
      const instance = entry.factory();
      if (entry.singleton) {
        entry.instance = instance;
        entry.isReady = true;
      }
      return instance;
    }

    return entry.instance;
  }

  /**
   * Checks if a dependency is ready.
   */
  public isReady(key: string): boolean {
    return this.dependencies.get(key)?.isReady || false;
  }
}
