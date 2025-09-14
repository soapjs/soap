import {
  DatabaseContext,
  WebContext,
  SocketContext,
  BlockchainContext,
  AnyContext,
} from "../repository-data-contexts";

const MockSource = {
  collectionName: "string",
  queries: {},
  find: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  update: jest.fn(),
  insert: jest.fn(),
  remove: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
};

const MockMapper = {
  toEntity: jest.fn(),
  toModel: jest.fn(),
};

const MockNonDatabaseSource = {
  find: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  update: jest.fn(),
  insert: jest.fn(),
  remove: jest.fn(),
};
const MockSessionRegistry = {
  transactionScope: null,
  createSession: jest.fn(),
  deleteSession: jest.fn(),
  getSession: jest.fn(),
  hasSession: jest.fn(),
};

describe("DatabaseContext", () => {
  it("should create an instance of DatabaseContext", () => {
    const source: any = MockSource;
    const mapper = MockMapper;
    const sessions = MockSessionRegistry;
    const context = new DatabaseContext(source, mapper, sessions);
    expect(context.isDatabaseContext).toBe(true);
    expect(context.source).toBe(source);
    expect(context.mapper).toBe(mapper);
  });

  it("should identify as DatabaseContext", () => {
    const source: any = MockSource;
    const mapper = MockMapper;
    const sessions = MockSessionRegistry;
    const context = new DatabaseContext(source, mapper, sessions);
    expect(DatabaseContext.isDatabaseContext(context)).toBe(true);
  });
});

describe("HttpContext", () => {
  it("should create an instance of HttpContext", () => {
    const source: any = MockNonDatabaseSource;
    const mapper = MockMapper;
    const context = new WebContext("http://example.com", source, mapper);
    expect(context.isWebContext).toBe(true);
    expect(context.baseUrl).toBe("http://example.com");
    expect(context.source).toBe(source);
    expect(context.mapper).toBe(mapper);
  });

  it("should identify as HttpContext", () => {
    const source: any = MockNonDatabaseSource;
    const mapper = MockMapper;
    const context = new WebContext("http://example.com", source, mapper);
    expect(WebContext.isWebContext(context)).toBe(true);
  });
});

describe("SocketContext", () => {
  it("should create an instance of SocketContext", () => {
    const source: any = MockNonDatabaseSource;
    const mapper = MockMapper;
    const context = new SocketContext("ws://example.com", source, mapper);
    expect(context.isSocketContext).toBe(true);
    expect(context.endpoint).toBe("ws://example.com");
    expect(context.source).toBe(source);
    expect(context.mapper).toBe(mapper);
  });

  it("should identify as SocketContext", () => {
    const source: any = MockNonDatabaseSource;
    const mapper = MockMapper;
    const context = new SocketContext("ws://example.com", source, mapper);
    expect(SocketContext.isSocketContext(context)).toBe(true);
  });
});

describe("BlockchainContext", () => {
  it("should create an instance of BlockchainContext", () => {
    const source: any = MockNonDatabaseSource;
    const mapper = MockMapper;
    const context = new BlockchainContext("test-network", source, mapper);
    expect(context.isBlockchainContext).toBe(true);
    expect(context.network).toBe("test-network");
    expect(context.source).toBe(source);
    expect(context.mapper).toBe(mapper);
  });

  it("should identify as BlockchainContext", () => {
    const source: any = MockNonDatabaseSource;
    const mapper = MockMapper;
    const context = new BlockchainContext("test-network", source, mapper);
    expect(BlockchainContext.isBlockchainContext(context)).toBe(true);
  });
});

describe("AnyContext", () => {
  it("should create an instance of AnyContext", () => {
    const source: any = MockNonDatabaseSource;
    const mapper = MockMapper;
    const context = new AnyContext(source, mapper);
    expect(context.isAnyContext).toBe(true);
    expect(context.source).toBe(source);
    expect(context.mapper).toBe(mapper);
  });

  it("should identify as AnyContext", () => {
    const source: any = MockNonDatabaseSource;
    const mapper = MockMapper;
    const context = new AnyContext(source, mapper);
    expect(AnyContext.isAnyContext(context)).toBe(true);
  });
});
