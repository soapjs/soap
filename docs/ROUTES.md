# Routes - HTTP Routing System in SoapJS

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Route Classes](#route-classes)
4. [Route Registry](#route-registry)
5. [Route Groups](#route-groups)
6. [Route IO](#route-io)
7. [Middleware System](#middleware-system)
8. [Route Options](#route-options)
9. [Usage Examples](#usage-examples)
10. [Best Practices](#best-practices)
11. [Complete Example](#complete-example)

## Overview

The HTTP routing system in SoapJS provides a comprehensive, type-safe, and enterprise-ready solution for managing API endpoints. It offers multiple abstraction layers that can be used independently or together, allowing developers to choose the appropriate level of complexity for their use case.

The routing system consists of several core components:

1. **Route Classes** - Type-safe HTTP method-specific route classes
2. **Route Registry** - Centralized route management and organization
3. **Route Groups** - Logical grouping of related endpoints
4. **Route IO** - Input/output mapping and transformation
5. **Middleware System** - Flexible middleware management
6. **Route Options** - Comprehensive configuration options

## Core Components

### Route Classes

SoapJS provides type-safe route classes for each HTTP method, extending the base `Route` class.

#### Base Route Class

```typescript
import { Route } from "@soapjs/soap";

class Route {
  constructor(
    method: RequestMethod | RequestMethod[],
    path: string | string[],
    handler: AnyHandler,
    options?: RouteAdditionalOptions,
    io?: IO
  );
}
```

#### HTTP Method-Specific Classes

```typescript
import { 
  GetRoute, 
  PostRoute, 
  PutRoute, 
  PatchRoute, 
  DeleteRoute,
  HeadRoute,
  OptionsRoute,
  TraceRoute,
  ConnectRoute,
  AllRoute 
} from "@soapjs/soap";

// GET route
const getRoute = new GetRoute("/users", handler, options);

// POST route
const postRoute = new PostRoute("/users", handler, options);

// PUT route
const putRoute = new PutRoute("/users/:id", handler, options);

// DELETE route
const deleteRoute = new DeleteRoute("/users/:id", handler, options);

// Multiple paths
const multiPathRoute = new GetRoute(["/users", "/users/list"], handler, options);

// Multiple methods
const multiMethodRoute = new Route(["GET", "POST"], "/users", handler, options);
```

### Route Registry

The `RouteRegistry` class provides centralized route management with efficient lookup and organization capabilities.

#### Key Features

- **Centralized Management** - All routes in one place
- **Efficient Lookup** - O(1) route retrieval
- **Group Support** - Organize routes in logical groups
- **Dynamic Registration** - Add routes at runtime

#### Methods

```typescript
import { RouteRegistry } from "@soapjs/soap";

class RouteRegistry {
  // Register a route or route group
  register(item: Route | RouteGroup): void;
  
  // Get all registered routes
  getAllRoutes(): Route[];
  
  // Get all registered groups
  getAllGroups(): RouteGroup[];
  
  // Get specific route
  getRoute(method: RequestMethod, path: string): Route | undefined;
  
  // Get specific group
  getGroup(path: string): RouteGroup | undefined;
  
  // Clear all routes
  clear(): void;
}
```

#### Usage

```typescript
const registry = new RouteRegistry();

// Register individual routes
registry.register(new GetRoute("/users", listUsersHandler));
registry.register(new PostRoute("/users", createUserHandler));

// Register route groups
const userGroup = new RouteGroup("/api/users", { cors: true });
userGroup.add(new GetRoute("/", listUsersHandler));
userGroup.add(new PostRoute("/", createUserHandler));
registry.register(userGroup);

// Retrieve routes
const route = registry.getRoute("GET", "/users");
const group = registry.getGroup("/api/users");
```

### Route Groups

Route groups allow logical organization of related endpoints with shared configuration.

#### Key Features

- **Logical Organization** - Group related endpoints
- **Shared Options** - Common configuration for group
- **Path Prefixing** - Automatic path prefixing
- **Option Inheritance** - Inherit options from group

#### Methods

```typescript
import { RouteGroup } from "@soapjs/soap";

class RouteGroup {
  constructor(
    path: string,
    options?: RouteAdditionalOptions,
    io?: IO,
    routes?: Route[]
  );
  
  // Add route to group
  add(route: Route): void;
  
  // Get all routes in group
  get routes(): Route[];
}
```

#### Usage

```typescript
// Create route group with shared options
const userGroup = new RouteGroup("/api/v1/users", {
  cors: { origin: "*" },
  rateLimit: { maxRequests: 100, windowMs: 60000 },
  roles: { authenticatedOnly: true }
});

// Add routes to group
userGroup.add(new GetRoute("/", listUsersHandler));
userGroup.add(new PostRoute("/", createUserHandler));
userGroup.add(new GetRoute("/:id", getUserHandler));
userGroup.add(new PutRoute("/:id", updateUserHandler));
userGroup.add(new DeleteRoute("/:id", deleteUserHandler));

// Register group
registry.register(userGroup);
```

### Route IO

The `IO` interface provides input/output mapping and transformation capabilities.

#### Interface

```typescript
import { IO } from "@soapjs/soap";

interface IO<I = unknown, O = unknown> {
  // Extract and transform data from source
  from<T>(source: T): I;
  
  // Send result to target
  to<T>(result: any, target: T): void;
}
```

#### Usage

```typescript
// Custom IO implementation
class UserIO implements IO<UserInput, UserOutput> {
  from<T>(source: T): UserInput {
    const request = source as Request;
    return {
      name: request.body.name,
      email: request.body.email,
      age: parseInt(request.body.age)
    };
  }
  
  to<T>(result: any, target: T): void {
    const response = target as Response;
    if (result?.content) {
      response.json({
        success: true,
        data: result.content
      });
    } else if (result?.error) {
      response.status(400).json({
        success: false,
        error: result.error.message
      });
    }
  }
}

// Use with route
const route = new PostRoute("/users", createUserHandler, options, new UserIO());
```

## Middleware System

### Middleware Interface

The middleware system provides flexible middleware management with lifecycle support.

```typescript
import { Middleware } from "@soapjs/soap";

interface Middleware {
  readonly name: string;
  readonly isDynamic: boolean;
  
  init?(...args: any[]): void | Promise<void>;
  use?(...args: any[]): any;
  destroy?(): Promise<void> | void;
}
```

### Middleware Registry

The `MiddlewareRegistry` class manages middleware instances with lifecycle tracking.

```typescript
import { MiddlewareRegistry } from "@soapjs/soap";

class MiddlewareRegistry {
  // Add middleware
  add(middleware: Middleware | Middleware[]): void;
  
  // Initialize middleware
  init(name: string, ...args: unknown[]): void;
  
  // Use middleware
  use(name: string, ...args: unknown[]): MiddlewareFunction;
  
  // Check if middleware is ready
  isReady(name: string): boolean;
  
  // Get middleware
  get(name: string, onlyReady?: boolean): Middleware | MiddlewareFunction;
  
  // Check if middleware exists
  has(name: string, onlyReady?: boolean): boolean;
}
```

### Usage

```typescript
const registry = new MiddlewareRegistry();

// Add middleware
registry.add(authMiddleware);
registry.add(rateLimitMiddleware);
registry.add(loggingMiddleware);

// Initialize middleware
registry.init("auth", { secret: "your-secret" });
registry.init("rateLimit", { maxRequests: 100, windowMs: 60000 });

// Use middleware
const authFunction = registry.use("auth", { role: "admin" });
const rateLimitFunction = registry.use("rateLimit");

// Check readiness
if (registry.isReady("auth")) {
  // Middleware is ready to use
}
```

## Route Options

SoapJS provides comprehensive route configuration options for enterprise applications.

### Available Options

```typescript
import { RouteAdditionalOptions } from "@soapjs/soap";

type RouteAdditionalOptions = {
  // CORS configuration
  cors?: RouteCorsOptions;
  
  // Security headers
  security?: RouteSecurityOptions;
  
  // Rate limiting
  rateLimit?: RouteRateLimitOptions;
  
  // Request/response validation
  validation?: RouteValidationOptions;
  
  // Session management
  session?: SessionOptions;
  
  // Response caching
  cache?: CacheOptions;
  
  // Request logging
  logging?: LoggingOptions;
  
  // Analytics tracking
  analytics?: AnalyticsOptions;
  
  // Audit logging
  audit?: AuditOptions;
  
  // Role-based access control
  roles?: RoleOptions;
  
  // Middleware configuration
  middlewares?: MiddlewareOptions;
  
  // Response compression
  compression?: RouteCompressionOptions;
};
```

### CORS Options

```typescript
const corsOptions: RouteCorsOptions = {
  origin: ["http://localhost:3000", "https://myapp.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  headers: ["Content-Type", "Authorization"],
  credentials: true,
  exposedHeaders: ["X-Total-Count"],
  maxAge: 86400
};
```

### Security Options

```typescript
const securityOptions: RouteSecurityOptions = {
  contentSecurityPolicy: "default-src 'self'",
  crossOriginEmbedderPolicy: "require-corp",
  crossOriginOpenerPolicy: "same-origin",
  crossOriginResourcePolicy: "same-origin",
  referrerPolicy: "strict-origin-when-cross-origin"
};
```

### Rate Limiting

```typescript
const rateLimitOptions: RouteRateLimitOptions = {
  maxRequests: 100,
  windowMs: 60000 // 1 minute
};
```

### Validation

```typescript
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18)
});

const validationOptions: RouteValidationOptions = {
  request: {
    validator: "zod",
    schema: userSchema
  },
  response: {
    validator: "zod",
    schema: userResponseSchema
  }
};
```

### Role-Based Access Control

```typescript
const roleOptions: RoleOptions = {
  authenticatedOnly: true,
  allow: ["admin", "user"],
  deny: ["guest"],
  selfOnly: true // Only resource owner can access
};
```

## Usage Examples

### Basic Route Definition

```typescript
import { GetRoute, PostRoute, PutRoute, DeleteRoute } from "@soapjs/soap";

// Simple GET route
const listUsersRoute = new GetRoute("/users", listUsersHandler);

// POST route with options
const createUserRoute = new PostRoute("/users", createUserHandler, {
  cors: { origin: "*" },
  rateLimit: { maxRequests: 10, windowMs: 60000 },
  validation: {
    request: { schema: createUserSchema }
  }
});

// PUT route with multiple paths
const updateUserRoute = new PutRoute(
  ["/users/:id", "/api/users/:id"], 
  updateUserHandler,
  { roles: { authenticatedOnly: true } }
);
```

### Route Groups

```typescript
// API version group
const apiV1Group = new RouteGroup("/api/v1", {
  cors: { origin: "*" },
  logging: { level: "info" }
});

// User management group
const userGroup = new RouteGroup("/users", {
  roles: { authenticatedOnly: true },
  rateLimit: { maxRequests: 100, windowMs: 60000 }
});

// Add routes to user group
userGroup.add(new GetRoute("/", listUsersHandler));
userGroup.add(new PostRoute("/", createUserHandler));
userGroup.add(new GetRoute("/:id", getUserHandler));
userGroup.add(new PutRoute("/:id", updateUserHandler));
userGroup.add(new DeleteRoute("/:id", deleteUserHandler));

// Add user group to API group
apiV1Group.add(userGroup);

// Register with registry
registry.register(apiV1Group);
```

### Middleware Integration

```typescript
// Custom authentication middleware
class AuthMiddleware implements Middleware {
  readonly name = "auth";
  readonly isDynamic = true;
  
  init(secret: string) {
    this.secret = secret;
  }
  
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    
    try {
      const decoded = jwt.verify(token, this.secret);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  }
}

// Register and use middleware
const authMiddleware = new AuthMiddleware();
registry.add(authMiddleware);
registry.init("auth", "your-secret-key");

// Use in route options
const protectedRoute = new GetRoute("/profile", getProfileHandler, {
  middlewares: {
    pre: [registry.use("auth")]
  }
});
```

## Best Practices

### 1. Route Organization

```typescript
// Good - Logical grouping
const apiGroup = new RouteGroup("/api", { cors: true });
const v1Group = new RouteGroup("/v1", { rateLimit: true });
const userGroup = new RouteGroup("/users", { auth: true });

v1Group.add(userGroup);
apiGroup.add(v1Group);

// Bad - Flat structure
registry.register(new GetRoute("/api/v1/users", handler));
registry.register(new PostRoute("/api/v1/users", handler));
registry.register(new GetRoute("/api/v1/users/:id", handler));
```

### 2. Option Inheritance

```typescript
// Good - Inherit common options
const baseOptions = {
  cors: { origin: "*" },
  logging: { level: "info" }
};

const userGroup = new RouteGroup("/users", baseOptions);
userGroup.add(new GetRoute("/", handler)); // Inherits baseOptions

// Bad - Duplicate options
const userGroup = new RouteGroup("/users", { cors: { origin: "*" } });
userGroup.add(new GetRoute("/", handler, { cors: { origin: "*" } }));
```

### 3. Type Safety

```typescript
// Good - Use specific route classes
const route = new GetRoute("/users", handler);

// Bad - Use generic Route class
const route = new Route("GET", "/users", handler);
```

### 4. Middleware Management

```typescript
// Good - Centralized middleware management
const registry = new MiddlewareRegistry();
registry.add(authMiddleware);
registry.init("auth", secret);
const authFunction = registry.use("auth");

// Bad - Direct middleware usage
const route = new GetRoute("/users", handler, {
  middlewares: { pre: [authMiddleware.use()] }
});
```

### 5. Error Handling

```typescript
// Good - Proper error handling in handlers
const handler = async (req: Request, res: Response) => {
  try {
    const result = await userService.getUsers();
    return Result.withSuccess(result);
  } catch (error) {
    return Result.withFailure(error);
  }
};

// Bad - No error handling
const handler = async (req: Request, res: Response) => {
  const result = await userService.getUsers();
  return result;
};
```

## Complete Example

Here's a complete example demonstrating all routing components working together:

### Complete API Structure

```typescript
import { 
  RouteRegistry, 
  RouteGroup, 
  GetRoute, 
  PostRoute, 
  PutRoute, 
  DeleteRoute,
  MiddlewareRegistry,
  IO,
  Result 
} from "@soapjs/soap";

// 1. Define handlers
const listUsersHandler = async (req: Request, res: Response) => {
  try {
    const users = await userService.getUsers();
    return Result.withSuccess(users);
  } catch (error) {
    return Result.withFailure(error);
  }
};

const createUserHandler = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body);
    return Result.withSuccess(user);
  } catch (error) {
    return Result.withFailure(error);
  }
};

const getUserHandler = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUser(req.params.id);
    return Result.withSuccess(user);
  } catch (error) {
    return Result.withFailure(error);
  }
};

const updateUserHandler = async (req: Request, res: Response) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return Result.withSuccess(user);
  } catch (error) {
    return Result.withFailure(error);
  }
};

const deleteUserHandler = async (req: Request, res: Response) => {
  try {
    await userService.deleteUser(req.params.id);
    return Result.withSuccess();
  } catch (error) {
    return Result.withFailure(error);
  }
};

// 2. Custom Route IO
class UserIO implements IO<UserInput, UserOutput, Request, Response> {
  from<Request>(source: Request): UserInput {
    return {
      name: source.body.name,
      email: source.body.email,
      age: parseInt(source.body.age)
    };
  }
  
  to<Response>(result?: HandlerResult<UserOutput>, target: Response): void {
    if (result?.content) {
      target.json({
        success: true,
        data: result.content
      });
    } else if (result?.error) {
      target.status(400).json({
        success: false,
        error: result.error.message
      });
    }
  }
}

// 3. Middleware setup
const middlewareRegistry = new MiddlewareRegistry();

// Authentication middleware
class AuthMiddleware implements Middleware {
  readonly name = "auth";
  readonly isDynamic = true;
  
  init(secret: string) {
    this.secret = secret;
  }
  
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    
    try {
      const decoded = jwt.verify(token, this.secret);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  }
}

// Rate limiting middleware
class RateLimitMiddleware implements Middleware {
  readonly name = "rateLimit";
  readonly isDynamic = true;
  
  init(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  use(req: Request, res: Response, next: NextFunction) {
    // Rate limiting logic
    next();
  }
}

// Register middleware
middlewareRegistry.add(new AuthMiddleware());
middlewareRegistry.add(new RateLimitMiddleware());
middlewareRegistry.init("auth", "your-secret-key");
middlewareRegistry.init("rateLimit", 100, 60000);

// 4. Route structure
const routeRegistry = new RouteRegistry();

// Base API group
const apiGroup = new RouteGroup("/api", {
  cors: { origin: "*" },
  logging: { level: "info" },
  analytics: { provider: "google" }
});

// Version group
const v1Group = new RouteGroup("/v1", {
  rateLimit: { maxRequests: 1000, windowMs: 60000 },
  compression: { level: 6, threshold: 1024 }
});

// User management group
const userGroup = new RouteGroup("/users", {
  roles: { authenticatedOnly: true },
  middlewares: {
    pre: [middlewareRegistry.use("auth")]
  }
}, new UserIO());

// Add routes to user group
userGroup.add(new GetRoute("/", listUsersHandler, {
  cache: { ttl: 300, store: "memory" }
}));

userGroup.add(new PostRoute("/", createUserHandler, {
  validation: {
    request: { schema: createUserSchema }
  },
  audit: { store: "db", redactFields: ["password"] }
}));

userGroup.add(new GetRoute("/:id", getUserHandler, {
  cache: { ttl: 600, store: "memory" }
}));

userGroup.add(new PutRoute("/:id", updateUserHandler, {
  validation: {
    request: { schema: updateUserSchema }
  },
  audit: { store: "db", redactFields: ["password"] }
}));

userGroup.add(new DeleteRoute("/:id", deleteUserHandler, {
  audit: { store: "db" }
}));

// 5. Assemble route structure
v1Group.add(userGroup);
apiGroup.add(v1Group);

// 6. Register with registry
routeRegistry.register(apiGroup);

// 7. Usage
async function setupRoutes(app: Express) {
  const routes = routeRegistry.getAllRoutes();
  
  routes.forEach(route => {
    if (Array.isArray(route.path)) {
      route.path.forEach(path => {
        app[route.method.toLowerCase()](path, route.handler);
      });
    } else {
      app[route.method.toLowerCase()](route.path, route.handler);
    }
  });
}

// 8. Error handling and cleanup
process.on('SIGTERM', () => {
  console.log('Shutting down route system...');
  middlewareRegistry.destroy();
  process.exit(0);
});

setupRoutes(app).catch(console.error);
```

## Summary

The HTTP routing system in SoapJS provides a comprehensive, type-safe, and enterprise-ready solution for managing API endpoints. With its flexible architecture, developers can choose the appropriate level of complexity for their use case while maintaining consistency and type safety.

Key advantages:
- **Type Safety** - Full TypeScript support with specific route classes
- **Flexibility** - Multiple abstraction layers for different use cases
- **Enterprise Features** - Built-in security, rate limiting, audit logging
- **Organization** - Logical grouping and inheritance of route options
- **Middleware Management** - Centralized middleware with lifecycle support
- **Performance** - Efficient route lookup and caching
- **Maintainability** - Clear separation of concerns and modular design
