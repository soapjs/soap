# Socket Components - Real-time Communication in SoapJS

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Abstract Interfaces](#abstract-interfaces)
4. [Implementation Examples](#implementation-examples)
5. [Usage Examples](#usage-examples)
6. [Advanced Features](#advanced-features)
7. [Best Practices](#best-practices)
8. [Complete Example](#complete-example)

## Overview

The Socket components in SoapJS provide a flexible and scalable solution for real-time communication. The system consists of `SocketClient` and `SocketServer` classes that work with abstract socket interfaces, allowing integration with various socket libraries like WebSocket, Socket.IO, and custom implementations.

### Key Features

- **Abstract Implementation** - Pluggable socket backends
- **Client Management** - Track connected clients and subscriptions
- **Message Broadcasting** - Send to all or specific groups
- **Heartbeat Monitoring** - Detect stale connections
- **Rate Limiting** - Prevent abuse and control message flow
- **Authentication** - Support for JWT, tokens, and custom strategies

---

## Core Components

### SocketClient

The `SocketClient` class provides a robust client implementation with advanced features for real-time applications.

#### Key Features

- **Connection Management** - Automatic connection handling with reconnection support
- **Message Queuing** - Queue messages when disconnected, flush on reconnect
- **Rate Limiting** - Control message sending rate to prevent flooding
- **Subscriptions** - Subscribe to specific message types with handlers
- **Heartbeat Support** - Periodic ping/pong to maintain connection health
- **Authorization** - Support for custom authentication strategies

#### Constructor

```typescript
constructor(
  socket: AbstractSocket,
  options: SocketClientOptions<MessageType, HeadersType>
)
```

#### Key Methods

```typescript
// Connect to server
async connect(): Promise<void>

// Send message to server
async send(message: SocketMessage<MessageType, HeadersType>): Promise<void>

// Subscribe to message type
subscribe(messageType: string, handler: (message: SocketMessage<MessageType, HeadersType>) => void): void

// Disconnect from server
async disconnect(): Promise<void>
```

### SocketServer

The `SocketServer` class manages server-side socket connections and provides advanced features for handling multiple clients.

#### Key Features

- **Client Tracking** - Monitor all connected clients
- **Subscription Management** - Group clients by message types (e.g., rooms)
- **Message Broadcasting** - Send to all clients or specific subscribers
- **Heartbeat Monitoring** - Detect and handle stale connections
- **Error Handling** - Comprehensive error management

#### Constructor

```typescript
constructor(
  server: AbstractSocketServer,
  options: SocketServerOptions
)
```

#### Key Methods

```typescript
// Send message to specific client
sendToClient(clientId: string, message: SocketMessage): void

// Broadcast to all clients
broadcast(message: SocketMessage): void

// Subscribe client to message type
subscribe(clientId: string, messageType: string): void

// Unsubscribe client from message type
unsubscribe(clientId: string, messageType: string): void

// Send to subscribers of specific type
sendToSubscribers(messageType: string, message: SocketMessage): void

// Gracefully shutdown server
shutdown(): void
```

---

## Abstract Interfaces

### AbstractSocket Interface

The `AbstractSocket` interface defines the contract for socket client implementations.

```typescript
interface AbstractSocket {
  connect(options: { auth?: unknown; [key: string]: unknown }): Promise<void>;
  disconnect(): Promise<void>;
  send(message: string | ArrayBuffer): void;
  on(event: "open" | "message" | "close" | "error" | string, handler: (data: any) => void): void;
}
```

### AbstractSocketServer Interface

The `AbstractSocketServer` interface defines the contract for socket server implementations.

```typescript
interface AbstractSocketServer<SocketType = AbstractSocket> {
  onConnection(onConnection: (client: SocketType, req: IncomingMessage) => void): void;
  send(client: SocketType, message: string): void;
  isClientConnected(client: SocketType): boolean;
  ping(client: SocketType): void;
  close(): void;
}
```

### SocketMessage Interface

The `SocketMessage` interface defines the structure of messages exchanged between client and server.

```typescript
interface SocketMessage<MessageType = unknown, HeadersType = Record<string, unknown>> {
  type: string;
  payload: MessageType;
  headers?: HeadersType;
}
```

### Configuration Options

#### SocketClientOptions

```typescript
interface SocketClientOptions<MessageType, HeadersType> {
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
```

#### SocketServerOptions

```typescript
interface SocketServerOptions {
  port: number;  // Required
  heartbeatInterval?: number;
  rateLimit?: number;
  onConnection?: (clientId: string) => void;
  onDisconnection?: (clientId: string) => void;
  onError?: (clientId: string, error: Error) => void;
  onMessage?: (clientId: string, message: SocketMessage) => void;
}
```

### Authentication Strategies

The socket system supports various authentication strategies:

1. **JWT Tokens (Bearer)** - Tokens passed in headers during connection
2. **Query Parameters** - Tokens or session IDs sent as URL parameters
3. **Custom Authorization Strategy** - Flexible integration with any auth mechanism

---

## Implementation Examples

### WebSocket Implementation

Here's how to implement the abstract interfaces using the `ws` library:

#### WebSocket Client Adapter

```typescript
import { AbstractSocket } from "@soapjs/soap";
import { WebSocket } from "ws";

export class WebSocketAdapter implements AbstractSocket {
  private socket!: WebSocket;

  async connect(options: { auth?: unknown; [key: string]: unknown }): Promise<void> {
    const url = (options as any).url || 'ws://localhost:8080';
    this.socket = new WebSocket(url);
    
    return new Promise((resolve, reject) => {
      this.socket.on('open', () => resolve());
      this.socket.on('error', (error) => reject(error));
    });
  }

  async disconnect(): Promise<void> {
    this.socket.close();
  }

  send(message: string | ArrayBuffer): void {
    this.socket.send(message);
  }

  on(event: "open" | "message" | "close" | "error" | string, handler: (data: any) => void): void {
    this.socket.on(event, handler);
  }
}
```

#### WebSocket Server Adapter

```typescript
import { AbstractSocketServer } from "@soapjs/soap";
import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";

export class WebSocketServerAdapter implements AbstractSocketServer<WebSocket> {
  private wss!: WebSocketServer;

  onConnection(handler: (client: WebSocket, req: IncomingMessage) => void): void {
    this.wss = new WebSocketServer({ port: 8080 });
    this.wss.on("connection", (ws, req) => handler(ws, req));
  }

  send(client: WebSocket, message: string): void {
    client.send(message);
  }

  isClientConnected(client: WebSocket): boolean {
    return client.readyState === WebSocket.OPEN;
  }

  ping(client: WebSocket): void {
    client.ping();
  }

  close(): void {
    this.wss.close();
  }
}
```

### Socket.IO Implementation

```typescript
import { AbstractSocket, AbstractSocketServer } from "@soapjs/soap";
import { io, Socket as SocketIOSocket, Server as SocketIOServer } from "socket.io";

export class SocketIOAdapter implements AbstractSocket {
  private socket!: SocketIOSocket;

  async connect(options: { auth?: unknown; [key: string]: unknown }): Promise<void> {
    const url = (options as any).url || 'http://localhost:8080';
    this.socket = io(url);
  }

  async disconnect(): Promise<void> {
    this.socket.disconnect();
  }

  send(message: string | ArrayBuffer): void {
    this.socket.emit('message', message);
  }

  on(event: "open" | "message" | "close" | "error" | string, handler: (data: any) => void): void {
    this.socket.on(event, handler);
  }
}
```

---

## Usage Examples

### Simple Client-Server Communication

#### Server Setup

```typescript
import { SocketServer } from "@soapjs/soap";
import { WebSocketServerAdapter } from "./WebSocketAdapter";

const server = new SocketServer(new WebSocketServerAdapter(), {
  port: 8080,  // Required port
  heartbeatInterval: 5000,
  onConnection: (clientId) => console.log(`Client connected: ${clientId}`),
  onMessage: (clientId, message) => {
    console.log(`Message from ${clientId}:`, message);
    server.sendToClient(clientId, {
      type: "echo",
      payload: `You said: ${message.payload}`,
    });
  },
  onDisconnection: (clientId) => console.log(`Client disconnected: ${clientId}`),
  onError: (clientId, error) => console.error(`Error from ${clientId}:`, error),
});
```

#### Client Setup

```typescript
import { SocketClient } from "@soapjs/soap";
import { WebSocketAdapter } from "./WebSocketAdapter";

const client = new SocketClient(new WebSocketAdapter(), {
  url: "ws://localhost:8080",
  heartbeatInterval: 5000,
  maxRate: 10,  // Max 10 messages per second
  onOpen: () => {
    console.log("Connected to server");
    client.send({ type: "greeting", payload: "Hello, Server!" });
  },
  onMessage: (message) => console.log(`Message from server:`, message),
  onClose: () => console.log("Disconnected from server"),
  onError: (error) => console.error("Socket error:", error),
});

await client.connect();
```

---

### Chat Application with Rooms

#### Server Implementation

```typescript
import { SocketServer } from "@soapjs/soap";
import { WebSocketServerAdapter } from "./WebSocketAdapter";

const chatServer = new SocketServer(new WebSocketServerAdapter(), {
  port: 8080,
  heartbeatInterval: 5000,
  onConnection: (clientId) => console.log(`Client connected: ${clientId}`),
  onMessage: (clientId, message) => {
    const { type, payload } = message;

    switch (type) {
      case "join":
        chatServer.subscribe(clientId, payload.room);
        chatServer.sendToSubscribers(payload.room, {
          type: "system",
          payload: `${payload.user} joined the room`,
        });
        break;

      case "message":
        chatServer.sendToSubscribers(payload.room, {
          type: "chat",
          payload: `${payload.user}: ${payload.message}`,
        });
        break;

      case "leave":
        chatServer.unsubscribe(clientId, payload.room);
        chatServer.sendToSubscribers(payload.room, {
          type: "system",
          payload: `${payload.user} left the room`,
        });
        break;

      default:
        chatServer.sendToClient(clientId, {
          type: "error",
          payload: "Invalid message type",
        });
    }
  },
  onDisconnection: (clientId) => console.log(`Client disconnected: ${clientId}`),
  onError: (clientId, error) => console.error(`Error from ${clientId}:`, error),
});
```

#### Client Implementation

```typescript
import { SocketClient } from "@soapjs/soap";
import { WebSocketAdapter } from "./WebSocketAdapter";

const chatClient = new SocketClient(new WebSocketAdapter(), {
  url: "ws://localhost:8080",
  heartbeatInterval: 5000,
  maxRate: 5,  // Limit chat messages
  onOpen: () => {
    console.log("Connected to chat server");
    chatClient.send({
      type: "join",
      payload: { room: "general", user: "Alice" },
    });
  },
  onMessage: (message) => {
    if (message.type === "chat") {
      console.log(`Chat: ${message.payload}`);
    } else if (message.type === "system") {
      console.log(`System: ${message.payload}`);
    }
  },
  onClose: () => console.log("Disconnected from chat server"),
  onError: (error) => console.error("Socket error:", error),
});

await chatClient.connect();

// Send a message
await chatClient.send({
  type: "message",
  payload: { room: "general", user: "Alice", message: "Hello, everyone!" },
});

// Leave the room after 30 seconds
setTimeout(async () => {
  await chatClient.send({ type: "leave", payload: { room: "general", user: "Alice" } });
  await chatClient.disconnect();
}, 30000);
```

## Advanced Features

### Message Broadcasting

Send messages to all connected clients or specific groups:

```typescript
// Broadcast to all clients
server.broadcast({
  type: "announcement",
  payload: "Server maintenance in 5 minutes"
});

// Send to specific subscribers (e.g., room members)
server.sendToSubscribers("general", {
  type: "notification",
  payload: "New message in general room"
});
```

### Subscription Management

Manage client subscriptions for different message types:

```typescript
// Subscribe client to multiple rooms
server.subscribe(clientId, "general");
server.subscribe(clientId, "support");
server.subscribe(clientId, "announcements");

// Unsubscribe from specific room
server.unsubscribe(clientId, "support");

// Send to all subscribers of a type
server.sendToSubscribers("announcements", {
  type: "system",
  payload: "System update completed"
});
```

### Heartbeat Monitoring

Both client and server support heartbeat mechanisms:

```typescript
// Server with heartbeat
const server = new SocketServer(adapter, {
  port: 8080,
  heartbeatInterval: 30000,  // 30 seconds
  onConnection: (clientId) => console.log(`Client connected: ${clientId}`),
  onDisconnection: (clientId) => console.log(`Client disconnected: ${clientId}`),
});

// Client with heartbeat
const client = new SocketClient(adapter, {
  url: "ws://localhost:8080",
  heartbeatInterval: 30000,  // 30 seconds
  onOpen: () => console.log("Connected"),
  onClose: () => console.log("Disconnected"),
});
```

### Rate Limiting

Control message flow to prevent abuse:

```typescript
// Client with rate limiting
const client = new SocketClient(adapter, {
  url: "ws://localhost:8080",
  maxRate: 10,  // Max 10 messages per second
  onOpen: () => console.log("Connected"),
});

// Server with rate limiting
const server = new SocketServer(adapter, {
  port: 8080,
  rateLimit: 100,  // Max 100 messages per client per minute
  onMessage: (clientId, message) => {
    // Process message
  },
});
```

### Custom Authorization

Implement custom authentication strategies:

```typescript
import { AuthorizationStrategy } from "@soapjs/soap";

class JWTAuthStrategy implements AuthorizationStrategy {
  applyAuthorization(options: any): any {
    return {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.getToken()}`
      }
    };
  }

  private getToken(): string {
    // Get JWT token from storage
    return localStorage.getItem('jwt') || '';
  }
}

const client = new SocketClient(adapter, {
  url: "ws://localhost:8080",
  authorizationStrategy: new JWTAuthStrategy(),
  onOpen: () => console.log("Connected with auth"),
});
```

### Graceful Shutdown

Properly close connections and clean up resources:

```typescript
// Server shutdown
const server = new SocketServer(adapter, options);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.shutdown();
  process.exit(0);
});

