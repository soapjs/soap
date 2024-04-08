export abstract class Server<T> {
  abstract app: T;
  abstract init(): Promise<T>;
  abstract start(): Promise<T>;
}
