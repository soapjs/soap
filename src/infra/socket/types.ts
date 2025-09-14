/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from "http";

export type SocketMessage<
  MessageType = unknown,
  HeadersType = Record<string, unknown>
> = {
  type: string;
  payload: MessageType;
  headers?: HeadersType;
};

export interface AbstractSocket {
  connect(options: { auth?: unknown; [key: string]: unknown }): Promise<void>;
  disconnect(): Promise<void>;
  send(message: string | ArrayBuffer): void;
  on(
    event: "open" | "message" | "close" | "error" | string,
    handler: (data: any) => void
  ): void;
}

/**
 * Abstract interface for socket server implementations.
 * Provides methods for handling connections, messages, and client management.
 */
export interface AbstractSocketServer<SocketType = AbstractSocket> {
  /**
   * Sets up a callback for handling new client connections.
   *
   * @param {(client: SocketType, req: IncomingMessage) => void} onConnection - Callback invoked on new connections.
   */
  onConnection(
    onConnection: (client: SocketType, req: IncomingMessage) => void
  ): void;

  /**
   * Sends a message to the specified client.
   *
   * @param {SocketType} client - The target client.
   * @param {string} message - The message to send.
   */
  send(client: SocketType, message: string): void;

  /**
   * Checks if the specified client is currently connected.
   *
   * @param {SocketType} client - The client to check.
   * @returns {boolean} True if the client is connected, otherwise false.
   */
  isClientConnected(client: SocketType): boolean;

  /**
   * Sends a ping to the specified client (used for heartbeats).
   *
   * @param {SocketType} client - The client to ping.
   */
  ping(client: SocketType): void;

  /**
   * Gracefully shuts down the socket server.
   */
  close(): void;
}

export interface AuthorizationStrategy {
  /**
   * Applies the authorization logic to the Socket connection options.
   *
   * @param {any} options - The options object for the Socket connection.
   * @returns {any} The modified options with the applied authorization.
   */
  applyAuthorization(options: any): any;
}

export interface SocketClientOptions<MessageType, HeadersType> {
  url: string;
  authorizationStrategy?: AuthorizationStrategy;
  heartbeatInterval?: number;
  maxRate?: number;
  reconnect?: {
    retries: number;
    delay: number;
  };
  parser?: (data: any) => SocketMessage<MessageType, HeadersType>;
  onError?: (error: Error) => void;
  onClose?: () => void;
  onOpen?: () => void;
}

export interface SocketServerOptions {
  port: number;
  heartbeatInterval?: number;
  rateLimit?: number;
  onConnection?: (clientId: string) => void;
  onDisconnection?: (clientId: string) => void;
  onError?: (clientId: string, error: Error) => void;
  onMessage?: (clientId: string, message: SocketMessage) => void;
}

export interface SocketEventHandler<MessageType, HeadersType> {
  onMessage(message: SocketMessage<MessageType, HeadersType>): void;
  onError(
    error: Error,
    message?: SocketMessage<MessageType, HeadersType>
  ): void;
}
