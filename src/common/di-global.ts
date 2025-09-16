/* eslint-disable @typescript-eslint/no-explicit-any */
import { DIContainer } from './di-container';
import { BindingBuilder } from './binding-builder';

/**
 * Global DI container instance
 */
export const container = new DIContainer();

/**
 * Bind a token to a provider (Inversify-style API)
 */
export function bind<T>(token: string | symbol | Function): BindingBuilder<T> {
  return container.bind<T>(token);
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
 * Clear all dependencies
 */
export function clear(): void {
  container.clear();
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
export function getProvider(token: string): any {
  return container.getProvider(token);
}

/**
 * DI Namespace
 */
export const DI = {
  bind,
  get,
  has,
  clear,
  getTokens,
  getProvider,
  container,
} as const;
