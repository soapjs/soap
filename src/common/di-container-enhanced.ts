/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { Scope, Provider, Module, DependencyContext } from './di-types';
import { getInjectableMetadata, getInjectMetadata, getParamTypes } from './di-decorators';

/**
 * Enhanced DI Container with NestJS-style API
 */
export class DIContainer {
  private providers = new Map<string, Provider>();
  private instances = new Map<string, any>();
  private modules = new Map<string, Module>();

  /**
   * Register a provider with the container
   */
  bind<T>(token: string, provider: Provider): this {
    this.providers.set(token, provider);
    return this;
  }

  /**
   * Register a class provider
   */
  bindClass<T>(token: string, constructor: new (...args: any[]) => T, options?: {
    scope?: Scope;
    dependencies?: string[];
  }): this {
    return this.bind(token, {
      token,
      useClass: constructor,
      scope: options?.scope || Scope.SINGLETON,
      dependencies: options?.dependencies || []
    });
  }

  /**
   * Register a value provider
   */
  bindValue<T>(token: string, value: T): this {
    return this.bind(token, {
      token,
      useValue: value,
      scope: Scope.SINGLETON
    });
  }

  /**
   * Register a factory provider
   */
  bindFactory<T>(token: string, factory: (...args: any[]) => T, options?: {
    scope?: Scope;
    dependencies?: string[];
  }): this {
    return this.bind(token, {
      token,
      useFactory: factory,
      scope: options?.scope || Scope.SINGLETON,
      dependencies: options?.dependencies || []
    });
  }

  /**
   * Get a dependency from the container
   */
  get<T>(token: string): T {
    const provider = this.providers.get(token);
    if (!provider) {
      throw new Error(`No provider found for token: ${token}`);
    }

    // Handle different scopes
    switch (provider.scope) {
      case Scope.SINGLETON:
        if (!this.instances.has(token)) {
          this.instances.set(token, this.createInstance(provider));
        }
        return this.instances.get(token);

      case Scope.TRANSIENT:
        return this.createInstance(provider);

      case Scope.REQUEST:
        // For request scope, we'd need request context
        // For now, treat as transient
        return this.createInstance(provider);

      default:
        return this.createInstance(provider);
    }
  }

  /**
   * Check if a provider is registered
   */
  has(token: string): boolean {
    return this.providers.has(token);
  }

  /**
   * Create an instance from a provider
   */
  private createInstance(provider: Provider): any {
    if (provider.useValue) {
      return provider.useValue;
    }

    if (provider.useFactory) {
      const dependencies = this.resolveDependencies(provider.dependencies || []);
      return provider.useFactory(...dependencies);
    }

    if (provider.useClass) {
      // Try to auto-resolve dependencies from constructor
      const dependencies = this.autoResolveDependencies(provider.useClass);
      return new provider.useClass(...dependencies);
    }

    throw new Error(`Invalid provider configuration for token: ${provider.token}`);
  }

  /**
   * Resolve dependencies for a provider
   */
  private resolveDependencies(dependencies: string[]): any[] {
    return dependencies.map(dep => this.get(dep));
  }

  /**
   * Auto-resolve dependencies from constructor
   */
  private autoResolveDependencies(constructor: new (...args: any[]) => any): any[] {
    const paramTypes = getParamTypes(constructor);
    const dependencies: any[] = [];

    for (const paramType of paramTypes) {
      if (paramType && paramType.name !== 'Object') {
        try {
          dependencies.push(this.get(paramType.name));
        } catch {
          // If can't resolve by type name, try to resolve by constructor name
          try {
            dependencies.push(this.get(constructor.name));
          } catch {
            // If still can't resolve, pass undefined
            dependencies.push(undefined);
          }
        }
      } else {
        dependencies.push(undefined);
      }
    }

    return dependencies;
  }

  /**
   * Register a module
   */
  registerModule(name: string, module: Module): this {
    this.modules.set(name, module);
    
    // Register all providers from the module
    module.providers.forEach(provider => {
      this.bind(provider.token, provider);
    });

    return this;
  }

  /**
   * Auto-register a class with decorators
   */
  autoRegister<T>(constructor: new (...args: any[]) => T): this {
    const metadata = getInjectableMetadata(constructor);
    if (!metadata) {
      throw new Error(`Class ${constructor.name} is not marked as @Injectable`);
    }

    const dependencies = this.extractDependencies(constructor);
    
    return this.bindClass(metadata.token, constructor, {
      scope: metadata.scope,
      dependencies
    });
  }

  /**
   * Extract dependencies from a class constructor
   */
  private extractDependencies(constructor: new (...args: any[]) => any): string[] {
    const paramTypes = getParamTypes(constructor);
    const injectMetadata = getInjectMetadata(constructor);
    const dependencies: string[] = [];

    for (let i = 0; i < paramTypes.length; i++) {
      const token = injectMetadata?.constructor?.[i];
      if (token) {
        dependencies.push(token);
      } else {
        // Try to resolve by type name
        const paramType = paramTypes[i];
        if (paramType && paramType.name !== 'Object') {
          dependencies.push(paramType.name);
        }
      }
    }

    return dependencies;
  }

  /**
   * Create a dependency context for CLI automation
   */
  createContext(name: string, type: DependencyContext['type'], path: string): DependencyContext {
    return {
      name,
      type,
      path,
      dependencies: [],
      scope: Scope.SINGLETON
    };
  }

  /**
   * Register dependencies from context
   */
  registerFromContext(contexts: DependencyContext[]): this {
    contexts.forEach(context => {
      switch (context.type) {
        case 'service':
        case 'repository':
        case 'usecase':
        case 'controller':
        case 'middleware':
          // These would be auto-registered by CLI
          break;
      }
    });

    return this;
  }

  /**
   * Clear all providers and instances
   */
  clear(): this {
    this.providers.clear();
    this.instances.clear();
    this.modules.clear();
    return this;
  }

  /**
   * Get all registered tokens
   */
  getTokens(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get provider information
   */
  getProvider(token: string): Provider | undefined {
    return this.providers.get(token);
  }
}
