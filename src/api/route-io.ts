/* eslint-disable @typescript-eslint/no-explicit-any */

import { Result } from "../architecture";

export abstract class RouteIO<
  I = unknown,
  O = unknown,
  RequestType = unknown,
  ResponseType = unknown
> {
  public abstract toResponse?(response: ResponseType, result?: Result<O>): void;
  public abstract fromRequest?(request: RequestType, ...args: unknown[]): I;
}
