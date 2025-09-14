# CQRS (Command Query Responsibility Segregation) - Best Practices Guide

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Commands](#commands)
4. [Queries](#queries)
5. [Events](#events)
6. [Aggregate Roots](#aggregate-roots)
7. [Read Models](#read-models)
8. [Projections](#projections)
9. [Event Store](#event-store)
10. [Sagas](#sagas)
11. [Concurrency Control](#concurrency-control)
12. [Best Practices](#best-practices)
13. [Complete Example](#complete-example)

## Overview

CQRS (Command Query Responsibility Segregation) is an architectural pattern that separates read and write operations for a data store. In SoapJS, CQRS is implemented as a comprehensive toolkit that provides all the necessary components for building scalable, maintainable applications with clear separation of concerns.

### Key Benefits

- **Scalability**: Read and write operations can be scaled independently
- **Performance**: Optimized read models for complex queries
- **Maintainability**: Clear separation between read and write logic
- **Flexibility**: Different data models for reads and writes
- **Event Sourcing**: Full audit trail and temporal queries

## Core Components

The SoapJS CQRS implementation consists of the following core components:

1. **Commands** - Write operations that change system state
2. **Queries** - Read operations that don't change state
3. **Events** - Domain events that represent something that happened
4. **Aggregate Roots** - Entry points for commands and source of events
5. **Read Models** - Optimized data structures for queries
6. **Projections** - Build read models from events
7. **Event Store** - Persistent storage for domain events
8. **Sagas** - Orchestrate distributed transactions
9. **Concurrency Control** - Handle optimistic locking and conflicts

## Commands

### Purpose and Architecture

Commands represent write operations that change the system state. They are immutable, contain all necessary data for the operation, and are processed by command handlers.

### Key Characteristics

- **Immutable**: Once created, commands cannot be modified
- **Self-contained**: Include all data needed for execution
- **Traceable**: Include metadata like command ID, timestamp, and correlation ID
- **Idempotent**: Can be safely retried

### Implementation

```typescript
import { BaseCommand, CommandHandler, Result } from '@soapjs/soap';

// Define the command
export class CreateOrderCommand extends BaseCommand<string> {
  constructor(
    public readonly customerId: string,
    public readonly items: OrderItem[],
    public readonly shippingAddress: Address,
    initiatedBy?: string,
    correlationId?: string
  ) {
    super(initiatedBy, correlationId);
  }
}

// Define the command handler
export class CreateOrderCommandHandler implements CommandHandler<CreateOrderCommand, string> {
  constructor(
    private orderRepository: OrderRepository,
    private eventBus: DomainEventBus
  ) {}

  async handle(command: CreateOrderCommand): Promise<Result<string>> {
    try {
      // Create the order aggregate
      const order = Order.create(
        command.customerId,
        command.items,
        command.shippingAddress
      );

      // Save the aggregate
      const saveResult = await this.orderRepository.add([order]);
      if (saveResult.isFailure()) {
        return saveResult;
      }

      // Publish domain events
      for (const event of order.uncommittedEvents) {
        await this.eventBus.publish(event);
      }

      // Mark events as committed
      order.markEventsAsCommitted();

      return Result.withSuccess(order.id!);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
}
```

### Best Practices

1. **Keep commands simple**: One command should represent one business operation
2. **Include validation data**: Commands should contain all data needed for validation
3. **Use meaningful names**: Command names should clearly describe the intent
4. **Include metadata**: Always include correlation IDs for tracing
5. **Make them immutable**: Use readonly properties and constructor-only initialization

## Queries

### Purpose and Architecture

Queries represent read operations that don't change the system state. They are optimized for retrieving data and can use specialized read models.

### Key Characteristics

- **Read-only**: Queries never modify system state
- **Optimized**: Can use denormalized data structures
- **Fast**: Designed for quick data retrieval
- **Flexible**: Can combine data from multiple sources

### Implementation

```typescript
import { BaseQuery, QueryHandler, Result } from '@soapjs/soap';

// Define the query
export class GetOrdersByCustomerQuery extends BaseQuery<OrderSummary[]> {
  constructor(
    public readonly customerId: string,
    public readonly status?: OrderStatus,
    public readonly limit?: number,
    public readonly offset?: number,
    initiatedBy?: string,
    correlationId?: string
  ) {
    super(initiatedBy, correlationId);
  }
}

// Define the query handler
export class GetOrdersByCustomerQueryHandler 
  implements QueryHandler<GetOrdersByCustomerQuery, OrderSummary[]> {
  
  constructor(
    private orderRepository: ReadRepository<OrderReadModel>
  ) {}

  async handle(query: GetOrdersByCustomerQuery): Promise<Result<OrderSummary[]>> {
    try {
      const criteria = {
        customerId: query.customerId,
        ...(query.status && { status: query.status })
      };

      const result = await this.orderRepository.find(criteria);
      if (result.isFailure()) {
        return result;
      }

      let orders = result.content;
      
      // Apply pagination
      if (query.offset) {
        orders = orders.slice(query.offset);
      }
      if (query.limit) {
        orders = orders.slice(0, query.limit);
      }

      // Map to DTOs
      const summaries = orders.map(order => ({
        id: order.id,
        customerId: order.data.customerId,
        total: order.data.total,
        status: order.data.status,
        createdAt: order.data.createdAt
      }));

      return Result.withSuccess(summaries);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
}
```

### Best Practices

1. **Use read models**: Queries should use optimized read models, not domain aggregates
2. **Keep queries focused**: One query should retrieve one specific dataset
3. **Include pagination**: For large datasets, always include pagination parameters
4. **Use DTOs**: Return data transfer objects, not domain objects
5. **Optimize for performance**: Use indexes and denormalized data structures

## Events

### Purpose and Architecture

Domain events represent something that happened in the domain. They are the foundation of event sourcing and enable loose coupling between components.

### Key Characteristics

- **Immutable**: Events represent facts that cannot be changed
- **Self-describing**: Include all necessary data about what happened
- **Temporal**: Include timestamps and version information
- **Correlated**: Include correlation IDs for tracking related operations

### Implementation

```typescript
import { BaseDomainEvent, EventHandler, Result } from '@soapjs/soap';

// Define domain events
export class OrderCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly total: number,
    public readonly items: OrderItem[],
    aggregateId?: string,
    version?: number,
    initiatedBy?: string,
    correlationId?: string
  ) {
    super('OrderCreated', aggregateId, version, initiatedBy, correlationId);
  }
}

export class OrderStatusChangedEvent extends BaseDomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly oldStatus: OrderStatus,
    public readonly newStatus: OrderStatus,
    public readonly reason?: string,
    aggregateId?: string,
    version?: number,
    initiatedBy?: string,
    correlationId?: string
  ) {
    super('OrderStatusChanged', aggregateId, version, initiatedBy, correlationId);
  }
}

// Define event handlers
export class OrderCreatedEventHandler implements EventHandler<OrderCreatedEvent> {
  constructor(
    private orderRepository: ReadWriteRepository<OrderReadModel>,
    private emailService: EmailService
  ) {}

  async handle(event: OrderCreatedEvent): Promise<Result<void>> {
    try {
      // Update read model
      const readModel = new OrderReadModel(event.orderId, {
        orderId: event.orderId,
        customerId: event.customerId,
        total: event.total,
        items: event.items,
        status: 'pending',
        createdAt: event.occurredOn
      });

      await this.orderRepository.add([readModel]);

      // Send confirmation email
      await this.emailService.sendOrderConfirmation(event.customerId, event.orderId);

      return Result.withSuccess();
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
}
```

### Best Practices

1. **Use past tense**: Event names should describe what happened (e.g., "OrderCreated")
2. **Include all necessary data**: Events should contain all data needed by handlers
3. **Keep events focused**: One event should represent one domain occurrence
4. **Use correlation IDs**: Include correlation IDs for tracking related operations
5. **Version events**: Include version information for schema evolution

## Aggregate Roots

### Purpose and Architecture

Aggregate roots are the entry points for commands and the source of domain events. They encapsulate business logic and ensure consistency boundaries.

### Key Characteristics

- **Consistency boundary**: Ensures data consistency within the aggregate
- **Event source**: Generates domain events for state changes
- **Command target**: Receives and processes commands
- **Versioned**: Maintains version for optimistic locking

### Implementation

```typescript
import { BaseAggregateRoot, DomainEvent } from '@soapjs/soap';

export class Order extends BaseAggregateRoot<OrderData> {
  private _customerId: string;
  private _items: OrderItem[];
  private _status: OrderStatus;
  private _total: number;
  private _shippingAddress: Address;

  constructor(
    customerId: string,
    items: OrderItem[],
    shippingAddress: Address,
    id?: string
  ) {
    super(id);
    this._customerId = customerId;
    this._items = items;
    this._status = 'pending';
    this._total = this.calculateTotal(items);
    this._shippingAddress = shippingAddress;
  }

  // Factory method
  static create(
    customerId: string,
    items: OrderItem[],
    shippingAddress: Address
  ): Order {
    const order = new Order(customerId, items, shippingAddress);
    
    // Add domain event
    order.addDomainEvent(new OrderCreatedEvent(
      order.id!,
      customerId,
      order._total,
      items,
      order.id,
      order.version,
      undefined,
      undefined
    ));

    return order;
  }

  // Business methods
  changeStatus(newStatus: OrderStatus, reason?: string): void {
    const oldStatus = this._status;
    this._status = newStatus;

    this.addDomainEvent(new OrderStatusChangedEvent(
      this.id!,
      oldStatus,
      newStatus,
      reason,
      this.id,
      this.version,
      undefined,
      undefined
    ));
  }

  addItem(item: OrderItem): void {
    this._items.push(item);
    this._total = this.calculateTotal(this._items);

    this.addDomainEvent(new OrderItemAddedEvent(
      this.id!,
      item,
      this._total,
      this.id,
      this.version,
      undefined,
      undefined
    ));
  }

  // Private methods
  private calculateTotal(items: OrderItem[]): number {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  // Getters
  get customerId(): string { return this._customerId; }
  get items(): OrderItem[] { return [...this._items]; }
  get status(): OrderStatus { return this._status; }
  get total(): number { return this._total; }
  get shippingAddress(): Address { return { ...this._shippingAddress }; }
}
```

### Best Practices

1. **Keep aggregates small**: Large aggregates lead to performance issues and conflicts
2. **Enforce invariants**: Use business methods to ensure data consistency
3. **Generate events**: Always generate events for state changes
4. **Use factory methods**: Provide clear ways to create aggregates
5. **Protect internal state**: Use private fields and public getters

## Read Models

### Purpose and Architecture

Read models are optimized data structures designed for efficient querying. They are denormalized and can combine data from multiple aggregates.

### Key Characteristics

- **Denormalized**: Optimized for query performance
- **Projection-based**: Built from domain events
- **Query-optimized**: Designed for specific query patterns
- **Eventually consistent**: May lag behind write operations

### Implementation

```typescript
import { BaseReadModel } from '@soapjs/soap';

export class OrderReadModel extends BaseReadModel<OrderData> {
  constructor(
    id: string,
    data: OrderData,
    version: number = 0
  ) {
    super(id, data, version);
  }

  // Business methods for querying
  isActive(): boolean {
    return ['pending', 'processing', 'shipped'].includes(this.data.status);
  }

  isOverdue(): boolean {
    if (this.data.status !== 'pending') return false;
    const daysSinceCreation = (Date.now() - this.data.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation > 7;
  }

  getTotalWithTax(): number {
    return this.data.total * 1.2; // 20% tax
  }
}

// Data structure for the read model
export interface OrderData {
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  shippingAddress: Address;
  paymentStatus: PaymentStatus;
}
```

### Best Practices

1. **Denormalize data**: Include all data needed for queries to avoid joins
2. **Optimize for queries**: Structure data based on how it will be queried
3. **Include computed fields**: Pre-calculate values that are frequently used
4. **Use meaningful names**: Make the purpose of each read model clear
5. **Keep them focused**: One read model should serve one specific query pattern

## Projections

### Purpose and Architecture

Projections build read models from domain events. They handle the transformation from event-sourced data to query-optimized structures.

### Key Characteristics

- **Event-driven**: React to domain events
- **Idempotent**: Can be safely replayed
- **Incremental**: Update read models incrementally
- **Fault-tolerant**: Handle failures gracefully

### Implementation

```typescript
import { BaseProjection, ReadModel, DomainEvent, Result } from '@soapjs/soap';

export class OrderProjection extends BaseProjection<OrderReadModel> {
  constructor(
    private orderRepository: ReadWriteRepository<OrderReadModel>,
    private customerRepository: ReadRepository<CustomerReadModel>
  ) {
    super();
  }

  getReadModelType(): new (...args: any[]) => OrderReadModel {
    return OrderReadModel;
  }

  getEventTypes(): string[] {
    return ['OrderCreated', 'OrderStatusChanged', 'OrderItemAdded', 'CustomerUpdated'];
  }

  async project(event: DomainEvent, readModel?: OrderReadModel): Promise<Result<OrderReadModel>> {
    try {
      switch (event.eventType) {
        case 'OrderCreated':
          return this.handleOrderCreated(event as OrderCreatedEvent);
        case 'OrderStatusChanged':
          return this.handleOrderStatusChanged(event as OrderStatusChangedEvent, readModel);
        case 'OrderItemAdded':
          return this.handleOrderItemAdded(event as OrderItemAddedEvent, readModel);
        case 'CustomerUpdated':
          return this.handleCustomerUpdated(event as CustomerUpdatedEvent, readModel);
        default:
          return Result.withFailure(new Error(`Unknown event type: ${event.eventType}`));
      }
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<Result<OrderReadModel>> {
    // Get customer data
    const customerResult = await this.customerRepository.find({ 
      where: { id: event.customerId } 
    });
    if (customerResult.isFailure()) {
      return customerResult;
    }

    const customers = customerResult.content;
    if (!customers || customers.length === 0) {
      return Result.withFailure(new Error(`Customer not found: ${event.customerId}`));
    }
    
    const customer = customers[0];

    // Create read model
    const readModel = new OrderReadModel(event.orderId, {
      orderId: event.orderId,
      customerId: event.customerId,
      customerName: customer.data.name,
      customerEmail: customer.data.email,
      items: event.items,
      total: event.total,
      status: 'pending',
      createdAt: event.occurredOn,
      updatedAt: event.occurredOn,
      shippingAddress: {} as Address, // Will be updated by other events
      paymentStatus: 'pending'
    });

    return Result.withSuccess(readModel);
  }

  private async handleOrderStatusChanged(
    event: OrderStatusChangedEvent, 
    readModel?: OrderReadModel
  ): Promise<Result<OrderReadModel>> {
    if (!readModel) {
      const result = await this.orderRepository.find({ 
        where: { id: event.orderId } 
      });
      if (result.isFailure()) return result;
      const models = result.content;
      if (!models || models.length === 0) {
        return Result.withFailure(new Error(`Order not found: ${event.orderId}`));
      }
      readModel = models[0];
    }

    readModel.update({
      status: event.newStatus,
      updatedAt: event.occurredOn
    });

    readModel.incrementVersion();

    return Result.withSuccess(readModel);
  }

  // Additional handlers...
}
```

### Best Practices

1. **Handle all event types**: Ensure all relevant events are handled
2. **Be idempotent**: Projections should be safe to replay
3. **Handle missing data**: Gracefully handle cases where related data is missing
4. **Update incrementally**: Only update the parts of the read model that changed
5. **Use transactions**: Ensure consistency when updating multiple read models

## Event Store

### Purpose and Architecture

The event store is the persistent storage for domain events. It enables event sourcing and provides a complete audit trail.

### Key Characteristics

- **Append-only**: Events are never modified or deleted
- **Versioned**: Maintains version information for optimistic locking
- **Queryable**: Supports various query patterns
- **Scalable**: Designed for high-volume event storage

### Implementation

```typescript
import { EventStore, DomainEvent, Result } from '@soapjs/soap';

export class MongoEventStore implements EventStore {
  constructor(private collection: Collection) {}

  async appendEvents(
    aggregateId: string,
    expectedVersion: number,
    events: DomainEvent[]
  ): Promise<Result<void>> {
    try {
      // Check for version conflicts
      const currentVersion = await this.getCurrentVersion(aggregateId);
      if (currentVersion !== expectedVersion) {
        return Result.withFailure(new VersionConflictError(
          aggregateId,
          expectedVersion,
          currentVersion
        ));
      }

      // Prepare event store entries
      const entries = events.map((event, index) => ({
        id: `${aggregateId}_${expectedVersion + index + 1}`,
        aggregateId,
        aggregateVersion: expectedVersion + index + 1,
        event,
        storedAt: new Date(),
        streamName: `order_${aggregateId}`
      }));

      // Insert events
      await this.collection.insertMany(entries);

      return Result.withSuccess();
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }

  async getEvents(aggregateId: string): Promise<Result<DomainEvent[]>> {
    try {
      const entries = await this.collection
        .find({ aggregateId })
        .sort({ aggregateVersion: 1 })
        .toArray();

      const events = entries.map(entry => entry.event);
      return Result.withSuccess(events);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }

  async getEventsFromVersion(
    aggregateId: string,
    fromVersion: number
  ): Promise<Result<DomainEvent[]>> {
    try {
      const entries = await this.collection
        .find({ 
          aggregateId, 
          aggregateVersion: { $gte: fromVersion } 
        })
        .sort({ aggregateVersion: 1 })
        .toArray();

      const events = entries.map(entry => entry.event);
      return Result.withSuccess(events);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }

  // Additional methods...
}
```

### Best Practices

1. **Use optimistic locking**: Check versions before appending events
2. **Batch operations**: Group related events in single transactions
3. **Index properly**: Create indexes for common query patterns
4. **Handle failures**: Implement retry logic for transient failures
5. **Monitor performance**: Track event store performance metrics

## Sagas

### Purpose and Architecture

Sagas orchestrate distributed transactions across multiple aggregates or services. They ensure consistency in complex business processes.

### Key Characteristics

- **Distributed**: Coordinate operations across multiple services
- **Compensating**: Include compensation logic for rollbacks
- **Stateful**: Maintain state throughout the process
- **Resilient**: Handle failures and retries

### Implementation

```typescript
import { BaseSaga, SagaStep, Command, Result } from '@soapjs/soap';

export class CreateOrderSaga extends BaseSaga {
  constructor(
    private orderId: string,
    private customerId: string,
    private items: OrderItem[]
  ) {
    const steps: SagaStep[] = [
      {
        stepId: 'create-order',
        name: 'Create Order',
        command: new CreateOrderCommand(orderId, customerId, items),
        compensation: new CancelOrderCommand(orderId)
      },
      {
        stepId: 'reserve-inventory',
        name: 'Reserve Inventory',
        command: new ReserveInventoryCommand(items),
        compensation: new ReleaseInventoryCommand(items)
      },
      {
        stepId: 'process-payment',
        name: 'Process Payment',
        command: new ProcessPaymentCommand(orderId, customerId),
        compensation: new RefundPaymentCommand(orderId)
      },
      {
        stepId: 'confirm-order',
        name: 'Confirm Order',
        command: new ConfirmOrderCommand(orderId)
      }
    ];

    super('CreateOrderSaga', steps);
  }

  async executeNextStep(): Promise<Result<void>> {
    try {
      if (this.currentStepIndex >= this.steps.length) {
        return this.complete();
      }

      const step = this.steps[this.currentStepIndex];
      
      // Execute the command
      const result = await this.commandBus.dispatch(step.command);
      
      if (result.isFailure()) {
        // If this step fails, compensate all previous steps
        return this.compensate();
      }

      this._currentStepIndex++;
      
      // Check if we've completed all steps
      if (this._currentStepIndex >= this.steps.length) {
        return this.complete();
      }
      
      return Result.withSuccess();
    } catch (error) {
      return this.fail(error as Error);
    }
  }

  async compensate(): Promise<Result<void>> {
    try {
      // Execute compensation commands in reverse order
      for (let i = this.currentStepIndex - 1; i >= 0; i--) {
        const step = this.steps[i];
        if (step.compensation) {
          await this.commandBus.dispatch(step.compensation);
        }
      }
      
      this._status = SagaStatus.COMPENSATED;
      return Result.withSuccess();
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
}
```

### Best Practices

1. **Keep sagas simple**: Each saga should handle one business process
2. **Include compensation**: Always provide compensation logic for rollbacks
3. **Handle failures**: Implement proper error handling and retry logic
4. **Use timeouts**: Set appropriate timeouts for each step
5. **Monitor progress**: Track saga execution and performance

## Concurrency Control

### Purpose and Architecture

Concurrency control handles optimistic locking and version conflicts in distributed systems. It ensures data consistency when multiple operations modify the same data.

### Key Characteristics

- **Optimistic locking**: Use version numbers to detect conflicts
- **Conflict resolution**: Provide strategies for handling conflicts
- **Performance**: Minimize locking overhead
- **Reliable**: Handle edge cases and failures

### Implementation

```typescript
import { BaseConcurrencyControl, Result, VersionConflictError } from '@soapjs/soap';

export class MongoConcurrencyControl extends BaseConcurrencyControl {
  constructor(private collection: Collection) {
    super();
  }

  async getCurrentVersion(aggregateId: string): Promise<Result<number>> {
    try {
      const result = await this.collection
        .findOne(
          { aggregateId },
          { projection: { version: 1 } }
        );

      return Result.withSuccess(result?.version || 0);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }

  async incrementVersion(aggregateId: string): Promise<Result<number>> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { aggregateId },
        { $inc: { version: 1 } },
        { 
          returnDocument: 'after',
          upsert: true 
        }
      );

      return Result.withSuccess(result.value?.version || 1);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }

  async resolveVersionConflict(
    aggregateId: string,
    expectedVersion: number,
    currentVersion: number
  ): Promise<Result<number>> {
    try {
      // Strategy: retry with current version
      // In a real implementation, you might want more sophisticated conflict resolution
      return Result.withSuccess(currentVersion);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
}
```

### Best Practices

1. **Use optimistic locking**: Prefer optimistic over pessimistic locking
2. **Handle conflicts gracefully**: Implement appropriate conflict resolution strategies
3. **Retry operations**: Implement retry logic for transient conflicts
4. **Monitor conflicts**: Track conflict rates and patterns
5. **Use appropriate timeouts**: Set reasonable timeouts for operations

## Best Practices

### General CQRS Guidelines

1. **Start Simple**: Begin with a simple CQRS implementation and evolve
2. **Separate Concerns**: Keep read and write models completely separate
3. **Event Sourcing**: Use event sourcing for write models when appropriate
4. **Read Model Optimization**: Optimize read models for specific query patterns
5. **Consistency**: Accept eventual consistency for read models

### Performance Considerations

1. **Caching**: Implement caching for frequently accessed read models
2. **Indexing**: Create appropriate indexes for query patterns
3. **Pagination**: Always implement pagination for large datasets
4. **Async Processing**: Use async processing for projections and event handlers
5. **Monitoring**: Monitor performance metrics and optimize bottlenecks

### Error Handling

1. **Graceful Degradation**: Handle failures gracefully
2. **Retry Logic**: Implement retry logic for transient failures
3. **Dead Letter Queues**: Use dead letter queues for failed events
4. **Monitoring**: Monitor error rates and patterns
5. **Alerting**: Set up alerts for critical failures

### Testing

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions
3. **Event Sourcing Tests**: Test event replay and projection rebuilding
4. **Saga Tests**: Test saga execution and compensation
5. **Performance Tests**: Test system performance under load

## Complete Example

Here's a complete example of an e-commerce order system using CQRS:

```typescript
// 1. Domain Events
export class OrderCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly items: OrderItem[],
    public readonly total: number,
    aggregateId?: string,
    version?: number,
    initiatedBy?: string,
    correlationId?: string
  ) {
    super('OrderCreated', aggregateId, version, initiatedBy, correlationId);
  }
}

// 2. Commands
export class CreateOrderCommand extends BaseCommand<string> {
  constructor(
    public readonly customerId: string,
    public readonly items: OrderItem[],
    public readonly shippingAddress: Address,
    initiatedBy?: string,
    correlationId?: string
  ) {
    super(initiatedBy, correlationId);
  }
}

// 3. Command Handler
export class CreateOrderCommandHandler implements CommandHandler<CreateOrderCommand, string> {
  constructor(
    private orderRepository: OrderRepository,
    private eventStore: EventStore,
    private eventBus: DomainEventBus
  ) {}

  async handle(command: CreateOrderCommand): Promise<Result<string>> {
    try {
      // Create aggregate
      const order = Order.create(
        command.customerId,
        command.items,
        command.shippingAddress
      );

      // Save to event store
      await this.eventStore.appendEvents(
        order.id!,
        0,
        order.uncommittedEvents
      );

      // Publish events
      for (const event of order.uncommittedEvents) {
        await this.eventBus.publish(event);
      }

      order.markEventsAsCommitted();

      return Result.withSuccess(order.id!);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
}

// 4. Queries
export class GetOrdersByCustomerQuery extends BaseQuery<OrderSummary[]> {
  constructor(
    public readonly customerId: string,
    public readonly status?: OrderStatus,
    initiatedBy?: string,
    correlationId?: string
  ) {
    super(initiatedBy, correlationId);
  }
}

// 5. Query Handler
export class GetOrdersByCustomerQueryHandler 
  implements QueryHandler<GetOrdersByCustomerQuery, OrderSummary[]> {
  
  constructor(
    private orderRepository: ReadRepository<OrderReadModel>
  ) {}

  async handle(query: GetOrdersByCustomerQuery): Promise<Result<OrderSummary[]>> {
    try {
      const criteria = {
        customerId: query.customerId,
        ...(query.status && { status: query.status })
      };

      const result = await this.orderRepository.find(criteria);
      if (result.isFailure()) {
        return result;
      }

      const summaries = result.content.map(order => ({
        id: order.id,
        customerId: order.data.customerId,
        total: order.data.total,
        status: order.data.status,
        createdAt: order.data.createdAt
      }));

      return Result.withSuccess(summaries);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
}

// 6. Projection
export class OrderProjection extends BaseProjection<OrderReadModel> {
  constructor(
    private orderRepository: ReadWriteRepository<OrderReadModel>
  ) {
    super();
  }

  getReadModelType(): new (...args: any[]) => OrderReadModel {
    return OrderReadModel;
  }

  getEventTypes(): string[] {
    return ['OrderCreated', 'OrderStatusChanged'];
  }

  async project(event: DomainEvent, readModel?: OrderReadModel): Promise<Result<OrderReadModel>> {
    try {
      switch (event.eventType) {
        case 'OrderCreated':
          return this.handleOrderCreated(event as OrderCreatedEvent);
        case 'OrderStatusChanged':
          return this.handleOrderStatusChanged(event as OrderStatusChangedEvent, readModel);
        default:
          return Result.withFailure(new Error(`Unknown event type: ${event.eventType}`));
      }
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<Result<OrderReadModel>> {
    const readModel = new OrderReadModel(event.orderId, {
      orderId: event.orderId,
      customerId: event.customerId,
      items: event.items,
      total: event.total,
      status: 'pending',
      createdAt: event.occurredOn,
      updatedAt: event.occurredOn
    });

    return Result.withSuccess(readModel);
  }

  private async handleOrderStatusChanged(
    event: OrderStatusChangedEvent, 
    readModel?: OrderReadModel
  ): Promise<Result<OrderReadModel>> {
    if (!readModel) {
      const result = await this.orderRepository.find({ 
        where: { id: event.orderId } 
      });
      if (result.isFailure()) return result;
      const models = result.content;
      if (!models || models.length === 0) {
        return Result.withFailure(new Error(`Order not found: ${event.orderId}`));
      }
      readModel = models[0];
    }

    readModel.update({
      status: event.newStatus,
      updatedAt: event.occurredOn
    });

    readModel.incrementVersion();

    return Result.withSuccess(readModel);
  }
}

// 7. Usage Example
export class OrderService {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus
  ) {}

  async createOrder(
    customerId: string,
    items: OrderItem[],
    shippingAddress: Address,
    userId: string
  ): Promise<Result<string>> {
    const command = new CreateOrderCommand(
      customerId,
      items,
      shippingAddress,
      userId,
      `order_${Date.now()}`
    );

    return this.commandBus.dispatch(command);
  }

  async getCustomerOrders(
    customerId: string,
    status?: OrderStatus,
    userId: string
  ): Promise<Result<OrderSummary[]>> {
    const query = new GetOrdersByCustomerQuery(
      customerId,
      status,
      userId,
      `query_${Date.now()}`
    );

    return this.queryBus.dispatch(query);
  }
}
```

This comprehensive CQRS implementation provides a solid foundation for building scalable, maintainable applications with clear separation of concerns and excellent performance characteristics.

## Using Repository Pattern in CQRS

### Overview

SoapJS provides seamless integration between the repository pattern and CQRS (Command Query Responsibility Segregation). You can use `ReadRepository` and `ReadWriteRepository` directly in CQRS implementations without any additional interfaces or adapters.

### Repository Types in CQRS

#### 1. ReadRepository for Query Side

Use `ReadRepository` for query operations in CQRS. This is perfect for:
- Query handlers
- Read models
- Dashboard queries
- Reports and analytics

#### 2. ReadWriteRepository for Command Side

Use `ReadWriteRepository` for command operations in CQRS. This is ideal for:
- Command handlers
- Aggregate repositories
- Event sourcing
- Projections

### Direct Usage Examples

#### Query Handler with ReadRepository

```typescript
import { ReadRepository } from '@soapjs/soap';
import { QueryHandler, BaseQuery, Result } from '@soapjs/soap';

// Query
export class GetOrdersByCustomerQuery extends BaseQuery<OrderSummary[]> {
  constructor(
    public readonly customerId: string,
    public readonly status?: OrderStatus
  ) {
    super();
  }
}

// Query Handler using ReadRepository
export class GetOrdersByCustomerQueryHandler 
  implements QueryHandler<GetOrdersByCustomerQuery, OrderSummary[]> {
  
  constructor(
    private orderRepository: ReadRepository<OrderReadModel>
  ) {}

  async handle(query: GetOrdersByCustomerQuery): Promise<Result<OrderSummary[]>> {
    try {
      const criteria = {
        customerId: query.customerId,
        ...(query.status && { status: query.status })
      };

      const result = await this.orderRepository.find(criteria);
      if (result.isFailure()) {
        return result;
      }

      const summaries = result.content.map(order => ({
        id: order.id,
        customerId: order.data.customerId,
        total: order.data.total,
        status: order.data.status,
        createdAt: order.data.createdAt
      }));

      return Result.withSuccess(summaries);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
}
```

#### Command Handler with ReadWriteRepository

```typescript
import { ReadWriteRepository } from '@soapjs/soap';
import { CommandHandler, BaseCommand, Result } from '@soapjs/soap';

// Command
export class CreateOrderCommand extends BaseCommand<string> {
  constructor(
    public readonly customerId: string,
    public readonly items: OrderItem[],
    public readonly shippingAddress: Address
  ) {
    super();
  }
}

// Command Handler using ReadWriteRepository
export class CreateOrderCommandHandler 
  implements CommandHandler<CreateOrderCommand, string> {
  
  constructor(
    private orderRepository: ReadWriteRepository<Order>,
    private eventBus: DomainEventBus
  ) {}

  async handle(command: CreateOrderCommand): Promise<Result<string>> {
    try {
      // Create the order aggregate
      const order = Order.create(
        command.customerId,
        command.items,
        command.shippingAddress
      );

      // Save the aggregate using ReadWriteRepository
      const saveResult = await this.orderRepository.add([order]);
      if (saveResult.isFailure()) {
        return saveResult;
      }

      // Publish domain events
      for (const event of order.uncommittedEvents) {
        await this.eventBus.publish(event);
      }

      // Mark events as committed
      order.markEventsAsCommitted();

      return Result.withSuccess(order.id!);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
}
```

#### Projection with ReadWriteRepository

```typescript
import { ReadWriteRepository } from '@soapjs/soap';
import { BaseProjection, ReadModel, DomainEvent, Result } from '@soapjs/soap';

export class OrderProjection extends BaseProjection<OrderReadModel> {
  constructor(
    private orderRepository: ReadWriteRepository<OrderReadModel>
  ) {
    super();
  }

  getReadModelType(): new (...args: any[]) => OrderReadModel {
    return OrderReadModel;
  }

  getEventTypes(): string[] {
    return ['OrderCreated', 'OrderStatusChanged'];
  }

  async project(event: DomainEvent, readModel?: OrderReadModel): Promise<Result<OrderReadModel>> {
    try {
      switch (event.eventType) {
        case 'OrderCreated':
          return this.handleOrderCreated(event as OrderCreatedEvent);
        case 'OrderStatusChanged':
          return this.handleOrderStatusChanged(event as OrderStatusChangedEvent, readModel);
        default:
          return Result.withFailure(new Error(`Unknown event type: ${event.eventType}`));
      }
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<Result<OrderReadModel>> {
    const readModel = new OrderReadModel(event.orderId, {
      orderId: event.orderId,
      customerId: event.customerId,
      items: event.items,
      total: event.total,
      status: 'pending',
      createdAt: event.occurredOn,
      updatedAt: event.occurredOn
    });

    // Save using ReadWriteRepository
    const result = await this.orderRepository.add([readModel]);
    if (result.isSuccess()) {
      return Result.withSuccess(result.content[0]);
    }
    return result;
  }

  private async handleOrderStatusChanged(
    event: OrderStatusChangedEvent, 
    readModel?: OrderReadModel
  ): Promise<Result<OrderReadModel>> {
    if (!readModel) {
      const result = await this.orderRepository.find({ 
        where: { id: event.orderId } 
      });
      if (result.isFailure()) return result;
      readModel = result.content[0];
    }

    readModel.update({
      status: event.newStatus,
      updatedAt: event.occurredOn
    });

    readModel.incrementVersion();

    // Update using ReadWriteRepository
    const updateResult = await this.orderRepository.update({
      where: { id: event.orderId },
      updates: [readModel]
    });

    if (updateResult.isSuccess()) {
      return Result.withSuccess(readModel);
    }
    return updateResult;
  }
}
```

### Benefits of Direct Repository Usage

#### 1. **Simplified Architecture**
- No need for additional interfaces or adapters
- Direct use of existing repository pattern
- Consistent API across the application
- Less code to maintain

#### 2. **Better Performance**
- Read repositories can be optimized for queries
- Write repositories can be optimized for transactions
- No adapter overhead
- Direct method calls

#### 3. **Type Safety**
- Full TypeScript support
- Compile-time error checking
- Better IDE support
- No type conversion needed

#### 4. **Flexibility**
- Use any repository method directly
- Custom query builders
- Advanced aggregation operations
- Full access to repository capabilities

### Best Practices

#### 1. **Choose the Right Repository Type**

```typescript
// For queries (read-only)
const queryRepository = new ReadRepository<OrderReadModel>(context);

// For commands (read-write)
const commandRepository = new ReadWriteRepository<Order>(context);
```

#### 2. **Use Appropriate Contexts**

```typescript
// For database operations
const dbContext = new DatabaseContext(source, mapper, sessions);

// For HTTP API operations
const httpContext = new HttpContext(client, mapper);

// For WebSocket operations
const wsContext = new SocketContext(socket, mapper);
```

#### 3. **Handle Errors Properly**

```typescript
const result = await repository.find({ status: 'active' });

if (result.isSuccess()) {
  const entities = result.content;
  // Process entities
} else {
  const error = result.failure;
  // Handle error
}
```

#### 4. **Use Query Builders for Complex Queries**

```typescript
const query = new RepositoryQuery()
  .where('status', 'active')
  .where('createdAt', '>=', new Date('2024-01-01'))
  .orderBy('createdAt', 'desc')
  .limit(10);

const result = await repository.find(query);
```

### Conclusion

Using `ReadRepository` and `ReadWriteRepository` directly in CQRS provides:

- **Simplified architecture** - No additional interfaces or adapters needed
- **Better performance** - Optimized for specific use cases, no overhead
- **Type safety** - Full TypeScript support, no type conversion
- **Consistency** - Same API across the application
- **Flexibility** - Access to all repository methods
- **Less code** - Fewer abstractions to maintain

This approach eliminates the need for additional abstractions while maintaining the benefits of CQRS and the repository pattern. The direct use of repositories makes the codebase simpler and more maintainable. 