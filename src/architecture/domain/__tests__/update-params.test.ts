import {
  UpdateEachParams,
  UpdateMethod,
  UpdateParams,
} from "../queries/params/update-params";
import { Where } from "../where";

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
