/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyFunction } from "../route.types";

export type CommonMiddlewares =
  | "security"
  | "session"
  | "compression"
  | "cors"
  | "rate_limit"
  | "validation"
  | "only_authenticated"
  | "only_non_authenticated";

export class MiddlewareRegistry extends Map<string, AnyFunction> {}
