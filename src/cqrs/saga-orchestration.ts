import { Result } from "../common/result";
import { DomainEvent } from "../domain/domain-event";
import { Command } from "./command";
import { Saga, SagaStatus, SagaStep } from "./saga";

/**
 * Saga Orchestration Strategy - defines how sagas are orchestrated
 */
export enum SagaOrchestrationStrategy {
  /**
   * Orchestration-based saga (centralized coordinator)
   */
  ORCHESTRATION = 'orchestration',
  
  /**
   * Choreography-based saga (distributed coordination)
   */
  CHOREOGRAPHY = 'choreography',
  
  /**
   * Hybrid approach (combination of both)
   */
  HYBRID = 'hybrid'
}

/**
 * Saga Event - represents an event in saga orchestration
 */
export interface SagaEvent extends DomainEvent {
  /**
   * Saga ID this event belongs to
   */
  readonly sagaId: string;
  
  /**
   * Step ID this event relates to
   */
  readonly stepId?: string;
  
  /**
   * Event type in saga context
   */
  readonly sagaEventType: SagaEventType;
  
  /**
   * Correlation ID for tracking
   */
  readonly correlationId: string;
}

/**
 * Saga Event Types
 */
export enum SagaEventType {
  SAGA_STARTED = 'saga.started',
  SAGA_STEP_STARTED = 'saga.step.started',
  SAGA_STEP_COMPLETED = 'saga.step.completed',
  SAGA_STEP_FAILED = 'saga.step.failed',
  SAGA_STEP_COMPENSATED = 'saga.step.compensated',
  SAGA_COMPLETED = 'saga.completed',
  SAGA_FAILED = 'saga.failed',
  SAGA_COMPENSATED = 'saga.compensated',
  SAGA_TIMEOUT = 'saga.timeout'
}

/**
 * Saga Orchestration Step - enhanced step with event-driven capabilities
 */
export interface SagaOrchestrationStep extends SagaStep {
  /**
   * Event that triggers this step
   */
  readonly triggerEvent?: string;
  
  /**
   * Events this step publishes
   */
  readonly publishedEvents?: string[];
  
  /**
   * Timeout for this step
   */
  readonly timeout?: number;
  
  /**
   * Retry configuration
   */
  readonly retryConfig?: StepRetryConfig;
  
  /**
   * Compensation timeout
   */
  readonly compensationTimeout?: number;
  
  /**
   * Whether this step can be executed in parallel with others
   */
  readonly parallel?: boolean;
  
  /**
   * Dependencies on other steps
   */
  readonly dependencies?: string[];
}

/**
 * Step Retry Configuration
 */
export interface StepRetryConfig {
  /**
   * Maximum number of retries
   */
  readonly maxRetries: number;
  
  /**
   * Retry delay in milliseconds
   */
  readonly retryDelay: number;
  
  /**
   * Backoff multiplier
   */
  readonly backoffMultiplier?: number;
  
  /**
   * Maximum retry delay
   */
  readonly maxRetryDelay?: number;
  
  /**
   * Retryable error types
   */
  readonly retryableErrors?: string[];
}

/**
 * Saga Orchestration Context - context for saga execution
 */
export interface SagaOrchestrationContext {
  /**
   * Saga ID
   */
  readonly sagaId: string;
  
  /**
   * Current step index
   */
  readonly currentStepIndex: number;
  
  /**
   * Saga status
   */
  readonly status: SagaStatus;
  
  /**
   * Started timestamp
   */
  readonly startedAt: Date;
  
  /**
   * Completed timestamp
   */
  readonly completedAt?: Date;
  
  /**
   * Step execution history
   */
  readonly stepHistory: StepExecutionHistory[];
  
  /**
   * Saga data (accumulated state)
   */
  readonly sagaData: Record<string, unknown>;
  
  /**
   * Correlation ID
   */
  readonly correlationId: string;
  
  /**
   * Parent saga ID (for nested sagas)
   */
  readonly parentSagaId?: string;
  
  /**
   * Child saga IDs
   */
  readonly childSagaIds: string[];
}

/**
 * Step Execution History
 */
export interface StepExecutionHistory {
  /**
   * Step ID
   */
  readonly stepId: string;
  
  /**
   * Start time
   */
  readonly startedAt: Date;
  
  /**
   * End time
   */
  readonly endedAt?: Date;
  
  /**
   * Status
   */
  readonly status: 'started' | 'completed' | 'failed' | 'compensated' | 'timeout';
  
