import "reflect-metadata";
import { TransactionScope } from "../transaction-scope";
import { TransactionRunner } from "../transaction-runner";
import { Transaction } from "../transaction";
import { DatabaseSession } from "../../data/database-session";
import { Result } from "../../common/result";
import { AnyObject } from "../types";

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

  beforeEach(() => {
    transactionScope = TransactionScope.getInstance();
    transactionRunner = TransactionRunner.getInstance();

    sessionMock = new TestDatabaseSession() as jest.Mocked<DatabaseSession>;
    sessionMock.commitTransaction = jest.fn();
    sessionMock.rollbackTransaction = jest.fn();
    sessionMock.end = jest.fn();

    transaction = new (jest.fn().mockImplementation(() => {
      return {
        id: "transactionId",
        init: jest.fn().mockReturnValue([sessionMock]),
        execute: jest.fn(),
        dispose: jest.fn(),
        abort: jest.fn(),
      };
    }))();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should commit and end sessions on success", async () => {
    transaction.execute.mockResolvedValue(Result.withSuccess("Success"));

    const result = await transactionRunner.run(transaction);

    expect(result.isSuccess()).toBe(true);
    expect(result.content).toBe("Success");
    expect(sessionMock.commitTransaction).toHaveBeenCalled();
    expect(sessionMock.end).toHaveBeenCalled();
  });

  it("should rollback and end sessions on failure", async () => {
    transaction.execute.mockRejectedValue(new Error("Failure"));

    const result = await transactionRunner.run(transaction);

    expect(result.isSuccess()).toBe(false);
    expect(result.failure.error).toEqual(new Error("Failure"));
    expect(sessionMock.rollbackTransaction).toHaveBeenCalled();
    expect(sessionMock.end).toHaveBeenCalled();
  });

  it("should dispose sessions after execution", async () => {
    transaction.execute.mockResolvedValue(Result.withSuccess("Success"));

    await transactionRunner.run(transaction);

    expect(transaction.dispose).toHaveBeenCalled();
  });
});