// Client disconnect
const client = new SocketClient(adapter, options);

// Graceful disconnect
process.on('SIGINT', async () => {
  console.log('Disconnecting client...');
  await client.disconnect();
  process.exit(0);
});
```

## Best Practices

### 1. Error Handling

```typescript
// ✅ Good - Comprehensive error handling
const server = new SocketServer(adapter, {
  port: 8080,
  onError: (clientId, error) => {
    console.error(`Error from client ${clientId}:`, error);
    // Log to monitoring service
    monitoringService.recordError(error, { clientId });
  },
  onMessage: (clientId, message) => {
    try {
      // Process message
      handleMessage(clientId, message);
    } catch (error) {
      console.error(`Failed to process message from ${clientId}:`, error);
      server.sendToClient(clientId, {
        type: "error",
        payload: "Failed to process message"
      });
    }
  }
});

// ❌ Bad - No error handling
const server = new SocketServer(adapter, {
  port: 8080,
  onMessage: (clientId, message) => {
    // No error handling
    handleMessage(clientId, message);
  }
});
```

### 2. Connection Management

```typescript
// ✅ Good - Proper connection lifecycle
const client = new SocketClient(adapter, {
  url: "ws://localhost:8080",
  onOpen: () => {
    console.log("Connected to server");
    // Re-subscribe to topics
    client.subscribe("notifications", handleNotification);
  },
  onClose: () => {
    console.log("Disconnected from server");
    // Clean up resources
    cleanup();
  },
  onError: (error) => {
    console.error("Connection error:", error);
    // Implement retry logic
    setTimeout(() => client.connect(), 5000);
  }
});

