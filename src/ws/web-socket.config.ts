export interface WebSocketConfig {
  port: number;
  path: string;
  pingInterval?: number;
  pingTimeout?: number;
  maxPayload?: number;
  [key: string]: unknown;
}
