# Dependency Injection

SoapJS provides a comprehensive dependency injection system with **Inversify-style API**. The system is designed to be flexible, type-safe, and doesn't require external dependencies.

## Features

- **Inversify-style API**: `DI.bind('IUserService').toClass(UserService)` - clean and readable
- **Multiple Token Types**: String, Symbol, Function (class/interface) tokens
- **Universal @Inject Decorator**: Single decorator for both constructor and property injection
- **NestJS-style Scopes**: Singleton, Transient, Request scopes
- **Type Safety**: Full TypeScript support with metadata reflection
- **No External Dependencies**: Built-in implementation, no need for InversifyJS or similar
- **Factory Pattern**: Support for factory-based dependency creation
- **Module System**: Organize dependencies into modules

## Basic Usage

### 1. Inversify-style API (Recommended)

The cleanest way to use dependency injection is through the Inversify-style API:

```typescript
import { DI, Injectable, Inject, Scope } from '@soapjs/soap';

// Mark classes as injectable
@Injectable()
class UserRepository {
  async findById(id: string): Promise<User | null> {
    // Implementation
  }
}

@Injectable()
class EmailService {
  async sendEmail(to: string, subject: string): Promise<void> {
    // Implementation
  }
}

@Injectable()
class UserService {
  constructor(
    @Inject('IUserRepository') private userRepo: UserRepository,
    @Inject('IEmailService') private emailService: EmailService
  ) {}

  async createUser(userData: CreateUserData): Promise<User> {
    const user = await this.userRepo.save(userData);
    await this.emailService.sendEmail(user.email, 'Welcome!');
    return user;
  }
}

// Registration with Inversify-style API
DI.bind('IUserRepository').toClass(UserRepository);
DI.bind('IEmailService').toClass(EmailService);
DI.bind('IUserService').toClass(UserService);

// Get services
const userService = DI.get<IUserService>('IUserService');
const userRepo = DI.get<UserRepository>('IUserRepository');

// Check if service exists
if (DI.has('IUserService')) {
  console.log('UserService is registered');
}

// List all registered tokens
console.log('Registered services:', DI.getTokens());
```

### 2. Marking Classes as Injectable

Use the `@Injectable` decorator to mark classes that can be injected:

```typescript
import { Injectable, Scope } from '@soapjs/soap';

@Injectable({ scope: Scope.SINGLETON })
class UserRepository {
  async findById(id: string): Promise<User | null> {
    // Implementation
  }
}

@Injectable({ scope: Scope.TRANSIENT }) // New instance each time
class EmailService {
  async sendEmail(to: string, subject: string): Promise<void> {
    // Implementation
  }
}
```

### 3. Constructor Injection

Inject dependencies through constructor parameters using the universal `@Inject` decorator:

```typescript
import { Injectable, Inject } from '@soapjs/soap';

@Injectable()
class CreateUserUseCase extends UseCase<User> {
  constructor(
    @Inject('IUserRepository') private userRepo: UserRepository,
    @Inject('IEmailService') private emailService: EmailService
  ) {
    super();
  }

  async execute(input: CreateUserInput): Promise<User> {
    const user = await this.userRepo.save(input);
    await this.emailService.sendEmail(user.email, 'Welcome!');
    return user;
  }
}
```

### 4. Property Injection

Inject dependencies as class properties using the same `@Inject` decorator:

```typescript
import { Injectable, Inject } from '@soapjs/soap';

@Injectable()
class GetUserUseCase extends UseCase<User> {
  @Inject('IUserRepository')
  private userRepo!: UserRepository;

  @Inject('IEmailService')
  private emailService!: EmailService;

  async execute(input: { id: string }): Promise<User> {
    return await this.userRepo.findById(input.id);
  }
}
```

## Registration Methods

### 1. Inversify-style API (Recommended)

```typescript
import { DI, Scope } from '@soapjs/soap';

// Bind to classes
DI.bind('IUserRepository').toClass(UserRepositoryImpl);
DI.bind('IEmailService').toClass(EmailServiceImpl, { scope: Scope.TRANSIENT });
DI.bind('IUserService').toClass(UserService);

// Bind to interfaces
DI.bind(IUserRepository).toInterface(UserRepositoryImpl);
DI.bind(IEmailService).toInterface(EmailServiceImpl);

// Bind to abstract classes
DI.bind(AbstractUserService).toAbstract(ConcreteUserService);

// Bind to values
DI.bind('AppConfig').toValue({ database: 'mongodb://localhost:27017/myapp' });

// Bind to factories
DI.bind('DatabaseConnection').toFactory(
  (config) => new DatabaseConnection(config), 
  { 
    scope: Scope.SINGLETON,
    dependencies: ['AppConfig']
  }
);

// Bind with symbol tokens
DI.bind(Symbol('UserService')).toClass(UserService);

// Get dependencies
const userRepo = DI.get<IUserRepository>('IUserRepository');
const config = DI.get('AppConfig');
const userService = DI.get<IUserService>('IUserService');

// Management
console.log('Registered tokens:', DI.getTokens());
console.log('UserRepository exists:', DI.has('IUserRepository'));
```

