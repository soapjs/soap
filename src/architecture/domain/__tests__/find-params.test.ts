import { FindParams } from "../queries/params/find-params";
import { Sort } from "../types";
import { Where } from "../where";

describe("FindParams class", () => {
  test("should create a new instance of FindParams with provided options", () => {
    const options = {
      limit: 10,
      offset: 5,
      sort: { field1: 1, field2: -1 },
      where: new Where(),
    };
    const findParams = FindParams.create(options);
    expect(findParams.limit).toEqual(options.limit);
    expect(findParams.offset).toEqual(options.offset);
    expect(findParams.sort).toEqual(options.sort);
    expect(findParams.where).toEqual(options.where);
  });

  test("should create a new instance of FindParams with provided parameters", () => {
    const limit = 10;
    const offset = 5;
    const sort: Sort = { field1: 1, field2: -1 };
    const where = new Where();

    const findParams = new FindParams(limit, offset, sort, where);

    expect(findParams.limit).toEqual(limit);
    expect(findParams.offset).toEqual(offset);
    expect(findParams.sort).toEqual(sort);
    expect(findParams.where).toEqual(where);
  });
});
