import type { ApiDocFragment } from './api-doc';

/**
 * Opaque HTTP contract — validation + schema emission are implemented by
 * adapters (`@soapjs/soap-contract-zod`, TypeBox, Joi, …) in the application.
 */
export interface HttpContract<TSchema = unknown> {
  readonly kind: string;
  readonly schema: TSchema;
  readonly target: 'body' | 'query' | 'params';
}

/** Metadata merged into {@link ApiDocFragment} by contract adapters. */
export interface RouteContractMeta {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  security?: ApiDocFragment['security'];
  responses?: ApiDocFragment['responses'];
  deprecated?: boolean;
}

export function isHttpContract(value: unknown): value is HttpContract {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    'schema' in value &&
    'target' in value
  );
}

export function normalizeContracts(
  contract: HttpContract | HttpContract[] | undefined,
): HttpContract[] {
  if (!contract) return [];
  return Array.isArray(contract) ? contract : [contract];
}