### 2. Token Types

SoapJS supports multiple token types:

```typescript
// String tokens
DI.bind('IUserService').toClass(UserService);

// Symbol tokens
DI.bind(Symbol('UserService')).toClass(UserService);

// Interface tokens
DI.bind(IUserService).toInterface(UserService);

// Class tokens
DI.bind(UserService).toClass(UserService);

// Abstract class tokens
DI.bind(AbstractUserService).toAbstract(ConcreteUserService);
```

### 3. Scopes

```typescript
import { Scope } from '@soapjs/soap';

// Singleton (default)
DI.bind('UserService').toClass(UserService, { scope: Scope.SINGLETON });

// Transient (new instance each time)
DI.bind('UserService').toClass(UserService, { scope: Scope.TRANSIENT });

// Request (per-request instance)
DI.bind('UserService').toClass(UserService, { scope: Scope.REQUEST });
```

## Advanced Features

### Custom Tokens

You can use custom tokens for dependency registration:

```typescript
// String tokens
DI.bind('PrimaryUserRepository').toClass(PrimaryUserRepository);
DI.bind('SecondaryUserRepository').toClass(SecondaryUserRepository);

// Symbol tokens
const PRIMARY_REPO = Symbol('PrimaryUserRepository');
const SECONDARY_REPO = Symbol('SecondaryUserRepository');

DI.bind(PRIMARY_REPO).toClass(PrimaryUserRepository);
DI.bind(SECONDARY_REPO).toClass(SecondaryUserRepository);

// Interface tokens
DI.bind(IUserRepository).toInterface(PrimaryUserRepository);
DI.bind(IUserRepository).toInterface(SecondaryUserRepository);

@Injectable()
class UserService {
  constructor(
    @Inject('PrimaryUserRepository') private primaryRepo: IUserRepository,
    @Inject('SecondaryUserRepository') private secondaryRepo: IUserRepository
  ) {}
}
```

### Factory Functions

Register dependencies using factory functions:

```typescript
import { DI, Scope } from '@soapjs/soap';

// Traditional factory (only dependencies as arguments)
DI.bind('DatabaseConnection').toFactory(
  (config) => new DatabaseConnection(config), 
  { 
    scope: Scope.SINGLETON,
    dependencies: ['AppConfig']
  }
);

// Factory with DI container access
DI.bind('DatabaseConnection').toFactory(
  (container, config) => {
    const logger = container.get('ILogger');
    const cache = container.get('ICache');
    return new DatabaseConnection(config, logger, cache);
  },
  { 
    scope: Scope.SINGLETON,
    dependencies: ['AppConfig'],
    injectContainer: true // Enable container injection
  }
);

DI.bind('Logger').toFactory(
  () => new Logger(process.env.LOG_LEVEL || 'info'),
  { scope: Scope.SINGLETON }
);
```

#### Factory with Container Access

When `injectContainer: true` is set, the factory function receives the DI container as the first argument:

```typescript
// Factory with full DI access
DI.bind('ComplexService').toFactory(
  (container, config) => {
    // Can access any registered dependency
    const logger = container.get('ILogger');
    const cache = container.get('ICache');
    const db = container.get('IDatabase');
    
    // Can even register new services dynamically
    container.bind('CustomService').toValue(new CustomService());
    
    return new ComplexService(config, logger, cache, db);
  },
  { 
    dependencies: ['AppConfig'],
    injectContainer: true
  }
);
```

**Benefits of container access:**
- ✅ Access to all registered dependencies
- ✅ Dynamic service registration
- ✅ Complex dependency resolution
- ✅ No need to pass all dependencies explicitly
- ✅ Flexible factory logic

### Lifecycle Management

```typescript
import { DI } from '@soapjs/soap';

// Check if a dependency is registered
const isRegistered = DI.has('DatabaseConnection');

// Get a dependency
const dbConnection = DI.get('DatabaseConnection');

// List all registered tokens
const tokens = DI.getTokens();

// Get provider information
const provider = DI.getProvider('DatabaseConnection');

// Clear all dependencies
DI.clear();
```

## Best Practices

### 1. Use Constructor Injection for Required Dependencies

```typescript
// Good
@Injectable()
class UserService {
  constructor(
    @Inject('IUserRepository') private userRepo: UserRepository
  ) {}
}

// Avoid for required dependencies
@Injectable()
class UserService {
  @Inject('IUserRepository')
  private userRepo!: UserRepository; // Non-null assertion needed
}
```

