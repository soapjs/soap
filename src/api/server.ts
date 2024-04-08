export abstract class SoapServer<T> {
  abstract app: T;
  abstract init(): Promise<T>;
  abstract start(): Promise<T>;
}
