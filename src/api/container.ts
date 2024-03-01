/* eslint-disable @typescript-eslint/no-explicit-any */

export class Container {
  private container: Map<string, any> = new Map();

  public bind(key: string, value: any) {
    this.container.set(key, value);
  }

  public get<T>(key: string): T {
    return this.container.get(key);
  }
}
