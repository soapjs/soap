## Overview of Transactions

Transactions are used to ensure that a sequence of operations on a database is executed atomically. This means either all operations succeed, or none of them are applied, maintaining data consistency and integrity.

In this framework, transactions can be implemented in the following ways:

1. **Custom Transaction Methods in Repositories**
2. **Transaction Class and TransactionRunner**
3. **Declarative Transactions with Decorators**

### Custom Transaction Methods in Repositories

You can implement transaction logic directly within repository methods. This approach is suitable for repository-specific operations that need a high level of control over transaction behavior.

#### Example:
```typescript
class OrderRepository extends Repository<Order> {
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
- Transaction logic is specific to a single repository.
- You need granular control over session lifecycle.
- Operations are relatively simple and do not span multiple repositories.

---

### Transaction Class and TransactionRunner

For operations involving multiple repositories or services, you can use the `Transaction` class in conjunction with `TransactionRunner`. This approach centralizes transaction management and ensures consistency across components.

#### Example:
```typescript
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

const runner = TransactionRunner.getInstance();
const result = await runner.run(new PlaceOrderTransaction(customerRepo, orderRepo));
```

#### When to Use:
- The transaction spans multiple repositories or services.
- You need centralized transaction logic.
- You want to reuse transaction classes across multiple use cases.

---

### 3. Declarative Transactions with Decorators

The framework provides declarative transaction support via the `@Transactional` and `@IsTransaction` decorators. These approaches minimize boilerplate code and simplify transaction management for use cases.

#### `@Transactional` Decorator

#### Example:
```typescript
@Injectable()
class PlaceOrderUseCase {
  @UseSession()
  @Inject('CustomerRepository')
  private customerRepo: CustomerRepository;

  @UseSession()
  @Inject('OrderRepository')
  private orderRepo: OrderRepository;

  @Transactional({ sessionComponents: ['customerRepo', 'orderRepo'], tag: 'default' })
  public async execute(): Promise<Result<void>> {
    const customer = await this.customerRepo.create({ name: "John Doe" });
    if (customer.isFailure()) this.abort("Failed to create customer");

    const order = await this.orderRepo.create({ customerId: customer.content.id });
    if (order.isFailure()) this.abort("Failed to create order");

    return Result.withSuccess();
  }
}
```

#### Features:
- **`sessionComponents`**: Specify the names of components requiring session initialization. Optional.
- **`tag`**: Use a tag to select a specific `TransactionRunner` instance. Optional.

#### `@IsTransaction` Decorator

The `@IsTransaction` decorator is applied at the class level. It automatically wraps the `execute()` method in a transaction. This approach is useful when the entire use case should be treated as a transactional operation.

#### Example:
```typescript
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

#### Features:
- Automatically wraps the `execute()` method in a transaction.
- Supports tagging to select specific `TransactionRunner` instances.

#### When to Use:
- You want the entire use case to be transactional without specifying individual session components.
- A class-level decorator is more appropriate for your design.

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

---

### Best Practices

1. **Use Custom Methods**:
   - For simple, repository-specific operations that require fine-grained control over transaction management.

2. **Use `TransactionRunner`**:
   - For complex scenarios involving multiple repositories or services.
   - When you need reusable transaction logic across different parts of the application.

3. **Use `@Transactional` Decorators**:
   - For straightforward use cases requiring minimal setup.
   - When working in a declarative environment to enhance readability.

4. **Use `@IsTransaction` Decorators**:
   - When you want to declare the entire use case as transactional.
   - To avoid managing individual session components manually.

---

### TODO (Planned features)

#### Savepoints
If your database supports savepoints (e.g., PostgreSQL, MySQL), you can extend the `TransactionRunner` to include savepoint management, allowing rollback of specific parts of a transaction without aborting the entire process.

#### Nested Transactions
While not all databases support nested transactions directly, you can simulate them with savepoints or design patterns. Extend the `Transaction` class to include support for nested operations if necessary.
