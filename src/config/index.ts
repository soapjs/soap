/* eslint-disable @typescript-eslint/no-explicit-any */

import { ApiConfig } from "../api";
import { EventConfig } from "../event";
import { WebSocketConfig } from "../ws";

export * from "./config-vars";
export * from "./config.utils";

export type Config = {
  api?: ApiConfig;
  socket?: WebSocketConfig;
  event?: EventConfig;
  logger?: any;
  [key: string]: any;
};
