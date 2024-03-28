/* eslint-disable @typescript-eslint/no-explicit-any */

export abstract class Dependencies {
  abstract configure(...args: unknown[]): void;
}
