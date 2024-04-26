/* eslint-disable @typescript-eslint/no-explicit-any */

import { Result } from "../architecture";
import { RouteResponse, RouteRequest } from "./route.types";

export abstract class RouteIO<T = any, K = any> {
  public abstract toResponse?(
    response: RouteResponse,
    result?: Result<K>
  ): RouteResponse;
  public abstract fromRequest?(request: RouteRequest, ...args: unknown[]): T;
}
