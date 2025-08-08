import { DatabaseContext } from "../repository-data-contexts";
import { Source } from "../source";
import { Result } from "../../common/result";
import { ReadWriteRepository } from "../read-write-repository";
import { QueryBuilder } from "../../domain/query-builder";
import { FindParams, CountParams, AggregationParams, UpdateParams, RemoveParams, UpdateMethod } from "../../domain/params";
import { Where } from "../../domain/where";
import { UpdateStats, RemoveStats } from "../../domain/types";

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

  // Read operations (inherited from ReadRepository)
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

  test("should count data", async () => {
    const params = new MockQueryBuilder();
    const count = 10;
    (dataContext.source.count as jest.Mock).mockResolvedValueOnce(count);
    const result = await repository.count(params);
    expect(result).toEqual(Result.withSuccess(count));
  });

  test("should find data", async () => {
    const params = new MockQueryBuilder();
    const foundEntities = [
      { id: 1, name: "Entity1" },
      { id: 2, name: "Entity2" },
    ];
    (dataContext.source.find as jest.Mock).mockResolvedValueOnce(foundEntities);
    const result = await repository.find(params);
    expect(result).toEqual(Result.withSuccess(foundEntities));
  });

  // Write operations
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

  test("should handle update with UpdateParams", async () => {
    const updates = [{ id: 1, name: "UpdatedEntity" }];
    const where = [new Where().valueOf("id").isEq(1)];
    const methods = [UpdateMethod.UpdateOne];
    const params = new UpdateParams(updates, where, methods);
    const updateStats = { modifiedCount: 1 } as UpdateStats;
    (dataContext.source.update as jest.Mock).mockResolvedValueOnce(updateStats);
    const result = await repository.update(params);
    expect(result).toEqual(Result.withSuccess(updateStats));
  });

  test("should handle remove with RemoveParams", async () => {
    const params = new RemoveParams();
    const removeStats = { deletedCount: 1 } as RemoveStats;
    (dataContext.source.remove as jest.Mock).mockResolvedValueOnce(removeStats);
    const result = await repository.remove(params);
    expect(result).toEqual(Result.withSuccess(removeStats));
  });

  test("should handle update errors", async () => {
    const params = new MockQueryBuilder();
    const error = new Error("Update failed");
    (dataContext.source.update as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.update(params);
    expect(result.isFailure()).toBe(true);
  });

  test("should handle add errors", async () => {
    const entities = [{ id: 1, name: "Entity1" }];
    const error = new Error("Add failed");
    (dataContext.source.insert as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.add(entities);
    expect(result.isFailure()).toBe(true);
  });

  test("should handle remove errors", async () => {
    const params = new MockQueryBuilder();
    const error = new Error("Remove failed");
    (dataContext.source.remove as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.remove(params);
    expect(result.isFailure()).toBe(true);
  });

  test("should use mapper for entity conversion in add", async () => {
    const entities = [{ id: 1, name: "Entity1" }];
    const documents = [{ id: 1, name: "Entity1", _id: "doc1" }];
    const addedDocuments = [{ id: 1, name: "Entity1", _id: "doc1" }];
    
    (dataContext.mapper.toModel as jest.Mock).mockReturnValue(documents[0]);
    (dataContext.source.insert as jest.Mock).mockResolvedValueOnce(addedDocuments);
    (dataContext.mapper.toEntity as jest.Mock).mockReturnValue(entities[0]);
    
    const result = await repository.add(entities);
    
    expect(dataContext.mapper.toModel).toHaveBeenCalledWith(entities[0]);
    expect(dataContext.source.insert).toHaveBeenCalledWith(documents);
    expect(dataContext.mapper.toEntity).toHaveBeenCalledWith(addedDocuments[0]);
    expect(result).toEqual(Result.withSuccess(entities));
  });

  test("should use mapper for entity conversion in update", async () => {
    const updates = [{ id: 1, name: "UpdatedEntity" }];
    const documents = [{ id: 1, name: "UpdatedEntity", _id: "doc1" }];
    const where = [new Where().valueOf("id").isEq(1)];
    const methods = [UpdateMethod.UpdateOne];
    const params = new UpdateParams(updates, where, methods);
    const updateStats = { modifiedCount: 1 } as UpdateStats;
    
    (dataContext.mapper.toModel as jest.Mock).mockReturnValue(documents[0]);
    (dataContext.source.update as jest.Mock).mockResolvedValueOnce(updateStats);
    
    const result = await repository.update(params);
    
    expect(dataContext.mapper.toModel).toHaveBeenCalledWith(updates[0]);
    expect(dataContext.source.update).toHaveBeenCalledWith({
      updates: documents,
      where: params.where,
      methods: params.methods
    });
    expect(result).toEqual(Result.withSuccess(updateStats));
  });
}); 