// ❌ Bad - No connection handling
const client = new SocketClient(adapter, {
  url: "ws://localhost:8080"
  // No connection callbacks
});
```

### 3. Message Validation

```typescript
// ✅ Good - Validate messages
const server = new SocketServer(adapter, {
  port: 8080,
  onMessage: (clientId, message) => {
    // Validate message structure
    if (!message.type || !message.payload) {
      server.sendToClient(clientId, {
        type: "error",
        payload: "Invalid message format"
      });
      return;
    }

    // Validate message type
    const validTypes = ["chat", "join", "leave", "ping"];
    if (!validTypes.includes(message.type)) {
      server.sendToClient(clientId, {
        type: "error",
        payload: "Invalid message type"
      });
      return;
    }

    // Process valid message
    handleMessage(clientId, message);
  }
});
```

### 4. Resource Cleanup

```typescript
// ✅ Good - Proper cleanup
class ChatService {
  private server: SocketServer;
  private clients = new Map();

  constructor() {
    this.server = new SocketServer(adapter, {
      port: 8080,
      onConnection: (clientId) => this.handleConnection(clientId),
      onDisconnection: (clientId) => this.handleDisconnection(clientId),
    });
  }

  private handleConnection(clientId: string) {
    this.clients.set(clientId, { joinedAt: Date.now() });
  }

