import { DatabaseContext } from "../repository-data-contexts";
import { Source } from "../source";
import { Result } from "../../common/result";
import { ReadRepository } from "../read-repository";
import { RepositoryQuery } from "../../domain/repository-query";
import { FindParams, CountParams, AggregationParams } from "../../domain/params";

class MockQueryBuilder extends RepositoryQuery {
  build() {
    return "";
  }
}

describe("ReadRepository class", () => {
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
    isCacheEnabled: jest.fn().mockReturnValue(false),
    getCacheKey: jest.fn().mockReturnValue('test-key'),
  };

  const repository = new ReadRepository(dataContext);

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

  test("should handle aggregation with AggregationParams", async () => {
    const params = new AggregationParams();
    const aggregationResult = { total: 100 };
    (dataContext.source.aggregate as jest.Mock).mockResolvedValueOnce(
      aggregationResult
    );
    const result = await repository.aggregate(params);
    expect(result).toEqual(Result.withSuccess(aggregationResult));
  });

  test("should handle count with CountParams", async () => {
    const params = new CountParams();
    const count = 5;
    (dataContext.source.count as jest.Mock).mockResolvedValueOnce(count);
    const result = await repository.count(params);
    expect(result).toEqual(Result.withSuccess(count));
  });

  test("should handle find with FindParams", async () => {
    const params = new FindParams();
    const foundEntities = [{ id: 1, name: "Entity1" }];
    (dataContext.source.find as jest.Mock).mockResolvedValueOnce(foundEntities);
    const result = await repository.find(params);
    expect(result).toEqual(Result.withSuccess(foundEntities));
  });

  test("should handle find without parameters", async () => {
    const foundEntities = [{ id: 1, name: "Entity1" }];
    (dataContext.source.find as jest.Mock).mockResolvedValueOnce(foundEntities);
    const result = await repository.find();
    expect(result).toEqual(Result.withSuccess(foundEntities));
  });

  test("should handle count without parameters", async () => {
    const count = 0;
    (dataContext.source.count as jest.Mock).mockResolvedValueOnce(count);
    const result = await repository.count();
    expect(result).toEqual(Result.withSuccess(count));
  });

  test("should handle aggregation errors", async () => {
    const params = new MockQueryBuilder();
    const error = new Error("Aggregation failed");
    (dataContext.source.aggregate as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.aggregate(params);
    expect(result.isFailure()).toBe(true);
  });

  test("should handle count errors", async () => {
    const params = new MockQueryBuilder();
    const error = new Error("Count failed");
    (dataContext.source.count as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.count(params);
    expect(result.isFailure()).toBe(true);
  });

  test("should handle find errors", async () => {
    const params = new MockQueryBuilder();
    const error = new Error("Find failed");
    (dataContext.source.find as jest.Mock).mockRejectedValueOnce(error);
    const result = await repository.find(params);
    expect(result.isFailure()).toBe(true);
  });
}); 