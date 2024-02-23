export const removeUndefinedProperties = <T>(input: unknown): T => {
  const output = Array.isArray(input) ? [] : {};
  for (const key of Object.keys(input)) {
    const value = input[key];

    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      output[key] = removeUndefinedProperties(value);
      continue;
    }

    if (value.constructor.name === 'Object') {
      const cleared = removeUndefinedProperties(value);
      output[key] = cleared;
      continue;
    }

    output[key] = value;
  }
  return output as T;
};
