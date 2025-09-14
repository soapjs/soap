/* eslint-disable @typescript-eslint/no-explicit-any */

import { SocketServer } from "./socket.server";
import { SocketRegistry } from "./socket.registry";
import { AbstractSocket, SocketMessage, SocketServerOptions } from "./types";

/**
 * Enhanced SocketServer with fluent API and registry support.
 * Provides a more intuitive interface for configuring and managing socket handlers.
 */
export class EnhancedSocketServer extends SocketServer {
  private registry?: SocketRegistry;

  /**
   * Creates a new EnhancedSocketServer instance.
   * 
   * @param {any} server - The socket server implementation.
   * @param {SocketServerOptions} options - Configuration options for the server.
   */
  constructor(
    server: any,
    options: SocketServerOptions
  ) {
    super(server, options);
    
    // Override the message handler to use the registry
    this.setupRegistryMessageHandler();
  }

  /**
   * Uses a socket registry to handle incoming events.
   * 
   * @param {SocketRegistry} registry - The socket registry to use.
   * @returns {EnhancedSocketServer} This instance for method chaining.
   */
  use(registry: SocketRegistry): EnhancedSocketServer {
    this.registry = registry;
    return this;
  }

  /**
   * Configures additional server options.
   * 
   * @param {Partial<SocketServerOptions>} config - Additional configuration options.
   * @returns {EnhancedSocketServer} This instance for method chaining.
   */
  configure(config: Partial<SocketServerOptions>): EnhancedSocketServer {
    // Merge configuration with existing options
    Object.assign((this as any).options, config);
    return this;
  }

  /**
   * Starts the socket server.
   * 
   * @returns {EnhancedSocketServer} This instance for method chaining.
   */
  start(): EnhancedSocketServer {
    // Server is already started in constructor, but this provides a fluent API
    return this;
  }

  /**
   * Gets the socket registry.
   * 
   * @returns {SocketRegistry | undefined} The registry instance.
   */
  getRegistry(): SocketRegistry | undefined {
    return this.registry;
  }

  /**
   * Sets up the registry-based message handler.
   * 
   * @private
   */
  private setupRegistryMessageHandler(): void {
    // Store original options to avoid modifying the original
    const originalOptions = { ...(this as any).options };
    
    // Override the message handling to use the registry
    (this as any).options = {
      ...originalOptions,
      onMessage: (clientId: string, message: SocketMessage) => {
        // Call original handler if it exists
        if (originalOptions.onMessage) {
          originalOptions.onMessage(clientId, message);
        }

        // Handle with registry
        this.handleMessageWithRegistry(clientId, message);
      }
    };
  }

  /**
   * Handles incoming messages using the registry.
   * 
   * @private
   * @param {string} clientId - The client ID.
   * @param {SocketMessage} message - The incoming message.
   */
  private async handleMessageWithRegistry(clientId: string, message: SocketMessage): Promise<void> {
    if (!this.registry) {
      return;
    }

    const client = this.getClient(clientId);
    if (!client) {
      console.warn(`Client ${clientId} not found for message handling`);
      return;
    }

    try {
      // Parse the message to extract event name and data
      const { type: eventName, payload: data } = message;
      
      // Handle the event through the registry
      await this.registry.handleEvent(client, eventName, data);
    } catch (error) {
      console.error(`Error handling message for client ${clientId}:`, error);
      
      // Send error response back to client
      this.sendToClientInternal(clientId, {
        type: 'error',
        payload: { message: 'Internal server error' }
      });
    }
  }

  /**
   * Gets a client by ID.
   * 
   * @private
   * @param {string} clientId - The client ID.
   * @returns {AbstractSocket | undefined} The client socket.
   */
  private getClient(clientId: string): AbstractSocket | undefined {
    // Access the private clients map from the parent class
    return (this as any).clients?.get(clientId);
  }

  /**
   * Sends a message to a specific client.
   * 
   * @private
   * @param {string} clientId - The client ID.
   * @param {SocketMessage} message - The message to send.
   */
  private sendToClientInternal(clientId: string, message: SocketMessage): void {
    // Use the public sendToClient method from the parent class
    this.sendToClient(clientId, message);
  }

  /**
   * Broadcasts a message to all connected clients using the registry's response format.
   * 
   * @param {string} eventName - The event name to broadcast.
   * @param {any} data - The data to broadcast.
   */
  broadcastEvent(eventName: string, data: any): void {
    const message: SocketMessage = {
      type: eventName,
      payload: data
    };
    this.broadcast(message);
  }

  /**
   * Sends a message to a specific client using the registry's response format.
   * 
   * @param {string} clientId - The client ID to send to.
   * @param {string} eventName - The event name.
   * @param {any} data - The data to send.
   */
  sendEvent(clientId: string, eventName: string, data: any): void {
    const message: SocketMessage = {
      type: eventName,
      payload: data
    };
    this.sendToClientInternal(clientId, message);
  }

  /**
   * Sends a message to all clients subscribed to a specific event.
   * 
   * @param {string} eventName - The event name.
   * @param {any} data - The data to send.
   */
  sendToSubscribers(eventName: string, data: any): void {
    const message: SocketMessage = {
      type: eventName,
      payload: data
    };
    this.sendToSubscribers(eventName, message);
  }
}
