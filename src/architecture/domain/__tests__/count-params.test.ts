import { CountParams } from "../queries/params/count-params";
import { Sort } from "../types";
import { Where } from "../where";

describe("CountParams class", () => {
  // Test for create method
  test("should create a new instance of CountParams with provided options", () => {
    const options = {
      sort: { field1: 1, field2: -1 },
      where: new Where(),
    };
    const countParams = CountParams.create(options);
    expect(countParams.sort).toEqual(options.sort);
    expect(countParams.where).toEqual(options.where);
  });

  // Test for constructor
  test("should create a new instance of CountParams with provided parameters", () => {
    const sort: Sort = { field1: 1, field2: -1 };
    const where = new Where();

    const countParams = new CountParams(sort, where);

    expect(countParams.sort).toEqual(sort);
    expect(countParams.where).toEqual(where);
  });
});
