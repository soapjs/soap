# Transactions - Database Transaction Management in SoapJS

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Transaction Class](#transaction-class)
4. [TransactionRunner](#transactionrunner)
5. [TransactionScope](#transactionscope)
6. [AutoTransaction](#autotransaction)
7. [Decorators](#decorators)
8. [Implementation Methods](#implementation-methods)
9. [Best Practices](#best-practices)
10. [Complete Example](#complete-example)

## Overview

Transactions in SoapJS ensure that a sequence of database operations is executed atomically. This means either all operations succeed, or none of them are applied, maintaining data consistency and integrity.

The transaction system consists of several core components:

1. **Transaction** - Abstract base class for defining transaction logic
2. **TransactionRunner** - Executes transactions and manages session lifecycle
3. **TransactionScope** - Manages transaction context using AsyncLocalStorage
4. **AutoTransaction** - Internal class used by decorators
5. **Decorators** - Declarative transaction management

## Core Components

### Transaction Class

The `Transaction` class is the abstract base class for all transactions. It manages database sessions and ensures proper cleanup.

#### Key Features

- **Session Management** - Automatically manages database sessions
- **Component Integration** - Works with repositories and services
- **Error Handling** - Provides abort mechanism for transaction failures
- **Resource Cleanup** - Ensures proper disposal of resources

#### Class Structure

```typescript
abstract class Transaction<T = unknown> {
  public readonly id: string;           // Unique transaction ID
  protected sessions: DatabaseSession[]; // Database sessions
  protected components: unknown[];       // Components requiring sessions

  constructor(...args: unknown[]);      // Initialize with components
  public init(): DatabaseSession[];     // Initialize sessions
  public abstract execute(): Promise<Result<T>>; // Execute transaction
  public dispose(): void;               // Clean up resources
  public abort(message?: string): void; // Abort transaction
}
```

### TransactionRunner

The `TransactionRunner` class executes transactions and manages the complete transaction lifecycle.

#### Key Features

- **Singleton Pattern** - Tagged instances for different contexts
- **Session Management** - Automatic commit/rollback handling
- **Error Recovery** - Proper error handling and cleanup
- **Transaction Scope** - Integration with TransactionScope

#### Methods

```typescript
class TransactionRunner {
  // Get singleton instance (tagged)
  static getInstance(tag = "default"): TransactionRunner;
  
  // Execute transaction
  async run<T>(transaction: Transaction<T>): Promise<Result<T>>;
}
```

### TransactionScope

The `TransactionScope` class manages transaction context using AsyncLocalStorage, ensuring proper isolation between concurrent transactions.

#### Key Features

- **Context Isolation** - Each transaction has its own context
- **Async Support** - Works with async/await operations
- **Singleton Pattern** - Single instance manages all contexts

#### Methods

```typescript
class TransactionScope {
  // Get singleton instance
  static getInstance(): TransactionScope;
  
  // Run function in transaction context
  run<T>(transactionId: string, fn: () => T): T;
  
  // Get current transaction ID
  getTransactionId(): string | undefined;
}
```

### AutoTransaction

The `AutoTransaction` class is used internally by decorators to wrap methods in transactions.

#### Key Features

- **Method Wrapping** - Wraps any method in transaction context
- **Session Components** - Supports components requiring sessions
- **Automatic Execution** - Handles transaction lifecycle automatically

#### Constructor

```typescript
class AutoTransaction<T> extends Transaction<T> {
  constructor(
    thisRef: any,                    // Use case instance
    method: (...args: any[]) => Result<T>, // Original method
    args: unknown[],                 // Method arguments
    sessionComponents: any[] = []    // Components requiring sessions
  );
}
```

## Decorators

### UseSession Decorator

The `@UseSession` decorator marks properties that require database sessions. It's used in conjunction with transaction decorators to automatically manage session lifecycle.

#### Usage

```typescript
import { UseSession } from "@soapjs/soap";

class PlaceOrderUseCase {
  @UseSession()
  @Inject('CustomerRepository')
  private customerRepo: CustomerRepository;

  @UseSession()
  @Inject('OrderRepository')
  private orderRepo: OrderRepository;
}
```

#### Features

- **Automatic Session Management** - Sessions are created and managed automatically
- **Metadata Integration** - Works with reflection metadata for dependency injection
- **Transaction Integration** - Seamlessly integrates with transaction decorators

### Transactional Decorator

The `@Transactional` decorator marks a method to be executed within a transaction.

#### Usage

```typescript
import { Transactional } from "@soapjs/soap";

@Injectable()
class PlaceOrderUseCase {
  @UseSession()
  @Inject('CustomerRepository')
  private customerRepo: CustomerRepository;

  @UseSession()
  @Inject('OrderRepository')
  private orderRepo: OrderRepository;

  @Transactional({ 
    sessionComponents: ['customerRepo', 'orderRepo'], 
    tag: 'default' 
  })
  public async execute(): Promise<Result<void>> {
    const customer = await this.customerRepo.create({ name: "John Doe" });
    if (customer.isFailure()) this.abort("Failed to create customer");

    const order = await this.orderRepo.create({ customerId: customer.content.id });
    if (order.isFailure()) this.abort("Failed to create order");

    return Result.withSuccess();
  }
}
```

#### Options

- **`sessionComponents`** - Array of property names requiring session initialization
- **`tag`** - Optional tag for selecting specific TransactionRunner instance

### IsTransaction Decorator

The `@IsTransaction` decorator is applied at the class level and automatically wraps the `execute()` method in a transaction.

#### Usage

```typescript
import { IsTransaction } from "@soapjs/soap";

@IsTransaction({ tag: 'default' })
@Injectable()
class PlaceOrderUseCase {
  @UseSession()
  @Inject('CustomerRepository')
  private customerRepo: CustomerRepository;

  @UseSession()
  @Inject('OrderRepository')
  private orderRepo: OrderRepository;

  public async execute(): Promise<Result<void>> {
    const customer = await this.customerRepo.create({ name: "John Doe" });
    if (customer.isFailure()) this.abort("Failed to create customer");

    const order = await this.orderRepo.create({ customerId: customer.content.id });
    if (order.isFailure()) this.abort("Failed to create order");

    return Result.withSuccess();
  }
}
```

#### Features

- **Automatic Wrapping** - Wraps execute() method in transaction context
- **Tag Support** - Supports tagged TransactionRunner instances
- **Minimal Configuration** - Requires no additional setup

## Implementation Methods

### Custom Transaction Methods in Repositories

You can implement transaction logic directly within repository methods. This approach is suitable for repository-specific operations that need a high level of control over transaction behavior.

#### Example:

```typescript
import { ReadWriteRepository, Result } from "@soapjs/soap";

class OrderRepository extends ReadWriteRepository<Order> {
  async placeOrderWithTransaction(order: Order): Promise<Result<void>> {
    const session = this.context.sessions.createSession();
    try {
      await session.startTransaction();
      await session.query("INSERT INTO orders ...", [order]);
      await session.commitTransaction();
      return Result.withSuccess();
    } catch (error) {
      await session.rollbackTransaction();
      return Result.withFailure(error);
    } finally {
      await session.end();
    }
  }
}
```

#### When to Use:

- Transaction logic is specific to a single repository
- You need granular control over session lifecycle
- Operations are relatively simple and do not span multiple repositories

---

### Transaction Class and TransactionRunner

For operations involving multiple repositories or services, you can use the `Transaction` class in conjunction with `TransactionRunner`. This approach centralizes transaction management and ensures consistency across components.

#### Example:

```typescript
import { Transaction, TransactionRunner, Result } from "@soapjs/soap";

class PlaceOrderTransaction extends Transaction<void> {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly orderRepo: OrderRepository
  ) {
    super(customerRepo, orderRepo);
  }

  public async execute(): Promise<Result<void>> {
    const customer = await this.customerRepo.create({ name: "John Doe" });
    if (customer.isFailure()) this.abort("Failed to create customer");

    const order = await this.orderRepo.create({ customerId: customer.content.id });
    if (order.isFailure()) this.abort("Failed to create order");

    return Result.withSuccess();
  }
}

// Usage with TransactionRunner
const runner = TransactionRunner.getInstance('default');
const result = await runner.run(new PlaceOrderTransaction(customerRepo, orderRepo));
```

#### When to Use:

- The transaction spans multiple repositories or services
- You need centralized transaction logic
- You want to reuse transaction classes across multiple use cases

---

### Declarative Transactions with Decorators

The framework provides declarative transaction support via the `@Transactional` and `@IsTransaction` decorators. These approaches minimize boilerplate code and simplify transaction management for use cases.

#### When to Use Decorators:

- You want minimal boilerplate code
- Working in a declarative environment
- Need to enhance code readability
- Want automatic transaction management

---

### Comparison of Methods

| Feature                      | Custom Methods         | TransactionRunner       | Declarative Decorators |
|------------------------------|------------------------|-------------------------|-------------------------|
| **Ease of Use**              | Moderate               | Moderate                | High                   |
| **Control**                  | High                   | High                    | Moderate               |
| **Boilerplate**              | High                   | Moderate                | Low                    |
| **Reusability**              | Low                    | High                    | Moderate               |
| **Complexity Support**       | Simple use cases       | Complex use cases       | Moderate use cases     |
| **Readability**              | Moderate               | Moderate                | High                   |
| **Session Management**       | Manual                 | Automatic               | Automatic               |
| **Error Handling**           | Manual                 | Automatic               | Automatic               |

---

## Best Practices

### 1. Error Handling

```typescript
// Good - Proper error handling with abort
class PlaceOrderTransaction extends Transaction<void> {
  public async execute(): Promise<Result<void>> {
    const customer = await this.customerRepo.create({ name: "John Doe" });
    if (customer.isFailure()) {
      this.abort("Failed to create customer: " + customer.failure.error.message);
    }

    const order = await this.orderRepo.create({ customerId: customer.content.id });
    if (order.isFailure()) {
      this.abort("Failed to create order: " + order.failure.error.message);
    }

    return Result.withSuccess();
  }
}

// Bad - No error handling
class BadTransaction extends Transaction<void> {
  public async execute(): Promise<Result<void>> {
    const customer = await this.customerRepo.create({ name: "John Doe" });
    const order = await this.orderRepo.create({ customerId: customer.content.id });
    return Result.withSuccess();
  }
}
```

### 2. Resource Management

```typescript
// Good - Proper resource cleanup
class ResourceAwareTransaction extends Transaction<void> {
  private resources: any[] = [];

  public async execute(): Promise<Result<void>> {
    try {
      // Use resources
      this.resources.push(await this.createResource());
      return Result.withSuccess();
    } finally {
      // Clean up resources
      this.cleanup();
    }
  }

  private cleanup() {
    this.resources.forEach(resource => resource.dispose());
    this.resources = [];
  }
}
```

### 3. Transaction Scope Usage

```typescript
// Good - Proper transaction scope usage
const scope = TransactionScope.getInstance();

// Run in transaction context
const result = scope.run(transactionId, () => {
  // Transaction context available here
  return performOperation();
});

// Get current transaction ID
const currentId = scope.getTransactionId();
```

### 4. Tagged TransactionRunners

```typescript
// Good - Use tagged runners for different contexts
const defaultRunner = TransactionRunner.getInstance('default');
const auditRunner = TransactionRunner.getInstance('audit');
const reportingRunner = TransactionRunner.getInstance('reporting');

// Use appropriate runner for context
const result = await auditRunner.run(new AuditTransaction());
```

### 5. Decorator Best Practices

```typescript
// Good - Proper decorator usage
@IsTransaction({ tag: 'default' })
@Injectable()
class PlaceOrderUseCase {
  @UseSession()
  @Inject('CustomerRepository')
  private customerRepo: CustomerRepository;

  @UseSession()
  @Inject('OrderRepository')
  private orderRepo: OrderRepository;

  public async execute(): Promise<Result<void>> {
    // Business logic here
    return Result.withSuccess();
  }
}

// Bad - Missing UseSession decorators
@IsTransaction()
class BadUseCase {
  @Inject('CustomerRepository')
  private customerRepo: CustomerRepository; // Missing @UseSession
}
```

### 6. Method Selection Guidelines

1. **Use Custom Methods**:
   - For simple, repository-specific operations that require fine-grained control over transaction management

2. **Use `TransactionRunner`**:
   - For complex scenarios involving multiple repositories or services
   - When you need reusable transaction logic across different parts of the application

3. **Use `@Transactional` Decorators**:
   - For straightforward use cases requiring minimal setup
   - When working in a declarative environment to enhance readability

4. **Use `@IsTransaction` Decorators**:
   - When you want to declare the entire use case as transactional
   - To avoid managing individual session components manually

---

## Complete Example

Here's a complete example demonstrating all transaction components working together:

### Complete Transaction System

```typescript
import { 
  Transaction, 
  TransactionRunner, 
  TransactionScope,
  Transactional, 
  IsTransaction, 
  UseSession,
  Result 
} from "@soapjs/soap";

// 1. Custom Transaction Class
class PlaceOrderTransaction extends Transaction<void> {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly orderRepo: OrderRepository,
    private readonly inventoryRepo: InventoryRepository
  ) {
    super(customerRepo, orderRepo, inventoryRepo);
  }

  public async execute(): Promise<Result<void>> {
    // Create customer
    const customer = await this.customerRepo.create({ 
      name: "John Doe", 
      email: "john@example.com" 
    });
    if (customer.isFailure()) {
      this.abort("Failed to create customer: " + customer.failure.error.message);
    }

    // Check inventory
    const inventory = await this.inventoryRepo.findByProductId("PROD-001");
    if (inventory.isFailure() || inventory.content.quantity < 1) {
      this.abort("Product out of stock");
    }

    // Create order
    const order = await this.orderRepo.create({ 
      customerId: customer.content.id,
      productId: "PROD-001",
      quantity: 1
    });
    if (order.isFailure()) {
      this.abort("Failed to create order: " + order.failure.error.message);
    }

    // Update inventory
    const updateResult = await this.inventoryRepo.update(inventory.content.id, {
      quantity: inventory.content.quantity - 1
    });
    if (updateResult.isFailure()) {
      this.abort("Failed to update inventory: " + updateResult.failure.error.message);
    }

    return Result.withSuccess();
  }
}

// 2. Use Case with Decorators
@IsTransaction({ tag: 'default' })
@Injectable()
class PlaceOrderUseCase {
  @UseSession()
  @Inject('CustomerRepository')
  private customerRepo: CustomerRepository;

  @UseSession()
  @Inject('OrderRepository')
  private orderRepo: OrderRepository;

  @UseSession()
  @Inject('InventoryRepository')
  private inventoryRepo: InventoryRepository;

  public async execute(orderData: OrderData): Promise<Result<void>> {
    // Create customer
    const customer = await this.customerRepo.create(orderData.customer);
    if (customer.isFailure()) {
      this.abort("Failed to create customer");
    }

    // Check inventory
    const inventory = await this.inventoryRepo.findByProductId(orderData.productId);
    if (inventory.isFailure() || inventory.content.quantity < orderData.quantity) {
      this.abort("Insufficient inventory");
    }

    // Create order
    const order = await this.orderRepo.create({
      customerId: customer.content.id,
      productId: orderData.productId,
      quantity: orderData.quantity
    });
    if (order.isFailure()) {
      this.abort("Failed to create order");
    }

    // Update inventory
    await this.inventoryRepo.update(inventory.content.id, {
      quantity: inventory.content.quantity - orderData.quantity
    });

    return Result.withSuccess();
  }
}

// 3. Method with Transactional Decorator
@Injectable()
class OrderService {
  @UseSession()
  @Inject('CustomerRepository')
  private customerRepo: CustomerRepository;

  @UseSession()
  @Inject('OrderRepository')
  private orderRepo: OrderRepository;

  @Transactional({ 
    sessionComponents: ['customerRepo', 'orderRepo'], 
    tag: 'default' 
  })
  public async createSimpleOrder(customerData: CustomerData): Promise<Result<void>> {
    const customer = await this.customerRepo.create(customerData);
    if (customer.isFailure()) {
      this.abort("Failed to create customer");
    }

    const order = await this.orderRepo.create({
      customerId: customer.content.id,
      productId: "DEFAULT-PRODUCT",
      quantity: 1
    });
    if (order.isFailure()) {
      this.abort("Failed to create order");
    }

    return Result.withSuccess();
  }
}

// 4. Usage Examples
async function main() {
  // Initialize repositories
  const customerRepo = new CustomerRepository(context);
  const orderRepo = new OrderRepository(context);
  const inventoryRepo = new InventoryRepository(context);

  // Get transaction components
  const runner = TransactionRunner.getInstance('default');
  const scope = TransactionScope.getInstance();

  // Method 1: Custom Transaction Class
  const transaction = new PlaceOrderTransaction(customerRepo, orderRepo, inventoryRepo);
  const result1 = await runner.run(transaction);

  // Method 2: Use Case with @IsTransaction
  const useCase = new PlaceOrderUseCase();
  const result2 = await useCase.execute({
    customer: { name: "Jane Doe", email: "jane@example.com" },
    productId: "PROD-001",
    quantity: 2
  });

  // Method 3: Service with @Transactional
  const orderService = new OrderService();
  const result3 = await orderService.createSimpleOrder({
    name: "Bob Smith",
    email: "bob@example.com"
  });

  // Method 4: Direct TransactionScope usage
  const result4 = scope.run("custom-transaction", () => {
    // Custom transaction logic here
    return performCustomOperation();
  });

  console.log("All transactions completed successfully");
}

// 5. Error Handling and Cleanup
process.on('SIGTERM', () => {
  console.log('Shutting down transaction system...');
  // Clean up any pending transactions
  process.exit(0);
});

main().catch(console.error);
```

## Summary

The transaction system in SoapJS provides a comprehensive solution for managing database transactions with multiple implementation approaches. From simple repository methods to complex multi-service transactions, the system offers flexibility while maintaining data consistency and integrity.

Key advantages:
- **Flexibility** - Multiple implementation approaches for different use cases
- **Type Safety** - Full TypeScript support with generic transaction types
- **Automatic Management** - Session lifecycle and error handling managed automatically
- **Declarative Support** - Decorators for minimal boilerplate code
- **Context Isolation** - Proper transaction context management with AsyncLocalStorage
- **Resource Cleanup** - Automatic disposal of resources and sessions

## TODO (Planned features)

#### Savepoints
If your database supports savepoints (e.g., PostgreSQL, MySQL), you can extend the `TransactionRunner` to include savepoint management, allowing rollback of specific parts of a transaction without aborting the entire process.

#### Nested Transactions
While not all databases support nested transactions directly, you can simulate them with savepoints or design patterns. Extend the `Transaction` class to include support for nested operations if necessary.
