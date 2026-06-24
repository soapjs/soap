import "reflect-metadata";
import { Result } from "../../common/result";
import { createNoopDatabaseSessionRegistry } from "../../data/noop-database-session-registry";
import { Transaction } from "../transaction";

class TestTransaction extends Transaction<string> {
  public async execute(): Promise<Result<string>> {
    return Result.withSuccess("ok");
  }
}

function createSessionComponent(sessions = createNoopDatabaseSessionRegistry()) {
  const component = {
    context: {
      isDatabaseContext: true,
      sessions,
    },
  };

  Reflect.defineMetadata("useSession", true, component);

  return component;
}

describe("Transaction", () => {
  it("should keep session refs with their owning registry", () => {
    const registry = createNoopDatabaseSessionRegistry();
    const component = createSessionComponent(registry);
    const transaction = new TestTransaction(component);

    const sessions = transaction.init();
    const sessionRefs = transaction.getSessionRefs();

    expect(sessions).toHaveLength(1);
    expect(sessionRefs).toHaveLength(1);
    expect(sessionRefs[0]).toEqual({
      session: sessions[0],
      registry,
    });
  });

  it("should create one session per registry for the same transaction", () => {
    const registry = createNoopDatabaseSessionRegistry();
    const firstComponent = createSessionComponent(registry);
    const secondComponent = createSessionComponent(registry);
    const transaction = new TestTransaction(firstComponent, secondComponent);

    const sessions = transaction.init();

    expect(sessions).toHaveLength(1);
    expect(transaction.getSessionRefs()).toHaveLength(1);
    expect(registry.hasSession(transaction.id)).toBe(true);
  });

  it("should create separate sessions for separate registries", () => {
    const firstRegistry = createNoopDatabaseSessionRegistry();
    const secondRegistry = createNoopDatabaseSessionRegistry();
    const firstComponent = createSessionComponent(firstRegistry);
    const secondComponent = createSessionComponent(secondRegistry);
    const transaction = new TestTransaction(firstComponent, secondComponent);

    const sessions = transaction.init();

    expect(sessions).toHaveLength(2);
    expect(transaction.getSessionRefs()).toEqual([
      { session: sessions[0], registry: firstRegistry },
      { session: sessions[1], registry: secondRegistry },
    ]);
    expect(firstRegistry.hasSession(transaction.id)).toBe(true);
    expect(secondRegistry.hasSession(transaction.id)).toBe(true);
  });

  it("should clear session refs on dispose", () => {
    const transaction = new TestTransaction(createSessionComponent());

    transaction.init();
    transaction.dispose();

    expect(transaction.getSessionRefs()).toEqual([]);
  });
});
