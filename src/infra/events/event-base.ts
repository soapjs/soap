/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Represents the base structure of an event, including its message payload and headers.
 *
 * @template MessageType - The type of the message payload.
 * @template HeadersType - The type of the headers metadata (default: Record<string, unknown>).
 */
export type EventBase<
  MessageType = unknown,
  HeadersType = Record<string, unknown>
> = {
  message: MessageType;
  headers: HeadersType;
  error?: Error;
};
