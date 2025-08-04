import { BaseCommand, Command, CommandHandler, CommandBus } from '../command';
import { Result } from '../../common/result';

describe('Command Pattern', () => {
  describe('BaseCommand', () => {
    class TestCommand extends BaseCommand<string> {
      constructor(
        public readonly data: string,
        initiatedBy?: string,
        correlationId?: string
      ) {
        super(initiatedBy, correlationId);
      }
    }

    it('should create a command with unique ID', () => {
      const command = new TestCommand('test data');
      
      expect(command.commandId).toBeDefined();
      expect(command.commandId).toMatch(/^cmd_\d+_[a-z0-9]+$/);
      expect(command.timestamp).toBeInstanceOf(Date);
    });

    it('should create a command with custom initiatedBy and correlationId', () => {
      const command = new TestCommand('test data', 'user-123', 'corr-456');
      
      expect(command.initiatedBy).toBe('user-123');
      expect(command.correlationId).toBe('corr-456');
    });

    it('should have different IDs for different commands', () => {
      const command1 = new TestCommand('data1');
      const command2 = new TestCommand('data2');
      
      expect(command1.commandId).not.toBe(command2.commandId);
    });
  });

  describe('CommandHandler', () => {
    class TestCommand extends BaseCommand<string> {
      constructor(public readonly data: string) {
        super();
      }
    }

    class TestCommandHandler implements CommandHandler<TestCommand, string> {
      async handle(command: TestCommand): Promise<Result<string>> {
        return Result.withSuccess(`Processed: ${command.data}`);
      }
    }

    it('should handle command and return success result', async () => {
      const handler = new TestCommandHandler();
      const command = new TestCommand('test data');
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(result.content).toBe('Processed: test data');
    });
  });

  describe('CommandBus', () => {
    class TestCommand extends BaseCommand<string> {
      constructor(public readonly data: string) {
        super();
      }
    }

    class TestCommandHandler implements CommandHandler<TestCommand, string> {
      async handle(command: TestCommand): Promise<Result<string>> {
        return Result.withSuccess(`Processed: ${command.data}`);
      }
    }

    class MockCommandBus implements CommandBus {
      private handlers = new Map<string, CommandHandler<any, any>>();

      async dispatch<TResult>(command: Command<TResult>): Promise<Result<TResult>> {
        const handler = this.handlers.get(command.constructor.name);
        if (!handler) {
          return Result.withFailure(new Error('No handler registered'));
        }
        return handler.handle(command);
      }

      register<TCommand extends Command<TResult>, TResult>(
        commandType: new (...args: any[]) => TCommand,
        handler: CommandHandler<TCommand, TResult>
      ): void {
        this.handlers.set(commandType.name, handler);
      }
    }

    it('should register and dispatch commands', async () => {
      const bus = new MockCommandBus();
      const handler = new TestCommandHandler();
      
      bus.register(TestCommand, handler);
      
      const command = new TestCommand('test data');
      const result = await bus.dispatch(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(result.content).toBe('Processed: test data');
    });

    it('should return failure when no handler is registered', async () => {
      const bus = new MockCommandBus();
      const command = new TestCommand('test data');
      
      const result = await bus.dispatch(command);
      
      expect(result.isFailure()).toBe(true);
      expect(result.failure.error.message).toBe('No handler registered');
    });
  });
}); 