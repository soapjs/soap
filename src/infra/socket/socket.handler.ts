/* eslint-disable @typescript-eslint/no-explicit-any */

import { IO } from "../common";
import { AnyHandler } from "../http/types";
import { MiddlewareFunction } from "../common/middleware.types";
import { AbstractSocket } from "./types";

/**
 * Options for configuring a socket handler.
 */
export interface SocketHandlerOptions {
  /**
   * Middleware configuration for the handler.
   */
  middlewares?: {
    /**
     * Middleware functions to execute before the main handler.
     */
    pre?: MiddlewareFunction[];
    
    /**
     * Middleware functions to execute after the main handler.
     */
    post?: MiddlewareFunction[];
  };

  /**
   * Authentication configuration.
   */
  auth?: {
    /**
     * Whether authentication is required for this handler.
     */
    required?: boolean;
    
    /**
     * List of roles allowed to access this handler.
     */
    roles?: string[];
  };

  /**
   * Rate limiting configuration.
   */
  rateLimit?: {
    /**
     * Maximum number of requests allowed.
     */
    maxRequests: number;
    
    /**
     * Time window in milliseconds.
     */
    windowMs: number;
  };

  /**
   * Validation configuration.
   */
  validation?: {
    /**
     * Schema for validating incoming data.
     */
    schema?: any;
  };

  /**
   * Additional custom options.
   */
  [key: string]: any;
}

/**
 * Represents a socket handler that processes specific socket events.
 * Combines business logic with middleware support and data transformation.
 */
export class SocketHandler {
  /**
   * Creates a new SocketHandler instance.
   * 
   * @param {string | string[]} event - The socket event name(s) to listen for.
   * @param {AnyHandler} handler - The handler function for the event.
   * @param {SocketHandlerOptions} [options] - Optional handler configuration.
   * @param {IO} [io] - Optional input/output data transformer.
   */
  constructor(
    public readonly event: string | string[],
    public readonly handler: AnyHandler,
    public readonly options?: SocketHandlerOptions,
    public readonly io?: IO
  ) {}

  /**
   * Executes the handler with middleware support and data transformation.
   * 
   * @param {AbstractSocket} socket - The socket connection.
   * @param {any} data - The incoming event data.
   * @param {string} eventName - The event name that triggered this handler.
   * @returns {Promise<void>} A promise that resolves when execution is complete.
   */
  async execute(socket: AbstractSocket, data: any, eventName: string): Promise<void> {
    try {
      // Execute pre-middleware
      if (this.options?.middlewares?.pre) {
        for (const middleware of this.options.middlewares.pre) {
          await this.executeMiddleware(middleware, socket, data, eventName);
        }
      }

      // Transform input data using IO
      let inputData = data;
      if (this.io?.from) {
        inputData = this.io.from({ socket, data });
      }

      // Execute the main handler
      const result = await this.handler(inputData, socket, eventName);

      // Execute post-middleware
      if (this.options?.middlewares?.post) {
        for (const middleware of this.options.middlewares.post) {
          await this.executeMiddleware(middleware, socket, data, eventName, result);
        }
      }

      // Transform and send response using IO
      if (this.io?.to) {
        this.io.to(result, socket);
      }
    } catch (error) {
      // Handle errors
      console.error(`Error in socket handler ${eventName}:`, error);
      
      // Send error response if IO supports it
      if (this.io?.to) {
        this.io.to({ error: error.message }, socket);
      }
    }
  }

  /**
   * Executes a middleware function.
   * 
   * @private
   * @param {MiddlewareFunction} middleware - The middleware function to execute.
   * @param {AbstractSocket} socket - The socket connection.
   * @param {any} data - The event data.
   * @param {string} eventName - The event name.
   * @param {any} [result] - The handler result (for post-middleware).
   * @returns {Promise<void>} A promise that resolves when middleware execution is complete.
   */
  private async executeMiddleware(
    middleware: MiddlewareFunction,
    socket: AbstractSocket,
    data: any,
    eventName: string,
    result?: any
  ): Promise<void> {
    try {
      await middleware(socket, data, eventName, result);
    } catch (error) {
      console.error(`Error in socket middleware:`, error);
      throw error;
    }
  }

  /**
   * Checks if this handler matches the given event name.
   * 
   * @param {string} eventName - The event name to check.
   * @returns {boolean} True if the handler matches the event.
   */
  matches(eventName: string): boolean {
    if (Array.isArray(this.event)) {
      return this.event.includes(eventName);
    }
    return this.event === eventName;
  }

  /**
   * Gets the event name(s) this handler responds to.
   * 
   * @returns {string[]} Array of event names.
   */
  getEvents(): string[] {
    return Array.isArray(this.event) ? this.event : [this.event];
  }
}
