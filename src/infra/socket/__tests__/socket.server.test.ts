// Unit tests for the SocketServer class
import { IncomingMessage } from "http";
import { SocketServer } from "../socket.server";
import {
  AbstractSocket,
  AbstractSocketServer,
  SocketServerOptions,
  SocketMessage,
} from "../types";

describe("SocketServer", () => {
  let mockServer: jest.Mocked<AbstractSocketServer>;
  let server: SocketServer;
  let options: SocketServerOptions;

  beforeEach(() => {
    jest.useFakeTimers();

    mockServer = {
      onConnection: jest.fn(),
      send: jest.fn(),
      isClientConnected: jest.fn().mockReturnValue(true),
      ping: jest.fn(),
      close: jest.fn(),
    };

    options = {
      port: 8080,
      onConnection: jest.fn(),
      onDisconnection: jest.fn(),
      onError: jest.fn(),
      onMessage: jest.fn(),
      heartbeatInterval: 5000,
    };

    server = new SocketServer(mockServer, options);
  });

  afterEach(() => {
    jest.useRealTimers();
    server.shutdown(); // Ensure the server is properly shut down
  });

  it("should set up connection handlers", () => {
    expect(mockServer.onConnection).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should handle new connections", () => {
    const mockClient = { on: jest.fn() } as any;
    const mockReq = {
      socket: { remoteAddress: "127.0.0.1", remotePort: 12345 },
    } as unknown as IncomingMessage;

    mockServer.onConnection.mock.calls[0][0](mockClient, mockReq);

    expect(options.onConnection).toHaveBeenCalledWith("127.0.0.1:12345");
  });

  it("should broadcast messages to all clients", () => {
    const message: SocketMessage = { type: "broadcast", payload: "hello" };

    const mockClient = {} as AbstractSocket;
    server["clients"].set("client-1", mockClient);

    server.broadcast(message);

    expect(mockServer.send).toHaveBeenCalledWith(
      mockClient,
      JSON.stringify(message)
    );
  });

  it("should send messages to a specific client", () => {
    const mockClient = {} as AbstractSocket;
    const clientId = "client-1";

    server["clients"].set(clientId, mockClient);

    const message: SocketMessage = { type: "private", payload: "hello" };

    server.sendToClient(clientId, message);

    expect(mockServer.send).toHaveBeenCalledWith(
      mockClient,
      JSON.stringify(message)
    );
  });

  it("should handle disconnection", () => {
    const clientId = "client-1";
    server["clients"].set(clientId, {} as AbstractSocket);

    server["handleDisconnection"](clientId);

    expect(options.onDisconnection).toHaveBeenCalledWith(clientId);
    expect(server["clients"].has(clientId)).toBe(false);
  });

  it("should handle incoming messages", () => {
    const clientId = "client-1";
    const data = JSON.stringify({ type: "test", payload: "hello" });

    server["handleMessage"](clientId, data);

    expect(options.onMessage).toHaveBeenCalledWith(clientId, {
      type: "test",
      payload: "hello",
    });
  });

  it("should start the heartbeat mechanism", () => {
    server["startHeartbeat"]();

    const mockClient = {} as AbstractSocket;
    server["clients"].set("client-1", mockClient);

    jest.advanceTimersByTime(5000);

    expect(mockServer.ping).toHaveBeenCalledWith(mockClient);
  });

  it("should shut down the server", () => {
    server.shutdown();

    expect(mockServer.close).toHaveBeenCalled();
    expect(server["clients"].size).toBe(0);
  });
});
