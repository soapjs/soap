import { RemoveParams } from "../queries/params/remove-params";
import { Where } from "../where";

describe("RemoveParams class", () => {
  test("should create a new instance of RemoveParams with provided where clause", () => {
    const whereClause = new Where();
    const removeParams = RemoveParams.create(whereClause);
    expect(removeParams.where).toEqual(whereClause);
  });

  test("should create a new instance of RemoveParams with provided where clause using constructor", () => {
    const whereClause = new Where();
    const removeParams = new RemoveParams(whereClause);
    expect(removeParams.where).toEqual(whereClause);
  });
});
