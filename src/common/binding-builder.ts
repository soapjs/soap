/* eslint-disable @typescript-eslint/no-explicit-any */
import { DIContainer } from './di-container';
import { Scope } from './di-types';

/**
 * Builder class for binding tokens to providers (Inversify-style API)
 */
export class BindingBuilder<T> {
  constructor(
    private container: DIContainer,
    private token: string
  ) {}

  /**
   * Bind to a class
   */
  toClass<U extends T>(constructor: new (...args: any[]) => U, options?: {
    scope?: Scope;
    dependencies?: string[];
  }): DIContainer {
    return this.container.bindClass(this.token, constructor, options);
  }

  /**
   * Bind to a value/instance
   */
  toValue(value: T): DIContainer {
    return this.container.bindValue(this.token, value);
  }

  /**
   * Bind to a factory function
   */
  toFactory(factory: (...args: any[]) => T, options?: {
    scope?: Scope;
    dependencies?: string[];
    injectContainer?: boolean; // New option to inject DI container
  }): DIContainer {
    return this.container.bindFactory(this.token, factory, options);
  }

  /**
   * Bind to an interface (alias for toClass with interface as token)
   */
  toInterface<U extends T>(implementation: new (...args: any[]) => U, options?: {
    scope?: Scope;
    dependencies?: string[];
  }): DIContainer {
    return this.container.bindClass(this.token, implementation, options);
  }

  /**
   * Bind to an abstract class (alias for toClass with abstract as token)
   */
  toAbstract<U extends T>(implementation: new (...args: any[]) => U, options?: {
    scope?: Scope;
    dependencies?: string[];
  }): DIContainer {
    return this.container.bindClass(this.token, implementation, options);
  }
}
