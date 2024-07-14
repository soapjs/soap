import "reflect-metadata";
import { TransactionStorage } from "../transaction-storage";
import { TransactionExecutor } from "../transaction-executor";
import { Transaction } from "../transaction";
import { DatabaseSession } from "../database-session";
import { Result } from "../../domain/result";
import { AnyObject } from "../../domain/types";

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

describe("TransactionExecutor", () => {
  let transactionStorage: TransactionStorage;
  let transactionExecutor: TransactionExecutor;
  let transaction: jest.Mocked<Transaction<unknown>>;
  let sessionMock: jest.Mocked<DatabaseSession>;

  beforeEach(() => {
    transactionStorage = TransactionStorage.getInstance();
    transactionExecutor = new TransactionExecutor(transactionStorage);

    sessionMock = new TestDatabaseSession() as jest.Mocked<DatabaseSession>;
    sessionMock.commitTransaction = jest.fn();
    sessionMock.rollbackTransaction = jest.fn();
    sessionMock.end = jest.fn();

    transaction = new (jest.fn().mockImplementation(() => {
      return {
        id: "transactionId",
        init: jest.fn().mockReturnValue([sessionMock]),
        perform: jest.fn(),
        dispose: jest.fn(),
        abort: jest.fn(),
      };
    }))();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should commit and end sessions on success", async () => {
    transaction.perform.mockResolvedValue(Result.withContent("Success"));

    const result = await transactionExecutor.execute(transaction);

    expect(result.isSuccess).toBe(true);
    expect(result.content).toBe("Success");
    expect(sessionMock.commitTransaction).toHaveBeenCalled();
    expect(sessionMock.end).toHaveBeenCalled();
  });

  it("should rollback and end sessions on failure", async () => {
    transaction.perform.mockRejectedValue(new Error("Failure"));

    const result = await transactionExecutor.execute(transaction);

    expect(result.isSuccess).toBe(false);
    expect(result.failure.error).toEqual(new Error("Failure"));
    expect(sessionMock.rollbackTransaction).toHaveBeenCalled();
    expect(sessionMock.end).toHaveBeenCalled();
  });

  it("should dispose sessions after execution", async () => {
    transaction.perform.mockResolvedValue(Result.withContent("Success"));

    await transactionExecutor.execute(transaction);

    expect(transaction.dispose).toHaveBeenCalled();
  });
});



// import { Result } from "../../domain/result";
// import { AnyObject } from "../../domain/types";
// import { DatabaseSession } from "../database-session";
// import { Transaction } from "../transaction";
// import { TransactionExecutor } from "../transaction-executor";

// jest.mock("../database-session");



// describe("TransactionExecutor", () => {
//   let transaction: TestTransaction;
//   let sessionMock: jest.Mocked<DatabaseSession>;

//   beforeEach(() => {
//     sessionMock = new TestDatabaseSession() as jest.Mocked<DatabaseSession>;
//     sessionMock.commitTransaction = jest.fn();
//     sessionMock.rollbackTransaction = jest.fn();
//     sessionMock.end = jest.fn();

//     transaction = new TestTransaction();
//     transaction["sessions"] = [sessionMock];
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it("should commit and end sessions on success", async () => {
//     const result = await TransactionExecutor.execute(transaction);

//     expect(result.isSuccess).toBe(true);
//     expect(result.content).toBe("Success");
//     expect(sessionMock.commitTransaction).toHaveBeenCalled();
//     expect(sessionMock.end).toHaveBeenCalled();
//   });

//   it("should rollback and end sessions on failure", async () => {
//     transaction.perform = jest.fn().mockRejectedValue(new Error("Failure"));

//     const result = await TransactionExecutor.execute(transaction);

//     expect(result.isSuccess).toBe(false);
//     expect(result.failure.error).toEqual(new Error("Failure"));
//     expect(sessionMock.rollbackTransaction).toHaveBeenCalled();
//     expect(sessionMock.end).toHaveBeenCalled();
//   });

//   it("should dispose sessions after execution", async () => {
//     await TransactionExecutor.execute(transaction);

//     expect(transaction["sessions"]).toHaveLength(0);
//   });
// });
