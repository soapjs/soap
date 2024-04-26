import { QueryBuilder } from "../queries";
import { UnknownObject } from "../types";

describe("QueryBuilder class", () => {
  test("should set arguments for the query", () => {
    const queryBuilder = new QueryBuilder();
    const args: UnknownObject = {
      field1: "value1",
      field2: 123,
      field3: true,
    };
    queryBuilder.with(args);
    expect(queryBuilder["args"]).toEqual(args);
  });

  test("should throw an error when build method is called", () => {
    const queryBuilder = new QueryBuilder();
    expect(() => queryBuilder.build()).toThrowError("Method not implemented.");
  });
});