<p align="center">
  <img src="https://raw.githubusercontent.com/soapjs/soap/main/docs/assets/soap_logo.png" alt="SoapJS logo" width="360" />
</p>

# SoapJS

**Enterprise-ready Clean Architecture framework for TypeScript**

> ⚠️ **Work in Progress** - Currently in development towards v1.0.0. API is stable and won't change, only additions will be made.

SoapJS brings enterprise architecture patterns to TypeScript applications. Build scalable, maintainable systems with Clean Architecture, DDD, CQRS, and Event Sourcing - framework and database agnostic.

## Why SoapJS?

- **Clean Architecture** - DDD, CQRS, Event Sourcing out of the box
- **Framework Agnostic** - Works with Express, NestJS, Fastify, and more
- **Database Agnostic** - MongoDB, PostgreSQL, MySQL, Redis support
- **Type-Safe** - Full TypeScript support with generics
- **Real-Time Ready** - WebSocket and event-driven patterns
- **Plugin System** - Security, metrics, monitoring plugins
- **Enterprise Features** - Security, audit logging, transaction management

## Quick Start

```bash
npm install @soapjs/soap
```

> **Tip:** Use the [`@soapjs/cli`](https://www.npmjs.com/package/@soapjs/cli) to scaffold SoapJS projects and generate clean-architecture building blocks (entities, use cases, repositories, controllers) much faster than by hand:
>
> ```bash
> npm install -g @soapjs/cli
> ```

```typescript
import { Entity, ReadWriteRepository, UseCase, Result, Where } from '@soapjs/soap';

// Define your domain entity
interface User extends Entity {
  readonly name: string;
  readonly email: string;
  readonly age: number;
}

// Create a use case
@Injectable()
class CreateUserUseCase implements UseCase<User> {
  constructor(
    @Inject('UserRepository')
    private userRepo: ReadWriteRepository<User>
  ) {}

  async execute(data: { name: string; email: string; age: number }): Promise<Result<User>> {
    const user: User = {
      id: generateId(),
      name: data.name,
      email: data.email,
      age: data.age
    };
    return this.userRepo.add(user);
  }
}

// Type-safe queries work with any database
const activeUsers = await userRepo.find(
  Where.valueOf('status').isEq('active')
    .and.valueOf('age').isGte(18)
);
```

## Documentation

### Core Concepts
- **[CQRS Pattern](docs/CQRS.md)** - Command Query Responsibility Segregation
- **[Event Bus](docs/EVENT-BUS.md)** - Event-driven architecture and messaging
- **[Advanced Event Patterns](docs/ADVANCED-EVENT-PATTERNS.md)** - Event replay, versioning, saga orchestration
- **[Repository Pattern](docs/REPOSITORY-PATTERN.md)** - Data access abstractions
- **[Query Builder](docs/QUERY-BUILDER.md)** - Type-safe database queries
- **[Transactions](docs/TRANSACTIONS.md)** - Database transaction management
- **[Dependency Injection](docs/DEPENDENCY-INJECTION.md)** - Service container and DI

### HTTP & Real-time
- **[HTTP adapters](docs/HTTP-ADAPTERS.md)** - Optional Zod, OpenAPI, tracing — wire in your app, not in soap-express
- **[HTTP Routing](docs/ROUTES.md)** - Framework-agnostic routing system
- **[Socket Communication](docs/SOCKET.md)** - Real-time communication patterns
- **[Socket Handlers](docs/SOCKET-HANDLERS.md)** - WebSocket handler patterns
- **[HTTP App Architecture](docs/HTTP-APP-ARCHITECTURE.md)** - HTTP application structure

### Plugins & Monitoring
- **[Security Plugin](docs/SECURITY-PLUGIN.md)** - Security middleware and protection
- **[Memory Monitoring Plugin](docs/MEMORY-MONITORING-PLUGIN.md)** - Memory usage tracking
- **[Cache](docs/CACHE.md)** - Caching strategies and patterns

### Query Building
- **[Where Conditions](docs/WHERE.md)** - Complex query condition building

## Perfect For

- **Enterprise Applications** - Complex business logic with multiple domains
- **Microservices** - Consistent architecture across services
- **Real-Time Applications** - WebSocket-based features and event-driven interactions
- **Legacy Modernization** - Gradual migration to Clean Architecture

## What's included and what needs an adapter

SoapJS is deliberately split into two categories: things that work out of the box, and extension points that define the contract your adapter must fulfill.

### Ready to use

| Component | Description |
|-----------|-------------|
| `Result`, `Failure` | Error handling without exceptions |
| `Entity`, `ValueObject`, `UseCase` | Domain building blocks |
| `Where`, `RepositoryQuery` | Type-safe query builder |
| `ReadRepository`, `ReadWriteRepository` | Repository base classes (wire up your data source) |
| `Transaction`, `TransactionRunner` | Transaction management |
| `InMemoryCommandBus` | Command dispatch — great for development and testing |
| `InMemoryQueryBus` | Query dispatch — great for development and testing |
| `InMemoryEventStore` | Event store — great for development and testing |
| `EventProcessor`, `EventDispatcher` | Event processing with retry, backoff, DLQ |
| `BaseHttpApp`, routing, plugins | Framework-agnostic HTTP layer |
| `DecoratorRegistry`, `HttpContract`, `ApiDocFragment`, `Tracer` / `Span` | Route/CQRS metadata registry + HTTP ports for adapters |
| `SecurityPlugin`, `MetricsPlugin`, `MemoryMonitoringPlugin` | Production-ready HTTP plugins |
| `SocketServer`, `SocketClient` | WebSocket communication |
| `DIContainer`, `@Injectable`, `@Inject` | Dependency injection |

### Extension points (implement the interface, or extend the base class)

These provide the full contract and a skeletal implementation. Wire them to your infrastructure (Kafka, MongoDB, Redis, etc.) by implementing the interface or extending the base class.

| Component | Interface to implement | Base class to extend |
|-----------|----------------------|---------------------|
| Event Bus (Kafka, RabbitMQ, SQS…) | `EventBus<M, H>` | — |
| Event Store (MongoDB, PostgreSQL…) | `EventStore` | — |
| Aggregate Root | — | `BaseAggregateRoot<T>` |
| Saga | — | `BaseSaga` (implement `executeCommand`) |
| Saga Orchestrator | `SagaOrchestrator` | `BaseSagaOrchestrator` (implement `executeStep`) |
| Event Replay | `EventReplayManager` | `BaseEventReplayManager` |
| Event Versioning | `EventVersionManager` | `BaseEventVersionManager` |
| Event Correlation | `EventCorrelationManager` | `BaseEventCorrelationManager` |
| Snapshots | `SnapshotManager` | `BaseSnapshotManager` |
| HTTP Application | `HttpApp<F>` | `BaseHttpApp<F>` |
| Request contracts (Zod, TypeBox, …) | — | Use `HttpContract` + route `apiDoc` / `middlewares.pre` from your adapter |
| API documentation (OpenAPI, …) | `HttpPlugin` | e.g. `@soapjs/soap-openapi` `DocumentationPlugin` |
| Distributed tracing | `Tracer`, `Span` | e.g. `@soapjs/soap-node-otel` `NoopTracer` or OpenTelemetry |
| Cache | `CacheManager` | — |
| Database Session | `DatabaseSession` | — |

> **Note:** `BaseEventCorrelationManager`, `BaseSnapshotManager` and `BaseEventReplayManager` store state in memory. For production use they need a persistent `EventStore` and `SnapshotStore` — implement those interfaces against your database of choice.

### HTTP adapter packages (separate repos)

| Package | Role |
|---------|------|
| `@soapjs/soap-express` | Express controllers, routing, `bootstrap` — **no** Zod/OpenAPI/OTel bundled |
| `@soapjs/soap-contract-zod` | `bodyContract()` → validation middleware + `apiDoc` |
| `@soapjs/soap-openapi` | OpenAPI 3 + Swagger UI plugin |
| `@soapjs/soap-node-otel` | `TracingMiddleware` + noop tracer implementing `Tracer` |

Wire them in **your** `index.ts` via `bootstrap({ plugins, middleware: { pre } })`.

### Roadmap (v1.x)

- Framework adapters: `@soapjs/soap-express`, `@soapjs/soap-fastify`
- Database adapters: `@soapjs/soap-mongo`, `@soapjs/soap-postgres`
- Event bus adapters: `@soapjs/soap-rabbit`, `@soapjs/soap-kafka`
- Project boilerplates

## Example Usage

```typescript
// HTTP Plugin System
import { HttpApp, SecurityPlugin, MetricsPlugin } from '@soapjs/soap';

const app = new SoapExpress();

app.usePlugin(new SecurityPlugin({
  enableCSRF: true,
  enableSecurityHeaders: true,
  exposeEndpoints: true
}));

app.usePlugin(new MetricsPlugin({
  exposeEndpoint: true,
  metricsPath: '/metrics'
}));
```

```typescript
// Custom Repository
class UserRepository extends ReadWriteRepository<User, UserDocument> {
  async findByEmail(email: string): Promise<Result<User | null>> {
    return this.find(Where.valueOf('email').isEq(email));
  }
}
```

## Community

- **[GitHub Discussions](https://github.com/soapjs/soap/discussions)** - Ask questions and share ideas
- **[YouTube](https://youtube.com/@soapjs)** - Video tutorials and demos

## License

MIT License - see [LICENSE](LICENSE) for details.

## Enterprise Support

Need enterprise support, consulting, or custom integrations?

- **Enterprise Support** - Priority support and SLAs
- **Architecture Consulting** - Clean Architecture implementation
- **Migration Services** - From legacy to Clean Architecture
- **Training Programs** - Team training and workshops

Contact: [radoslaw.kamysz@gmail.com](mailto:radoslaw.kamysz@gmail.com)

---

**SoapJS** - Enterprise-ready Clean Architecture framework for scalable, maintainable applications.
