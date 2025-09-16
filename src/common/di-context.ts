/* eslint-disable @typescript-eslint/no-explicit-any */
import { DependencyContext, Provider, Module, Scope } from './di-types';
import { DIContainer } from './di-container';

/**
 * Dependency context manager for CLI automation
 */
export class DependencyContextManager {
  private contexts: DependencyContext[] = [];
  private container: DIContainer;

  constructor(container: DIContainer) {
    this.container = container;
  }

  /**
   * Add a dependency context
   */
  addContext(context: DependencyContext): this {
    this.contexts.push(context);
    return this;
  }

  /**
   * Create a service context
   */
  createServiceContext(name: string, path: string, dependencies: string[] = []): DependencyContext {
    return {
      name,
      type: 'service',
      path,
      dependencies,
      scope: 'singleton' as Scope
    };
  }

  /**
   * Create a repository context
   */
  createRepositoryContext(name: string, path: string, dependencies: string[] = []): DependencyContext {
    return {
      name,
      type: 'repository',
      path,
      dependencies,
      scope: 'singleton' as Scope
    };
  }

  /**
   * Create a use case context
   */
  createUseCaseContext(name: string, path: string, dependencies: string[] = []): DependencyContext {
    return {
      name,
      type: 'usecase',
      path,
      dependencies,
      scope: 'transient' as Scope
    };
  }

  /**
   * Create a controller context
   */
  createControllerContext(name: string, path: string, dependencies: string[] = []): DependencyContext {
    return {
      name,
      type: 'controller',
      path,
      dependencies,
      scope: 'singleton' as Scope
    };
  }

  /**
   * Create a middleware context
   */
  createMiddlewareContext(name: string, path: string, dependencies: string[] = []): DependencyContext {
    return {
      name,
      type: 'middleware',
      path,
      dependencies,
      scope: 'singleton' as Scope
    };
  }

  /**
   * Generate provider configuration from context
   */
  generateProvider(context: DependencyContext): Provider {
    return {
      token: context.name,
      useClass: class Placeholder {}, // Placeholder - would be resolved by CLI
      scope: context.scope as any,
      dependencies: context.dependencies
    };
  }

  /**
   * Generate module configuration from contexts
   */
  generateModule(name: string, contexts: DependencyContext[]): Module {
    const providers = contexts.map(context => this.generateProvider(context));
    
    return {
      providers,
      exports: contexts
        .filter(context => context.exports)
        .flatMap(context => context.exports || [])
    };
  }

  /**
   * Register all contexts with the container
   */
  registerAll(): this {
    this.contexts.forEach(context => {
      const provider = this.generateProvider(context);
      // Use internal bindProvider method
      (this.container as any).bindProvider(context.name, provider);
    });

    return this;
  }


  /**
   * Get all contexts
   */
  getContexts(): DependencyContext[] {
    return [...this.contexts];
  }

  /**
   * Clear all contexts
   */
  clear(): this {
    this.contexts = [];
    return this;
  }
}
