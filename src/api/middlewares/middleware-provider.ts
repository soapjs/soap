/* eslint-disable @typescript-eslint/no-explicit-any */
import { WebFrameworkMiddleware } from "../web-framework";

export interface MiddlewareProvider {
  getMiddleware(...args: any[]): WebFrameworkMiddleware;
}
