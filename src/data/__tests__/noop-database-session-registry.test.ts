import { TransactionScope } from "../../domain/transaction-scope";
import {
  createNoopDatabaseSession,
  createNoopDatabaseSessionRegistry,
} from "../noop-database-session-registry";

describe("createNoopDatabaseSession", () => {
  it("should create a database session with a generated id", async () => {
    const session = createNoopDatabaseSession();

    expect(session.id).toBeTruthy();
    await expect(session.startTransaction()).resolves.toBeUndefined();
    await expect(session.commitTransaction()).resolves.toBeUndefined();
    await expect(session.rollbackTransaction()).resolves.toBeUndefined();
    await expect(session.end()).resolves.toBeUndefined();
  });

  it("should create a database session with a provided id", () => {
    const session = createNoopDatabaseSession("transaction-id");

    expect(session.id).toBe("transaction-id");
  });
});

describe("createNoopDatabaseSessionRegistry", () => {
  it("should expose the shared transaction scope", () => {
    const registry = createNoopDatabaseSessionRegistry();

    expect(registry.transactionScope).toBe(TransactionScope.getInstance());
  });

  it("should create and retrieve sessions by generated id", () => {
    const registry = createNoopDatabaseSessionRegistry();
    const session = registry.createSession();

    expect(registry.hasSession(session.id)).toBe(true);
    expect(registry.getSession(session.id)).toBe(session);
  });

  it("should use a string createSession argument as the registry id", () => {
    const registry = createNoopDatabaseSessionRegistry();
    const session = registry.createSession("transaction-id");

    expect(session.id).toBe("transaction-id");
    expect(registry.hasSession("transaction-id")).toBe(true);
    expect(registry.getSession("transaction-id")).toBe(session);
  });

  it("should delete sessions by id", () => {
    const registry = createNoopDatabaseSessionRegistry();
    registry.createSession("transaction-id");

    registry.deleteSession("transaction-id");

    expect(registry.hasSession("transaction-id")).toBe(false);
    expect(registry.getSession("transaction-id")).toBeUndefined();
  });

  it("should delete sessions when they end", async () => {
    const registry = createNoopDatabaseSessionRegistry();
    const session = registry.createSession("transaction-id");

    await session.end();

    expect(registry.hasSession("transaction-id")).toBe(false);
  });
});
