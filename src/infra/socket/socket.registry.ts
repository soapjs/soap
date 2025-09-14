/* eslint-disable @typescript-eslint/no-explicit-any */

import { SocketHandler, SocketHandlerOptions } from "./socket.handler";
import { AbstractSocket, SocketMessage } from "./types";
import { RouteAdditionalOptions } from "../http/types";
import { IO } from "../common";

/**
 * Registry for managing socket handlers and handling socket events.
 * Provides centralized management of socket event handlers with middleware support.
 */
export class SocketRegistry {
  private handlers: Map<string, SocketHandler[]> = new Map();

  /**
   * Registers a socket handler.
   * 
   * @param {SocketHandler} handler - The socket handler to register.
   */
  private registerOne(handler: SocketHandler): void {
    const events = handler.getEvents();
    
    for (const event of events) {
      if (!this.handlers.has(event)) {
        this.handlers.set(event, []);
      }
      this.handlers.get(event)!.push(handler);
    }
  }

  /**
   * Registers multiple socket handlers.
   * 
   * @param {SocketHandler[]} handlers - The socket handlers to register.
   */
  register(...handlers: SocketHandler[]): void {
    for (const handler of handlers) {
      this.registerOne(handler);
    }
  }

  /**
   * Creates and registers a new socket handler.
   * 
   * @param {string | string[]} event - The socket event name(s).
   * @param {any} handler - The handler function.
   * @param {SocketHandlerOptions} [options] - Optional handler options.
   * @param {IO} [io] - Optional input/output data transformer.
   * @returns {SocketHandler} The created and registered handler.
   */
  create(
    event: string | string[],
    handler: any,
    options?: SocketHandlerOptions,
    io?: IO
  ): SocketHandler {
    const socketHandler = new SocketHandler(event, handler, options, io);
    this.register(socketHandler);
    return socketHandler;
  }

  /**
   * Handles an incoming socket event by dispatching it to appropriate handlers.
   * 
   * @param {AbstractSocket} socket - The socket connection.
   * @param {string} eventName - The event name.
   * @param {any} data - The event data.
   * @returns {Promise<void>} A promise that resolves when all handlers are executed.
   */
  async handleEvent(socket: AbstractSocket, eventName: string, data: any): Promise<void> {
    const handlers = this.handlers.get(eventName);
    
    if (!handlers || handlers.length === 0) {
      console.warn(`No handlers found for socket event: ${eventName}`);
      return;
    }

    // Execute all matching handlers
    for (const handler of handlers) {
      await handler.execute(socket, data, eventName);
    }
  }

  /**
   * Gets all registered handlers for a specific event.
   * 
   * @param {string} eventName - The event name.
   * @returns {SocketHandler[]} Array of handlers for the event.
   */
  getHandlers(eventName: string): SocketHandler[] {
    return this.handlers.get(eventName) || [];
  }

  /**
   * Gets all registered handlers.
   * 
   * @returns {Map<string, SocketHandler[]>} All registered handlers grouped by event.
   */
  getAllHandlers(): Map<string, SocketHandler[]> {
    return new Map(this.handlers);
  }

  /**
   * Removes a handler from the registry.
   * 
   * @param {string} eventName - The event name.
   * @param {SocketHandler} handler - The handler to remove.
   */
  removeHandler(eventName: string, handler: SocketHandler): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        if (handlers.length === 0) {
          this.handlers.delete(eventName);
        }
      }
    }
  }

  /**
   * Removes all handlers for a specific event.
   * 
   * @param {string} eventName - The event name.
   */
  removeEvent(eventName: string): void {
    this.handlers.delete(eventName);
  }

  /**
   * Clears all registered handlers.
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Gets the number of registered handlers.
   * 
   * @returns {number} The total number of handlers.
   */
  getHandlerCount(): number {
    let count = 0;
    for (const handlers of this.handlers.values()) {
      count += handlers.length;
    }
    return count;
  }

  /**
   * Gets the number of registered events.
   * 
   * @returns {number} The number of unique events.
   */
  getEventCount(): number {
    return this.handlers.size;
  }

  /**
   * Checks if a handler is registered for a specific event.
   * 
   * @param {string} eventName - The event name.
   * @returns {boolean} True if handlers exist for the event.
   */
  hasHandlers(eventName: string): boolean {
    return this.handlers.has(eventName) && this.handlers.get(eventName)!.length > 0;
  }

  /**
   * Gets a list of all registered event names.
   * 
   * @returns {string[]} Array of event names.
   */
  getEventNames(): string[] {
    return Array.from(this.handlers.keys());
  }
}
