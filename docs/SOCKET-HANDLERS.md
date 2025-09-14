# Socket Handlers - Modern Socket Architecture

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [SocketHandler](#sockethandler)
4. [SocketRegistry](#socketregistry)
5. [EnhancedSocketServer](#enhancedsocketserver)
6. [IO Integration](#io-integration)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)

## Overview

The Socket Handlers system provides a modern, type-safe architecture for handling real-time socket communication. It combines the power of middleware, data transformation, and fluent APIs to create a developer-friendly experience.

### Key Features

- **Handler-based Architecture** - Organize socket events with dedicated handlers
- **Middleware Support** - Use the same middleware system as HTTP routes
- **IO Integration** - Transform data with universal `from<T>` and `to<T>` methods
- **Fluent API** - Chain configuration with `.use()` and `.configure()`
- **Type Safety** - Full TypeScript support with generics
- **Event Management** - Centralized handler registry

---

## Core Components

### SocketHandler

The `SocketHandler` class represents a single socket event handler with middleware and IO transformation support.

```typescript
import { SocketHandler } from "@soapjs/soap";

const handler = new SocketHandler(
  "chat_message",           // Event name
  chatHandler,              // Handler function
  {                         // Handler options
    middlewares: {
      pre: [authMiddleware],
      post: [loggingMiddleware]
    },
    auth: { required: true, roles: ['user'] },
    rateLimit: { maxRequests: 10, windowMs: 60000 }
  },
  new ChatIO()              // IO for data transformation
);
```

### SocketRegistry

The `SocketRegistry` manages multiple socket handlers and handles event dispatching.

```typescript
import { SocketRegistry } from "@soapjs/soap";

const registry = new SocketRegistry();

// Register handlers
registry.register(handler);

// Or create and register in one step
registry.create("user_join", userJoinHandler, options, io);
```

### EnhancedSocketServer

Extended socket server with fluent API and registry support.

```typescript
import { EnhancedSocketServer } from "@soapjs/soap";

const server = new EnhancedSocketServer(socketServer, serverOptions)
  .use(registry)
  .configure({
    heartbeatInterval: 25000,
    rateLimit: 50
  })
  .start();
```

---

## SocketHandler

### Constructor

```typescript
constructor(
  event: string | string[],
  handler: AnyHandler,
  options?: SocketHandlerOptions,
  io?: IO
)
```

### Handler Function Signature

```typescript
type SocketHandler = (
  input: I,                    // Transformed input data
  socket: AbstractSocket,      // Socket connection
  eventName: string           // Event name that triggered the handler
) => Promise<O> | O;
```

### SocketHandlerOptions

```typescript
interface SocketHandlerOptions {
  middlewares?: {
    pre?: MiddlewareFunction[];     // Execute before handler
    post?: MiddlewareFunction[];    // Execute after handler
  };
  auth?: {
    required?: boolean;
    roles?: string[];
  };
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  validation?: {
    schema?: any;
  };
  [key: string]: any;
}
```

### Methods

```typescript
// Execute the handler
await handler.execute(socket, data, eventName);

// Check if handler matches event
const matches = handler.matches("chat_message");

// Get event names
const events = handler.getEvents();
```

---

## SocketRegistry

### Methods

```typescript
const registry = new SocketRegistry();

// Register handlers
registry.register(handler);

// Create and register
const handler = registry.create("event", handlerFn, options, io);

// Handle events
await registry.handleEvent(socket, "chat_message", data);

// Query handlers
const handlers = registry.getHandlers("chat_message");
const allHandlers = registry.getAllHandlers();
const count = registry.getHandlerCount();
const events = registry.getEventNames();

// Remove handlers
registry.removeHandler("event", handler);
registry.removeEvent("event");
registry.clear();
```

---

## EnhancedSocketServer

### Fluent API

```typescript
const server = new EnhancedSocketServer(socketServer, options)
  .use(registry)                    // Use a registry
  .configure({                      // Configure additional options
    heartbeatInterval: 25000,
    rateLimit: 50
  })
  .start();                         // Start the server
```

### Methods

```typescript
// Registry management
server.use(registry);
const registry = server.getRegistry();

// Event broadcasting
server.broadcastEvent("notification", data);
server.sendEvent(clientId, "message", data);
server.sendToSubscribers("chat", data);
```

---

## IO Integration

### Universal IO Interface

```typescript
interface IO<I, O> {
  from<T>(source: T): I;
  to<T>(result: any, target: T): void;
}
```

### Example Implementation

```typescript
class ChatIO implements IO<ChatInput, ChatOutput> {
  from<T>(source: T): ChatInput {
    const { socket, data } = source as { socket: AbstractSocket; data: any };
    return {
      message: data.message,
      userId: data.userId,
      timestamp: new Date(),
      socketId: (socket as any).id || 'unknown'
    };
  }

  to<T>(result: any, target: T): void {
    const socket = target as AbstractSocket;
    const response: SocketMessage = {
      type: 'chat_response',
      payload: {
        success: true,
        message: result.message,
        timestamp: result.timestamp
      }
    };
    socket.send(JSON.stringify(response));
  }
}
```

---

## Usage Examples

### Basic Chat Application

```typescript
import { 
  SocketHandler,
  SocketRegistry,
  EnhancedSocketServer 
} from "@soapjs/soap";

// 1. Create registry
const registry = new SocketRegistry();

// 2. Define handlers
const chatHandler = async (input: ChatInput, socket: AbstractSocket) => {
  // Process chat message
  return {
    message: `Echo: ${input.message}`,
    timestamp: new Date(),
    success: true
  };
};

const userJoinHandler = async (data: any, socket: AbstractSocket) => {
  console.log(`User ${data.userId} joined`);
  return { userId: data.userId, timestamp: new Date() };
};

// 3. Register handlers
registry.create("chat_message", chatHandler, {
  middlewares: {
    pre: [authMiddleware],
    post: [loggingMiddleware]
  },
  auth: { required: true, roles: ['user'] },
  rateLimit: { maxRequests: 10, windowMs: 60000 }
}, new ChatIO());

registry.create("user_join", userJoinHandler, {
  auth: { required: true }
});

// 4. Create server with fluent API
const server = new EnhancedSocketServer(socketServer, {
  port: 3000,
  heartbeatInterval: 30000
})
.use(registry)
.configure({
  rateLimit: 100
})
.start();
```

### Real-time Notifications

```typescript
class NotificationIO implements IO<NotificationInput, NotificationOutput> {
  from<T>(source: T): NotificationInput {
    const { socket, data } = source as { socket: AbstractSocket; data: any };
    return {
      type: data.type,
      message: data.message,
      targetUsers: data.targetUsers || [],
      priority: data.priority || 'normal'
    };
  }

  to<T>(result: any, target: T): void {
    const socket = target as AbstractSocket;
    const response: SocketMessage = {
      type: 'notification',
      payload: result
    };
    socket.send(JSON.stringify(response));
  }
}

registry.create("send_notification", notificationHandler, {
  middlewares: {
    pre: [authMiddleware],
    post: [loggingMiddleware]
  },
  auth: { required: true, roles: ['admin'] }
}, new NotificationIO());
```

### Game Events

```typescript
// Game move handler
const gameMoveHandler = async (input: GameMoveInput, socket: AbstractSocket) => {
  // Validate move
  // Update game state
  // Broadcast to other players
  return {
    move: input.move,
    playerId: input.playerId,
    gameState: updatedGameState,
    timestamp: new Date()
  };
};

registry.create("game_move", gameMoveHandler, {
  middlewares: {
    pre: [authMiddleware, gameValidationMiddleware],
    post: [gameStateMiddleware]
  },
  auth: { required: true, roles: ['player'] },
  rateLimit: { maxRequests: 5, windowMs: 1000 }
}, new GameMoveIO());
```

---

## Best Practices

### 1. Handler Organization

```typescript
// Good - Group related handlers
const chatRegistry = new SocketRegistry();
chatRegistry.create("chat_message", chatHandler);
chatRegistry.create("user_join", userJoinHandler);
chatRegistry.create("user_leave", userLeaveHandler);

const gameRegistry = new SocketRegistry();
gameRegistry.create("game_move", gameMoveHandler);
gameRegistry.create("game_start", gameStartHandler);
gameRegistry.create("game_end", gameEndHandler);

// Combine registries
const mainRegistry = new SocketRegistry();
const handlers = Array.from(chatRegistry.getAllHandlers().values()).flat();
mainRegistry.register(...handlers);
```

### 2. Error Handling

```typescript
const errorHandlingMiddleware = async (socket: AbstractSocket, data: any, eventName: string) => {
  try {
    // Middleware logic
  } catch (error) {
    socket.send(JSON.stringify({
      type: 'error',
      payload: { message: error.message, event: eventName }
    }));
    throw error; // Re-throw to stop execution
  }
};
```

### 3. Type Safety

```typescript
interface ChatInput {
  message: string;
  userId: string;
  timestamp: Date;
}

interface ChatOutput {
  message: string;
  timestamp: Date;
  success: boolean;
}

class ChatIO implements IO<ChatInput, ChatOutput> {
  from<T>(source: T): ChatInput {
    const { socket, data } = source as { socket: AbstractSocket; data: any };
    // Type-safe transformation
    return {
      message: data.message,
      userId: data.userId,
      timestamp: new Date()
    };
  }

  to<T>(result: ChatOutput, target: T): void {
    const socket = target as AbstractSocket;
    // Type-safe response
    socket.send(JSON.stringify({
      type: 'chat_response',
      payload: result
    }));
  }
}
```

### 4. Middleware Composition

```typescript
// Reusable middleware
const createAuthMiddleware = (requiredRole?: string) => {
  return async (socket: AbstractSocket, data: any, eventName: string) => {
    const user = await validateUser(socket, data);
    if (requiredRole && !user.roles.includes(requiredRole)) {
      throw new Error('Insufficient permissions');
    }
    (socket as any).user = user;
  };
};

// Use with different roles
registry.create("admin_action", adminHandler, {
  middlewares: {
    pre: [createAuthMiddleware('admin')]
  }
});

registry.create("user_action", userHandler, {
  middlewares: {
    pre: [createAuthMiddleware()]
  }
});
```

### 5. Performance Considerations

```typescript
// Use connection pooling for database operations
const dbMiddleware = async (socket: AbstractSocket, data: any, eventName: string) => {
  const connection = await getConnection();
  (socket as any).db = connection;
};

// Cleanup middleware
const cleanupMiddleware = async (socket: AbstractSocket, data: any, eventName: string, result?: any) => {
  if ((socket as any).db) {
    await (socket as any).db.close();
  }
};

registry.create("data_operation", dataHandler, {
  middlewares: {
    pre: [dbMiddleware],
    post: [cleanupMiddleware]
  }
});
```

---

## Integration with HTTP Routes

The socket handlers can share the same IO implementations with HTTP routes:

```typescript
// Shared IO for both HTTP and Socket
class UserIO implements IO<UserInput, UserOutput> {
  from<T>(source: T): UserInput {
    // Handle HTTP Request
    if ('body' in source) {
      const request = source as Request;
      return {
        name: request.body.name,
        email: request.body.email
      };
    }
    
    // Handle Socket data
    if ('socket' in source && 'data' in source) {
      const { data } = source as { socket: AbstractSocket; data: any };
      return {
        name: data.name,
        email: data.email
      };
    }
    
    throw new Error('Unsupported source type');
  }

  to<T>(result: any, target: T): void {
    // Handle HTTP Response
    if ('json' in target) {
      const response = target as Response;
      response.json(result);
      return;
    }
    
    // Handle Socket
    if ('send' in target) {
      const socket = target as AbstractSocket;
      socket.send(JSON.stringify({
        type: 'user_response',
        payload: result
      }));
      return;
    }
    
    throw new Error('Unsupported target type');
  }
}

// Use with HTTP routes
const httpRoute = new PostRoute("/users", createUserHandler, options, new UserIO());

// Use with Socket handlers
registry.create("create_user", createUserHandler, options, new UserIO());
```

This allows you to share business logic between HTTP and WebSocket endpoints while maintaining type safety and consistent data transformation.