### 2. Use Property Injection for Optional Dependencies

```typescript
@Injectable()
class UserService {
  @Inject('IUserRepository')
  private userRepo!: UserRepository;

  @Inject('IOptionalService')
  private optionalService?: OptionalService; // Optional
}
```

### 3. Register Dependencies Early

```typescript
// In your application bootstrap
import { DI } from '@soapjs/soap';

// Register all dependencies before creating use cases
DI.bind('IUserRepository').toClass(UserRepositoryImpl);
DI.bind('IEmailService').toClass(EmailServiceImpl);
DI.bind('AppConfig').toValue(appConfig);
```

### 4. Use Meaningful Tokens

```typescript
// Good - descriptive tokens
DI.bind('IUserRepository').toClass(UserRepositoryImpl);
DI.bind('IEmailService').toClass(EmailServiceImpl);
DI.bind('IDatabaseConnection').toClass(DatabaseConnection);

// Avoid - generic tokens
DI.bind('repo1').toClass(UserRepositoryImpl);
DI.bind('service').toClass(EmailServiceImpl);
DI.bind('db').toClass(DatabaseConnection);
```

### 5. Use Appropriate Scopes

```typescript
// Good - use singleton for stateless services
DI.bind('IUserService').toClass(UserService, { scope: Scope.SINGLETON });

// Good - use transient for stateful use cases
DI.bind('ICreateUserUseCase').toClass(CreateUserUseCase, { scope: Scope.TRANSIENT });

// Or with decorators
@Injectable({ scope: Scope.SINGLETON })
class UserService {}

@Injectable({ scope: Scope.TRANSIENT })
class CreateUserUseCase {}
```

## Error Handling

The DI system provides clear error messages for common issues:

```typescript
// Error: No provider found for token: 'NonExistentService'
const service = DI.get('NonExistentService');

// Error: Class UserService is not marked as @Injectable
DI.bind('UserService').toClass(UserService); // UserService missing @Injectable decorator
```

## Migration from External DI Libraries

If you're migrating from InversifyJS or similar libraries:

### Before (InversifyJS)
```typescript
import { injectable, inject } from 'inversify';

@injectable()
class UserService {
  constructor(
    @inject('IUserRepository') private userRepo: UserRepository
  ) {}
}
```

### After (SoapJS)
```typescript
import { Injectable, Inject, DI } from '@soapjs/soap';

@Injectable()
class UserService {
  constructor(
    @Inject('IUserRepository') private userRepo: UserRepository
  ) {}
}

// Registration
DI.bind('IUserRepository').toClass(UserRepositoryImpl);
DI.bind('IUserService').toClass(UserService);

// Usage
const userService = DI.get<IUserService>('IUserService');
```

The API is similar but more flexible, supporting both decorator-based and manual registration approaches.

## Performance Considerations

- **Configurable Scopes**: Choose appropriate scopes (singleton, transient, request) for your use case
- **Lazy Loading**: Dependencies are created only when needed
- **Metadata Caching**: Reflection metadata is cached for better performance
- **Minimal Overhead**: The DI system adds minimal runtime overhead
- **Auto-resolution**: Constructor dependencies are automatically resolved by type

## TypeScript Configuration

Ensure your `tsconfig.json` includes the necessary settings:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "types": ["reflect-metadata"]
  }
}
```

And install the required dependency:

```bash
npm install reflect-metadata
```

## Examples

See the complete example for Inversify-style API:

- **Inversify-style API**: `examples/di-inversify-style-example.ts` - Shows the new Inversify-style API with all operations

## Quick Reference

### DI Operations

```typescript
import { DI } from '@soapjs/soap';

// Registration
DI.bind('IUserService').toClass(UserService)           // Bind to class
DI.bind('Config').toValue({ port: 3000 })            // Bind to value
DI.bind('Database').toFactory(() => new Database())  // Bind to factory
DI.bind('Database').toFactory((container, config) => { // Factory with container access
  const logger = container.get('ILogger');
  return new Database(config, logger);
}, { injectContainer: true })
DI.bind(IUserService).toInterface(UserService)       // Bind interface to implementation
DI.bind(AbstractService).toAbstract(ConcreteService)  // Bind abstract to implementation
DI.bind(Symbol('Token')).toClass(MyService)          // Bind with symbol token

// Retrieval
DI.get('token')                                       // Get dependency
DI.has('token')                                       // Check if exists

// Management
DI.clear()                                            // Clear container
DI.getTokens()                                        // List all tokens
DI.getProvider('token')                               // Get provider info

// Access
DI.container                                          // Access container instance
DI.help()                                             // Show help
```