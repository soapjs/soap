/* eslint-disable @typescript-eslint/no-explicit-any */
import { DIContainer } from './di-container-enhanced';
import { DependencyContextManager } from './di-context';
import { Scope, Provider, Module } from './di-types';

/**
 * Global DI container instance
 */
export const container = new DIContainer();

/**
 * Global dependency context manager
 */
export const contextManager = new DependencyContextManager(container);

/**
 * Register a class with the global container
 * 
 * @overload
 * Register a class using its name as token
 * @param constructor - The class constructor
 * @param options - Registration options
 */
export function registerClass<T>(
  constructor: new (...args: any[]) => T,
  options?: { scope?: Scope; dependencies?: string[] }
): void;

/**
 * @overload
 * Register a class with custom token
 * @param constructor - The class constructor
 * @param token - Custom token (string or symbol)
 * @param options - Registration options
 */
export function registerClass<T>(
  constructor: new (...args: any[]) => T,
  token: string | symbol,
  options?: { scope?: Scope; dependencies?: string[] }
): void;

/**
 * @overload
 * Legacy API - Register a class with explicit token first
 * @param token - The token to register under
 * @param constructor - The class constructor
 * @param options - Registration options
 */
export function registerClass<T>(
  token: string,
  constructor: new (...args: any[]) => T,
  options?: { scope?: Scope; dependencies?: string[] }
): void;

export function registerClass<T>(
  constructorOrToken: string | (new (...args: any[]) => T),
  constructorOrTokenOrOptions?: (new (...args: any[]) => T) | string | symbol | { scope?: Scope; dependencies?: string[] },
  options?: { scope?: Scope; dependencies?: string[] }
): void {
  // Handle different overloads
  if (typeof constructorOrToken === 'string') {
    // Legacy API: registerClass(token, constructor, options?)
    const token = constructorOrToken;
    const constructor = constructorOrTokenOrOptions as new (...args: any[]) => T;
    const opts = options;
    container.bindClass(token, constructor, opts);
  } else {
    // New API: registerClass(constructor, token?, options?)
    const constructor = constructorOrToken;
    
    if (typeof constructorOrTokenOrOptions === 'string' || typeof constructorOrTokenOrOptions === 'symbol') {
      // registerClass(constructor, token, options?)
      const token = constructorOrTokenOrOptions.toString();
      const opts = options;
      container.bindClass(token, constructor, opts);
    } else {
      // registerClass(constructor, options?)
      const token = constructor.name;
      const opts = constructorOrTokenOrOptions as { scope?: Scope; dependencies?: string[] } | undefined;
      container.bindClass(token, constructor, opts);
    }
  }
}

/**
 * Register a value with the global container
 */
export function registerValue<T>(token: string, value: T): void {
  container.bindValue(token, value);
}

/**
 * Register a factory with the global container
 */
export function registerFactory<T>(
  token: string, 
  factory: (...args: any[]) => T, 
  options?: { scope?: Scope; dependencies?: string[] }
): void {
  container.bindFactory(token, factory, options);
}

/**
 * Get a dependency from the global container
 */
export function get<T>(token: string): T {
  return container.get<T>(token);
}

/**
 * Check if a dependency is registered
 */
export function has(token: string): boolean {
  return container.has(token);
}

/**
 * Auto-register a class with decorators
 */
export function autoRegister<T>(constructor: new (...args: any[]) => T): void {
  container.autoRegister(constructor);
}

/**
 * Register a module
 */
export function registerModule(name: string, module: Module): void {
  container.registerModule(name, module);
}

/**
 * Create a service context
 */
export function createServiceContext(name: string, path: string, dependencies: string[] = []): void {
  const context = contextManager.createServiceContext(name, path, dependencies);
  contextManager.addContext(context);
}

/**
 * Create a repository context
 */
export function createRepositoryContext(name: string, path: string, dependencies: string[] = []): void {
  const context = contextManager.createRepositoryContext(name, path, dependencies);
  contextManager.addContext(context);
}

/**
 * Create a use case context
 */
export function createUseCaseContext(name: string, path: string, dependencies: string[] = []): void {
  const context = contextManager.createUseCaseContext(name, path, dependencies);
  contextManager.addContext(context);
}

