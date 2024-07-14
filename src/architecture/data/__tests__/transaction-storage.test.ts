import { TransactionStorage } from "../transaction-storage";
import { AsyncLocalStorage } from "async_hooks";

jest.mock("async_hooks", () => {
  return {
    AsyncLocalStorage: jest.fn().mockImplementation(() => {
      let store: any;
      return {
        run: jest.fn((value, callback) => {
          store = value;
          return callback();
        }),
        getStore: jest.fn(() => store),
      };
    }),
  };
});

describe("TransactionStorage", () => {
  let transactionStorage: TransactionStorage;

  beforeEach(() => {
    transactionStorage = TransactionStorage.getInstance();
  });

  it("should return the same instance", () => {
    const anotherInstance = TransactionStorage.getInstance();
    expect(transactionStorage).toBe(anotherInstance);
  });

  it("should run a function within a specific transaction context", () => {
    const mockFn = jest.fn(() => "result");
    const result = transactionStorage.run("transactionId123", mockFn);

    expect(result).toBe("result");
    expect(mockFn).toHaveBeenCalled();
  });

  it("should get the current transaction ID", () => {
    transactionStorage.run("transactionId123", () => {
      const transactionId = transactionStorage.getTransactionId();
      expect(transactionId).toBe("transactionId123");
    });
  });

  it("should return undefined if transaction ID is not set", () => {
    transactionStorage.run(undefined, () => {
      const transactionId = transactionStorage.getTransactionId();
      expect(transactionId).toBeUndefined();
    });
  });
});
