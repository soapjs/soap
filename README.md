# SoapJS - Clean Architecture Framework for TypeScript

**Build scalable, maintainable applications with enterprise-ready Clean Architecture patterns**

SoapJS is a comprehensive TypeScript framework that provides Clean Architecture patterns including Domain-Driven Design (DDD), Command Query Responsibility Segregation (CQRS), Event Sourcing, and more. It's designed to work with any framework while maintaining type safety and developer experience.

## What is SoapJS?

SoapJS is a framework-agnostic toolkit that brings enterprise architecture patterns to your applications. Whether you're building microservices, monoliths, or real-time applications, SoapJS provides the abstractions and patterns you need to create maintainable, scalable code.

### Key Benefits

- **🏗️ Clean Architecture** - DDD, CQRS, Event Sourcing out of the box
- **🔧 Framework Agnostic** - Works with Express, NestJS, Fastify, and more
- **🗄️ Database Agnostic** - MongoDB, PostgreSQL, MySQL, Redis support
- **🔍 Type-Safe** - Full TypeScript support with generics
- **⚡ Real-Time Ready** - WebSocket and event-driven patterns
- **📡 Event-Driven** - Built-in event bus and messaging patterns
- **🛡️ Enterprise Features** - Security, audit logging, transaction management

## 🚀 Quick Start

### Installation

```bash
npm install @soapjs/soap
```

### Basic Usage

```typescript
import { 
  Entity, 
  ReadWriteRepository, 
  UseCase, 
  Result,
  Where 
} from '@soapjs/soap';

// Define your domain entity
class User implements Entity {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly age: number;
}

// Create a use case
class CreateUserUseCase extends UseCase<User> {
  constructor(
    @Inject('UserRepository')
    private userRepo: ReadWriteRepository<User>
  ) {
    super();
  }

  async execute(data: { name: string; email: string; age: number }): Promise<Result<User>> {
    const user: User = {
      id: generateId(), // Your ID generation logic
      name: data.name,
      email: data.email,
      age: data.age
    };
    return this.userRepo.add([user]);
  }
}

// Query with type-safe query builder
const activeUsers = await userRepo.find(
  Where.valueOf('status').isEq('active')
    .and.valueOf('age').isGte(18)
);
```

## Architecture Components

SoapJS is built around several core components that work together to provide a complete Clean Architecture solution:

### **Domain Layer**
- **Entities** - Core business objects with identity (interfaces)
- **Value Objects** - Immutable objects without identity
- **Aggregates** - Clusters of related entities
- **Domain Events** - Business events that occur in the domain

### **Application Layer**
- **Use Cases** - Application-specific business rules
- **Commands & Queries** - CQRS pattern implementation
- **Event Handlers** - Process domain events
- **Transaction Management** - ACID transaction support

### **Infrastructure Layer**
- **Repositories** - Data access abstractions (ReadRepository, ReadWriteRepository)
- **Event Bus** - Message broker integrations
- **HTTP Routing** - Framework-agnostic routing
- **WebSocket Support** - Real-time communication

### **Repository Pattern**
SoapJS provides base repository classes that you can extend to create your own implementations:

- **ReadRepository** - Base class for read-only operations
- **ReadWriteRepository** - Base class for full CRUD operations
- **Custom Implementations** - Extend base classes for your specific needs

Learn more in the [Repository Pattern Guide](docs/REPOSITORY-PATTERN.md).

### **Cross-Cutting Concerns**
- **Dependency Injection** - Service container
- **Validation** - Request/response validation
- **Logging** - Structured logging
- **Error Handling** - Consistent error management

## Why SoapJS?

### **Framework Agnostic**
Write your business logic once and use it with any framework:

```typescript
// This code works with Express, NestJS, Fastify, or any other framework
class CreateUserUseCase extends UseCase<User> {
  constructor(
    @Inject('UserRepository')
    private userRepo: ReadWriteRepository<User>
  ) {
    super();
  }

  async execute(data: CreateUserData): Promise<Result<User>> {
    const user: User = {
      id: generateId(),
      name: data.name,
      email: data.email
    };
    return this.userRepo.add([user]);
  }
}
```

### **Type-Safe Query Builder**
Same query syntax for all databases:

```typescript
// Works with MongoDB, PostgreSQL, MySQL, Redis
const users = await userRepo.find(
  Where.valueOf('status').isEq('active')
    .and.valueOf('age').isGte(18)
    .and.valueOf('email').like('@gmail.com')
);
```

### **Enterprise-Ready Patterns**
Built-in support for complex business requirements:

```typescript
// CQRS with event sourcing
@CommandHandler()
class CreateOrderCommandHandler {
  async execute(command: CreateOrderCommand): Promise<Result<void>> {
    // Command handling logic
  }
}

@QueryHandler()
class GetOrdersQueryHandler {
  async execute(query: GetOrdersQuery): Promise<Result<OrderDto[]>> {
    // Query handling logic
  }
}
```

## Documentation

### **Core Concepts**
- **[CQRS Pattern](docs/CQRS.md)** - Command Query Responsibility Segregation
- **[Event Bus](docs/EVENT-BUS.md)** - Event-driven architecture and messaging
- **[Query Builder](docs/QUERY-BUILDER.md)** - Type-safe database queries
- **[Repository Pattern](docs/REPOSITORY-PATTERN.md)** - Data access abstractions
- **[Transactions](docs/TRANSACTIONS.md)** - Database transaction management
- **[HTTP Routing](docs/ROUTES.md)** - Framework-agnostic routing system
- **[Socket Communication](docs/SOCKET.md)** - Real-time communication patterns
- **[Where Conditions](docs/WHERE.md)** - Complex query condition building

