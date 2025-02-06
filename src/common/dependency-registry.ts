/* eslint-disable @typescript-eslint/no-explicit-any */

export type DependencyEntry<T> = {
  instance: T | null;
  isReady: boolean;
  init?: () => Promise<T>;
};

/**
 * Centralized Dependency Registry for managing shared instances
 */
export class DependencyRegistry {
  private dependencies: Map<string, DependencyEntry<any>> = new Map();

  /**
   * Registers a new dependency.
   */
  public register<T>(key: string, init?: () => Promise<T>): void {
    const dependency = this.dependencies.get(key);

    if (dependency?.isReady !== true) {
      this.dependencies.set(key, { instance: null, isReady: false, init });
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
    return this.dependencies.get(key)?.instance || null;
  }

  /**
   * Checks if a dependency is ready.
   */
  public isReady(key: string): boolean {
    return this.dependencies.get(key)?.isReady || false;
  }
}
