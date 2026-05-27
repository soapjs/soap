/* eslint-disable @typescript-eslint/no-explicit-any */
import { Result } from "../common/result";
import { Command, CommandBus, CommandHandler } from "./command";

export class InMemoryCommandBus implements CommandBus {
  private handlers = new Map<string, CommandHandler<any, any>>();

  register<TCommand extends Command<TResult>, TResult>(
    commandType: new (...args: any[]) => TCommand,
    handler: CommandHandler<TCommand, TResult>
  ): void {
    this.handlers.set(commandType.name, handler);
  }

  async dispatch<TResult>(command: Command<TResult>): Promise<Result<TResult>> {
    const handlerKey = command.constructor.name;
    const handler = this.handlers.get(handlerKey);

    if (!handler) {
      return Result.withFailure(
        new Error(`No handler registered for command: ${handlerKey}`)
      );
    }

    return handler.handle(command as any);
  }
}
