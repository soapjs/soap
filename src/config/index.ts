/* eslint-disable @typescript-eslint/no-explicit-any */

export * from "./config-vars";
export * from "./config.utils";

export type Config = {
  port: number;
  [key: string]: any;
};
