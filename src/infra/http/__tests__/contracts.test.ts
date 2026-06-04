import { isHttpContract, normalizeContracts } from '../contracts';

describe('HttpContract helpers', () => {
  it('isHttpContract narrows contract shapes', () => {
    expect(isHttpContract({ kind: 'zod', schema: {}, target: 'body' })).toBe(true);
    expect(isHttpContract(null)).toBe(false);
  });

  it('normalizeContracts flattens single and array', () => {
    const one = { kind: 'zod', schema: 1, target: 'body' as const };
    expect(normalizeContracts(one)).toEqual([one]);
    expect(normalizeContracts([one, { kind: 'joi', schema: 2, target: 'query' }])).toHaveLength(2);
    expect(normalizeContracts(undefined)).toEqual([]);
  });
});
