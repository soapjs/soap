/* eslint-disable @typescript-eslint/no-explicit-any */

export abstract class Middleware {
  abstract init?(...args: any[]): void | Promise<void>;
  abstract use?(...args: any[]): any;
}
