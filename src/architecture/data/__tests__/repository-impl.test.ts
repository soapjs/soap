import { DataContext } from "../data-context";
import { Collection } from "../collection";
import { QueryFactory } from "../query-factory";
import { FindParams } from "../../domain/params";
import { Result } from "../../domain/result";
import { Failure } from "../../domain/failure";
import { UpdateStats, RemoveStats } from "../../domain/types";
import { RepositoryImpl } from "../repository-impl";
import { QueryBuilder } from "../../domain/query-builder";

class MockQueryBuilder extends QueryBuilder {
  build() {
    return "";
  }
}

describe("RepositoryImpl class", () => {
  const dataContext: DataContext = {
    collection: {
      find: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      update: jest.fn(),
      insert: jest.fn(),
      remove: jest.fn(),
    } as unknown as Collection,
    mapper: {
      toEntity: jest.fn((doc) => doc),
      fromEntity: jest.fn((entity) => entity),
    },
    queries: {
      createCountQuery: jest.fn(),
      createRemoveQuery: jest.fn(),
      createAggregationQuery: jest.fn(),
      createUpdateQuery: jest.fn(),
      createFindQuery: jest.fn(),
    } as unknown as QueryFactory,
  };

  const repository = new RepositoryImpl(dataContext);

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should aggregate data", async () => {
    const params = new MockQueryBuilder();
    const aggregationResult = [
      { id: 1, name: "Entity1" },
      { id: 2, name: "Entity2" },
    ];
    (dataContext.collection.aggregate as jest.Mock).mockResolvedValueOnce(
      aggregationResult
    );
    const result = await repository.aggregate(params);
    expect(result).toEqual(Result.withContent(aggregationResult));
  });

  test("should update data", async () => {
    const params = new MockQueryBuilder();
    const updateStats = { modifiedCount: 2 } as UpdateStats;
    (dataContext.collection.update as jest.Mock).mockResolvedValueOnce(
      updateStats
    );
    const result = await repository.update(params);
    expect(result).toEqual(Result.withContent(updateStats));
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
    (dataContext.collection.insert as jest.Mock).mockResolvedValueOnce(
      addedEntities
    );
    const result = await repository.add(entities);
    expect(result).toEqual(Result.withContent(addedEntities));
  });

  test("should remove data", async () => {
    const params = new MockQueryBuilder();
    const removeStats = { deletedCount: 2 } as RemoveStats;
    (dataContext.collection.remove as jest.Mock).mockResolvedValueOnce(
      removeStats
    );
    const result = await repository.remove(params);
    expect(result).toEqual(Result.withContent(removeStats));
  });

  test("should count data", async () => {
    const params = new MockQueryBuilder();
    const count = 10;
    (dataContext.collection.count as jest.Mock).mockResolvedValueOnce(count);
    const result = await repository.count(params);
    expect(result).toEqual(Result.withContent(count));
  });

  test("should find data", async () => {
    const params = {} as FindParams;
    const entities = [
      { id: 1, name: "Entity1" },
      { id: 2, name: "Entity2" },
    ];
    (dataContext.collection.find as jest.Mock).mockResolvedValueOnce(entities);
    const result = await repository.find(params);
    expect(result).toEqual(Result.withContent(entities));
  });

  test("should handle errors during aggregation", async () => {
    const params = new MockQueryBuilder();
    const error = new Error("Aggregation error");
    (dataContext.collection.aggregate as jest.Mock).mockRejectedValueOnce(
      error
    );
    const result = await repository.aggregate(params);
    expect(result).toEqual(Result.withFailure(Failure.fromError(error)));
  });

  test("should handle errors during update", async () => {
    const params = new MockQueryBuilder();

    const error = new Error("Update error");
    (dataContext.collection.update as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.update(params);
    expect(result).toEqual(Result.withFailure(Failure.fromError(error)));
  });

  test("should handle errors during adding data", async () => {
    const entities = [
      { id: 1, name: "Entity1" },
      { id: 2, name: "Entity2" },
    ];
    const error = new Error("Add error");
    (dataContext.collection.insert as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.add(entities);
    expect(result).toEqual(Result.withFailure(Failure.fromError(error)));
  });

  test("should handle errors during removing data", async () => {
    const params = new MockQueryBuilder();
    const error = new Error("Remove error");
    (dataContext.collection.remove as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.remove(params);
    expect(result).toEqual(Result.withFailure(Failure.fromError(error)));
  });

  test("should handle errors during counting data", async () => {
    const params = new MockQueryBuilder();
    const error = new Error("Count error");
    (dataContext.collection.count as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.count(params);
    expect(result).toEqual(Result.withFailure(Failure.fromError(error)));
  });

  test("should handle errors during finding data", async () => {
    const params = {} as FindParams;
    const error = new Error("Find error");
    (dataContext.collection.find as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.find(params);
    expect(result).toEqual(Result.withFailure(Failure.fromError(error)));
  });
});
