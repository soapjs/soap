import {
  AbstractSocket,
  SocketClientOptions,
  SocketMessage,
} from "./types";

/**
 * A generic socket client with support for reconnecting, rate limiting, and advanced subscriptions.
 *
 * @template MessageType - The type of message payloads.
 * @template HeadersType - The type of headers for messages.
 */
export class SocketClient<
  MessageType = unknown,
  HeadersType = Record<string, unknown>
> {
  private isConnected = false;
  private messageQueue: SocketMessage<MessageType, HeadersType>[] = [];
  private subscriptions: Map<
    string,
    (message: SocketMessage<MessageType, HeadersType>) => void
  > = new Map();
  private rateLimiter?: NodeJS.Timeout;
  private heartbeatIntervalId?: NodeJS.Timeout;

  /**
   * Creates a SocketClient instance.
   *
   * @param {AbstractSocket} socket - The socket implementation (e.g., WebSocket, socket.io).
   * @param {SocketClientOptions<MessageType, HeadersType>} options - The configuration options for the client.
   */
  constructor(
    private readonly socket: AbstractSocket,
    private readonly options: SocketClientOptions<MessageType, HeadersType>
  ) {}

  /**
   * Connects to the socket server.
   *
   * @returns {Promise<void>} Resolves when the connection is established.
   */
  async connect(): Promise<void> {
    const { heartbeatInterval, authorizationStrategy } = this.options;

    this.socket.on("open", () => {
      this.isConnected = true;
      this.options.onOpen?.();
      this.flushQueue();

      if (heartbeatInterval) {
        this.startHeartbeat();
      }
    });

    this.socket.on("message", (data) => {
      try {
        const message = this.options.parser
          ? this.options.parser(data)
          : (JSON.parse(data.toString()) as SocketMessage<
              MessageType,
              HeadersType
            >);
        this.handleMessage(message);
      } catch (error) {
        this.options.onError?.(new Error("Failed to parse message"));
      }
    });

    this.socket.on("close", () => {
      this.isConnected = false;
      this.stopHeartbeat();
      this.options.onClose?.();
    });

    this.socket.on("error", (error) => {
      this.options.onError?.(error);
    });

    const authorizedOptions = authorizationStrategy
      ? authorizationStrategy.applyAuthorization({})
      : {};

    await this.socket.connect({ auth: authorizedOptions });
  }

  /**
   * Sends a message to the server.
   *
   * @param {SocketMessage<MessageType, HeadersType>} message - The message to send.
   * @returns {Promise<void>} Resolves when the message is sent or queued.
   */
  async send(message: SocketMessage<MessageType, HeadersType>): Promise<void> {
    if (this.isConnected) {
      if (this.options.maxRate) {
        this.enqueueMessage(message);
      } else {
        this.socket.send(JSON.stringify(message));
      }
    } else {
      this.messageQueue.push(message);
    }
  }

  /**
   * Subscribes to a specific message type.
   *
   * @param {string} messageType - The type of message to subscribe to.
   * @param {(message: SocketMessage<MessageType, HeadersType>) => void} handler - The callback for the message type.
   */
  subscribe(
    messageType: string,
    handler: (message: SocketMessage<MessageType, HeadersType>) => void
  ): void {
    this.subscriptions.set(messageType, handler);
  }

  /**
   * Unsubscribes from a specific message type.
   *
   * @param {string} messageType - The type of message to unsubscribe from.
   */
  unsubscribe(messageType: string): void {
    this.subscriptions.delete(messageType);
  }

  /**
   * Gracefully closes the socket connection.
   *
   * @returns {Promise<void>} Resolves when the connection is closed.
   */
  async disconnect(): Promise<void> {
    this.socket.disconnect();
    this.stopHeartbeat();
    if (this.rateLimiter) {
      clearInterval(this.rateLimiter);
    }
  }

  /**
   * Handles incoming messages and routes them to the appropriate subscription handler.
   *
   * @private
   * @param {SocketMessage<MessageType, HeadersType>} message - The incoming message.
   */
  private handleMessage(
    message: SocketMessage<MessageType, HeadersType>
  ): void {
    const handler = this.subscriptions.get(message.type);
    if (handler) {
      handler(message);
    } else {
      console.warn(`No handler found for message type: ${message.type}`);
    }
  }

  /**
   * Starts the heartbeat mechanism.
   *
   * @private
   */
  private startHeartbeat(): void {
    const { heartbeatInterval } = this.options;
    if (!heartbeatInterval) return;

    this.heartbeatIntervalId = setInterval(() => {
      if (this.isConnected) {
        this.socket.send(JSON.stringify({ type: "ping" }));
      }
    }, heartbeatInterval);
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
   * Enqueues a message and processes it according to rate limiting.
   *
   * @private
   * @param {SocketMessage<MessageType, HeadersType>} message - The message to enqueue.
   */
  private enqueueMessage(
    message: SocketMessage<MessageType, HeadersType>
  ): void {
    this.messageQueue.push(message);

    if (!this.rateLimiter) {
      this.processRateLimitedQueue();
      this.rateLimiter = setInterval(
        () => this.processRateLimitedQueue(),
        1000 / this.options.maxRate!
      );
    }
  }

  /**
   * Processes the message queue with respect to rate limiting.
   *
   * @private
   */
  private processRateLimitedQueue(): void {
    if (this.isConnected && this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.socket.send(JSON.stringify(message));
      }
    }

    if (this.messageQueue.length === 0 && this.rateLimiter) {
      clearInterval(this.rateLimiter);
      this.rateLimiter = undefined;
    }
  }

  /**
   * Flushes the queue of pending messages.
   *
   * @private
   */
  private flushQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }
}
