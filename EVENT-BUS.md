# **Event Components: Comprehensive Guide**

The `EventProcessor` and `EventBus` framework provides a flexible and scalable solution for managing events in distributed systems. With built-in support for retry policies, error handling, message parsing, and validation, the framework is designed to work seamlessly with various messaging systems like RabbitMQ, Kafka or AWS SQS.

## Features

- **EventBus Interface**: Abstraction for connecting, publishing, and subscribing to events.
- **EventProcessor**: Handles message processing with retry logic, dead letter queues (DLQ), and graceful shutdown.
- **Default Processing Strategy**: Validates, parses, and executes message handlers.
- **Flexible Integration**: Works with RabbitMQ, Kafka, and other messaging systems.
- **Extensible Design**: Customizable strategies for message processing and retry policies.

---

## Key Components

### **EventBus**
Defines methods for connecting to the event bus, publishing events, and subscribing to event streams.

### **EventProcessor**
Handles message processing, retries, and error handling using customizable strategies.

### **DefaultEventProcessingStrategy**
Provides the default logic for validating, parsing, and executing messages.

---

## Example Implementations

### RabbitMQ Integration

```typescript
import { EventProcessor } from '@soapjs/soap';
import { RabbitMQEventBus } from './RabbitMQEventBus';

const rabbitBus = new RabbitMQEventBus();
await rabbitBus.connect('amqp://localhost');

const processor = new EventProcessor<string, Record<string, any>>({
  retries: 3,
  dlq: { enabled: true, topic: 'dlq' },
  processingStrategy: new DefaultEventProcessingStrategy(),
  callbacks: {
    onError: (error, event) => console.error('Error processing message:', error, event),
    onSuccess: (event) => console.log('Message processed successfully:', event),
    onClose: () => console.log('Processor closed'),
  },
});

await processor.start('user.created', async (payload) => {
  console.log('Processing user:', payload);
});

process.on('SIGTERM', async () => {
  await processor.shutdown();
});
```

### Kafka Integration

```typescript
import { EventProcessor } from '@soapjs/soap';
import { KafkaEventBus } from './KafkaEventBus';

const kafkaBus = new KafkaEventBus(['localhost:9092']);
await kafkaBus.connect();

const processor = new EventProcessor<string, Record<string, any>>({
  retries: 5,
  dlq: { enabled: true, topic: 'dlq' },
  processingStrategy: new DefaultEventProcessingStrategy(),
  callbacks: {
    onError: (error, event) => console.error('Error processing Kafka message:', error, event),
    onSuccess: (event) => console.log('Kafka message processed successfully:', event),
  },
});

await processor.start('order.placed', async (payload) => {
  console.log('Processing order:', payload);
});

process.on('SIGTERM', async () => {
  await processor.shutdown();
});
```

---

## Advanced Features

### Retry Policies
Configure retries and backoff strategies to handle transient errors.

```typescript
setRetryPolicy(3, 1000, { type: 'exponential', jitter: true });
```

### Dead Letter Queue (DLQ)
Automatically route failed messages to a DLQ for further analysis.

```typescript
{ enabled: true, topic: 'dlq' }
```

### Batch Processing
Process multiple events at once to optimize throughput.

```typescript
subscribeBatch('bulk.event', (events) => {
  events.forEach((event) => console.log('Processing event:', event));
});
```