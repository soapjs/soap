/* eslint-disable @typescript-eslint/no-explicit-any */

import { HandlerResult } from "./types";

/**
 * RouteIO interface that defines methods for converting between request and response types.
 * @template I The input type, typically representing the data extracted from the request.
 * @template O The output type, typically representing the data to be sent in the response.
 * @template RequestType The type of the incoming request.
 * @template ResponseType The type of the outgoing response.
 */
export interface RouteIO<
  I = unknown,
  O = unknown,
  RequestType = unknown,
  ResponseType = unknown
> {
  /**
   * Converts the result into a response and sends it to the user.
   * Failure to send a response may result in a hanging request without a response.
   * @param {ResponseType} response - The response object to be populated and sent.
   * @param {HandlerResult<O>} [result] - The result data to be sent in the response (optional).
   */
  toResponse?(response: ResponseType, result?: HandlerResult<O>): void;

  /**
   * Extracts data from the request.
   * @param {RequestType} request - The incoming request object.
   * @param {...unknown[]} args - Additional arguments that may be needed for extraction.
   * @returns {I} The extracted data.
   */
  fromRequest?(request: RequestType, ...args: unknown[]): I;
}
