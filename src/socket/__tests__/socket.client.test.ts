import { SocketClient } from "../socket.client";
import { AbstractSocket, SocketClientOptions, SocketMessage } from "../types";

describe("SocketClient", () => {
  let mockSocket: jest.Mocked<AbstractSocket>;
  let client: SocketClient<string, Record<string, unknown>>;
  let options: SocketClientOptions<string, Record<string, unknown>>;

  beforeEach(() => {
    mockSocket = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn(),
      on: jest.fn(),
    };

    options = {
      url: "ws://localhost:8080",
      onOpen: jest.fn(),
      onClose: jest.fn(),
      onError: jest.fn(),
      parser: jest.fn(
        (data) =>
          JSON.parse(data as string) as SocketMessage<
            string,
            Record<string, unknown>
          >
      ),
    };

    client = new SocketClient<string, Record<string, unknown>>(
      mockSocket,
      options
    );
  });

  it("should connect to the server", async () => {
    await client.connect();

    expect(mockSocket.connect).toHaveBeenCalledWith({ auth: {} });
    expect(mockSocket.on).toHaveBeenCalledWith("open", expect.any(Function));
    expect(options.onOpen).not.toHaveBeenCalled();

    mockSocket.on.mock.calls.find(([event]) => event === "open")?.[1]({});
    expect(options.onOpen).toHaveBeenCalled();
  });

  it("should handle incoming messages", async () => {
    const messageHandler = jest.fn();
    client.subscribe("test", messageHandler);
    
    await client.connect();
    const testMessage = { type: "test", payload: "hello" };

    mockSocket.on.mock.calls.find(([event]) => event === "message")?.[1](
      JSON.stringify(testMessage)
    );

    expect(options.parser).toHaveBeenCalledWith(JSON.stringify(testMessage));
    expect(messageHandler).toHaveBeenCalledWith(testMessage);
  });

  it("should queue messages when not connected", async () => {
    const message: SocketMessage<string, Record<string, unknown>> = {
      type: "test",
      payload: "hello",
    };

    await client.send(message);
    expect(mockSocket.send).not.toHaveBeenCalled();
  });

  it("should send messages directly when connected", async () => {
    await client.connect();

    const message: SocketMessage<string, Record<string, unknown>> = {
      type: "test",
      payload: "hello",
    };

    mockSocket.on.mock.calls.find(([event]) => event === "open")?.[1]({});

    await client.send(message);

    expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it("should handle disconnection", async () => {
    await client.connect();

    mockSocket.on.mock.calls.find(([event]) => event === "close")?.[1]({});

    expect(options.onClose).toHaveBeenCalled();
  });
});