  /**
   * Retry count
   */
  readonly retryCount: number;
  
  /**
   * Error message
   */
  readonly error?: string;
  
  /**
   * Step data
   */
  readonly stepData?: Record<string, unknown>;
}

/**
 * Saga Orchestrator - manages saga orchestration
 */
export interface SagaOrchestrator {
  /**
   * Start a new saga
   */
  startSaga(
    sagaDefinition: SagaDefinition,
    initialData?: Record<string, unknown>
  ): Promise<Result<string>>; // Returns saga ID
  
  /**
   * Handle saga event
   */
  handleSagaEvent(event: SagaEvent): Promise<Result<void>>;
  
  /**
   * Get saga context
   */
  getSagaContext(sagaId: string): Promise<Result<SagaOrchestrationContext>>;
  
  /**
   * Cancel saga
   */
  cancelSaga(sagaId: string): Promise<Result<void>>;
  
  /**
   * Get active sagas
   */
  getActiveSagas(): Promise<Result<string[]>>;
  
  /**
   * Get saga statistics
   */
  getSagaStatistics(): Promise<Result<SagaStatistics>>;
}

/**
 * Saga Definition - defines a saga structure
 */
export interface SagaDefinition {
  /**
   * Saga name
   */
  readonly name: string;
  
  /**
   * Saga version
   */
  readonly version: string;
  
  /**
   * Orchestration strategy
   */
  readonly strategy: SagaOrchestrationStrategy;
  
  /**
   * Steps in the saga
   */
  readonly steps: SagaOrchestrationStep[];
  
  /**
   * Global timeout for the saga
   */
  readonly globalTimeout?: number;
  
  /**
   * Global retry configuration
   */
  readonly globalRetryConfig?: StepRetryConfig;
  
  /**
   * Compensation strategy
   */
  readonly compensationStrategy?: CompensationStrategy;
}

/**
 * Compensation Strategy
 */
export enum CompensationStrategy {
  /**
   * Compensate all completed steps
   */
  COMPENSATE_ALL = 'compensate_all',
  
  /**
   * Compensate only failed step
   */
  COMPENSATE_FAILED_ONLY = 'compensate_failed_only',
  
  /**
   * Compensate from failed step backwards
   */
  COMPENSATE_BACKWARDS = 'compensate_backwards',
  
  /**
   * No compensation
   */
  NO_COMPENSATION = 'no_compensation'
}

/**
 * Saga Statistics
 */
export interface SagaStatistics {
  /**
   * Total sagas started
   */
  readonly totalSagas: number;
  
  /**
   * Active sagas
   */
  readonly activeSagas: number;
  
  /**
   * Completed sagas
   */
  readonly completedSagas: number;
  
  /**
   * Failed sagas
   */
  readonly failedSagas: number;
  
  /**
   * Compensated sagas
   */
  readonly compensatedSagas: number;
  
  /**
   * Average execution time
   */
  readonly averageExecutionTime: number;
  
  /**
   * Success rate
   */
  readonly successRate: number;
}

/**
 * Base implementation of Saga Orchestrator
 */
export class BaseSagaOrchestrator implements SagaOrchestrator {
  private activeSagas = new Map<string, SagaOrchestrationContext>();
  private sagaDefinitions = new Map<string, SagaDefinition>();
  private sagaStatistics: SagaStatistics = {
    totalSagas: 0,
    activeSagas: 0,
    completedSagas: 0,
    failedSagas: 0,
    compensatedSagas: 0,
    averageExecutionTime: 0,
    successRate: 0
  };
  
  constructor(private eventBus?: EventBus) {}
  
