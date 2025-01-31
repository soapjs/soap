/* eslint-disable @typescript-eslint/no-explicit-any */
import { Result } from "../common/result";
import { Transaction } from "./transaction";

export class AutoTransaction<T> extends Transaction<T> {
  constructor(
    private thisRef: any,
    private method: (...args: any[]) => Result<T>,
    private args: unknown[],
    sessionComponents: any[] = []
  ) {
    super(...sessionComponents);
  }

  public async execute(): Promise<Result<T>> {
    return this.method.apply(this.thisRef, this.args);
  }
}
