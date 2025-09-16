# HTTP App Architecture

The HTTP App architecture provides a framework-agnostic foundation for building HTTP applications with support for multiple web frameworks including Express.js and Fastify.

## Architecture Overview

The architecture consists of three main components:

1. **HttpAppBase** - Abstract base class with framework-agnostic functionality
2. **ExpressHttpApp** - Express.js implementation
3. **FastifyHttpApp** - Fastify implementation

## Benefits

- ✅ **Framework Agnostic**: Write code that works with multiple frameworks
- ✅ **Code Reusability**: Shared functionality across different implementations
- ✅ **Plugin System**: Consistent plugin management across frameworks
- ✅ **Type Safety**: Full TypeScript support with proper typing
- ✅ **Easy Testing**: Abstract base class makes testing easier
- ✅ **Lifecycle Management**: Consistent application lifecycle across frameworks

## HttpAppBase - Abstract Base Class

The `HttpAppBase` class provides all the framework-agnostic functionality:

### Core Features

- **Plugin Management**: Register, install, and manage plugins
- **Route Registration**: Register routes, routers, controllers, and route groups
- **Middleware Management**: Register and manage middleware
- **Service Container**: Dependency injection container
- **Lifecycle Management**: Application start/stop with plugin lifecycle hooks
- **Configuration**: Flexible configuration system

### Methods

```typescript
// Lifecycle
abstract start(port: number): Promise<void>;
abstract stop(): Promise<void>;
abstract getApp(): Framework;
abstract getServer<T>(): T;

// Route Management
register(routes: Route[]): this;
register(routers: Router[]): this;
register(controllers: any[]): this;
register(groups: RouteGroup[]): this;
register(middleware: Middleware, ready?: boolean): this;

// Plugin Management
usePlugin(plugin: HttpPlugin, options?: any): this;
getPlugin(pluginName: string): HttpPlugin | undefined;
listPlugins(): HttpPlugin[];
isPluginLoaded(pluginName: string): boolean;

// Service Management
registerService<T>(token: string, service: new (...args: any[]) => T): this;
getService<T>(token: string): T;

// Utility Methods
configure(configureFn: (app: this) => void): this;
isDevelopment(): boolean;
isProduction(): boolean;
isTest(): boolean;
```

## Express Implementation

### ExpressHttpApp

The `ExpressHttpApp` class extends `HttpAppBase` and provides Express.js-specific functionality:

```typescript
import { ExpressHttpApp, createExpressApp } from '@soapjs/soap';

const app = createExpressApp();

// Express-specific methods
app
  .setTrustProxy(true)
  .setStatic('public')
  .setViewEngine('ejs')
  .addErrorHandler((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

// Framework-agnostic methods
app
  .usePlugin(new SecurityPlugin())
  .addRoute({
    method: 'GET',
    path: '/',
    handler: async (req, res) => {
      return { message: 'Hello from Express!' };
    }
  });

await app.start(3000);
```

### Express-Specific Features

- **Trust Proxy**: Configure proxy trust settings
- **Static Files**: Serve static files from directories
- **View Engine**: Set up template engines (EJS, Pug, Handlebars)
- **Error Handling**: Custom error handling middleware
- **Express Middleware**: Direct Express middleware registration

## Fastify Implementation

### FastifyHttpApp

The `FastifyHttpApp` class extends `HttpAppBase` and provides Fastify-specific functionality:

```typescript
import { FastifyHttpApp, createFastifyApp } from '@soapjs/soap';

const app = createFastifyApp();

// Fastify-specific methods
app
  .setConfig({
    trustProxy: true,
    logger: true
  })
  .addHook('onRequest', async (request, reply) => {
    console.log(`${request.method} ${request.url}`);
  })
  .decorate('customHelper', () => {
    return 'Custom Fastify helper';
  });

// Framework-agnostic methods
app
  .usePlugin(new SecurityPlugin())
  .addRouteWithSchema({
    method: 'GET',
    url: '/',
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      return { message: 'Hello from Fastify!' };
    }
  });

await app.start(3000);
```

