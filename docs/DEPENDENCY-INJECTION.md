# Dependency Injection

SoapJS provides a comprehensive dependency injection system with multiple approaches - from simple decorator-based injection to advanced CLI automation. The system is designed to be flexible, type-safe, and doesn't require external dependencies.

## Features

- **Universal @Inject Decorator**: Single decorator for both constructor and property injection (NestJS-compatible)
- **DI Namespace Tool**: Interactive `DI` namespace with all operations and autocomplete
- **NestJS-style API**: `DI.registerClass(MyService)` - register by class with auto token
- **Multiple Registration Methods**: Decorators, DI namespace, container.bind/get, factory pattern
- **NestJS-style Scopes**: Singleton, Transient, Request scopes
- **CLI Automation**: Context-based dependency registration for CLI tools
- **Type Safety**: Full TypeScript support with metadata reflection and overloads
- **Module System**: Organize dependencies into modules
- **Factory Pattern**: Support for factory-based dependency creation
- **Backward Compatibility**: Legacy API still works alongside new features
- **No External Dependencies**: Built-in implementation, no need for InversifyJS or similar

## Basic Usage

### 1. DI Namespace Tool (Recommended)

The easiest way to use dependency injection is through the `DI` namespace:

```typescript
import { DI, Injectable, Scope } from '@soapjs/soap';

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

// Register services (NestJS-style API)
DI.registerClass(UserRepository);                    // Auto token (class name)
DI.registerClass(EmailService, { scope: Scope.TRANSIENT }); // With options
DI.registerClass(UserService, 'CustomToken');        // With custom token

// Get services
const userRepo = DI.get<UserRepository>('UserRepository');
const emailService = DI.get<EmailService>('EmailService');
const userService = DI.get<UserService>('CustomToken');

// Check if service exists
if (DI.has('UserRepository')) {
  console.log('UserRepository is registered');
}

// List all registered tokens
console.log('Registered services:', DI.getTokens());

// Get help
DI.help(); // Shows all available operations
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
    @Inject('UserRepository') private userRepo: UserRepository,
    @Inject('EmailService') private emailService: EmailService
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
  @Inject('UserRepository')
  private userRepo!: UserRepository;

  @Inject('EmailService')
  private emailService!: EmailService;

  async execute(input: { id: string }): Promise<User> {
    return await this.userRepo.findById(input.id);
  }
}
```

## Registration Methods

### 1. DI Namespace (Recommended)

```typescript
import { DI, Scope } from '@soapjs/soap';

// Register classes (NestJS-style API)
DI.registerClass(UserRepositoryImpl);                    // Auto token
DI.registerClass(EmailServiceImpl, { scope: Scope.TRANSIENT }); // With options
DI.registerClass(UserService, 'CustomUserService');     // With custom token
DI.registerClass(EmailService, Symbol('EmailService')); // With symbol token

// Register values and factories
DI.registerValue('AppConfig', { database: 'mongodb://localhost:27017/myapp' });
DI.registerFactory('DatabaseConnection', (config) => new DatabaseConnection(config), {
  scope: Scope.SINGLETON,
  dependencies: ['AppConfig']
});

// Get dependencies
const userRepo = DI.get<UserRepository>('UserRepository');
const config = DI.get('AppConfig');
const userService = DI.get<UserService>('CustomUserService');

// Management
console.log('Registered tokens:', DI.getTokens());
console.log('UserRepository exists:', DI.has('UserRepository'));
DI.help(); // Show all available operations
```

### 2. Decorator-based Auto-registration

```typescript
import { DI } from '@soapjs/soap';

// Auto-register classes with @Injectable decorator
DI.autoRegister(UserRepositoryImpl);
DI.autoRegister(EmailServiceImpl);
DI.autoRegister(CreateUserUseCase);
```

### 3. Legacy API (Backward Compatible)

```typescript
import { registerClass, registerValue, registerFactory, get } from '@soapjs/soap';

// Register a class (legacy API)
registerClass('UserRepository', UserRepositoryImpl, { scope: Scope.SINGLETON });

// Register a value
registerValue('AppConfig', { database: 'mongodb://localhost:27017/myapp' });

// Register a factory
registerFactory('DatabaseConnection', (config) => new DatabaseConnection(config), {
  scope: Scope.SINGLETON,
  dependencies: ['AppConfig']
});

// Get dependencies
const userRepo = get<UserRepository>('UserRepository');
const config = get('AppConfig');
```

### 4. Direct Container Usage

```typescript
import { DI, Scope } from '@soapjs/soap';

// Access container directly
DI.container.bindClass('UserRepository', UserRepositoryImpl, { scope: Scope.SINGLETON });
DI.container.bindValue('AppConfig', { port: 3000 });
DI.container.bindFactory('DatabaseConnection', (config) => new DatabaseConnection(config));

// Get dependencies
const userRepo = DI.container.get<UserRepository>('UserRepository');
```

## CLI Automation

The DI system provides context-based automation for CLI tools:

### Creating Dependency Contexts

```typescript
import { DI } from '@soapjs/soap';

// Create contexts for different types of dependencies
DI.createServiceContext('UserService', './services/user.service', ['UserRepository']);
DI.createRepositoryContext('OrderRepository', './repositories/order.repository', []);
DI.createUseCaseContext('PlaceOrderUseCase', './usecases/place-order.usecase', ['UserRepository', 'OrderRepository']);
DI.createControllerContext('UserController', './controllers/user.controller', ['UserService']);
DI.createMiddlewareContext('AuthMiddleware', './middleware/auth.middleware', ['AuthService']);
```

### Generating Registration Code

