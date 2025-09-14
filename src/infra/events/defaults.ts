/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  EventValidationError,
  EventParsingError,
  HandlerExecutionError,
} from "./errors";
import { EventBase } from "./event-base";
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
   * Processes an event message by validating and passing it to the handler.
   *
   * @param {EventBase<MessageType, HeadersType>} message - The event message received from the event bus.
   * @param {(event: EventBase<MessageType, HeadersType>) => Promise<void>} handler - The handler function to process the event.
   * @throws {EventValidationError} If the message fails validation.
   * @throws {HandlerExecutionError} If the handler function throws an error during execution.
   * @returns {Promise<void>} A promise that resolves when the message is successfully processed.
   */
  async process(
    message: EventBase<MessageType, HeadersType>,
    handler: (event: EventBase<MessageType, HeadersType>) => Promise<void>
  ): Promise<void> {
    try {
      // Validate the message
      this.validateMessage(message);

      // Execute the handler with full event context
      await handler(message);
    } catch (error) {
      if (error instanceof EventValidationError) {
        throw new EventValidationError(`Validation failed: ${error.message}`);
      } else if (error instanceof EventParsingError) {
        throw new EventParsingError(`Parsing failed: ${error.message}`);
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new HandlerExecutionError(
          `Handler execution failed: ${errorMessage}`
        );
      }
    }
  }



  /**
   * Validates the event message to ensure it meets required criteria.
   *
   * @private
   * @param {EventBase<MessageType, HeadersType>} message - The event message to validate.
   * @throws {EventValidationError} If the message fails validation.
   */
  private validateMessage(message: EventBase<MessageType, HeadersType>): void {
    if (!message) {
      throw new EventValidationError("Message validation failed");
    }
    if (!message.message) {
      throw new EventValidationError("Message payload is required");
    }
  }
}
