/* eslint-disable @typescript-eslint/no-explicit-any */

export abstract class Dependencies<ContainerType = unknown> {
  public container: ContainerType;
  abstract configure(...args: unknown[]): void;
}