## Use Cases

SoapJS is designed for applications that need:

### **Enterprise Applications**
- Complex business logic with multiple domains
- High scalability and maintainability requirements
- Strict compliance and audit requirements
- Team collaboration on large codebases

### **Microservices**
- Consistent architecture across services
- Event-driven communication between services
- Independent deployment and scaling
- Service-to-service messaging

### **Real-Time Applications**
- WebSocket-based real-time features
- Event-driven user interactions
- Live data synchronization
- Chat and collaboration features

### **Legacy Modernization**
- Gradual migration from monolithic applications
- Framework-agnostic business logic
- Database migration strategies
- API modernization

## Current Status

### ** Ready to Use**
- **Core Framework** - Complete Clean Architecture implementation
- **CQRS Pattern** - Full command/query separation with event sourcing
- **Repository Pattern** - Base classes for custom implementations
- **Event Bus** - Built-in event-driven messaging
- **HTTP Routing** - Framework-agnostic routing system
- **WebSocket Support** - Real-time communication patterns
- **Transaction Management** - ACID transaction support
- **Type-Safe Query Builder** - Database-agnostic querying
- **Dependency Injection** - Service container and DI
- **Validation** - Request/response validation
- **Error Handling** - Consistent error management

### ** In Development**
- **Framework Integrations** - Express, NestJS, Fastify adapters
- **Database Adapters** - MongoDB, PostgreSQL, MySQL, Redis connectors
- **Event Bus Adapters** - RabbitMQ, Kafka, AWS SQS integrations
- **CLI Tools** - Code generation and project scaffolding
- **Boilerplates** - Complete application templates
- **Examples** - Real-world application examples

## Getting Started

### **1. Install Core Package**
```bash
npm install @soapjs/soap
```

### **2. Create Your First Entity**
```typescript
import { Entity } from '@soapjs/soap';

interface User extends Entity {
  readonly name: string;
  readonly email: string;
  readonly age: number;
}
```

### **3. Create a Use Case**
```typescript
import { UseCase, ReadWriteRepository, Result } from '@soapjs/soap';

class CreateUserUseCase extends UseCase<User> {
  constructor(
    @Inject('UserRepository')
    private userRepo: ReadWriteRepository<User>
  ) {
    super();
  }

  async execute(data: { name: string; email: string; age: number }): Promise<Result<User>> {
    const user: User = {
      id: generateId(), // Your ID generation logic
      name: data.name,
      email: data.email,
      age: data.age
    };
    return this.userRepo.add([user]);
  }
}
```

### **4. Query Your Data**
```typescript
import { Where } from '@soapjs/soap';

const activeUsers = await userRepo.find(
  Where.valueOf('status').isEq('active')
    .and.valueOf('age').isGte(18)
);
```

### **5. Create Custom Repository Implementation**
```typescript
import { ReadWriteRepository, DatabaseContext } from '@soapjs/soap';

class UserRepository extends ReadWriteRepository<User, UserDocument> {
  constructor(context: DatabaseContext<User, UserDocument>) {
    super(context);
  }

  // Add custom methods specific to your domain
  async findByEmail(email: string): Promise<Result<User | null>> {
    return this.find(Where.valueOf('email').isEq(email));
  }

  async findActiveUsers(): Promise<Result<User[]>> {
    return this.find(Where.valueOf('status').isEq('active'));
  }
}
```

For detailed information about creating custom repositories, see the [Repository Pattern Guide](docs/REPOSITORY-PATTERN.md).

## Coming Soon

### **Framework Integrations**
- **Express Integration** - Seamless Express.js integration
- **NestJS Integration** - NestJS module and decorators
- **Fastify Integration** - Fastify plugin and decorators

### **Database Adapters**
- **MongoDB Adapter** - Native MongoDB support
- **PostgreSQL Adapter** - PostgreSQL with TypeORM integration
- **MySQL Adapter** - MySQL with TypeORM integration
- **Redis Adapter** - Redis caching and session storage

### **Event Bus Adapters**
- **RabbitMQ Adapter** - Message queuing with RabbitMQ
- **Kafka Adapter** - Event streaming with Apache Kafka
- **AWS SQS Adapter** - Cloud messaging with AWS SQS

### **CLI & Boilerplates**
- **SoapJS CLI** - Code generation and project scaffolding
- **Express Boilerplate** - Complete Express.js application template
- **NestJS Boilerplate** - Complete NestJS application template
- **Microservices Boilerplate** - Multi-service application template

### **Examples & Tutorials**
- **E-commerce Example** - Complete e-commerce application
- **Chat Application** - Real-time chat with WebSockets
- **Task Management** - CQRS and event sourcing example
- **User Management** - Authentication and authorization example

## Community

- **[GitHub Discussions](https://github.com/soapjs/soap/discussions)** - Ask questions and share ideas
- **[Discord](https://discord.gg/soapjs)** - Join our community
- **[Blog](https://blog.soapjs.com)** - Architecture insights and best practices
- **[YouTube](https://youtube.com/@soapjs)** - Video tutorials and demos

## License

MIT License - see [LICENSE](LICENSE) for details.

## Enterprise

Need enterprise support, consulting, or custom integrations?

- **Enterprise Support** - Priority support and SLAs
- **Architecture Consulting** - Clean Architecture implementation
- **Migration Services** - From legacy to Clean Architecture
- **Training Programs** - Team training and workshops

Contact us at [radoslaw.kamysz@gmail.com](mailto:radoslaw.kamysz@gmail.com)

---

**SoapJS** - Enterprise-ready Clean Architecture framework for scalable, maintainable applications.