### Fastify-Specific Features

- **Schema Validation**: Built-in JSON schema validation
- **Hooks**: Request/response hooks for lifecycle management
- **Decorators**: Add custom properties to request/reply objects
- **Plugin System**: Fastify's native plugin system
- **Logger**: Built-in Pino logger integration

## Usage Examples

### Basic Setup

```typescript
import { createExpressApp } from '@soapjs/soap';

const app = createExpressApp();

app
  .usePlugin(new SecurityPlugin())
  .usePlugin(new HealthCheckPlugin())
  .addRoute({
    method: 'GET',
    path: '/api/health',
    handler: async (req, res) => {
      return { status: 'ok' };
    }
  });

await app.start(3000);
```

### Advanced Configuration

```typescript
import { createExpressApp, createFastifyApp } from '@soapjs/soap';

// Express with advanced features
const expressApp = createExpressApp();
expressApp
  .setTrustProxy(true)
  .setStatic('public')
  .setViewEngine('ejs')
  .configure((app) => {
    // Custom configuration
    app.getContainer().register('database', DatabaseService);
  })
  .usePlugin(new SecurityPlugin({
    enabled: true,
    exposeEndpoints: true
  }));

// Fastify with advanced features
const fastifyApp = createFastifyApp();
fastifyApp
  .setConfig({
    trustProxy: true,
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty'
      }
    }
  })
  .addHook('onRequest', async (request, reply) => {
    console.log(`Request: ${request.method} ${request.url}`);
  })
  .usePlugin(new SecurityPlugin({
    enabled: true,
    exposeEndpoints: true
  }));
```

### Plugin Development

```typescript
import { HttpPlugin, HttpAppBase } from '@soapjs/soap';

class CustomPlugin implements HttpPlugin<any> {
  name = 'custom-plugin';
  version = '1.0.0';
  description = 'Custom plugin';
  
  install(app: HttpAppBase<any>, context: any, options?: any): void {
    // Plugin installation logic
    app.addRoute({
      method: 'GET',
      path: '/custom',
      handler: async (req, res) => {
        return { message: 'Custom plugin endpoint' };
      }
    });
  }
  
  beforeStart(app: HttpAppBase<any>): void {
    console.log('Custom plugin: Application starting...');
  }
  
  afterStart(app: HttpAppBase<any>): void {
    console.log('Custom plugin: Application started');
  }
}
```

## Migration Guide

### From Interface to Abstract Class

**Before (Interface):**
```typescript
import { HttpApp } from '@soapjs/soap';

// This was just an interface - no concrete implementation
const app: HttpApp<any> = new SomeImplementation();
```

**After (Abstract Class):**
```typescript
import { createExpressApp, createFastifyApp } from '@soapjs/soap';

// Use concrete implementations
const expressApp = createExpressApp();
const fastifyApp = createFastifyApp();
```

### Updating Examples

**Before:**
```typescript
import { HttpApp } from '@soapjs/soap';

const app = new HttpApp(); // This would fail - no concrete implementation
```

**After:**
```typescript
import { createExpressApp } from '@soapjs/soap';

const app = createExpressApp(); // Works with concrete implementation
```

## Best Practices

### 1. Choose the Right Framework

- **Express**: Use for traditional web applications, when you need extensive middleware ecosystem
- **Fastify**: Use for high-performance APIs, when you need schema validation and built-in logging

### 2. Plugin Management

```typescript
// Good: Use plugins for cross-cutting concerns
app.usePlugin(new SecurityPlugin());
app.usePlugin(new HealthCheckPlugin());
app.usePlugin(new MetricsPlugin());

// Good: Configure plugins with options
app.usePlugin(new SecurityPlugin({
  enabled: true,
  exposeEndpoints: false, // Disable in production
  headers: {
    enabled: true,
    headers: {
      contentSecurityPolicy: "default-src 'self'"
    }
  }
}));
```

### 3. Route Organization

