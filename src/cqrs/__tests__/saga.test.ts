import { BaseSaga, Saga, SagaStep, SagaStatus, SagaManager } from '../saga';
import { BaseCommand } from '../command';
import { BaseDomainEvent } from '../../domain/domain-event';
import { Result } from '../../common/result';

class TestCommand extends BaseCommand<string> {
    constructor(public readonly data: string) {
      super();
    }
  }

  class TestEvent extends BaseDomainEvent<{ data: string }> {
    constructor(data: string) {
      super('TestEvent', 'test-aggregate', { data });
    }

    get eventData(): string {
      return this.data.data;
    }
  }

  class TestSaga extends BaseSaga {
    constructor(name: string, steps: SagaStep[] = []) {
      super(name, steps);
    }
  }

describe('Saga Pattern', () => {
  

  describe('SagaStep', () => {
    it('should create saga step with required properties', () => {
      const command = new TestCommand('test data');
      const compensation = new TestCommand('compensation data');
      
      const step: SagaStep = {
        stepId: 'step-1',
        name: 'Test Step',
        command,
        compensation,
        completed: false,
        compensated: false
      };
      
      expect(step.stepId).toBe('step-1');
      expect(step.name).toBe('Test Step');
      expect(step.command).toBe(command);
      expect(step.compensation).toBe(compensation);
      expect(step.completed).toBe(false);
      expect(step.compensated).toBe(false);
    });
  });

  describe('BaseSaga', () => {


    it('should create saga with basic properties', () => {
      const saga = new TestSaga('Test Saga');
      
      expect(saga.sagaId).toBeDefined();
      expect(saga.sagaId).toMatch(/^saga_\d+_[a-z0-9]+$/);
      expect(saga.name).toBe('Test Saga');
      expect(saga.status).toBe(SagaStatus.PENDING);
      expect(saga.steps).toHaveLength(0);
      expect(saga.currentStepIndex).toBe(0);
    });

    it('should create saga with steps', () => {
      const command = new TestCommand('test data');
      const step: SagaStep = {
        stepId: 'step-1',
        name: 'Test Step',
        command,
        completed: false,
        compensated: false
      };
      
      const saga = new TestSaga('Test Saga', [step]);
      
      expect(saga.steps).toHaveLength(1);
      expect(saga.steps[0]).toBe(step);
    });

    it('should execute next step', async () => {
      const command = new TestCommand('test data');
      const step: SagaStep = {
        stepId: 'step-1',
        name: 'Test Step',
        command,
        completed: false,
        compensated: false
      };
      
      const saga = new TestSaga('Test Saga', [step]);
      
      const result = await saga.executeNextStep();
      
      expect(result.isSuccess()).toBe(true);
      expect(saga.currentStepIndex).toBe(1);
    });

    it('should complete saga when all steps are executed', async () => {
      const command = new TestCommand('test data');
      const step: SagaStep = {
        stepId: 'step-1',
        name: 'Test Step',
        command,
        completed: false,
        compensated: false
      };
      
      const saga = new TestSaga('Test Saga', [step]);
      
      await saga.executeNextStep();
      
      expect(saga.status).toBe(SagaStatus.COMPLETED);
    });

    it('should fail saga on error', async () => {
      const command = new TestCommand('test data');
      const step: SagaStep = {
        stepId: 'step-1',
        name: 'Test Step',
        command,
        completed: false,
        compensated: false
      };
      
      const saga = new TestSaga('Test Saga', [step]);
      
      // Mock the executeNextStep to throw an error
      jest.spyOn(saga, 'executeNextStep').mockImplementationOnce(async () => {
        const error = new Error('Test error');
        return saga.fail(error);
      });
      
      const result = await saga.executeNextStep();
      
      expect(result.isFailure()).toBe(true);
      expect(saga.status).toBe(SagaStatus.FAILED);
    });

    it('should compensate saga', async () => {
      const command = new TestCommand('test data');
      const compensation = new TestCommand('compensation data');
      const step: SagaStep = {
        stepId: 'step-1',
        name: 'Test Step',
        command,
        compensation,
        completed: false,
        compensated: false
      };
      
      const saga = new TestSaga('Test Saga', [step]);
      
      // Execute one step first
      await saga.executeNextStep();
      
      // Then compensate
      const result = await saga.compensate();
      
      expect(result.isSuccess()).toBe(true);
      expect(saga.status).toBe(SagaStatus.COMPENSATED);
    });

    it('should complete saga', async () => {
      const saga = new TestSaga('Test Saga');
      
      const result = await saga.complete();
      
      expect(result.isSuccess()).toBe(true);
      expect(saga.status).toBe(SagaStatus.COMPLETED);
    });

    it('should fail saga', async () => {
      const saga = new TestSaga('Test Saga');
      const error = new Error('Test error');
      
      const result = await saga.fail(error);
      
      expect(result.isFailure()).toBe(true);
      expect(saga.status).toBe(SagaStatus.FAILED);
    });
  });

  describe('Saga Interface', () => {
    it('should implement Saga interface', () => {
      const saga: Saga = new TestSaga('Test Saga');
      
      expect(saga.sagaId).toBeDefined();
      expect(saga.name).toBeDefined();
      expect(saga.status).toBeDefined();
      expect(saga.steps).toBeDefined();
      expect(saga.currentStepIndex).toBeDefined();
      expect(typeof saga.executeNextStep).toBe('function');
      expect(typeof saga.compensate).toBe('function');
      expect(typeof saga.complete).toBe('function');
      expect(typeof saga.fail).toBe('function');
    });
  });

  describe('SagaManager', () => {
    class MockSagaManager implements SagaManager {
      private sagas = new Map<string, Saga>();

      async startSaga(saga: Saga): Promise<Result<void>> {
        this.sagas.set(saga.sagaId, saga);
        return Result.withSuccess();
      }

      async getSaga(sagaId: string): Promise<Result<Saga>> {
        const saga = this.sagas.get(sagaId);
        if (!saga) {
          return Result.withFailure(new Error('Saga not found'));
        }
        return Result.withSuccess(saga);
      }

      async getSagas(): Promise<Result<Saga[]>> {
        return Result.withSuccess(Array.from(this.sagas.values()));
      }

      async getSagasByStatus(status: SagaStatus): Promise<Result<Saga[]>> {
        const sagas = Array.from(this.sagas.values()).filter(s => s.status === status);
        return Result.withSuccess(sagas);
      }

      async handleSagaEvent(event: any): Promise<Result<void>> {
        // Mock implementation
        return Result.withSuccess();
      }
    }

    it('should start and retrieve saga', async () => {
      const manager = new MockSagaManager();
      const saga = new TestSaga('Test Saga');
      
      const startResult = await manager.startSaga(saga);
      expect(startResult.isSuccess()).toBe(true);
      
      const getResult = await manager.getSaga(saga.sagaId);
      expect(getResult.isSuccess()).toBe(true);
      expect(getResult.content).toBe(saga);
    });

    it('should return failure for non-existent saga', async () => {
      const manager = new MockSagaManager();
      
      const result = await manager.getSaga('non-existent');
      
      expect(result.isFailure()).toBe(true);
      expect(result.failure.error.message).toBe('Saga not found');
    });

    it('should get all sagas', async () => {
      const manager = new MockSagaManager();
      const saga1 = new TestSaga('Saga 1');
      const saga2 = new TestSaga('Saga 2');
      
      await manager.startSaga(saga1);
      await manager.startSaga(saga2);
      
      const result = await manager.getSagas();
      
      expect(result.isSuccess()).toBe(true);
      expect(result.content).toHaveLength(2);
    });

    it('should get sagas by status', async () => {
      const manager = new MockSagaManager();
      const saga1 = new TestSaga('Saga 1');
      const saga2 = new TestSaga('Saga 2');
      
      await manager.startSaga(saga1);
      await manager.startSaga(saga2);
      
      // Complete one saga
      await saga1.complete();
      
      const result = await manager.getSagasByStatus(SagaStatus.COMPLETED);
      
      expect(result.isSuccess()).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toBe(saga1);
    });
  });
}); 