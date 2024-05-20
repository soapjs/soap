/* eslint-disable @typescript-eslint/no-explicit-any */

export type ApiConfig = {
  port?: number;
  host?: string;
  json?: any;
  urlencoded?: any;
  cors?: any;
  rateLimit?: any;
  security?: any;
  logger?: any;
  compression?: any;
  session?: any;
  [key: string]: any;
};
