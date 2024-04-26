import { removeUndefinedProperties } from "../utils";

describe("removeUndefinedProperties", () => {
  it("removes undefined properties from a flat object", () => {
    const input = { a: 1, b: undefined, c: "hello", d: null };
    const expected = { a: 1, c: "hello", d: null };
    expect(removeUndefinedProperties(input)).toEqual(expected);
  });

  it("removes undefined properties from a nested object", () => {
    const input = {
      a: 1,
      b: { c: undefined, d: "world", e: null },
      f: undefined,
    };
    const expected = { a: 1, b: { d: "world", e: null } };
    expect(removeUndefinedProperties(input)).toEqual(expected);
  });

  it("removes undefined properties from an array", () => {
    const input = [1, undefined, "hello", null];
    const expected = [1, "hello", null];
    expect(removeUndefinedProperties(input)).toEqual(expected);
  });

  it("removes undefined properties from a nested array", () => {
    const input = [1, [undefined, "world", null], undefined];
    const expected = [1, ["world", null]];
    expect(removeUndefinedProperties(input)).toEqual(expected);
  });
});