  private handleDisconnection(clientId: string) {
    // Clean up client data
    this.clients.delete(clientId);
    // Unsubscribe from all rooms
    this.server.unsubscribe(clientId, "general");
    this.server.unsubscribe(clientId, "support");
  }

  shutdown() {
    this.server.shutdown();
    this.clients.clear();
  }
}
```

### 5. Performance Optimization

```typescript
// ✅ Good - Optimized for performance
const server = new SocketServer(adapter, {
  port: 8080,
  heartbeatInterval: 30000,  // 30 seconds - not too frequent
  rateLimit: 100,  // Prevent spam
  onMessage: (clientId, message) => {
    // Use async processing for heavy operations
    setImmediate(() => {
      processMessageAsync(clientId, message);
    });
  }
});

// Client with rate limiting
const client = new SocketClient(adapter, {
  url: "ws://localhost:8080",
  maxRate: 10,  // Limit message rate
  heartbeatInterval: 30000,
});
```

## Complete Example

Here's a complete real-time chat application example:

### Server Implementation

```typescript
import { SocketServer } from "@soapjs/soap";
import { WebSocketServerAdapter } from "./WebSocketAdapter";

interface ChatMessage {
  user: string;
  message: string;
  timestamp: number;
}

interface ChatUser {
  id: string;
  name: string;
  rooms: Set<string>;
}

