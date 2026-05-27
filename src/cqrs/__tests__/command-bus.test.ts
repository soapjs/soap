import { InMemoryCommandBus } from '../command-bus.impl';
import { BaseCommand, CommandHandler } from '../command';
import { Result } from '../../common/result';

class CreateUserCommand extends BaseCommand<string> {
  constructor(public readonly name: string) {
    super();
  }
}

class CreateUserHandler implements CommandHandler<CreateUserCommand, string> {
  async handle(command: CreateUserCommand): Promise<Result<string>> {
    return Result.withSuccess(`user-${command.name}`);
  }
}

describe('InMemoryCommandBus', () => {
  let bus: InMemoryCommandBus;

  beforeEach(() => {
    bus = new InMemoryCommandBus();
  });

  it('dispatches a command to a registered handler', async () => {
    bus.register(CreateUserCommand, new CreateUserHandler());

    const result = await bus.dispatch(new CreateUserCommand('Alice'));

    expect(result.isSuccess()).toBe(true);
    expect(result.content).toBe('user-Alice');
  });

  it('returns failure when no handler is registered', async () => {
    const result = await bus.dispatch(new CreateUserCommand('Bob'));

    expect(result.isFailure()).toBe(true);
    expect(result.failure?.error.message).toMatch(/No handler registered for command/);
  });

  it('returns failure propagated from handler', async () => {
    const failingHandler: CommandHandler<CreateUserCommand, string> = {
      async handle() {
        return Result.withFailure(new Error('handler error'));
      },
    };
    bus.register(CreateUserCommand, failingHandler);

    const result = await bus.dispatch(new CreateUserCommand('Carol'));

    expect(result.isFailure()).toBe(true);
    expect(result.failure?.error.message).toBe('handler error');
  });
});
