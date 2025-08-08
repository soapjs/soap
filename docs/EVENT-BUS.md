# Event Bus - Event-Driven Architecture in SoapJS

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [EventBus Interface](#eventbus-interface)
4. [EventProcessor](#eventprocessor)
5. [Processing Strategies](#processing-strategies)
6. [Retry Policies](#retry-policies)
7. [Error Handling](#error-handling)
8. [Message Validation](#message-validation)
9. [Integration Examples](#integration-examples)
10. [Advanced Features](#advanced-features)
11. [Best Practices](#best-practices)
12. [Complete Example](#complete-example)

## Overview

The Event Bus system in SoapJS provides a flexible and scalable solution for managing events in distributed systems. It offers a comprehensive framework for event-driven architecture with built-in support for retry policies, error handling, message parsing, and validation. The system is designed to work seamlessly with various messaging systems like RabbitMQ, Kafka, and AWS SQS.

### Key Benefits

- **Scalability**: Handle high-throughput event processing with configurable concurrency
- **Reliability**: Built-in retry mechanisms and dead letter queue support
- **Flexibility**: Pluggable processing strategies and messaging backends
- **Observability**: Comprehensive logging and error tracking
- **Type Safety**: Full TypeScript support with generic event types

## Core Components

The SoapJS Event Bus implementation consists of the following core components:

1. **EventBus** - Interface for connecting, publishing, and subscribing to events
2. **EventProcessor** - Handles message processing with retry logic and error handling
3. **ProcessingStrategy** - Defines how messages are validated, parsed, and executed
4. **EventBase** - Base structure for events with payload and headers
5. **RetryPolicy** - Configurable retry mechanisms with backoff strategies
6. **ErrorHandler** - Centralized error handling and dead letter queue management

## EventBase Structure

### Purpose and Architecture

The `EventBase` interface defines the standard structure for events in the SoapJS Event Bus system. It provides a consistent format for event data across different messaging backends.

### Event Structure

```typescript
interface EventBase<MessageType, HeadersType = Record<string, unknown>> {
  /**
   * The main payload of the event
   */
  message: MessageType;
  
  /**
   * Metadata headers for the event
   */
  headers: HeadersType & {
    correlation_id: string;
    timestamp: string;
  };
  
  /**
   * Optional error information if the event failed processing
   */
  error?: Error;
}
```

### Example Event

```typescript
const event: EventBase<UserCreatedPayload> = {
  message: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john@example.com'
  },
  headers: {
    correlation_id: 'corr-123',
    timestamp: '2024-01-15T10:30:00Z',
    source: 'user-service',
    version: '1.0'
  }
};
```

## EventBus Interface

### Purpose and Architecture

The `EventBus` interface provides an abstraction layer for different messaging systems. It defines the contract for connecting to message brokers, publishing events, and subscribing to event streams.

### Key Methods

```typescript
interface EventBus<MessageType, HeadersType, EventIdType = string> {
  /**
   * Connects to the event bus.
   * @param args - Connection arguments specific to the messaging system
   */
  connect(...args: unknown[]): Promise<void>;

  /**
   * Disconnects from the messaging system.
   */
  disconnect(): Promise<void>;

  /**
   * Checks the health status of the connection.
   * @returns true if connection is healthy, false otherwise
   */
  checkHealth(): Promise<boolean>;

  /**
   * Publishes an event with associated data.
   * @param event - The event identifier to publish
   * @param eventData - The event data with payload and headers
   * @param args - Additional arguments specific to the messaging system
   */
  publish(
    event: EventIdType,
    eventData: EventBase<MessageType, HeadersType>,
    ...args: unknown[]
  ): Promise<void>;

  /**
   * Subscribes to an event with a handler.
   * @param event - The event identifier to subscribe to
   * @param handler - The handler function to process event data
   */
  subscribe(
    event: EventIdType,
    handler: (data: EventBase<MessageType, HeadersType>) => void
  ): Promise<void>;

  /**
   * Unsubscribes from a previously registered subscription.
   * @param subscriptionId - The ID of the subscription to remove
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * Acknowledges the processing of a message.
   * @param messageId - The ID of the message to acknowledge
   */
  acknowledge?(messageId: string): Promise<void>;

  /**
   * Rejects a message and optionally requeues it.
   * @param messageId - The ID of the message to reject
   * @param requeue - Whether to requeue the message for processing
   */
  reject?(messageId: string, requeue?: boolean): Promise<void>;

  /**
   * Subscribes to events matching a specific pattern.
   * @param pattern - The pattern to match (e.g., 'user.*')
   * @param handler - The handler function for matched events
   * @returns Subscription ID
   */
  subscribeToPattern?(
    pattern: string,
    handler: (eventId: EventIdType, event: EventBase<MessageType, HeadersType>) => void
  ): Promise<string>;

  /**
   * Subscribes to an event with batch processing.
   * @param event - The event identifier to subscribe to
   * @param handler - The handler function to process batches of events
   * @returns Subscription ID
   */
  subscribeBatch?(
    event: EventIdType,
    handler: (events: EventBase<MessageType, HeadersType>[]) => void
  ): Promise<string>;
}
```

### Implementation Example

```typescript
import { EventBus } from '@soapjs/soap';

class RabbitMQEventBus implements EventBus {
  private connection: any;

  async connect(): Promise<void> {
    // Connect to RabbitMQ
    this.connection = await amqp.connect('amqp://localhost');
  }

  async publish(topic: string, message: any): Promise<void> {
    const channel = await this.connection.createChannel();
    await channel.assertQueue(topic);
    await channel.sendToQueue(topic, Buffer.from(JSON.stringify(message)));
  }

  async subscribe(topic: string, handler: (message: any) => Promise<void>): Promise<void> {
    const channel = await this.connection.createChannel();
    await channel.assertQueue(topic);
    await channel.consume(topic, async (msg) => {
      const content = JSON.parse(msg.content.toString());
      await handler(content);
      channel.ack(msg);
    });
  }
}
```

## EventProcessor

### Purpose and Architecture

The `EventProcessor` is the core component that handles message processing, retries, and error handling. It uses configurable strategies to process messages and provides hooks for monitoring and debugging.

### Key Features

- **Retry Logic**: Configurable retry policies with exponential backoff
- **Error Handling**: Centralized error handling with dead letter queue support
- **Graceful Shutdown**: Proper cleanup and message acknowledgment
- **Batch Processing**: Support for processing multiple messages at once
- **Monitoring**: Built-in callbacks for success, error, and lifecycle events

### Configuration

```typescript
import { EventProcessor, DefaultEventProcessingStrategy, EventBus } from '@soapjs/soap';

// First, create an event bus instance
const eventBus = new RabbitMQEventBus();
await eventBus.connect('amqp://localhost');

// Then create the processor with eventBus as first parameter
const processor = new EventProcessor<string, Record<string, any>>(
  eventBus,  // EventBus instance (required first parameter)
  {
    retries: 3,
    dlq: { 
      enabled: true, 
      topic: 'dead-letter-queue' 
    },
    processingStrategy: new DefaultEventProcessingStrategy(),
    maxParallelism: 5,  // Maximum concurrent message handlers
    callbacks: {
      onError: (error, event) => console.error('Processing error:', error),
      onSuccess: (event) => console.log('Message processed:', event),
      onClose: () => console.log('Processor closed'),
    },
  }
);
```

### Usage Example

```typescript
// Start processing events
await processor.start('user.created', async (payload) => {
  console.log('Processing user creation:', payload);
  // Business logic here
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await processor.shutdown();
});
```

## Processing Strategies

### EventProcessingStrategy Interface

The `EventProcessingStrategy` interface defines how events are processed. It provides a pluggable architecture for customizing event processing logic.

```typescript
interface EventProcessingStrategy<MessageType, HeadersType = Record<string, unknown>> {
  /**
   * Processes an event message
   * @param event - The event to process
   * @param handler - The handler function to execute
   * @param context - Processing context information
   */
  process(
    event: EventBase<MessageType, HeadersType>,
    handler: (payload: MessageType) => Promise<void>
  ): Promise<void>;
}
```

### DefaultEventProcessingStrategy

The default strategy provides a complete pipeline for message processing:

1. **Validation**: Ensures message format and required fields
2. **Parsing**: Converts raw message to typed object
3. **Execution**: Runs the business logic handler
4. **Error Handling**: Manages exceptions and retries

### Custom Strategies

You can implement custom processing strategies for specific requirements:

```typescript
import { EventProcessingStrategy, ProcessingContext } from '@soapjs/soap';

class CustomProcessingStrategy implements EventProcessingStrategy {
  async process<T>(
    message: any,
    handler: (payload: T) => Promise<void>,
    context: ProcessingContext
  ): Promise<void> {
    // Custom validation
    if (!this.validateMessage(message)) {
      throw new Error('Invalid message format');
    }

    // Custom parsing
    const payload = this.parseMessage(message);

    // Custom execution with metrics
    const startTime = Date.now();
    try {
      await handler(payload);
      this.recordMetrics('success', Date.now() - startTime);
    } catch (error) {
      this.recordMetrics('error', Date.now() - startTime);
      throw error;
    }
  }

  private validateMessage(message: any): boolean {
    // Custom validation logic
    return true;
  }

  private parseMessage(message: any): any {
    // Custom parsing logic
    return message;
  }

  private recordMetrics(status: string, duration: number): void {
    // Custom metrics recording
  }
}
```

## Retry Policies

### Configuration

Retry policies can be configured with various backoff strategies:

```typescript
// Exponential backoff with jitter
processor.setRetryPolicy(3, 1000, { 
  type: 'exponential', 
  jitter: true 
});

// Linear backoff
processor.setRetryPolicy(5, 2000, { 
  type: 'linear' 
});

// Fixed delay
processor.setRetryPolicy(3, 5000, { 
  type: 'fixed' 
});
```

### Retry Policy Types

| Type | Description | Use Case |
|------|-------------|----------|
| `fixed` | Constant delay between retries | Simple scenarios |
| `linear` | Linear increase in delay | Moderate load |
| `exponential` | Exponential increase in delay | High load scenarios |

### Custom Retry Logic

```typescript
class CustomRetryPolicy implements RetryPolicy {
  shouldRetry(error: Error, attempt: number): boolean {
    // Don't retry on validation errors
    if (error instanceof ValidationError) {
      return false;
    }
    
    // Retry up to 3 times for network errors
    if (error instanceof NetworkError && attempt < 3) {
      return true;
    }
    
    return false;
  }

  getDelay(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  }
}
```

## Error Handling

### Dead Letter Queue (DLQ)

Failed messages can be automatically routed to a dead letter queue for analysis:

```typescript
const processor = new EventProcessor({
  dlq: {
    enabled: true,
    topic: 'dead-letter-queue',
    maxRetries: 3
  }
});
```

### Error Callbacks

```typescript
const processor = new EventProcessor({
  callbacks: {
    onError: (error, event, attempt) => {
      console.error(`Error processing event (attempt ${attempt}):`, error);
      
      // Send to monitoring service
      monitoringService.recordError(error, event);
      
      // Alert if critical
      if (error instanceof CriticalError) {
        alertingService.sendAlert(error);
      }
    }
  }
});
```

### Error Types

```typescript
// Validation errors - don't retry
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
  }
}

// Network errors - retry with backoff
class NetworkError extends Error {
  constructor(message: string, public retryable: boolean = true) {
    super(message);
  }
}

// Business logic errors - handle specifically
class BusinessLogicError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}
```

## Message Validation

### Built-in Validation

The default processing strategy includes basic validation:

```typescript
// Validate message structure
if (!message || typeof message !== 'object') {
  throw new ValidationError('Message must be an object');
}

// Validate required fields
if (!message.id || !message.timestamp) {
  throw new ValidationError('Message missing required fields');
}
```

### Custom Validation

```typescript
import { z } from 'zod';

const UserCreatedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.string().datetime()
});

class ValidatedProcessingStrategy implements EventProcessingStrategy {
  async process<T>(
    message: any,
    handler: (payload: T) => Promise<void>,
    context: ProcessingContext
  ): Promise<void> {
    // Validate against schema
    const validatedPayload = UserCreatedSchema.parse(message);
    
    // Process validated message
    await handler(validatedPayload);
  }
}
```

## Integration Examples

### RabbitMQ Integration

```typescript
import { EventProcessor, DefaultEventProcessingStrategy } from '@soapjs/soap';
import { RabbitMQEventBus } from './RabbitMQEventBus';

const rabbitBus = new RabbitMQEventBus();
await rabbitBus.connect('amqp://localhost');

const processor = new EventProcessor<string, Record<string, any>>(
  rabbitBus,  // EventBus instance as first parameter
  {
    retries: 3,
    dlq: { enabled: true, topic: 'dlq' },
    processingStrategy: new DefaultEventProcessingStrategy(),
    callbacks: {
      onError: (error, event) => console.error('Error processing message:', error, event),
      onSuccess: (event) => console.log('Message processed successfully:', event),
      onClose: () => console.log('Processor closed'),
    },
  }
);

await processor.start('user.created', async (payload) => {
  console.log('Processing user:', payload);
  // Business logic here
});

process.on('SIGTERM', async () => {
  await processor.shutdown();
});
```

### Kafka Integration

```typescript
import { EventProcessor, DefaultEventProcessingStrategy } from '@soapjs/soap';
import { KafkaEventBus } from './KafkaEventBus';

const kafkaBus = new KafkaEventBus(['localhost:9092']);
await kafkaBus.connect();

const processor = new EventProcessor<string, Record<string, any>>(
  kafkaBus,  // EventBus instance as first parameter
  {
    retries: 5,
    dlq: { enabled: true, topic: 'dlq' },
    processingStrategy: new DefaultEventProcessingStrategy(),
    callbacks: {
      onError: (error, event) => console.error('Error processing Kafka message:', error, event),
      onSuccess: (event) => console.log('Kafka message processed successfully:', event),
    },
  }
);

await processor.start('order.placed', async (payload) => {
  console.log('Processing order:', payload);
  // Business logic here
});

process.on('SIGTERM', async () => {
  await processor.shutdown();
});
```

### AWS SQS Integration

```typescript
import { EventProcessor, DefaultEventProcessingStrategy } from '@soapjs/soap';
import { SQSEventBus } from './SQSEventBus';

const sqsBus = new SQSEventBus({
  region: 'us-east-1',
  queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue'
});
await sqsBus.connect();

const processor = new EventProcessor<string, Record<string, any>>(
  sqsBus,  // EventBus instance as first parameter
  {
    retries: 3,
    dlq: { enabled: true, topic: 'dlq' },
    processingStrategy: new DefaultEventProcessingStrategy(),
  }
);

await processor.start('notification.sent', async (payload) => {
  console.log('Processing notification:', payload);
  // Business logic here
});
```

## Advanced Features

### Batch Processing

Process multiple events at once to optimize throughput:

```typescript
// Subscribe to batch events using the event bus directly
await eventBus.subscribeBatch('bulk.events', async (events) => {
  console.log(`Processing ${events.length} events`);
  
  // Process in parallel
  await Promise.all(events.map(async (event) => {
    await processEvent(event);
  }));
});

// Or use pattern-based subscription for multiple event types
await eventBus.subscribeToPattern('user.*', async (eventId, event) => {
  console.log(`Processing ${eventId}:`, event);
  await processUserEvent(eventId, event);
});
```

### Event Filtering

Filter events before processing using custom processing strategies:

```typescript
class FilteredProcessingStrategy implements EventProcessingStrategy {
  constructor(private filter: (event: any) => boolean) {}

  async process<T>(
    message: any,
    handler: (payload: T) => Promise<void>,
    context: ProcessingContext
  ): Promise<void> {
    // Apply filter before processing
    if (!this.filter(message)) {
      console.log('Event filtered out:', message.id);
      return;
    }
    
    // Process filtered message
    await handler(message);
  }
}

// Usage with time-based filtering
const processor = new EventProcessor(
  eventBus,
  {
    processingStrategy: new FilteredProcessingStrategy((event) => {
      // Only process events from the last 24 hours
      const eventTime = new Date(event.timestamp);
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return eventTime > cutoffTime;
    })
  }
);
```

### Circuit Breaker

Implement circuit breaker pattern for external dependencies:

```typescript
class CircuitBreakerProcessingStrategy implements EventProcessingStrategy {
  private circuitBreaker = new CircuitBreaker();

  async process<T>(
    message: any,
    handler: (payload: T) => Promise<void>,
    context: ProcessingContext
  ): Promise<void> {
    await this.circuitBreaker.execute(async () => {
      await handler(message);
    });
  }
}
```

### Message Transformation

Transform messages before processing:

```typescript
class TransformProcessingStrategy implements EventProcessingStrategy {
  async process<T>(
    message: any,
    handler: (payload: T) => Promise<void>,
    context: ProcessingContext
  ): Promise<void> {
    // Transform message format
    const transformedMessage = this.transformMessage(message);
    
    // Process transformed message
    await handler(transformedMessage);
  }

  private transformMessage(message: any): any {
    // Custom transformation logic
    return {
      ...message,
      processedAt: new Date().toISOString(),
      version: '2.0'
    };
  }
}
```

## Best Practices

### 1. Error Handling

```typescript
// ✅ Good - Comprehensive error handling
const processor = new EventProcessor(
  eventBus,
  {
    callbacks: {
      onError: (error, event) => {
        // Log error with context
        logger.error('Event processing failed', {
          error: error.message,
          eventId: event.id,
          stack: error.stack
        });
        
        // Send to monitoring
        monitoringService.recordError(error, event);
        
        // Don't retry on validation errors
        if (error instanceof ValidationError) {
          return false;
        }
      }
    }
  }
);

// ❌ Bad - No error handling
const processor = new EventProcessor(eventBus, {});
```

### 2. Retry Configuration

```typescript
// ✅ Good - Appropriate retry policy
const processor = new EventProcessor(
  eventBus,
  {
    retries: 3,
    maxParallelism: 5
  }
);

// Configure retry policy on the event bus if supported
eventBus.setRetryPolicy?.(3, 1000, { 
  type: 'exponential', 
  jitter: true 
});

// ❌ Bad - Too many retries
const processor = new EventProcessor(
  eventBus,
  {
    retries: 100  // Will overwhelm the system
  }
);
```

### 3. Message Validation

```typescript
// ✅ Good - Strong validation
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email()
});

class ValidatedStrategy implements EventProcessingStrategy {
  async process<T>(
    message: any,
    handler: (payload: T) => Promise<void>,
    context: ProcessingContext
  ): Promise<void> {
    const validatedMessage = UserSchema.parse(message);
    await handler(validatedMessage);
  }
}

// ❌ Bad - No validation
class NoValidationStrategy implements EventProcessingStrategy {
  async process<T>(
    message: any,
    handler: (payload: T) => Promise<void>,
    context: ProcessingContext
  ): Promise<void> {
    await handler(message);  // Could fail at runtime
  }
}
```

### 4. Resource Management

```typescript
// ✅ Good - Proper cleanup
const processor = new EventProcessor(eventBus, {});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await processor.shutdown();
  process.exit(0);
});

// ❌ Bad - No cleanup
const processor = new EventProcessor(eventBus, {});
// Process will exit without cleanup
```

### 5. Monitoring and Observability

```typescript
// ✅ Good - Comprehensive monitoring
const processor = new EventProcessor(
  eventBus,
  {
    callbacks: {
      onSuccess: (event) => {
        metrics.increment('events.processed.success');
        logger.info('Event processed successfully', { eventId: event.id });
      },
      onError: (error, event) => {
        metrics.increment('events.processed.error');
        logger.error('Event processing failed', { 
          eventId: event.id, 
          error: error.message 
        });
      }
    }
  }
);

// ❌ Bad - No monitoring
const processor = new EventProcessor(eventBus, {});
```

## Complete Example

Here's a complete example of an event-driven user management system:

```typescript
import { 
  EventProcessor, 
  DefaultEventProcessingStrategy,
  EventBus 
} from '@soapjs/soap';
import { z } from 'zod';

// Event schemas
const UserCreatedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.string().datetime()
});

const UserUpdatedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  updatedAt: z.string().datetime()
});

// Event handlers
class UserEventHandler {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
    private auditService: AuditService
  ) {}

  async handleUserCreated(payload: z.infer<typeof UserCreatedSchema>) {
    // Create user
    const user = await this.userRepository.create(payload);
    
    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);
    
    // Audit log
    await this.auditService.log('user.created', payload);
  }

  async handleUserUpdated(payload: z.infer<typeof UserUpdatedSchema>) {
    // Update user
    const user = await this.userRepository.update(payload.id, payload);
    
    // Audit log
    await this.auditService.log('user.updated', payload);
  }
}

// Setup event processor
const eventBus = new RabbitMQEventBus();
await eventBus.connect('amqp://localhost');

const userEventHandler = new UserEventHandler(
  new UserRepository(),
  new EmailService(),
  new AuditService()
);

const processor = new EventProcessor(
  eventBus,
  {
    retries: 3,
    dlq: { enabled: true, topic: 'user-events-dlq' },
    processingStrategy: new DefaultEventProcessingStrategy(),
    callbacks: {
      onError: (error, event) => {
        console.error('User event processing failed:', error);
        // Send alert for critical errors
        if (error instanceof CriticalError) {
          alertingService.sendAlert('User event processing critical error', error);
        }
      },
      onSuccess: (event) => {
        console.log('User event processed successfully:', event.id);
      }
    }
  }
);

// Start processing events
await processor.start('user.created', async (payload) => {
  await userEventHandler.handleUserCreated(payload);
});

await processor.start('user.updated', async (payload) => {
  await userEventHandler.handleUserUpdated(payload);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down user event processor...');
  await processor.shutdown();
  process.exit(0);
});
```

## Summary

The Event Bus system in SoapJS provides a robust foundation for building event-driven applications. With its flexible architecture, comprehensive error handling, and support for multiple messaging backends, it enables developers to create scalable and maintainable event processing systems.

Key advantages:
- **Reliability**: Built-in retry mechanisms and dead letter queue support
- **Flexibility**: Pluggable processing strategies and messaging backends
- **Observability**: Comprehensive monitoring and error tracking
- **Type Safety**: Full TypeScript support with schema validation
- **Scalability**: Support for batch processing and high-throughput scenarios