class ChatServer {
  private server: SocketServer;
  private users = new Map<string, ChatUser>();

  constructor() {
    this.server = new SocketServer(new WebSocketServerAdapter(), {
      port: 8080,
      heartbeatInterval: 30000,
      rateLimit: 50,
      onConnection: (clientId) => this.handleConnection(clientId),
      onDisconnection: (clientId) => this.handleDisconnection(clientId),
      onMessage: (clientId, message) => this.handleMessage(clientId, message),
      onError: (clientId, error) => this.handleError(clientId, error),
    });
  }

  private handleConnection(clientId: string) {
    console.log(`User connected: ${clientId}`);
    this.users.set(clientId, {
      id: clientId,
      name: `User-${clientId.slice(-4)}`,
      rooms: new Set()
    });

    // Send welcome message
    this.server.sendToClient(clientId, {
      type: "welcome",
      payload: {
        message: "Welcome to the chat!",
        userId: clientId,
        availableRooms: ["general", "support", "random"]
      }
    });
  }

  private handleDisconnection(clientId: string) {
    console.log(`User disconnected: ${clientId}`);
    const user = this.users.get(clientId);
    if (user) {
      // Notify all rooms user was in
      for (const room of user.rooms) {
        this.server.sendToSubscribers(room, {
          type: "system",
          payload: `${user.name} left the room`
        });
        this.server.unsubscribe(clientId, room);
      }
    }
    this.users.delete(clientId);
  }

  private handleMessage(clientId: string, message: any) {
    const user = this.users.get(clientId);
    if (!user) return;

    switch (message.type) {
      case "join":
        this.handleJoin(clientId, user, message.payload.room);
        break;
      case "message":
        this.handleChatMessage(clientId, user, message.payload);
        break;
      case "leave":
        this.handleLeave(clientId, user, message.payload.room);
        break;
      default:
        this.server.sendToClient(clientId, {
          type: "error",
          payload: "Unknown message type"
        });
    }
  }

  private handleJoin(clientId: string, user: ChatUser, room: string) {
    const validRooms = ["general", "support", "random"];
    if (!validRooms.includes(room)) {
      this.server.sendToClient(clientId, {
        type: "error",
        payload: "Invalid room"
      });
      return;
    }

    user.rooms.add(room);
    this.server.subscribe(clientId, room);
    this.server.sendToSubscribers(room, {
      type: "system",
      payload: `${user.name} joined the room`
    });
  }

