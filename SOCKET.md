# **Socket Components: Comprehensive Guide**

This guide explains how to use the **SocketClient** and **SocketServer** components with an abstract `Socket` interface. These components provide flexibility for integrating various socket libraries (e.g., WebSocket, Socket.IO) and simplify building scalable, real-time applications.

---

## **Core Components**

### **SocketClient**
The `SocketClient` offers advanced features for real-time applications:
- **Automatic Reconnection:** Retry logic to reconnect on connection loss.
- **Rate Limiting:** Limits the number of messages sent per second.
- **Subscriptions:** Simplifies handling messages by type.
- **Custom Authorization Strategies:** Integrates seamlessly with JWTs, tokens, or custom logic.
- **Heartbeat Mechanism:** Ensures connection health with periodic `ping/pong`.

### **SocketServer**
The `SocketServer` is designed for handling complex server-side socket interactions:
- **Client Management:** Tracks connected clients and their subscriptions.
- **Subscriptions by Message Type:** Allows grouping clients by interest (e.g., rooms).
- **Heartbeat Monitoring:** Detects and handles stale connections.
- **Broadcasting:** Sends messages to all or specific groups of clients.
- **Rate Limiting (Optional):** Prevents abuse by limiting client message rates.

---

## **Features**

### **Abstract Socket Implementation**
The `AbstractSocket` and `AbstractSocketServer` interfaces define methods for handling connections, messaging, and more. These abstractions allow you to plug in various libraries like `ws`, `Socket.IO`, or even custom socket implementations.

### **Authentication Strategies**
1. **JWT Tokens (Bearer):**
   - Tokens are passed in headers during the connection handshake.
2. **Query Parameters:**
   - Tokens or session IDs are sent as part of the URL.
3. **Custom Authorization Strategy:**
   - Allows flexible integration with any authentication mechanism.

---

## **Examples**

### **Implementing Abstract Sockets with WebSocket**

#### **Socket Implementation**
```typescript
import { AbstractSocket, AbstractSocketServer } from "./types";
import { WebSocket, WebSocketServer } from "ws";

export class WebSocketAdapter implements AbstractSocket {
  private socket!: WebSocket;

  async connect(options: { url: string }): Promise<void> {
    this.socket = new WebSocket(options.url);
  }

  disconnect(): void {
    this.socket.close();
  }

  send(message: string): void {
    this.socket.send(message);
  }

  on(event: "open" | "message" | "close" | "error", handler: (data: any) => void): void {
    this.socket.on(event, handler);
  }
}

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

---

### **Simple Client-Server Communication**

#### **Server**
```typescript
import { SocketServer } from "./SocketServer";
import { WebSocketServerAdapter } from "./WebSocketAdapter";

const server = new SocketServer(new WebSocketServerAdapter(), {
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
});
```

#### **Client**
```typescript
import { SocketClient } from "./SocketClient";
import { WebSocketAdapter } from "./WebSocketAdapter";

const client = new SocketClient(new WebSocketAdapter(), {
  url: "ws://localhost:8080",
  onOpen: () => {
    console.log("Connected to server");
    client.send({ type: "greeting", payload: "Hello, Server!" });
  },
  onMessage: (message) => console.log(`Message from server:`, message),
  onClose: () => console.log("Disconnected from server"),
  onError: (error) => console.error("Socket error:", error),
});

client.connect();
```

---

### **Chat Application with Rooms**

#### **Server**
```typescript
import { SocketServer } from "./SocketServer";
import { WebSocketServerAdapter } from "./WebSocketAdapter";

const chatServer = new SocketServer(new WebSocketServerAdapter(), {
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
});
```

#### **Client**
```typescript
import { SocketClient } from "./SocketClient";
import { WebSocketAdapter } from "./WebSocketAdapter";

const chatClient = new SocketClient(new WebSocketAdapter(), {
  url: "ws://localhost:8080",
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

// Send a message
chatClient.send({
  type: "message",
  payload: { room: "general", user: "Alice", message: "Hello, everyone!" },
});

// Leave the room after 30 seconds
setTimeout(() => {
  chatClient.send({ type: "leave", payload: { room: "general", user: "Alice" } });
  chatClient.disconnect();
}, 30000);
```

---

## **Advanced Features**
### **Reconnect on Failure**
The client automatically reconnects with retry logic.

### **Subscriptions**
The server manages subscriptions by message type (e.g., rooms).

### **Heartbeat Mechanism**
Both client and server support periodic heartbeats to detect stale connections.

### **Custom Authorization**
Use strategies like JWT, query parameters, or custom logic for authentication.