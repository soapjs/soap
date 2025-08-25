import "reflect-metadata";
import {
  EntityProperty,
  PropertyResolver,
  IsTransaction,
  UseSession,
} from "../decorators";

import { TransactionRunner } from "../transaction-runner";
import { Result } from "../../common/result";
import { AutoTransaction } from "../auto-transaction";
import { Transaction } from "../transaction";

jest.mock("../transaction-runner", () => {
  return {
    TransactionRunner: {
      getInstance: jest.fn().mockReturnValue({
        run: jest.fn().mockImplementation(async (trx: any) => {
          return trx.execute();
        }),
      }),
    },
  };
});

describe("FieldResolver", () => {
  class ObjectId {}
  class TestModel {
    @EntityProperty("domainId")
    db_id: ObjectId;

    @EntityProperty("domainName")
    db_name: string;
  }

  const resolver = new PropertyResolver(TestModel);

  it("should resolve the correct database field name and type from a domain field name", () => {
    const result = resolver.resolveDatabaseField("domainId");
    expect(result?.name).toBe("domainId");
    expect(result?.type).toBe("ObjectId");
    expect(result?.modelFieldName).toBe("db_id");
  });

  it("should return undefined if the domain field name does not exist", () => {
    expect(resolver.resolveDatabaseField("nonExistingField")).toBeUndefined();
  });
});

describe("UseSession", () => {
  it("should define 'useSession' metadata on a property", () => {
    class SessionTest {
      @UseSession()
      repo: any;
    }

    const metadata = Reflect.getMetadata(
      "useSession",
      SessionTest.prototype,
      "repo"
    );
    expect(metadata).toBe(true);
  });

  it("should define 'useSession' metadata with options", () => {
    const sessionOptions = { type: "read", priority: 1 };

    class SessionTest2 {
      @UseSession(sessionOptions)
      repo: any;
    }

    const metadata = Reflect.getMetadata(
      "useSession",
      SessionTest2.prototype,
      "repo"
    );
    expect(metadata).toEqual(sessionOptions);
  });
});

describe("IsTransaction", () => {
  it("should replace execute() with a transaction-wrapped function", async () => {
    @IsTransaction({ tag: "MyTag" })
    class MyUseCase {
      public async execute() {
        return Result.withSuccess("original method result");
      }
    }

    const instance = new MyUseCase();
    const result = await instance.execute();

    expect(result.content).toBe("original method result");
    expect(TransactionRunner.getInstance).toHaveBeenCalledWith("MyTag");
  });

  it("should do nothing if 'execute' is not found", () => {
    const spy = jest.spyOn(TransactionRunner, "getInstance");

    @IsTransaction()
    class NoExecute {}

    new NoExecute();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("Transactional Decorator", () => {
  let transactionRunnerMock: jest.Mocked<TransactionRunner>;
  let mockMethod: jest.Mock;
  let mockThisRef: Record<string, unknown>;
  let autoTransaction: AutoTransaction<string>;

  beforeEach(() => {
    TransactionRunner.getInstance = jest.fn().mockReturnValue({
      run: jest.fn(),
    } as unknown as TransactionRunner);
    transactionRunnerMock =
      TransactionRunner.getInstance() as jest.Mocked<TransactionRunner>;
    mockMethod = jest.fn();
    mockThisRef = {};
    autoTransaction = new AutoTransaction(mockThisRef, mockMethod, [
      "arg1",
      "arg2",
    ]);
  });

  it("should extend Transaction", () => {
    expect(autoTransaction).toBeInstanceOf(Transaction);
  });

  it("should call the original method with the correct context and arguments", async () => {
    mockMethod.mockResolvedValue(Result.withSuccess("Success Result"));

    const result = await autoTransaction.execute();

    expect(mockMethod).toHaveBeenCalledWith("arg1", "arg2");
    expect(mockMethod).toHaveBeenCalledTimes(1);
    expect(mockMethod.mock.instances[0]).toBe(mockThisRef);
    expect(result.content).toBe("Success Result");
  });

  it("should handle method errors gracefully and return a failure result", async () => {
    const error = new Error("Mock Error");
    mockMethod.mockImplementation(() => Result.withFailure(error));

    const result = await autoTransaction.execute();

    expect(mockMethod).toHaveBeenCalledTimes(1);
    expect(result.isFailure()).toBe(true);
    expect(result.failure.error.message).toBe("Mock Error");
  });

  it("should pass session components to the parent Transaction class", () => {
    const mockSessionComponent = { name: "SessionComponent" };
    const autoTransactionWithSessions = new AutoTransaction(
      mockThisRef,
      mockMethod,
      [],
      [mockSessionComponent]
    );

    expect(autoTransactionWithSessions["components"]).toContain(
      mockSessionComponent
    );
  });
});