/**
 * Create a controller context
 */
export function createControllerContext(name: string, path: string, dependencies: string[] = []): void {
  const context = contextManager.createControllerContext(name, path, dependencies);
  contextManager.addContext(context);
}

/**
 * Create a middleware context
 */
export function createMiddlewareContext(name: string, path: string, dependencies: string[] = []): void {
  const context = contextManager.createMiddlewareContext(name, path, dependencies);
  contextManager.addContext(context);
}

/**
 * Register all contexts
 */
export function registerAllContexts(): void {
  contextManager.registerAll();
}

/**
 * Generate registration code for all contexts
 */
export function generateRegistrationCode(): string {
  return contextManager.generateRegistrationCode(contextManager.getContexts());
}

/**
 * Generate module code
 */
export function generateModuleCode(moduleName: string): string {
  return contextManager.generateModuleCode(moduleName, contextManager.getContexts());
}

/**
 * Clear all dependencies
 */
export function clear(): void {
  container.clear();
  contextManager.clear();
}

/**
 * Get all registered tokens
 */
export function getTokens(): string[] {
  return container.getTokens();
}

/**
 * Get provider information
 */
export function getProvider(token: string): Provider | undefined {
  return container.getProvider(token);
}

/**
 * DI Namespace - Interactive tool for dependency injection
 * 
 * Usage:
 * - DI.registerClass(MyService) - Register class with auto token
 * - DI.registerClass(MyService, 'CustomToken') - Register with custom token
 * - DI.get('MyService') - Get dependency
 * - DI.has('MyService') - Check if exists
 * - DI.getTokens() - List all tokens
 * - DI.clear() - Clear container
 * 
 * Available operations:
 * - registerClass, registerValue, registerFactory, autoRegister
 * - get, has, registerModule
 * - createServiceContext, createRepositoryContext, createUseCaseContext, createControllerContext, createMiddlewareContext
 * - registerAllContexts, generateRegistrationCode, generateModuleCode
 * - clear, getTokens, getProvider
 */
export const DI = {
  // Registration methods
  registerClass,
  registerValue,
  registerFactory,
  autoRegister,
  registerModule,
  
  // Retrieval methods
  get,
  has,
  
  // Context creation methods
  createServiceContext,
  createRepositoryContext,
  createUseCaseContext,
  createControllerContext,
  createMiddlewareContext,
  
  // Management methods
  registerAllContexts,
  generateRegistrationCode,
  generateModuleCode,
  clear,
  getTokens,
  getProvider,
  
  // Container access
  container,
  contextManager,
  
  // Help method
  help(): void {
    console.log(`
🔧 SOAP DI Tool - Available Operations:

📝 Registration:
  DI.registerClass(MyService)                    - Register class with auto token
  DI.registerClass(MyService, 'CustomToken')     - Register with custom token  
  DI.registerClass(MyService, Symbol('Token'))   - Register with symbol token
  DI.registerValue('token', value)               - Register value
  DI.registerFactory('token', factory)           - Register factory
  DI.autoRegister(MyService)                     - Auto-register with decorators
  DI.registerModule('name', module)              - Register module

🔍 Retrieval:
  DI.get('token')                                - Get dependency
  DI.has('token')                                - Check if exists

🏗️ Context Creation:
  DI.createServiceContext(name, path, deps?)     - Create service context
  DI.createRepositoryContext(name, path, deps?)  - Create repository context
  DI.createUseCaseContext(name, path, deps?)     - Create use case context
  DI.createControllerContext(name, path, deps?)  - Create controller context
  DI.createMiddlewareContext(name, path, deps?)  - Create middleware context

⚙️ Management:
  DI.registerAllContexts()                       - Register all contexts
  DI.generateRegistrationCode()                  - Generate registration code
  DI.generateModuleCode('name')                  - Generate module code
  DI.clear()                                     - Clear container
  DI.getTokens()                                 - List all tokens
  DI.getProvider('token')                        - Get provider info

📊 Info:
  DI.container                                   - Access container instance
  DI.contextManager                              - Access context manager
  DI.help()                                      - Show this help

Examples:
  DI.registerClass(MyService)
  const service = DI.get('MyService')
  console.log(DI.getTokens())
    `);
  }
} as const;