  async startSaga(
    sagaDefinition: SagaDefinition,
    initialData: Record<string, unknown> = {}
  ): Promise<Result<string>> {
    try {
      const sagaId = this.generateSagaId();
      const correlationId = this.generateCorrelationId();
      
      // Store saga definition
      this.sagaDefinitions.set(sagaId, sagaDefinition);
      
      // Create saga context
      const context: SagaOrchestrationContext = {
        sagaId,
        currentStepIndex: 0,
        status: SagaStatus.PENDING,
        startedAt: new Date(),
        stepHistory: [],
        sagaData: initialData,
        correlationId,
        childSagaIds: []
      };
      
      this.activeSagas.set(sagaId, context);
      
      // Update statistics
      this.sagaStatistics.totalSagas++;
      this.sagaStatistics.activeSagas++;
      
      // Publish saga started event
      if (this.eventBus) {
        const sagaStartedEvent: SagaEvent = {
          id: this.generateEventId(),
          type: 'SagaStarted',
          timestamp: new Date(),
          data: { sagaDefinition: sagaDefinition.name },
          sagaId,
          sagaEventType: SagaEventType.SAGA_STARTED,
          correlationId
        };
        
        await this.eventBus.publish('saga.started', sagaStartedEvent);
      }
      
      // Start first step
      await this.executeNextStep(sagaId);
      
      return Result.withSuccess(sagaId);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async handleSagaEvent(event: SagaEvent): Promise<Result<void>> {
    try {
      const context = this.activeSagas.get(event.sagaId);
      if (!context) {
        return Result.withFailure(new Error(`Saga ${event.sagaId} not found`));
      }
      
      const sagaDefinition = this.sagaDefinitions.get(event.sagaId);
      if (!sagaDefinition) {
        return Result.withFailure(new Error(`Saga definition for ${event.sagaId} not found`));
      }
      
      switch (event.sagaEventType) {
        case SagaEventType.SAGA_STEP_COMPLETED:
          await this.handleStepCompleted(event, context, sagaDefinition);
          break;
          
        case SagaEventType.SAGA_STEP_FAILED:
          await this.handleStepFailed(event, context, sagaDefinition);
          break;
          
        case SagaEventType.SAGA_TIMEOUT:
          await this.handleSagaTimeout(event, context, sagaDefinition);
          break;
          
        default:
          // Handle other event types
          break;
      }
      
      return Result.withSuccess();
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async getSagaContext(sagaId: string): Promise<Result<SagaOrchestrationContext>> {
    const context = this.activeSagas.get(sagaId);
    if (!context) {
      return Result.withFailure(new Error(`Saga ${sagaId} not found`));
    }
    
    return Result.withSuccess(context);
  }
  
  async cancelSaga(sagaId: string): Promise<Result<void>> {
    try {
      const context = this.activeSagas.get(sagaId);
      if (!context) {
        return Result.withFailure(new Error(`Saga ${sagaId} not found`));
      }
      
      // Update context status
      context.status = SagaStatus.FAILED;
      context.completedAt = new Date();
      
      // Update statistics
      this.sagaStatistics.activeSagas--;
      this.sagaStatistics.failedSagas++;
      
      // Publish saga cancelled event
      if (this.eventBus) {
        const sagaCancelledEvent: SagaEvent = {
          id: this.generateEventId(),
          type: 'SagaCancelled',
          timestamp: new Date(),
          data: { sagaId },
          sagaId,
          sagaEventType: SagaEventType.SAGA_FAILED,
          correlationId: context.correlationId
        };
        
        await this.eventBus.publish('saga.cancelled', sagaCancelledEvent);
      }
      
      return Result.withSuccess();
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async getActiveSagas(): Promise<Result<string[]>> {
    return Result.withSuccess(Array.from(this.activeSagas.keys()));
  }
  
  async getSagaStatistics(): Promise<Result<SagaStatistics>> {
    return Result.withSuccess({ ...this.sagaStatistics });
  }
  
  private async executeNextStep(sagaId: string): Promise<void> {
    const context = this.activeSagas.get(sagaId);
    const sagaDefinition = this.sagaDefinitions.get(sagaId);
    
    if (!context || !sagaDefinition) return;
    
    if (context.currentStepIndex >= sagaDefinition.steps.length) {
      await this.completeSaga(sagaId);
      return;
    }
    
    const step = sagaDefinition.steps[context.currentStepIndex];
    
    // Record step start
    const stepHistory: StepExecutionHistory = {
      stepId: step.stepId,
      startedAt: new Date(),
      status: 'started',
      retryCount: 0
    };
    
    context.stepHistory.push(stepHistory);
    
    // Publish step started event
    if (this.eventBus) {
      const stepStartedEvent: SagaEvent = {
        id: this.generateEventId(),
        type: 'SagaStepStarted',
        timestamp: new Date(),
        data: { stepId: step.stepId },
        sagaId,
        stepId: step.stepId,
        sagaEventType: SagaEventType.SAGA_STEP_STARTED,
        correlationId: context.correlationId
      };
      
      await this.eventBus.publish('saga.step.started', stepStartedEvent);
    }
    
    // Execute step (this would typically use a command bus)
    try {
      // Simulate step execution
      await this.simulateStepExecution(step, context);
      
      // Mark step as completed
      stepHistory.status = 'completed';
      stepHistory.endedAt = new Date();
      
      // Publish step completed event
      if (this.eventBus) {
        const stepCompletedEvent: SagaEvent = {
          id: this.generateEventId(),
          type: 'SagaStepCompleted',
          timestamp: new Date(),
          data: { stepId: step.stepId },
          sagaId,
          stepId: step.stepId,
          sagaEventType: SagaEventType.SAGA_STEP_COMPLETED,
          correlationId: context.correlationId
        };
        
        await this.eventBus.publish('saga.step.completed', stepCompletedEvent);
      }
      
      // Move to next step
      context.currentStepIndex++;
      
      // Execute next step
      await this.executeNextStep(sagaId);
      
    } catch (error) {
      // Handle step failure
      await this.handleStepFailure(sagaId, step, error as Error);
    }
  }
  
  private async handleStepCompleted(
    event: SagaEvent,
    context: SagaOrchestrationContext,
    sagaDefinition: SagaDefinition
  ): Promise<void> {
    // Update step history
    const stepHistory = context.stepHistory.find(h => h.stepId === event.stepId);
    if (stepHistory) {
      stepHistory.status = 'completed';
      stepHistory.endedAt = new Date();
    }
    
    // Move to next step
    context.currentStepIndex++;
    
    // Execute next step
    await this.executeNextStep(context.sagaId);
  }
  
  private async handleStepFailed(
    event: SagaEvent,
    context: SagaOrchestrationContext,
    sagaDefinition: SagaDefinition
  ): Promise<void> {
    // Update step history
    const stepHistory = context.stepHistory.find(h => h.stepId === event.stepId);
    if (stepHistory) {
      stepHistory.status = 'failed';
      stepHistory.endedAt = new Date();
      stepHistory.error = event.data?.error as string;
    }
    
    // Handle compensation based on strategy
    await this.handleCompensation(context, sagaDefinition);
  }
  
  private async handleSagaTimeout(
    event: SagaEvent,
    context: SagaOrchestrationContext,
    sagaDefinition: SagaDefinition
  ): Promise<void> {
    context.status = SagaStatus.FAILED;
    context.completedAt = new Date();
    
    // Update statistics
    this.sagaStatistics.activeSagas--;
    this.sagaStatistics.failedSagas++;
  }
  
  private async completeSaga(sagaId: string): Promise<void> {
    const context = this.activeSagas.get(sagaId);
    if (!context) return;
    
    context.status = SagaStatus.COMPLETED;
    context.completedAt = new Date();
    
    // Update statistics
    this.sagaStatistics.activeSagas--;
    this.sagaStatistics.completedSagas++;
    
    // Publish saga completed event
    if (this.eventBus) {
      const sagaCompletedEvent: SagaEvent = {
        id: this.generateEventId(),
        type: 'SagaCompleted',
        timestamp: new Date(),
        data: { sagaId },
        sagaId,
        sagaEventType: SagaEventType.SAGA_COMPLETED,
        correlationId: context.correlationId
      };
      
      await this.eventBus.publish('saga.completed', sagaCompletedEvent);
    }
  }
  
  private async handleStepFailure(
    sagaId: string,
    step: SagaOrchestrationStep,
    error: Error
  ): Promise<void> {
    const context = this.activeSagas.get(sagaId);
    if (!context) return;
    
    // Update step history
    const stepHistory = context.stepHistory.find(h => h.stepId === step.stepId);
    if (stepHistory) {
      stepHistory.status = 'failed';
      stepHistory.endedAt = new Date();
      stepHistory.error = error.message;
    }
    
    // Publish step failed event
    if (this.eventBus) {
      const stepFailedEvent: SagaEvent = {
        id: this.generateEventId(),
        type: 'SagaStepFailed',
        timestamp: new Date(),
        data: { stepId: step.stepId, error: error.message },
        sagaId,
        stepId: step.stepId,
        sagaEventType: SagaEventType.SAGA_STEP_FAILED,
        correlationId: context.correlationId
      };
      
      await this.eventBus.publish('saga.step.failed', stepFailedEvent);
    }
  }
  
  private async handleCompensation(
    context: SagaOrchestrationContext,
    sagaDefinition: SagaDefinition
  ): Promise<void> {
    const compensationStrategy = sagaDefinition.compensationStrategy || CompensationStrategy.COMPENSATE_ALL;
    
    switch (compensationStrategy) {
      case CompensationStrategy.COMPENSATE_ALL:
        await this.compensateAllSteps(context, sagaDefinition);
        break;
        
      case CompensationStrategy.COMPENSATE_FAILED_ONLY:
        // Only compensate the failed step
        break;
        
      case CompensationStrategy.COMPENSATE_BACKWARDS:
        await this.compensateBackwards(context, sagaDefinition);
        break;
        
      case CompensationStrategy.NO_COMPENSATION:
        // No compensation
        break;
    }
  }
  
  private async compensateAllSteps(
    context: SagaOrchestrationContext,
    sagaDefinition: SagaDefinition
  ): Promise<void> {
    // Compensate all completed steps in reverse order
    for (let i = context.currentStepIndex - 1; i >= 0; i--) {
      const step = sagaDefinition.steps[i];
      if (step.compensation) {
        await this.executeCompensation(context, step);
      }
    }
    
    context.status = SagaStatus.COMPENSATED;
    context.completedAt = new Date();
    
    // Update statistics
    this.sagaStatistics.activeSagas--;
    this.sagaStatistics.compensatedSagas++;
  }
  
  private async compensateBackwards(
    context: SagaOrchestrationContext,
    sagaDefinition: SagaDefinition
  ): Promise<void> {
    // Compensate from current step backwards
    for (let i = context.currentStepIndex; i >= 0; i--) {
      const step = sagaDefinition.steps[i];
      if (step.compensation) {
        await this.executeCompensation(context, step);
      }
    }
    
    context.status = SagaStatus.COMPENSATED;
    context.completedAt = new Date();
    
    // Update statistics
    this.sagaStatistics.activeSagas--;
    this.sagaStatistics.compensatedSagas++;
  }
  
  private async executeCompensation(
    context: SagaOrchestrationContext,
    step: SagaOrchestrationStep
  ): Promise<void> {
    // Execute compensation command
    // This would typically use a command bus
    
    // Update step history
    const stepHistory = context.stepHistory.find(h => h.stepId === step.stepId);
    if (stepHistory) {
      stepHistory.status = 'compensated';
    }
    
    // Publish compensation event
    if (this.eventBus) {
      const compensationEvent: SagaEvent = {
        id: this.generateEventId(),
        type: 'SagaStepCompensated',
        timestamp: new Date(),
        data: { stepId: step.stepId },
        sagaId: context.sagaId,
        stepId: step.stepId,
        sagaEventType: SagaEventType.SAGA_STEP_COMPENSATED,
        correlationId: context.correlationId
      };
      
      await this.eventBus.publish('saga.step.compensated', compensationEvent);
    }
  }
  
  private async simulateStepExecution(
    step: SagaOrchestrationStep,
    context: SagaOrchestrationContext
  ): Promise<void> {
    // Simulate step execution delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate random failure (for testing)
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error(`Step ${step.stepId} failed`);
    }
  }
  
  private generateSagaId(): string {
    return `saga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Saga Definition Builder - fluent API for creating saga definitions
 */
export class SagaDefinitionBuilder {
  private definition: Partial<SagaDefinition> = {
    steps: []
  };
  
  constructor(private name: string) {
    this.definition.name = name;
  }
  
  version(version: string): SagaDefinitionBuilder {
    this.definition.version = version;
    return this;
  }
  
  strategy(strategy: SagaOrchestrationStrategy): SagaDefinitionBuilder {
    this.definition.strategy = strategy;
    return this;
  }
  
  addStep(step: SagaOrchestrationStep): SagaDefinitionBuilder {
    this.definition.steps!.push(step);
    return this;
  }
  
  globalTimeout(timeout: number): SagaDefinitionBuilder {
    this.definition.globalTimeout = timeout;
    return this;
  }
  
  globalRetryConfig(config: StepRetryConfig): SagaDefinitionBuilder {
    this.definition.globalRetryConfig = config;
    return this;
  }
  
  compensationStrategy(strategy: CompensationStrategy): SagaDefinitionBuilder {
    this.definition.compensationStrategy = strategy;
    return this;
  }
  
  build(): SagaDefinition {
    if (!this.definition.version) {
      throw new Error('Version is required');
    }
    
    if (!this.definition.strategy) {
      throw new Error('Strategy is required');
    }
    
    return this.definition as SagaDefinition;
  }
}

/**
 * Helper function to create saga definition builder
 */
export function createSagaDefinition(name: string): SagaDefinitionBuilder {
  return new SagaDefinitionBuilder(name);
}

// Placeholder for EventBus interface (would be imported from actual implementation)
interface EventBus {
  publish(topic: string, event: SagaEvent): Promise<void>;
}
