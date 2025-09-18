# Advanced Event Patterns - SoapJS

## Table of Contents

1. [Overview](#overview)
2. [Event Replay](#event-replay)
3. [Event Versioning](#event-versioning)
4. [Saga Orchestration](#saga-orchestration)
5. [Event Correlation](#event-correlation)
6. [Event Sourcing Snapshots](#event-sourcing-snapshots)
7. [Integration Examples](#integration-examples)
8. [Best Practices](#best-practices)

## Overview

SoapJS provides advanced event patterns that extend the basic CQRS and Event Sourcing capabilities. These patterns are designed to be framework-agnostic and can be integrated with any messaging system or database.

### Key Benefits

- **Framework Independence**: No dependency on specific frameworks or libraries
- **Flexibility**: Configurable strategies and behaviors
- **Performance**: Optimized for high-throughput scenarios
- **Reliability**: Built-in error handling and retry mechanisms
- **Observability**: Comprehensive logging and monitoring capabilities

## Event Replay

Event Replay allows you to replay events from your event store to rebuild state, test scenarios, or migrate data.

### Features

- **Multiple Strategies**: Chronological, by aggregate, by type, by correlation
- **Batch Processing**: Configurable batch sizes for performance
- **Progress Tracking**: Real-time progress monitoring
- **Error Handling**: Comprehensive error handling with retry logic
- **Cancellation**: Ability to cancel ongoing replays

### Usage Example

```typescript
import { BaseEventReplayManager, ReplayStrategy, ReplayOptions } from '@soapjs/soap';

const eventStore = new YourEventStore();
const replayManager = new BaseEventReplayManager(eventStore);

// Configure replay options
const options: ReplayOptions = {
  strategy: ReplayStrategy.CHRONOLOGICAL,
  fromDate: new Date('2024-01-01'),
  toDate: new Date('2024-12-31'),
  batchSize: 100,
  includeSnapshots: true
};

// Create custom handler
class CustomReplayHandler implements EventReplayHandler {
  async handleEvent(event: DomainEvent): Promise<Result<void>> {
    // Process individual event
    return Result.withSuccess();
  }
  
  async handleBatch(events: DomainEvent[]): Promise<Result<void>> {
    // Process batch of events
    return Result.withSuccess();
  }
}

// Start replay
const replayResult = await replayManager.startReplay(options, new CustomReplayHandler());
```

### Replay Strategies

- **CHRONOLOGICAL**: Replay events in time order
- **BY_AGGREGATE**: Replay events grouped by aggregate
- **BY_TYPE**: Replay events by event type
- **BY_CORRELATION**: Replay events by correlation ID

## Event Versioning

Event Versioning provides schema evolution capabilities for your events, allowing you to migrate between different versions of event schemas.

### Features

- **Schema Evolution**: Migrate between event versions
- **Backward Compatibility**: Support for multiple versions simultaneously
- **Migration Functions**: Custom migration logic between versions
- **Validation**: Schema validation for event data
- **Deprecation**: Mark old versions as deprecated

### Usage Example

```typescript
import { BaseEventVersionManager, createEventVersion } from '@soapjs/soap';

const registry = new InMemoryEventVersionRegistry();
const versionManager = new BaseEventVersionManager(registry);

// Define event versions
const userCreatedV1 = createEventVersion('UserCreated')
  .version(1)
  .schema({
    type: 'object',
    properties: {
      userId: { type: 'string' },
      email: { type: 'string' },
      name: { type: 'string' }
    },
    required: ['userId', 'email', 'name']
  })
  .build();

const userCreatedV2 = createEventVersion('UserCreated')
  .version(2)
  .schema({
    type: 'object',
    properties: {
      userId: { type: 'string' },
      email: { type: 'string' },
      firstName: { type: 'string' },
      lastName: { type: 'string' }
    },
    required: ['userId', 'email', 'firstName', 'lastName']
  })
  .migration((data, fromVersion, toVersion) => {
    // Migration logic from v1 to v2
    if (fromVersion === 1 && toVersion === 2) {
      const name = data.name as string;
      const nameParts = name.split(' ');
      return {
        ...data,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || ''
      };
    }
    return data;
  })
  .build();

// Register versions
await versionManager.registerVersion(userCreatedV1);
await versionManager.registerVersion(userCreatedV2);

// Migrate event to latest version
const migrationResult = await versionManager.migrateToLatest(oldEvent);
```

## Saga Orchestration

Advanced Saga Orchestration provides sophisticated workflow management for distributed transactions with event-driven coordination.

### Features

- **Multiple Strategies**: Orchestration, Choreography, and Hybrid approaches
- **Event-Driven**: Event-based step coordination
- **Compensation**: Multiple compensation strategies
- **Retry Logic**: Configurable retry mechanisms
- **Timeout Handling**: Step and saga-level timeouts
- **Parallel Execution**: Support for parallel step execution

### Usage Example

```typescript
import { BaseSagaOrchestrator, createSagaDefinition, SagaOrchestrationStrategy } from '@soapjs/soap';

const sagaOrchestrator = new BaseSagaOrchestrator();

// Define saga steps
const steps: SagaOrchestrationStep[] = [
  {
    stepId: 'create-user',
    name: 'Create User',
    command: { type: 'CreateUser', data: { email: 'user@example.com' } },
    compensation: { type: 'DeleteUser', data: { email: 'user@example.com' } },
    completed: false,
    compensated: false,
    timeout: 30000,
    retryConfig: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    }
  }
];

// Create saga definition
const sagaDefinition = createSagaDefinition('UserOnboardingSaga')
  .version('1.0.0')
  .strategy(SagaOrchestrationStrategy.ORCHESTRATION)
  .addStep(steps[0])
  .globalTimeout(60000)
  .compensationStrategy('compensate_all')
  .build();

// Start saga
const sagaResult = await sagaOrchestrator.startSaga(sagaDefinition, {
  userEmail: 'user@example.com'
});
```

### Orchestration Strategies

- **ORCHESTRATION**: Centralized coordinator manages the saga
- **CHOREOGRAPHY**: Distributed coordination through events
- **HYBRID**: Combination of both approaches

### Compensation Strategies

- **COMPENSATE_ALL**: Compensate all completed steps
- **COMPENSATE_FAILED_ONLY**: Compensate only the failed step
- **COMPENSATE_BACKWARDS**: Compensate from failed step backwards
- **NO_COMPENSATION**: No compensation

## Event Correlation

Event Correlation provides sophisticated event relationship tracking and analysis capabilities.

### Features

- **Multiple Correlation Types**: Causal, Temporal, Contextual, Data, and Business correlations
- **Rule-Based**: Configurable correlation rules
- **Pattern Matching**: Flexible event pattern matching
- **Strength Calculation**: Correlation strength scoring
- **Context Tracking**: Maintain correlation contexts

### Usage Example

```typescript
import { BaseEventCorrelationManager, createCorrelationRule, CorrelationType } from '@soapjs/soap';

const correlationManager = new BaseEventCorrelationManager();

// Create correlation rule
const correlationRule = createCorrelationRule('user-session-rule', 'User Session Correlation')
  .description('Correlate events within the same user session')
  .sourceEventPattern({
    eventType: 'UserAction*',
    dataPatterns: { userId: '${userId}' }
  })
  .targetEventPattern({
    eventType: 'UserAction*',
    dataPatterns: { userId: '${userId}' }
  })
  .correlationType(CorrelationType.CONTEXTUAL)
  .addCondition({
    type: ConditionType.EQUALS,
    fieldPath: 'data.sessionId',
    expectedValue: '${sessionId}',
    operator: 'and'
  })
  .build();

// Register correlation rule
await correlationManager.registerCorrelationRule(correlationRule);

// Process events for correlation
const correlationResult = await correlationManager.processEvent(event);
```

### Correlation Types

- **CAUSAL**: Event A causes event B
- **TEMPORAL**: Events happen in sequence
- **CONTEXTUAL**: Events share same context
- **DATA**: Events share same data
- **BUSINESS**: Events related by business process

## Event Sourcing Snapshots

Event Sourcing Snapshots provide optimization capabilities for event-sourced aggregates by creating periodic snapshots of aggregate state.

### Features

- **Multiple Strategies**: Event count, time threshold, interval, manual, and state change triggers
- **Compression**: Built-in compression support
- **Encryption**: Optional encryption for sensitive data
- **Automatic Cleanup**: Configurable cleanup of old snapshots
- **Performance Optimization**: Faster aggregate reconstruction

### Usage Example

```typescript
import { BaseSnapshotManager, createSnapshotConfiguration, SnapshotStrategy } from '@soapjs/soap';

const eventStore = new YourEventStore();
const snapshotStore = new YourSnapshotStore();
const snapshotManager = new BaseSnapshotManager(snapshotStore, eventStore);

// Configure snapshot strategy
const snapshotConfig = createSnapshotConfiguration('User')
  .strategy(SnapshotStrategy.EVENT_COUNT)
  .eventCountThreshold(50)
  .compress(true)
  .compressionAlgorithm(CompressionAlgorithm.GZIP)
  .maxSnapshots(5)
  .autoCleanup(true)
  .build();

// Set configuration
await snapshotManager.setSnapshotConfiguration('User', snapshotConfig);

// Create a snapshot
const snapshotResult = await snapshotManager.createSnapshot(
  'user-123',
  'User',
  aggregateState,
  100,
  snapshotConfig
);

// Restore aggregate from snapshot
const restoreResult = await snapshotManager.restoreAggregate('user-123');
```

### Snapshot Strategies

- **EVENT_COUNT**: Create snapshots when event count threshold is reached
- **TIME_THRESHOLD**: Create snapshots when time threshold is reached
- **INTERVAL**: Create snapshots at regular intervals
- **MANUAL**: Create snapshots manually
- **STATE_CHANGE**: Create snapshots based on aggregate state changes

## Integration Examples

### Complete Event-Driven Architecture

```typescript
import {
  BaseEventReplayManager,
  BaseEventVersionManager,
  BaseSagaOrchestrator,
  BaseEventCorrelationManager,
  BaseSnapshotManager
} from '@soapjs/soap';

class EventDrivenApplication {
  private replayManager: BaseEventReplayManager;
  private versionManager: BaseEventVersionManager;
  private sagaOrchestrator: BaseSagaOrchestrator;
  private correlationManager: BaseEventCorrelationManager;
  private snapshotManager: BaseSnapshotManager;
  
  constructor(
    eventStore: EventStore,
    snapshotStore: SnapshotStore
  ) {
    this.replayManager = new BaseEventReplayManager(eventStore);
    this.versionManager = new BaseEventVersionManager(new InMemoryEventVersionRegistry());
    this.sagaOrchestrator = new BaseSagaOrchestrator();
    this.correlationManager = new BaseEventCorrelationManager();
    this.snapshotManager = new BaseSnapshotManager(snapshotStore, eventStore);
  }
  
  async processEvent(event: DomainEvent): Promise<void> {
    // Version the event
    const versionedEvent = await this.versionManager.migrateToLatest(event);
    
    // Process for correlation
    await this.correlationManager.processEvent(versionedEvent.data);
    
    // Store in event store
    await this.eventStore.appendEvents(
      event.aggregateId,
      event.version,
      [versionedEvent.data]
    );
    
    // Check if snapshot should be created
    const shouldSnapshot = await this.snapshotManager.shouldCreateSnapshot(
      event.aggregateId,
      event.version,
      await this.snapshotManager.getSnapshotConfiguration(event.aggregateType)
    );
    
    if (shouldSnapshot.data) {
      await this.snapshotManager.createSnapshot(
        event.aggregateId,
        event.aggregateType,
        await this.getAggregateState(event.aggregateId),
        event.version
      );
    }
  }
}
```

## Best Practices

### Event Replay

1. **Use Appropriate Strategies**: Choose the right replay strategy for your use case
2. **Batch Processing**: Use appropriate batch sizes for performance
3. **Progress Monitoring**: Implement progress tracking for long-running replays
4. **Error Handling**: Implement robust error handling and retry logic

### Event Versioning

1. **Backward Compatibility**: Always maintain backward compatibility when possible
2. **Migration Testing**: Thoroughly test migration functions
3. **Version Deprecation**: Properly deprecate old versions with migration deadlines
4. **Schema Validation**: Validate events against schemas before processing

### Saga Orchestration

1. **Compensation Design**: Design compensation logic carefully
2. **Timeout Configuration**: Set appropriate timeouts for steps and sagas
3. **Retry Logic**: Configure retry logic based on failure patterns
4. **Event-Driven**: Use events for step coordination when possible

### Event Correlation

1. **Rule Design**: Design correlation rules carefully to avoid false positives
2. **Performance**: Consider performance implications of correlation rules
3. **Context Management**: Properly manage correlation contexts
4. **Cleanup**: Implement cleanup for old correlations

### Event Sourcing Snapshots

1. **Strategy Selection**: Choose appropriate snapshot strategies
2. **Compression**: Use compression for large snapshots
3. **Cleanup**: Implement automatic cleanup of old snapshots
4. **Testing**: Test snapshot creation and restoration thoroughly

### General

1. **Monitoring**: Implement comprehensive monitoring and logging
2. **Error Handling**: Implement robust error handling throughout
3. **Performance**: Consider performance implications of all patterns
4. **Testing**: Write comprehensive tests for all patterns
5. **Documentation**: Document your event schemas and patterns

## Conclusion

The advanced event patterns in SoapJS provide powerful capabilities for building sophisticated event-driven applications. These patterns are designed to be framework-agnostic and can be integrated with any messaging system or database. By following the best practices outlined in this document, you can build reliable, scalable, and maintainable event-driven systems.
