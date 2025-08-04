import { Result } from "../common/result";

/**
 * Base interface for all commands in CQRS pattern
 * Commands represent write operations that change the system state
 */
export interface Command<TResult = void> {
  /**
   * Unique identifier for the command
   */
  readonly commandId?: string;
  
  /**
   * Timestamp when the command was created
   */
  readonly timestamp?: Date;
  
  /**
   * User or system that initiated the command
   */
  readonly initiatedBy?: string;
  
  /**
   * Correlation ID for tracking related operations
   */
  readonly correlationId?: string;
}

/**
 * Base class for commands with common properties
 */
export abstract class BaseCommand<TResult = void> implements Command<TResult> {
  public readonly commandId: string;
  public readonly timestamp: Date;
  public readonly initiatedBy?: string;
  public readonly correlationId?: string;

  constructor(initiatedBy?: string, correlationId?: string) {
    this.commandId = this.generateCommandId();
    this.timestamp = new Date();
    this.initiatedBy = initiatedBy;
    this.correlationId = correlationId;
  }

  /**
   * Generate a unique command ID
   */
  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Command handler interface
 * Handlers process commands and return results
 */
export interface CommandHandler<TCommand extends Command<TResult>, TResult = void> {
  /**
   * Handle the command and return a result
   */
  handle(command: TCommand): Promise<Result<TResult>>;
}

/**
 * Command bus interface for dispatching commands
 */
export interface CommandBus {
  /**
   * Dispatch a command to its handler
   */
  dispatch<TResult>(command: Command<TResult>): Promise<Result<TResult>>;
  
  /**
   * Register a command handler
   */
  register<TCommand extends Command<TResult>, TResult>(
    commandType: new (...args: any[]) => TCommand,
    handler: CommandHandler<TCommand, TResult>
  ): void;
} 