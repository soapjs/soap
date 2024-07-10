import { Result } from "../../domain/result";
import { TransactionManager } from "../transaction-manager";

describe("TransactionManager", () => {
  const mockSource: any = {
    startSession: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
  };

  const manager = new TransactionManager(mockSource);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should execute the callback and commit the transaction on success", async () => {
    const successfulCallback = jest
      .fn()
      .mockResolvedValue(Result.withContent("Success"));
    const result = await manager.withinTransaction(successfulCallback);

    expect(successfulCallback).toHaveBeenCalled();
    expect(mockSource.startSession).toHaveBeenCalled();
    expect(mockSource.commitTransaction).toHaveBeenCalled();
    expect(result.isSuccess).toBeTruthy();
    expect(result.content).toEqual("Success");
  });

  it("should rollback the transaction and return failure if an error occurs", async () => {
    const errorMessage = "Something went wrong";
    const errorCallback = jest.fn().mockRejectedValue(new Error(errorMessage));
    const result = await manager.withinTransaction(errorCallback);

    expect(errorCallback).toHaveBeenCalled();
    expect(mockSource.startSession).toHaveBeenCalled();
    expect(mockSource.rollbackTransaction).toHaveBeenCalled();
    expect(result.isFailure).toBeTruthy();
    expect(result.failure.error.message).toEqual(errorMessage);
  });
});
