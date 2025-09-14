/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * IO interface that defines methods for converting between different data types.
 * This interface is protocol-agnostic and can be used with HTTP, WebSocket, gRPC, or any other protocol.
 * 
 * @template I The input type, typically representing the data extracted from the source.
 * @template O The output type, typically representing the data to be sent to the target.
 */
export interface IO<I = unknown, O = unknown> {
  /**
   * Extracts and transforms data from a source object.
   * The source can be any type (Request, Socket, Event, gRPC context, etc.).
   * The IO implementation doesn't need to know the protocol - it only transforms data.
   * 
   * @template T The type of the source object.
   * @param {T} source - The source object to extract data from.
   * @returns {I} The extracted and transformed data.
   */
  from<T>(source: T): I;

  /**
   * Sends the result data to a target object.
   * The target can be any type (Response, Socket, Event, gRPC response, etc.).
   * The IO implementation doesn't need to know the protocol - it only sends data.
   * 
   * @template T The type of the target object.
   * @param {O} result - The result data to be sent.
   * @param {T} target - The target object to send the data to.
   */
  to<T>(result: O, target: T): void;
}
