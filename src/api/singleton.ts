/* eslint-disable @typescript-eslint/no-explicit-any */

export class Singleton {
  private static container: Record<string, any>;

  static bind(key: string, value: any) {
    if (!Singleton.container) {
      Singleton.container = {};
    }
    Singleton.container[key] = value;
  }

  static get<T>(key: string): T {
    if (!Singleton.container || !Singleton.container[key]) {
      throw new Error(`Dependency '${key}' not registered`);
    }
    return Singleton.container[key];
  }
}
