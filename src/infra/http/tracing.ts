/**
 * Tracing ports for HTTP apps. Implement in `@soapjs/soap-node-otel` (noop or OpenTelemetry).
 */
export interface Span {
  readonly traceId: string;
  readonly spanId: string;
  setAttribute(key: string, value: unknown): void;
  end(): void;
}

export interface Tracer {
  startSpan(name: string, attributes?: Record<string, unknown>): Span;
}

export namespace Tracer {
  export const Token = 'Tracer';
}
