export interface Event<TData = Record<string, unknown>> {
  readonly id?: string;
  readonly type: string;
  readonly timestamp: Date;
  readonly data: TData;
}

export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  source?: string;
  [key: string]: unknown;
}