/* eslint-disable @typescript-eslint/no-explicit-any */

export abstract class EventBus {
  public abstract connect(): Promise<void>;
  public abstract publish(event: string, data: any): Promise<void>;
  public abstract subscribe(
    event: string,
    handler: (data: any) => void
  ): Promise<void>;
}
