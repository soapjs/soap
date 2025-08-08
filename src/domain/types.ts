/* eslint-disable @typescript-eslint/no-explicit-any */
export type UpdateStats = {
  status: string;
  modifiedCount?: number;
  upsertedCount?: number;
  upsertedIds?: unknown[];
};

export type RemoveStats = {
  status: string;
  deletedCount?: number;
};

export type AnyObject = Record<string, unknown>;
export type DbQuery = unknown;
export type Sort = { [field: string]: number };
export type Filter = { field: string; name: string };
