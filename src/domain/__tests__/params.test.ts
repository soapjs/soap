import {
  AggregationParams,
  CountParams,
  FindParams,
  RemoveParams,
  UpdateParams,
  UpdateMethod,
  UpdateEachParams,
} from "../params";
import { Filter, Sort } from "../types";
import { Where } from "../where";

describe("Helper Functions", () => {
  test("isAggregationParams should return true for valid AggregationParams", () => {
    const validParams: Partial<AggregationParams> = {
      groupBy: ["field1"],
      filterBy: { field: "name", name: "John" },
      sort: {},
      sum: "field2",
      average: "field3",
      min: "field4",
      max: "field5",
      count: "field6",
      where: new Where(),
    };
    expect(AggregationParams.isAggregationParams(validParams)).toBe(true);
  });

  test("isCountParams should return true for valid CountParams", () => {
    const validParams: Partial<CountParams> = {
      sort: {},
      where: new Where(),
    };
    expect(CountParams.isCountParams(validParams)).toBe(true);
  });

  test("isFindParams should return true for valid FindParams", () => {
    const validParams: Partial<FindParams> = {
      limit: 10,
      offset: 0,
      sort: {},
      where: new Where(),
    };
    expect(FindParams.isFindParams(validParams)).toBe(true);
  });

  test("isRemoveParams should return true for valid RemoveParams", () => {
    const validParams: Partial<RemoveParams> = {
      where: new Where(),
    };
    expect(RemoveParams.isRemoveParams(validParams)).toBe(true);
  });

  test("isUpdateParams should return true for valid UpdateParams", () => {
    const validParams: Partial<UpdateParams<unknown>> = {
      updates: [{}],
      where: [new Where()],
      methods: [UpdateMethod.UpdateOne],
    };
    expect(UpdateParams.isUpdateParams(validParams)).toBe(true);
  });
});

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

describe("UpdateParams class", () => {
  test("should create parameters to update multiple entities", () => {
    const updateData = { name: "John" };
    const whereClause = new Where();
    const updateParams = UpdateParams.createUpdateMany(updateData, whereClause);
    expect(updateParams.updates).toEqual([updateData]);
    expect(updateParams.where).toEqual([whereClause]);
    expect(updateParams.methods).toEqual([UpdateMethod.UpdateMany]);
  });

  test("should create parameters to update each entity with different set of parameters", () => {
    const updateEachParams: UpdateEachParams<any>[] = [
      {
        update: { name: "John" },
        where: new Where(),
        method: UpdateMethod.UpdateOne,
      },
      {
        update: { age: 30 },
        where: new Where(),
      },
    ];
    const updateParams = UpdateParams.createUpdateEach(updateEachParams);
    expect(updateParams.updates).toEqual([{ name: "John" }, { age: 30 }]);
    expect(updateParams.where.length).toBe(2);
    expect(updateParams.methods).toEqual([
      UpdateMethod.UpdateOne,
      UpdateMethod.UpdateOne,
    ]);
  });

  test("should create parameters to update a single entity", () => {
    const updateData = { name: "John" };
    const whereClause = new Where();
    const updateParams = UpdateParams.createUpdateOne(updateData, whereClause);
    expect(updateParams.updates).toEqual([updateData]);
    expect(updateParams.where).toEqual([whereClause]);
    expect(updateParams.methods).toEqual([UpdateMethod.UpdateOne]);
  });

  test("should create an instance of UpdateParams with provided parameters", () => {
    const updates = [{ name: "John" }, { age: 30 }];
    const wheres = [new Where(), new Where()];
    const methods = [UpdateMethod.UpdateOne, UpdateMethod.UpdateOne];
    const updateParams = new UpdateParams(updates, wheres, methods);
    expect(updateParams.updates).toEqual(updates);
    expect(updateParams.where).toEqual(wheres);
    expect(updateParams.methods).toEqual(methods);
  });
});
