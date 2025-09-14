/* eslint-disable @typescript-eslint/no-explicit-any */
import { DependencyContext, Provider, Module } from './di-types';
import { DIContainer } from './di-container-enhanced';

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
      scope: 'singleton' as any
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
      scope: 'singleton' as any
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
      scope: 'transient' as any
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
      scope: 'singleton' as any
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
      scope: 'singleton' as any
    };
  }

  /**
   * Generate provider configuration from context
   */
  generateProvider(context: DependencyContext): Provider {
    return {
      token: context.name,
      useClass: this.getConstructorFromPath(context.path),
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
      this.container.bind(context.name, provider);
    });

    return this;
  }

  /**
   * Get constructor from file path (placeholder - would be implemented by CLI)
   */
  private getConstructorFromPath(path: string): new (...args: any[]) => any {
    // This would be implemented by the CLI to dynamically import and return the constructor
    // For now, return a placeholder
    return class Placeholder {};
  }

  /**
   * Generate dependency registration code
   */
  generateRegistrationCode(contexts: DependencyContext[]): string {
    const imports: string[] = [];
    const registrations: string[] = [];

    contexts.forEach(context => {
      const importPath = this.getRelativeImportPath(context.path);
      imports.push(`import { ${context.name} } from '${importPath}';`);
      
      registrations.push(
        `container.bindClass('${context.name}', ${context.name}, { scope: '${context.scope}' });`
      );
    });

    return [
      '// Auto-generated dependency registration',
      'import { container } from \'@soapjs/soap\';',
      '',
      ...imports,
      '',
      '// Register dependencies',
      ...registrations,
      ''
    ].join('\n');
  }

  /**
   * Generate module registration code
   */
  generateModuleCode(moduleName: string, contexts: DependencyContext[]): string {
    const module = this.generateModule(moduleName, contexts);
    
    return [
      `// Auto-generated module: ${moduleName}`,
      'import { Module } from \'@soapjs/soap\';',
      '',
      `export const ${moduleName}Module: Module = {`,
      '  providers: [',
      ...module.providers.map(provider => 
        `    { token: '${provider.token}', useClass: ${provider.useClass?.name || 'Unknown'}, scope: '${provider.scope}' },`
      ),
      '  ],',
      '  exports: [',
      ...(module.exports || []).map(exportToken => `    '${exportToken}',`),
      '  ]',
      '};',
      ''
    ].join('\n');
  }

  /**
   * Get relative import path (placeholder)
   */
  private getRelativeImportPath(path: string): string {
    // This would be implemented by the CLI to generate proper relative paths
    return `./${path}`;
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
