/* eslint-disable @typescript-eslint/no-unused-vars */
import { Result } from "../architecture";
import { RouteResponse, RouteRequest } from "./api.types";

export abstract class RouteIO<
  RequestType extends RouteRequest = RouteRequest,
  ResponseType extends RouteResponse = RouteResponse,
  InputType = unknown,
  OutputType extends Result = Result
> {
  public abstract toResponse?(output: OutputType): ResponseType;
  public abstract fromRequest?(
    request: RequestType | unknown,
    ...args: unknown[]
  ): InputType;
}
