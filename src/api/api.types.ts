import { Socket } from 'net';
import { RouteIO } from './route-io';

export type RouteResponse<T = unknown> = {
  body?: T;
  status: number;
  type?: string;
  headers?: object;
  socket?: Socket;
};

export interface RouteRequest<BodyType = unknown, ParamsType = object, QueryType = unknown> {
  body: BodyType;
  params: ParamsType;
  query: QueryType;
  headers: object;
  [key: string]: unknown;
}

export type RouteHooks = {
  pre?: <T = Request>(request: T) => unknown;
  post?: (output?: any) => unknown;
};

export type ValidationResult = {
  valid: boolean;
  message?: string;
  code?: number;
  errors?: string[];
};

export type Validators = {
  request?: (...args: unknown[]) => ValidationResult;
  response?: {
    [status: number]: (...args: unknown[]) => ValidationResult;
  };
};

export type RouteOptions = {
  hooks?: RouteHooks;
  io?: RouteIO;
  validators?: Validators;
  authorization?: (request: RouteRequest) => boolean;
};

export type RouteHandler = (input?: any, ...args: unknown[]) => any;
