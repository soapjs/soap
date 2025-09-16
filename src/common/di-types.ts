/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Dependency injection scope options
 */
export enum Scope {
  SINGLETON = 'singleton',
  TRANSIENT = 'transient',
  REQUEST = 'request'
}

/**
 * Dependency injection options
 */
export interface DIOptions {
  scope?: Scope;
  token?: string;
  factory?: () => any;
  dependencies?: string[];
}

/**
 * Provider configuration
 */
export interface Provider {
  token: string;
  useClass?: new (...args: any[]) => any;
  useValue?: any;
  useFactory?: (...args: any[]) => any;
  scope?: Scope;
  dependencies?: string[];
  injectContainer?: boolean; // New option to inject DI container into factory
}

/**
 * Module configuration
 */
export interface Module {
  providers: Provider[];
  imports?: Module[];
  exports?: string[];
}

/**
 * Dependency context for CLI automation
 */
export interface DependencyContext {
  name: string;
  type: 'service' | 'repository' | 'usecase' | 'controller' | 'middleware';
  path: string;
  dependencies: string[];
  scope: Scope;
  exports?: string[];
}