  private handleChatMessage(clientId: string, user: ChatUser, payload: ChatMessage) {
    const room = payload.room;
    if (!user.rooms.has(room)) {
      this.server.sendToClient(clientId, {
        type: "error",
        payload: "You are not in this room"
      });
      return;
    }

    const chatMessage: ChatMessage = {
      user: user.name,
      message: payload.message,
      timestamp: Date.now()
    };

    this.server.sendToSubscribers(room, {
      type: "chat",
      payload: chatMessage
    });
  }

  private handleLeave(clientId: string, user: ChatUser, room: string) {
    if (user.rooms.has(room)) {
      user.rooms.delete(room);
      this.server.unsubscribe(clientId, room);
      this.server.sendToSubscribers(room, {
        type: "system",
        payload: `${user.name} left the room`
      });
    }
  }

  private handleError(clientId: string, error: Error) {
    console.error(`Error from ${clientId}:`, error);
    this.server.sendToClient(clientId, {
      type: "error",
      payload: "An error occurred"
    });
  }

  shutdown() {
    console.log("Shutting down chat server...");
    this.server.shutdown();
  }
}

// Start the server
const chatServer = new ChatServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  chatServer.shutdown();
  process.exit(0);
});
```

### Client Implementation

```typescript
import { SocketClient } from "@soapjs/soap";
import { WebSocketAdapter } from "./WebSocketAdapter";

interface ChatMessage {
  user: string;
  message: string;
  timestamp: number;
}

class ChatClient {
  private client: SocketClient;
  private currentRoom: string = "general";
  private username: string;

  constructor(username: string) {
    this.username = username;
    this.client = new SocketClient(new WebSocketAdapter(), {
      url: "ws://localhost:8080",
      heartbeatInterval: 30000,
      maxRate: 5,
      onOpen: () => this.handleOpen(),
      onMessage: (message) => this.handleMessage(message),
      onClose: () => this.handleClose(),
      onError: (error) => this.handleError(error),
    });
  }

  async connect() {
    await this.client.connect();
  }

  private handleOpen() {
    console.log("Connected to chat server");
    // Join default room
    this.joinRoom("general");
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case "welcome":
        console.log("Welcome:", message.payload.message);
        break;
      case "chat":
        const chatMsg = message.payload as ChatMessage;
        console.log(`${chatMsg.user}: ${chatMsg.message}`);
        break;
      case "system":
        console.log(`[System] ${message.payload}`);
        break;
      case "error":
        console.error("Error:", message.payload);
        break;
    }
  }

  private handleClose() {
    console.log("Disconnected from chat server");
  }

  private handleError(error: Error) {
    console.error("Connection error:", error);
  }

  async joinRoom(room: string) {
    await this.client.send({
      type: "join",
      payload: { room }
    });
    this.currentRoom = room;
    console.log(`Joined room: ${room}`);
  }

  async sendMessage(message: string) {
    await this.client.send({
      type: "message",
      payload: {
        room: this.currentRoom,
        message,
        user: this.username
      }
    });
  }

  async leaveRoom(room: string) {
    await this.client.send({
      type: "leave",
      payload: { room }
    });
    console.log(`Left room: ${room}`);
  }

  async disconnect() {
    await this.client.disconnect();
  }
}

// Usage example
async function main() {
  const chatClient = new ChatClient("Alice");
  await chatClient.connect();

  // Join a room
  await chatClient.joinRoom("general");

  // Send a message
  await chatClient.sendMessage("Hello, everyone!");

  // Leave after 30 seconds
  setTimeout(async () => {
    await chatClient.leaveRoom("general");
    await chatClient.disconnect();
  }, 30000);
}

main().catch(console.error);
```

## Summary

The Socket components in SoapJS provide a robust foundation for building real-time applications. With their abstract design, comprehensive feature set, and excellent TypeScript support, they enable developers to create scalable and maintainable real-time communication systems.

Key advantages:
- **Flexibility** - Pluggable socket backends for different libraries
- **Reliability** - Built-in heartbeat monitoring and error handling
- **Scalability** - Efficient client management and subscription system
- **Type Safety** - Full TypeScript support with generic message types
- **Performance** - Rate limiting and optimized message handling