```typescript
import { DI } from '@soapjs/soap';

// Generate registration code for all contexts
const registrationCode = DI.generateRegistrationCode();
console.log(registrationCode);

// Generate module code
const moduleCode = DI.generateModuleCode('AppModule');
console.log(moduleCode);
```

### Module System

```typescript
import { DI, Module } from '@soapjs/soap';

const userModule: Module = {
  providers: [
    { token: 'UserRepository', useClass: UserRepositoryImpl, scope: 'singleton' },
    { token: 'UserService', useClass: UserService, scope: 'singleton' }
  ],
  exports: ['UserService']
};

DI.registerModule('UserModule', userModule);
```

## Advanced Features

### Custom Tokens

You can use custom tokens for dependency registration:

```typescript
@Injectable({ token: 'PrimaryUserRepository' })
class PrimaryUserRepository implements UserRepository {
  // Implementation
}

@Injectable({ token: 'SecondaryUserRepository' })
class SecondaryUserRepository implements UserRepository {
  // Implementation
}

@Injectable()
class UserService {
  constructor(
    @Inject('PrimaryUserRepository') private primaryRepo: UserRepository,
    @Inject('SecondaryUserRepository') private secondaryRepo: UserRepository
  ) {}
}
```

### Factory Functions

Register dependencies using factory functions:

```typescript
import { DI, Scope } from '@soapjs/soap';

DI.registerFactory('DatabaseConnection', (config) => new DatabaseConnection(config), {
  scope: Scope.SINGLETON,
  dependencies: ['AppConfig']
});
```

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
    @Inject('UserRepository') private userRepo: UserRepository
  ) {}
}

// Avoid for required dependencies
@Injectable()
class UserService {
  @Inject('UserRepository')
  private userRepo!: UserRepository; // Non-null assertion needed
}
```

### 2. Use Property Injection for Optional Dependencies

```typescript
@Injectable()
class UserService {
  @Inject('UserRepository')
  private userRepo!: UserRepository;

  @Inject('OptionalService')
  private optionalService?: OptionalService; // Optional
}
```

### 3. Register Dependencies Early

```typescript
// In your application bootstrap
import { DI } from '@soapjs/soap';

// Register all dependencies before creating use cases
DI.registerClass(UserRepositoryImpl);
DI.registerClass(EmailServiceImpl);
DI.registerValue('Config', appConfig);
```

### 4. Use Meaningful Tokens

```typescript
// Good - descriptive tokens
@Inject('UserRepository')
@Inject('EmailService')
@Inject('DatabaseConnection')

// Avoid - generic tokens
@Inject('repo1')
@Inject('service')
@Inject('db')
```

### 5. Use Appropriate Scopes

```typescript
// Good - use singleton for stateless services
DI.registerClass(UserService, { scope: Scope.SINGLETON });

// Good - use transient for stateful use cases
DI.registerClass(CreateUserUseCase, { scope: Scope.TRANSIENT });

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
DI.autoRegister(UserService); // UserService missing @Injectable decorator
```

## Migration from External DI Libraries

If you're migrating from InversifyJS or similar libraries:

### Before (InversifyJS)
```typescript
import { injectable, inject } from 'inversify';

@injectable()
class UserService {
  constructor(
    @inject('UserRepository') private userRepo: UserRepository
  ) {}
}
```

### After (SoapJS)
```typescript
import { Injectable, DI } from '@soapjs/soap';

@Injectable()
class UserService {
  constructor(private userRepo: UserRepository) {}
}

// Register and use (NestJS-style API)
DI.registerClass(UserRepositoryImpl);  // Auto token
DI.registerClass(UserService);         // Auto token
const userService = DI.get<UserService>('UserService');

// Or with custom tokens
DI.registerClass(UserRepositoryImpl, 'UserRepository');
DI.registerClass(UserService, 'UserService');
const userService = DI.get<UserService>('UserService');
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

See the complete examples for different approaches:

- **DI Namespace**: `examples/di-namespace-example.ts` - Shows the new DI namespace tool with all operations
- **Enhanced DI System**: `examples/di-enhanced-example.ts` - Shows all registration methods and CLI automation
- **Basic DI**: `examples/dependency-injection-example.ts` - Simple decorator-based approach

## Quick Reference

### DI Namespace Operations

```typescript
import { DI } from '@soapjs/soap';

// Registration
DI.registerClass(MyService)                    // Auto token
DI.registerClass(MyService, 'CustomToken')     // Custom token
DI.registerClass(MyService, Symbol('Token'))   // Symbol token
DI.registerClass(MyService, { scope: 'transient' }) // With options
DI.registerValue('token', value)               // Register value
DI.registerFactory('token', factory)           // Register factory
DI.autoRegister(MyService)                     // Auto-register with decorators
DI.registerModule('name', module)              // Register module

// Retrieval
DI.get('token')                                // Get dependency
DI.has('token')                                // Check if exists

// Context Creation
DI.createServiceContext(name, path, deps?)     // Create service context
DI.createRepositoryContext(name, path, deps?)  // Create repository context
DI.createUseCaseContext(name, path, deps?)     // Create use case context
DI.createControllerContext(name, path, deps?)  // Create controller context
DI.createMiddlewareContext(name, path, deps?)  // Create middleware context

// Management
DI.registerAllContexts()                       // Register all contexts
DI.generateRegistrationCode()                  // Generate registration code
DI.generateModuleCode('name')                  // Generate module code
DI.clear()                                     // Clear container
DI.getTokens()                                 // List all tokens
DI.getProvider('token')                        // Get provider info
DI.help()                                      // Show help

// Access
DI.container                                   // Access container instance
DI.contextManager                              // Access context manager
```
