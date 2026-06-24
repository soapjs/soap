import "reflect-metadata";
import { TransactionScope } from "../transaction-scope";
import { TransactionRunner } from "../transaction-runner";
import { Transaction } from "../transaction";
import { DatabaseSession } from "../../data/database-session";
import { Result } from "../../common/result";
import { AnyObject } from "../types";
import { DatabaseSessionRegistry } from "../../data/database-session-registry";

class TestDatabaseSession implements DatabaseSession {
  id: string;
  end(options?: AnyObject): any {
    jest.fn();
  }
  startTransaction(options?: AnyObject): any {
    jest.fn();
  }
  commitTransaction(): any {
    jest.fn();
  }
  rollbackTransaction(): any {
    jest.fn();
  }
}

describe("TransactionRunner", () => {
  let transactionScope: TransactionScope;
  let transactionRunner: TransactionRunner;
  let transaction: jest.Mocked<Transaction<unknown>>;
  let sessionMock: jest.Mocked<DatabaseSession>;
  let registryMock: jest.Mocked<DatabaseSessionRegistry>;

  beforeEach(() => {
    transactionScope = TransactionScope.getInstance();
    transactionRunner = TransactionRunner.getInstance();

    sessionMock = new TestDatabaseSession() as jest.Mocked<DatabaseSession>;
    sessionMock.startTransaction = jest.fn();
    sessionMock.commitTransaction = jest.fn();
    sessionMock.rollbackTransaction = jest.fn();
    sessionMock.end = jest.fn();
    sessionMock.id = "transactionId";

    registryMock = {
      transactionScope,
      createSession: jest.fn(),
      deleteSession: jest.fn(),
      getSession: jest.fn(),
      hasSession: jest.fn(),
    };

    transaction = new (jest.fn().mockImplementation(() => {
      return {
        id: "transactionId",
        init: jest.fn().mockReturnValue([sessionMock]),
        getSessionRefs: jest
          .fn()
          .mockReturnValue([{ session: sessionMock, registry: registryMock }]),
        execute: jest.fn(),
        dispose: jest.fn(),
        abort: jest.fn(),
      };
    }))();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should start, commit and delete sessions on success", async () => {
    transaction.execute.mockResolvedValue(Result.withSuccess("Success"));

    const result = await transactionRunner.run(transaction);

    expect(result.isSuccess()).toBe(true);
    expect(result.content).toBe("Success");
    expect(sessionMock.startTransaction).toHaveBeenCalled();
    expect(sessionMock.commitTransaction).toHaveBeenCalled();
    expect(registryMock.deleteSession).toHaveBeenCalledWith("transactionId");
  });

  it("should rollback and delete sessions on failure", async () => {
    transaction.execute.mockRejectedValue(new Error("Failure"));

    const result = await transactionRunner.run(transaction);

    expect(result.isSuccess()).toBe(false);
    expect(result.failure.error).toEqual(new Error("Failure"));
    expect(sessionMock.startTransaction).toHaveBeenCalled();
    expect(sessionMock.rollbackTransaction).toHaveBeenCalled();
    expect(registryMock.deleteSession).toHaveBeenCalledWith("transactionId");
  });

  it("should dispose sessions after execution", async () => {
    transaction.execute.mockResolvedValue(Result.withSuccess("Success"));

    await transactionRunner.run(transaction);

    expect(transaction.dispose).toHaveBeenCalled();
  });

  it("should delete sessions when commit fails", async () => {
    const commitError = new Error("Commit failure");
    transaction.execute.mockResolvedValue(Result.withSuccess("Success"));
    sessionMock.commitTransaction.mockRejectedValue(commitError);

    const result = await transactionRunner.run(transaction);

    expect(result.isSuccess()).toBe(false);
    expect(result.failure.error).toEqual(commitError);
    expect(sessionMock.rollbackTransaction).toHaveBeenCalled();
    expect(registryMock.deleteSession).toHaveBeenCalledWith("transactionId");
    expect(transaction.dispose).toHaveBeenCalled();
  });

  it("should return failure when cleanup fails after a successful transaction", async () => {
    const cleanupError = new Error("Cleanup failure");
    transaction.execute.mockResolvedValue(Result.withSuccess("Success"));
    registryMock.deleteSession.mockRejectedValue(cleanupError);

    const result = await transactionRunner.run(transaction);

    expect(result.isSuccess()).toBe(false);
    expect(result.failure.error).toEqual(cleanupError);
    expect(transaction.dispose).toHaveBeenCalled();
  });

  it("should preserve transaction failure when cleanup also fails", async () => {
    const transactionError = new Error("Failure");
    transaction.execute.mockRejectedValue(transactionError);
    registryMock.deleteSession.mockRejectedValue(new Error("Cleanup failure"));

    const result = await transactionRunner.run(transaction);

    expect(result.isSuccess()).toBe(false);
    expect(result.failure.error).toEqual(transactionError);
    expect(transaction.dispose).toHaveBeenCalled();
  });
});
