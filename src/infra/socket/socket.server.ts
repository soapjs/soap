import {
  AbstractSocket,
  AbstractSocketServer,
  SocketMessage,
  SocketServerOptions,
} from "./types";
import { IncomingMessage } from "http";

/**
 * A generic socket server class that supports subscriptions, message validation, heartbeats, and advanced features.
 */
export class SocketServer {
  private clients: Map<string, AbstractSocket> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();
  private heartbeatIntervalId?: NodeJS.Timeout;

  /**
   * Creates a new SocketServer instance.
   *
   * @param {AbstractSocketServer} server - The socket server implementation.
   * @param {SocketServerOptions} options - Configuration options for the server.
   */
  constructor(
    private readonly server: AbstractSocketServer,
    private readonly options: SocketServerOptions
  ) {
    this.server.onConnection((client, req) => {
      const clientId = this.generateClientId(req);
      this.clients.set(clientId, client);
      this.options.onConnection?.(clientId);

      client.on("message", (data) => this.handleMessage(clientId, data));
      client.on("close", () => this.handleDisconnection(clientId));
      client.on("error", (error) => this.options.onError?.(clientId, error));
    });

    if (this.options.heartbeatInterval) {
      this.startHeartbeat();
    }
  }

  /**
   * Broadcasts a message to all connected clients.
   *
   * @param {SocketMessage} message - The message to broadcast.
   */
  broadcast(message: SocketMessage): void {
    for (const client of this.clients.values()) {
      if (this.server.isClientConnected(client)) {
        this.server.send(client, JSON.stringify(message));
      }
    }
  }

  /**
   * Sends a message to a specific client.
   *
   * @param {string} clientId - The ID of the client.
   * @param {SocketMessage} message - The message to send.
   */
  sendToClient(clientId: string, message: SocketMessage): void {
    const client = this.clients.get(clientId);
    if (client && this.server.isClientConnected(client)) {
      this.server.send(client, JSON.stringify(message));
    }
  }

  /**
   * Subscribes a client to a specific message type.
   *
   * @param {string} clientId - The ID of the client.
   * @param {string} messageType - The message type to subscribe to.
   */
  subscribe(clientId: string, messageType: string): void {
    if (!this.subscriptions.has(messageType)) {
      this.subscriptions.set(messageType, new Set());
    }
    this.subscriptions.get(messageType)?.add(clientId);
  }

  /**
   * Unsubscribes a client from a specific message type.
   *
   * @param {string} clientId - The ID of the client.
   * @param {string} messageType - The message type to unsubscribe from.
   */
  unsubscribe(clientId: string, messageType: string): void {
    this.subscriptions.get(messageType)?.delete(clientId);
  }

  /**
   * Sends a message to all clients subscribed to a specific message type.
   *
   * @param {string} messageType - The message type.
   * @param {SocketMessage} message - The message to send.
   */
  sendToSubscribers(messageType: string, message: SocketMessage): void {
    const subscribers = this.subscriptions.get(messageType);
    if (subscribers) {
      for (const clientId of subscribers) {
        this.sendToClient(clientId, message);
      }
    }
  }

  /**
   * Handles incoming messages from clients.
   *
   * @private
   * @param {string} clientId - The ID of the client.
   * @param {string | Buffer | ArrayBuffer | Buffer[]} data - The received message data.
   */
  private handleMessage(
    clientId: string,
    data: string | Buffer | ArrayBuffer | Buffer[]
  ): void {
    try {
      const message = JSON.parse(data.toString()) as SocketMessage;
      this.options.onMessage?.(clientId, message);
    } catch (error) {
      this.options.onError?.(
        clientId,
        new Error("Invalid message format received")
      );
    }
  }

  /**
   * Handles client disconnection.
   *
   * @private
   * @param {string} clientId - The ID of the disconnected client.
   */
  private handleDisconnection(clientId: string): void {
    this.clients.delete(clientId);
    for (const subscribers of this.subscriptions.values()) {
      subscribers.delete(clientId);
    }
    this.options.onDisconnection?.(clientId);
  }

  /**
   * Generates a unique client ID.
   *
   * @private
   * @param {IncomingMessage} req - The HTTP upgrade request.
   * @returns {string} The generated client ID.
   */
  private generateClientId(req: IncomingMessage): string {
    return `${req.socket.remoteAddress}:${req.socket.remotePort}`;
  }

  /**
   * Starts the heartbeat mechanism to check client connection health.
   *
   * @private
   */
  private startHeartbeat(): void {
    this.heartbeatIntervalId = setInterval(() => {
      for (const [clientId, client] of this.clients.entries()) {
        if (this.server.isClientConnected(client)) {
          this.server.ping(client);
        } else {
          this.handleDisconnection(clientId);
        }
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Stops the heartbeat mechanism.
   *
   * @private
   */
  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }
  }

  /**
   * Gracefully shuts down the socket server.
   */
  shutdown(): void {
    this.stopHeartbeat();
    this.server.close();
    this.clients.clear();
    this.subscriptions.clear();
  }
}
