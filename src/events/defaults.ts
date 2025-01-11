/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  EventValidationError,
  EventParsingError,
  HandlerExecutionError,
} from "./errors";
import { EventProcessingStrategy } from "./types";

/**
 * Default strategy for processing event messages with validation, parsing, and error handling.
 *
 * This strategy ensures that incoming messages are parsed and validated before being passed to the handler.
 * It also categorizes errors into specific types for better error handling and debugging.
 *
 * @template MessageType - The type of the event's main payload (message).
 * @template HeadersType - The type of the event's headers metadata (default: `Record<string, unknown>`).
 */
export class DefaultEventProcessingStrategy<
  MessageType,
  HeadersType = Record<string, unknown>
> implements EventProcessingStrategy<MessageType, HeadersType>
{
  /**
   * Processes an event message by validating, parsing, and passing it to the handler.
   *
   * @param {unknown} message - The raw message received from the event bus.
   * @param {(payload: MessageType) => Promise<void>} handler - The handler function to process the parsed and validated payload.
   * @throws {EventValidationError} If the message fails validation.
   * @throws {EventParsingError} If the message cannot be parsed.
   * @throws {HandlerExecutionError} If the handler function throws an error during execution.
   * @returns {Promise<void>} A promise that resolves when the message is successfully processed.
   */
  async process(
    message: unknown,
    handler: (payload: MessageType) => Promise<void>
  ): Promise<void> {
    try {
      // Validate and parse the message
      const parsedMessage = this.parseMessage(message);
      this.validateMessage(parsedMessage);

      // Execute the handler
      await handler(parsedMessage);
    } catch (error) {
      if (error instanceof EventValidationError) {
        throw new EventValidationError(`Validation failed: ${error.message}`);
      } else if (error instanceof EventParsingError) {
        throw new EventParsingError(`Parsing failed: ${error.message}`);
      } else {
        throw new HandlerExecutionError(
          `Handler execution failed: ${error.message}`
        );
      }
    }
  }

  /**
   * Parses the raw message into the expected payload format.
   *
   * @private
   * @param {unknown} message - The raw message received from the event bus.
   * @throws {EventParsingError} If the message cannot be parsed into the expected format.
   * @returns {MessageType} The parsed payload.
   */
  private parseMessage(message: unknown): MessageType {
    try {
      return JSON.parse(message as string) as MessageType;
    } catch (error) {
      throw new EventParsingError("Failed to parse message");
    }
  }

  /**
   * Validates the parsed message to ensure it meets required criteria.
   *
   * @private
   * @param {MessageType} message - The parsed message to validate.
   * @throws {EventValidationError} If the message fails validation.
   */
  private validateMessage(message: MessageType): void {
    if (!message) {
      throw new EventValidationError("Message validation failed");
    }
  }
}
