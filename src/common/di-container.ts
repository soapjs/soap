/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { Scope, Provider, Module } from './di-types';
import { getInjectableMetadata, getInjectMetadata, getParamTypes } from './di-decorators';
import { BindingBuilder } from './binding-builder';

/**
 * Enhanced DI Container with NestJS-style API
 */
export class DIContainer {
  private providers = new Map<string, Provider>();
  private instances = new Map<string, any>();
  private modules = new Map<string, Module>();

  /**
   * Bind a token to a provider (Inversify-style API)
   */
  bind<T>(token: string | symbol | Function): BindingBuilder<T> {
    return new BindingBuilder<T>(this, this.resolveTokenKey(token));
  }

  /**
   * Register a provider with the container (internal method)
   */
  private bindProvider<T>(token: string, provider: Provider): this {
    this.providers.set(token, provider);
    return this;
  }

  /**
   * Register a class provider (internal method)
   */
  bindClass<T>(token: string, constructor: new (...args: any[]) => T, options?: {
    scope?: Scope;
    dependencies?: string[];
  }): this {
    return this.bindProvider(token, {
      token,
      useClass: constructor,
      scope: options?.scope || Scope.SINGLETON,
      dependencies: options?.dependencies
    });
  }

  /**
   * Register a value provider (internal method)
   */
  bindValue<T>(token: string, value: T): this {
    return this.bindProvider(token, {
      token,
      useValue: value,
      scope: Scope.SINGLETON
    });
  }

  /**
   * Register a factory provider (internal method)
   */
  bindFactory<T>(token: string, factory: (...args: any[]) => T, options?: {
    scope?: Scope;
    dependencies?: string[];
    injectContainer?: boolean;
  }): this {
    return this.bindProvider(token, {
      token,
      useFactory: factory,
      scope: options?.scope || Scope.SINGLETON,
      dependencies: options?.dependencies || [],
      injectContainer: options?.injectContainer || false
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
      
      // If injectContainer is true, pass container as first argument
      if (provider.injectContainer) {
        return provider.useFactory(this, ...dependencies);
      } else {
        return provider.useFactory(...dependencies);
      }
    }

    if (provider.useClass) {
      const dependencies = provider.dependencies !== undefined
        ? this.resolveDependencies(provider.dependencies)
        : this.autoResolveDependencies(provider.useClass);
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
    return this.resolveDependencies(this.extractDependencies(constructor));
  }

  /**
   * Register a module
   */
  registerModule(name: string, module: Module): this {
    this.modules.set(name, module);
    
    // Register all providers from the module
    module.providers.forEach(provider => {
      this.bindProvider(provider.token, provider);
    });

    return this;
  }

  /**
   * Resolve token key from different token types
   */
  private resolveTokenKey(token: string | symbol | Function): string {
    if (typeof token === 'string') {
      return token; // "IUserService"
    }
    
    if (typeof token === 'symbol') {
      return token.toString(); // Symbol('UserService')
    }
    
    if (typeof token === 'function') {
      return token.name; // UserService.name -> "UserService"
    }
    
    throw new Error('Invalid token type. Token must be string, symbol, or function');
  }

  /**
   * Auto-register a class with decorators
   */
  autoRegister<T>(constructor: new (...args: any[]) => T): this {
    const metadata = getInjectableMetadata(constructor);
    if (!metadata) {
      throw new Error(`Class ${constructor.name} is not marked as @Injectable`);
    }

    const dependencies = metadata.dependencies?.length
      ? metadata.dependencies
      : this.extractDependencies(constructor);
    
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

    const injectTokens: string[] | undefined =
      Array.isArray(injectMetadata?.parameters) ? injectMetadata.parameters : undefined;

    const dependencyCount = Math.max(
      paramTypes.length,
      injectTokens?.length ?? 0,
      constructor.length
    );

    for (let i = 0; i < dependencyCount; i++) {
      const token = injectTokens?.[i];
      if (token) {
        dependencies.push(token);
        continue;
      }

      // Try to resolve by type name
      const paramType = paramTypes[i];
      if (paramType && paramType.name !== 'Object') {
        dependencies.push(paramType.name);
      } else {
        throw new Error(
          `Cannot resolve constructor parameter #${i} of ${constructor.name}: ` +
          'no @Inject token and no emitted design:paramtypes. ' +
          'Add @Inject(<token>) or run under a compiler that emits decorator metadata.'
        );
      }
    }

    return dependencies;
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
