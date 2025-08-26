import { RepositoryQuery } from "../repository-query";
import { AnyObject, DbQuery } from "../types";

class TestRepositoryQuery extends RepositoryQuery {
  build(): DbQuery {
    return {
      field1: this.args.field1,
    };
  }
}

describe("RepositoryQuery class", () => {
  test("should set arguments for the query", () => {
    const queryBuilder = new TestRepositoryQuery();
    const args: AnyObject = {
      field1: "value1",
      field2: 123,
      field3: true,
    };
    queryBuilder.with(args);
    expect(queryBuilder["args"]).toEqual(args);
  });
});

describe("RepositoryQuery helper", () => {
  test("isQueryBuilder should return true for valid RepositoryQuery", () => {
    const queryBuilder = new TestRepositoryQuery();
    const args: AnyObject = {
      field1: "value1",
      field2: 123,
      field3: true,
    };
    queryBuilder.with(args);
    expect(RepositoryQuery.isQueryBuilder(queryBuilder)).toBe(true);
  });

  test("isQueryBuilder should return false for invalid RepositoryQuery object", () => {
    expect(RepositoryQuery.isQueryBuilder({})).toBe(false);
  });
});
