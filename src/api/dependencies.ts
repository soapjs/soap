/* eslint-disable @typescript-eslint/no-explicit-any */

export abstract class Dependencies<ContainerType = any, ConfigType = any> {
  constructor(
    protected container: ContainerType,
    protected config: ConfigType
  ) {}

  abstract configure(...args: unknown[]): void;
}
