/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Dependencies<ContainerType = unknown> {
  readonly container: ContainerType;
  configure(...args: unknown[]): void;
}
