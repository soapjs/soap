/**
 * Removes undefined properties recursively from an object or array.
 * @param {unknown} input - The input object or array.
 * @returns {T} - The output object or array with undefined properties removed.
 */
export const removeUndefinedProperties = <T>(input: unknown): T => {
  if (Array.isArray(input)) {
    return input.reduce((acc, value) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          acc.push(removeUndefinedProperties(value));
        } else if (value?.constructor.name === "Object") {
          const cleared = removeUndefinedProperties(value);
          acc.push(cleared);
        } else {
          acc.push(value);
        }
      }

      return acc;
    }, []);
  }

  const output = {};

  for (const key of Object.keys(input)) {
    const value = input[key];

    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      output[key] = removeUndefinedProperties(value);
    } else if (value?.constructor.name === "Object") {
      const cleared = removeUndefinedProperties(value);
      output[key] = cleared;
    } else {
      output[key] = value;
    }
  }
  return output as T;
};
