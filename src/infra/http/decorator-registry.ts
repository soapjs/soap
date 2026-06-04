import { RouteMetadata, ControllerMetadata } from './types';

/** CQRS handler / bus metadata collected by framework decorators. */
export interface CommandHandlerMetadata {
  commandType: new (...args: any[]) => any;
  handlerClass: any;
  token: string;
  scope: string;
}

export interface QueryHandlerMetadata {
  queryType: new (...args: any[]) => any;
  handlerClass: any;
  token: string;
  scope: string;
}

export interface EventHandlerMetadata {
  eventType: new (...args: any[]) => any;
  handlerClass: any;
  token: string;
  scope: string;
}

export interface CommandBusMetadata {
  busClass: any;
  token: string;
  scope: string;
}

export interface QueryBusMetadata {
  busClass: any;
  token: string;
  scope: string;
}

function resolveClassName(target: any): string {
  if (target.constructor && target.constructor === Function) {
    return target.name;
  }
  if (target.constructor) {
    return target.constructor.name;
  }
  return target.name;
}

/**
 * In-memory registry for HTTP route/controller metadata and CQRS decorator metadata.
 * Populated at class-load time; read by HTTP adapters (Express) and plugins (OpenAPI).
 */
export class DecoratorRegistry {
  private static routes = new Map<string, RouteMetadata>();
  private static controllers = new Map<string, ControllerMetadata>();

  private static commandHandlers = new Map<string, CommandHandlerMetadata>();
  private static queryHandlers = new Map<string, QueryHandlerMetadata>();
  private static eventHandlers = new Map<string, EventHandlerMetadata>();
  private static commandBuses = new Map<string, CommandBusMetadata>();
  private static queryBuses = new Map<string, QueryBusMetadata>();

  static registerRoute(target: any, propertyKey: string, metadata: RouteMetadata) {
    const key = `${resolveClassName(target)}.${propertyKey}`;
    this.routes.set(key, metadata);
  }

  static getRoute(target: any, propertyKey: string): RouteMetadata | undefined {
    const key = `${resolveClassName(target)}.${propertyKey}`;
    return this.routes.get(key);
  }

  static getRoutes(): Map<string, RouteMetadata> {
    return this.routes;
  }

  static registerController(target: any, metadata: ControllerMetadata) {
    this.controllers.set(resolveClassName(target), metadata);
  }

  static getController(target: any): ControllerMetadata | undefined {
    return this.controllers.get(resolveClassName(target));
  }

  static getControllers(): Map<string, ControllerMetadata> {
    return this.controllers;
  }

  static registerCommandHandler(metadata: CommandHandlerMetadata) {
    this.commandHandlers.set(metadata.token, metadata);
  }

  static getCommandHandlers(): Map<string, CommandHandlerMetadata> {
    return this.commandHandlers;
  }

  static getCommandHandler(token: string): CommandHandlerMetadata | undefined {
    return this.commandHandlers.get(token);
  }

  static registerQueryHandler(metadata: QueryHandlerMetadata) {
    this.queryHandlers.set(metadata.token, metadata);
  }

  static getQueryHandlers(): Map<string, QueryHandlerMetadata> {
    return this.queryHandlers;
  }

  static getQueryHandler(token: string): QueryHandlerMetadata | undefined {
    return this.queryHandlers.get(token);
  }

  static registerEventHandler(metadata: EventHandlerMetadata) {
    this.eventHandlers.set(metadata.token, metadata);
  }

  static getEventHandlers(): Map<string, EventHandlerMetadata> {
    return this.eventHandlers;
  }

  static getEventHandler(token: string): EventHandlerMetadata | undefined {
    return this.eventHandlers.get(token);
  }

  static registerCommandBus(metadata: CommandBusMetadata) {
    this.commandBuses.set(metadata.token, metadata);
  }

  static getCommandBuses(): Map<string, CommandBusMetadata> {
    return this.commandBuses;
  }

  static getCommandBus(token: string): CommandBusMetadata | undefined {
    return this.commandBuses.get(token);
  }

  static registerQueryBus(metadata: QueryBusMetadata) {
    this.queryBuses.set(metadata.token, metadata);
  }

  static getQueryBuses(): Map<string, QueryBusMetadata> {
    return this.queryBuses;
  }

  static getQueryBus(token: string): QueryBusMetadata | undefined {
    return this.queryBuses.get(token);
  }

  static clear() {
    this.routes.clear();
    this.controllers.clear();
    this.commandHandlers.clear();
    this.queryHandlers.clear();
    this.eventHandlers.clear();
    this.commandBuses.clear();
    this.queryBuses.clear();
  }
}
