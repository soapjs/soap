import { Result } from "../common/result";
import { Command } from "./command";
import { DomainEvent } from "./event";

/**
 * Saga step interface
 */
export interface SagaStep {
  /**
   * Unique identifier for the step
   */
  readonly stepId: string;
  
  /**
   * Step name/description
   */
  readonly name: string;
  
  /**
   * Command to execute
   */
  readonly command: Command;
  
  /**
   * Compensation command (for rollback)
   */
  readonly compensation?: Command;
  
  /**
   * Whether this step has been completed
   */
  readonly completed: boolean;
  
  /**
   * Whether this step has been compensated
   */
  readonly compensated: boolean;
}

/**
 * Saga interface for handling distributed transactions
 */
export interface Saga {
  /**
   * Unique identifier for the saga
   */
  readonly sagaId: string;
  
  /**
   * Saga name/description
   */
  readonly name: string;
  
  /**
   * Current status of the saga
   */
  readonly status: SagaStatus;
  
  /**
   * Steps in the saga
   */
  readonly steps: SagaStep[];
  
  /**
   * Current step index
   */
  readonly currentStepIndex: number;
  
  /**
   * Execute the next step
   */
  executeNextStep(): Promise<Result<void>>;
  
  /**
   * Compensate the saga (rollback)
   */
  compensate(): Promise<Result<void>>;
  
  /**
   * Complete the saga
   */
  complete(): Promise<Result<void>>;
  
  /**
   * Fail the saga
   */
  fail(error: Error): Promise<Result<void>>;
}

/**
 * Saga status enum
 */
export enum SagaStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  COMPENSATED = 'compensated'
}

/**
 * Saga Manager for managing sagas
 */
export interface SagaManager {
  /**
   * Start a new saga
   */
  startSaga(saga: Saga): Promise<Result<void>>;
  
  /**
   * Get a saga by ID
   */
  getSaga(sagaId: string): Promise<Result<Saga>>;
  
  /**
   * Get all sagas
   */
  getSagas(): Promise<Result<Saga[]>>;
  
  /**
   * Get sagas by status
   */
  getSagasByStatus(status: SagaStatus): Promise<Result<Saga[]>>;
  
  /**
   * Handle saga events
   */
  handleSagaEvent(event: DomainEvent): Promise<Result<void>>;
}

/**
 * Base saga implementation
 */
export abstract class BaseSaga implements Saga {
  public readonly sagaId: string;
  public readonly name: string;
  public readonly steps: SagaStep[];

  private _status: SagaStatus;
  private _currentStepIndex: number;

  constructor(name: string, steps: SagaStep[] = []) {
    this.sagaId = this.generateSagaId();
    this.name = name;
    this._status = SagaStatus.PENDING;
    this.steps = steps;
    this._currentStepIndex = 0;
  }

  get status(): SagaStatus {
    return this._status;
  }

  get currentStepIndex(): number {
    return this._currentStepIndex;
  }

  /**
   * Generate a unique saga ID
   */
  private generateSagaId(): string {
    return `saga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Execute the next step
   */
  async executeNextStep(): Promise<Result<void>> {
    try {
      if (this._currentStepIndex >= this.steps.length) {
        return this.complete();
      }

      const step = this.steps[this._currentStepIndex];
      // Execute the command
      // This would typically use a command bus
      
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

  /**
   * Compensate the saga
   */
  async compensate(): Promise<Result<void>> {
    try {
      // Execute compensation commands in reverse order
      for (let i = this.currentStepIndex - 1; i >= 0; i--) {
        const step = this.steps[i];
        if (step.compensation) {
          // Execute compensation command
        }
      }
      
      this._status = SagaStatus.COMPENSATED;
      return Result.withSuccess();
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }

  /**
   * Complete the saga
   */
  async complete(): Promise<Result<void>> {
    this._status = SagaStatus.COMPLETED;
    return Result.withSuccess();
  }

  /**
   * Fail the saga
   */
  async fail(error: Error): Promise<Result<void>> {
    this._status = SagaStatus.FAILED;
    return Result.withFailure(error);
  }
} 