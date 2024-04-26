import { AggregationParams } from "../queries/params/aggregation-params";
import { Filter, Sort } from "../types";
import { Where } from "../where";

describe("AggregationParams class", () => {
  test("should create a new instance of AggregationParams with provided options", () => {
    const options = {
      groupBy: ["field1", "field2"],
      filterBy: { field: "name", name: "John" },
      sort: { field1: 1, field2: -1 },
      sum: "value",
      average: "age",
      min: "price",
      max: "price",
      count: "id",
      where: new Where(),
    };
    const aggregationParams = AggregationParams.create(options);
    expect(aggregationParams.groupBy).toEqual(options.groupBy);
    expect(aggregationParams.filterBy).toEqual(options.filterBy);
    expect(aggregationParams.sort).toEqual(options.sort);
    expect(aggregationParams.sum).toEqual(options.sum);
    expect(aggregationParams.average).toEqual(options.average);
    expect(aggregationParams.min).toEqual(options.min);
    expect(aggregationParams.max).toEqual(options.max);
    expect(aggregationParams.count).toEqual(options.count);
    expect(aggregationParams.where).toEqual(options.where);
  });

  test("should create a new instance of AggregationParams with provided parameters", () => {
    const groupBy = ["field1", "field2"];
    const filterBy: Filter = { field: "name", name: "John" };
    const sort: Sort = { field1: 1, field2: -1 };
    const sum = "value";
    const average = "age";
    const min = "price";
    const max = "price";
    const count = "id";
    const where = new Where();

    const aggregationParams = new AggregationParams(
      groupBy,
      filterBy,
      sort,
      sum,
      average,
      min,
      max,
      count,
      where
    );

    expect(aggregationParams.groupBy).toEqual(groupBy);
    expect(aggregationParams.filterBy).toEqual(filterBy);
    expect(aggregationParams.sort).toEqual(sort);
    expect(aggregationParams.sum).toEqual(sum);
    expect(aggregationParams.average).toEqual(average);
    expect(aggregationParams.min).toEqual(min);
    expect(aggregationParams.max).toEqual(max);
    expect(aggregationParams.count).toEqual(count);
    expect(aggregationParams.where).toEqual(where);
  });
});
