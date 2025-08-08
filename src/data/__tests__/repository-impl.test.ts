import { DatabaseContext } from "../repository-data-contexts";
import { Source } from "../source";
import { DbQueryFactory } from "../db-query-factory";
import { FindParams } from "../../domain/params";
import { Result } from "../../common/result";
import { Failure } from "../../common/failure";
import { UpdateStats, RemoveStats } from "../../domain/types";
import { ReadWriteRepository } from "../read-write-repository";
import { QueryBuilder } from "../../domain/query-builder";

class MockQueryBuilder extends QueryBuilder {
  build() {
    return "";
  }
}

describe("ReadWriteRepository class", () => {
  const dataContext: DatabaseContext = {
    isDatabaseContext: true,
    source: {
      find: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      update: jest.fn(),
      insert: jest.fn(),
      remove: jest.fn(),
    } as unknown as Source,
    mapper: {
      toEntity: jest.fn((doc) => doc),
      toModel: jest.fn((entity) => entity),
    },
    sessions: {
      transactionScope: null,
      createSession: jest.fn(),
      deleteSession: jest.fn(),
      getSession: jest.fn(),
      hasSession: jest.fn(),
    },
  };

  const repository = new ReadWriteRepository(dataContext);

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should aggregate data", async () => {
    const params = new MockQueryBuilder();
    const aggregationResult = [
      { id: 1, name: "Entity1" },
      { id: 2, name: "Entity2" },
    ];
    (dataContext.source.aggregate as jest.Mock).mockResolvedValueOnce(
      aggregationResult
    );
    const result = await repository.aggregate(params);
    expect(result).toEqual(Result.withSuccess(aggregationResult));
  });

  test("should update data", async () => {
    const params = new MockQueryBuilder();
    const updateStats = { modifiedCount: 2 } as UpdateStats;
    (dataContext.source.update as jest.Mock).mockResolvedValueOnce(updateStats);
    const result = await repository.update(params);
    expect(result).toEqual(Result.withSuccess(updateStats));
  });

  test("should add data", async () => {
    const entities = [
      { id: 1, name: "Entity1" },
      { id: 2, name: "Entity2" },
    ];
    const addedEntities = [
      { id: 1, name: "Entity1" },
      { id: 2, name: "Entity2" },
    ];
    (dataContext.source.insert as jest.Mock).mockResolvedValueOnce(
      addedEntities
    );
    const result = await repository.add(entities);
    expect(result).toEqual(Result.withSuccess(addedEntities));
  });

  test("should remove data", async () => {
    const params = new MockQueryBuilder();
    const removeStats = { deletedCount: 2 } as RemoveStats;
    (dataContext.source.remove as jest.Mock).mockResolvedValueOnce(removeStats);
    const result = await repository.remove(params);
    expect(result).toEqual(Result.withSuccess(removeStats));
  });

  test("should count data", async () => {
    const params = new MockQueryBuilder();
    const count = 10;
    (dataContext.source.count as jest.Mock).mockResolvedValueOnce(count);
    const result = await repository.count(params);
    expect(result).toEqual(Result.withSuccess(count));
  });

  test("should find data", async () => {
    const params = {} as FindParams;
    const entities = [
      { id: 1, name: "Entity1" },
      { id: 2, name: "Entity2" },
    ];
    (dataContext.source.find as jest.Mock).mockResolvedValueOnce(entities);
    const result = await repository.find(params);
    expect(result).toEqual(Result.withSuccess(entities));
  });

  test("should handle errors during aggregation", async () => {
    const params = new MockQueryBuilder();
    const error = new Error("Aggregation error");
    (dataContext.source.aggregate as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.aggregate(params);
    expect(result).toEqual(Result.withFailure(Failure.fromError(error)));
  });

  test("should handle errors during update", async () => {
    const params = new MockQueryBuilder();

    const error = new Error("Update error");
    (dataContext.source.update as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.update(params);
    expect(result).toEqual(Result.withFailure(Failure.fromError(error)));
  });

  test("should handle errors during adding data", async () => {
    const entities = [
      { id: 1, name: "Entity1" },
      { id: 2, name: "Entity2" },
    ];
    const error = new Error("Add error");
    (dataContext.source.insert as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.add(entities);
    expect(result).toEqual(Result.withFailure(Failure.fromError(error)));
  });

  test("should handle errors during removing data", async () => {
    const params = new MockQueryBuilder();
    const error = new Error("Remove error");
    (dataContext.source.remove as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.remove(params);
    expect(result).toEqual(Result.withFailure(Failure.fromError(error)));
  });

  test("should handle errors during counting data", async () => {
    const params = new MockQueryBuilder();
    const error = new Error("Count error");
    (dataContext.source.count as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.count(params);
    expect(result).toEqual(Result.withFailure(Failure.fromError(error)));
  });

  test("should handle errors during finding data", async () => {
    const params = {} as FindParams;
    const error = new Error("Find error");
    (dataContext.source.find as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.find(params);
    expect(result).toEqual(Result.withFailure(Failure.fromError(error)));
  });
});
