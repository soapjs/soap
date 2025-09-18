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
class CreateUserUseCase extends UseCase<User> {
  constructor(
    @Inject('UserRepository')
    private userRepo: ReadWriteRepository<User>
  ) {
    super();
  }

  async execute(data: { name: string; email: string; age: number }): Promise<Result<User>> {
    const user: User = {
      id: generateId(),
      name: data.name,
      email: data.email,
      age: data.age
    };
    return this.userRepo.add([user]);
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

## Current Status

**Ready to Use:**
- Core Clean Architecture implementation
- Domain, Data, and API layers
- CQRS, Event Sourcing, Repository patterns
- Type-safe query builder
- HTTP plugins (Security, Metrics, Memory Monitoring)
- Dependency injection and validation

**In Development (v1.0.0):**
- Framework integrations (Express, NestJS, Fastify)
- Database adapters (MongoDB, PostgreSQL, MySQL, Redis)
- Event bus adapters (RabbitMQ, Kafka, AWS SQS)
- CLI tools and boilerplates

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