```typescript
// Good: Use route groups for organization
const apiRoutes = new RouteGroup({
  prefix: '/api/v1',
  routes: [
    new Route({ method: 'GET', path: '/users', handler: getUsers }),
    new Route({ method: 'POST', path: '/users', handler: createUser })
  ]
});

app.addRouteGroup(apiRoutes);

// Good: Use routers for complex routing
const userRouter = new Router({
  prefix: '/users',
  routes: [
    new Route({ method: 'GET', path: '/', handler: listUsers }),
    new Route({ method: 'GET', path: '/:id', handler: getUser }),
    new Route({ method: 'POST', path: '/', handler: createUser })
  ]
});

app.addRouter(userRouter);
```

### 4. Service Registration

```typescript
// Good: Register services early
app.registerService('database', DatabaseService);
app.registerService('cache', CacheService);
app.registerService('logger', LoggerService);

// Good: Use services in routes
app.addRoute({
  method: 'GET',
  path: '/users',
  handler: async (req, res) => {
    const database = app.getService<DatabaseService>('database');
    const users = await database.getUsers();
    return users;
  }
});
```

## Testing

### Testing Abstract Base Class

```typescript
import { HttpAppBase } from '@soapjs/soap';

class TestHttpApp extends HttpAppBase<any> {
  // Implement abstract methods for testing
  initializeFramework(): void {}
  async start(port: number): Promise<void> { this.isStarted = true; }
  async stop(): Promise<void> { this.isStarted = false; }
  getApp(): any { return {}; }
  getServer<T>(): T { return {} as T; }
}

describe('HttpAppBase', () => {
  let app: TestHttpApp;
  
  beforeEach(() => {
    app = new TestHttpApp();
  });
  
  it('should register plugins', () => {
    const plugin = new TestPlugin();
    app.usePlugin(plugin);
    expect(app.isPluginLoaded('test-plugin')).toBe(true);
  });
});
```

### Testing Framework Implementations

```typescript
import { ExpressHttpApp } from '@soapjs/soap';

describe('ExpressHttpApp', () => {
  let app: ExpressHttpApp;
  
  beforeEach(() => {
    app = new ExpressHttpApp();
  });
  
  it('should start Express server', async () => {
    await app.start(3000);
    expect(app.isApplicationStarted()).toBe(true);
    await app.stop();
  });
});
```

## Performance Considerations

### Express vs Fastify

- **Express**: More mature ecosystem, extensive middleware, easier to get started
- **Fastify**: Higher performance, built-in schema validation, better TypeScript support

### Memory Usage

- Both implementations share the same base class, so memory overhead is minimal
- Plugin system adds minimal overhead
- Route registration is efficient with proper data structures

## Troubleshooting

### Common Issues

1. **Abstract Method Not Implemented**
   ```typescript
   // Error: Cannot create instance of abstract class
   const app = new HttpAppBase(); // ❌
   
   // Solution: Use concrete implementation
   const app = createExpressApp(); // ✅
   ```

2. **Plugin Not Found**
   ```typescript
   // Error: Plugin 'unknown-plugin' not found
   app.getPlugin('unknown-plugin'); // Returns undefined
   
   // Solution: Check plugin name and registration
   const plugin = new SecurityPlugin();
   app.usePlugin(plugin);
   expect(app.getPlugin('security')).toBeDefined();
   ```

3. **Framework-Specific Methods**
   ```typescript
   // Error: Property 'setTrustProxy' does not exist
   const app = createFastifyApp();
   app.setTrustProxy(true); // ❌ - Express method
   
   // Solution: Use framework-specific methods
   const expressApp = createExpressApp();
   expressApp.setTrustProxy(true); // ✅
   
   const fastifyApp = createFastifyApp();
   fastifyApp.setConfig({ trustProxy: true }); // ✅
   ```

## Future Enhancements

- **Koa Support**: Add Koa.js implementation
- **Hapi Support**: Add Hapi.js implementation
- **GraphQL Support**: Built-in GraphQL server support
- **WebSocket Support**: WebSocket server integration
- **Microservices**: Service mesh integration
- **Performance Monitoring**: Built-in performance metrics
