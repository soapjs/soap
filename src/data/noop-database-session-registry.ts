import { TransactionScope } from "../domain/transaction-scope";
import { DatabaseSession } from "./database-session";
import { DatabaseSessionRegistry } from "./database-session-registry";

function createSessionId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Creates a database session implementation that does not perform any storage-specific work.
 */
export function createNoopDatabaseSession(id = createSessionId()): DatabaseSession {
  return {
    id,
    async end() {},
    async startTransaction() {},
    async commitTransaction() {},
    async rollbackTransaction() {},
  };
}

/**
 * Creates a database session registry for repositories that do not have a storage-specific session manager.
 */
export function createNoopDatabaseSessionRegistry(): DatabaseSessionRegistry {
  const sessions = new Map<string, DatabaseSession>();

  return {
    transactionScope: TransactionScope.getInstance(),
    createSession(...args: unknown[]) {
      const requestedId = typeof args[0] === "string" ? args[0] : undefined;
      const session = createNoopDatabaseSession(requestedId);
      const end = session.end.bind(session);

      session.end = async (options) => {
        await end(options);
        sessions.delete(session.id);
      };

      sessions.set(session.id, session);
      return session;
    },
    deleteSession(id: string) {
      sessions.delete(id);
    },
    getSession(id: string) {
      return sessions.get(id);
    },
    hasSession(id: string) {
      return sessions.has(id);
    },
  };
}
