import { renderHook, act } from "@testing-library/react-native";

import { useWebSocket } from "@/hooks/useWebSocket";
import { useChannel } from "@/hooks/useChannel";
import { usePresence } from "@/hooks/usePresence";
import { WebSocketManager } from "@/services/realtime/websocket-manager";

// Mock WebSocketManager
jest.mock("@/services/realtime/websocket-manager", () => {
  const mockConnect = jest.fn().mockResolvedValue(undefined);
  const mockDisconnect = jest.fn();
  const mockSend = jest.fn();
  const mockSubscribe = jest.fn().mockReturnValue(jest.fn());
  const mockOnStatusChange = jest.fn().mockReturnValue(jest.fn());
  const mockOnMessage = jest.fn().mockReturnValue(jest.fn());
  const mockGetStatus = jest.fn().mockReturnValue("disconnected");

  return {
    WebSocketManager: jest.fn().mockImplementation(() => ({
      connect: mockConnect,
      disconnect: mockDisconnect,
      send: mockSend,
      subscribe: mockSubscribe,
      onStatusChange: mockOnStatusChange,
      onMessage: mockOnMessage,
      getStatus: mockGetStatus,
    })),
  };
});

const MockWebSocketManager = WebSocketManager as jest.MockedClass<
  typeof WebSocketManager
>;

describe("useWebSocket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockWebSocketManager.mockClear();
  });

  it("should create WebSocketManager on mount", () => {
    const config = { url: "wss://api.example.com/ws" };
    renderHook(() => useWebSocket(config));

    expect(MockWebSocketManager).toHaveBeenCalledWith(config);
  });

  it("should connect on mount and register status listener", () => {
    const config = { url: "wss://api.example.com/ws" };
    renderHook(() => useWebSocket(config));

    const instance = MockWebSocketManager.mock.results[0].value;
    expect(instance.onStatusChange).toHaveBeenCalled();
    expect(instance.connect).toHaveBeenCalled();
  });

  it("should call manager.connect when connect is called", async () => {
    const config = { url: "wss://api.example.com/ws" };
    const { result } = renderHook(() => useWebSocket(config));

    const instance = MockWebSocketManager.mock.results[0].value;
    instance.connect.mockClear();

    await act(async () => {
      await result.current.connect();
    });

    expect(instance.connect).toHaveBeenCalled();
  });

  it("should call manager.disconnect when disconnect is called", () => {
    const config = { url: "wss://api.example.com/ws" };
    const { result } = renderHook(() => useWebSocket(config));

    const instance = MockWebSocketManager.mock.results[0].value;
    instance.disconnect.mockClear();

    act(() => {
      result.current.disconnect();
    });

    expect(instance.disconnect).toHaveBeenCalled();
  });

  it("should call manager.send when send is called", () => {
    const config = { url: "wss://api.example.com/ws" };
    const { result } = renderHook(() => useWebSocket(config));

    const instance = MockWebSocketManager.mock.results[0].value;

    act(() => {
      result.current.send("chat:message", { text: "Hello" }, "room-1");
    });

    expect(instance.send).toHaveBeenCalledWith(
      "chat:message",
      { text: "Hello" },
      "room-1"
    );
  });

  it("should track connection status via onStatusChange", () => {
    const config = { url: "wss://api.example.com/ws" };
    const { result } = renderHook(() => useWebSocket(config));

    expect(result.current.status).toBe("disconnected");

    // Get the status callback registered with onStatusChange
    const instance = MockWebSocketManager.mock.results[0].value;
    const statusCallback = instance.onStatusChange.mock.calls[0][0];

    act(() => {
      statusCallback("connected");
    });

    expect(result.current.status).toBe("connected");
  });
});

describe("useChannel", () => {
  let mockManager: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockManager = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn().mockReturnValue(jest.fn()),
      onStatusChange: jest.fn().mockReturnValue(jest.fn()),
      onMessage: jest.fn().mockReturnValue(jest.fn()),
      getStatus: jest.fn().mockReturnValue("connected"),
    };
  });

  it("should subscribe to channel on mount", () => {
    renderHook(() => useChannel(mockManager, "chat:room-1"));

    expect(mockManager.subscribe).toHaveBeenCalledWith(
      "chat:room-1",
      expect.any(Function)
    );
  });

  it("should unsubscribe on unmount", () => {
    const mockUnsubscribe = jest.fn();
    mockManager.subscribe.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() =>
      useChannel(mockManager, "chat:room-1")
    );

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("should accumulate messages", () => {
    const { result } = renderHook(() => useChannel(mockManager, "chat:room-1"));

    const messageHandler = mockManager.subscribe.mock.calls[0][1];

    const msg1 = {
      type: "chat:message",
      channel: "chat:room-1",
      payload: { text: "Hello" },
      timestamp: "2024-01-01T00:00:00.000Z",
    };
    const msg2 = {
      type: "chat:message",
      channel: "chat:room-1",
      payload: { text: "World" },
      timestamp: "2024-01-01T00:00:01.000Z",
    };

    act(() => {
      messageHandler(msg1);
    });

    act(() => {
      messageHandler(msg2);
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].payload).toEqual({ text: "Hello" });
    expect(result.current.messages[1].payload).toEqual({ text: "World" });
    expect(result.current.lastMessage).toEqual(msg2);
  });

  it("should respect maxMessages limit", () => {
    const { result } = renderHook(() =>
      useChannel(mockManager, "chat:room-1", { maxMessages: 2 })
    );

    const messageHandler = mockManager.subscribe.mock.calls[0][1];

    act(() => {
      messageHandler({
        type: "chat:message",
        payload: { text: "1" },
        timestamp: "2024-01-01T00:00:00.000Z",
      });
    });
    act(() => {
      messageHandler({
        type: "chat:message",
        payload: { text: "2" },
        timestamp: "2024-01-01T00:00:01.000Z",
      });
    });
    act(() => {
      messageHandler({
        type: "chat:message",
        payload: { text: "3" },
        timestamp: "2024-01-01T00:00:02.000Z",
      });
    });

    expect(result.current.messages).toHaveLength(2);
    // The oldest message should be dropped
    expect(result.current.messages[0].payload).toEqual({ text: "2" });
    expect(result.current.messages[1].payload).toEqual({ text: "3" });
  });
});

describe("usePresence", () => {
  let mockManager: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockManager = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn().mockReturnValue(jest.fn()),
      onStatusChange: jest.fn().mockReturnValue(jest.fn()),
      onMessage: jest.fn().mockReturnValue(jest.fn()),
      getStatus: jest.fn().mockReturnValue("connected"),
    };
  });

  it("should track users from presence_join events", () => {
    const { result } = renderHook(() => usePresence(mockManager, "room:lobby"));

    const messageHandler = mockManager.subscribe.mock.calls[0][1];

    act(() => {
      messageHandler({
        type: "presence_join",
        channel: "room:lobby",
        payload: {
          id: "user-1",
          name: "Alice",
          lastSeen: "2024-01-01T00:00:00.000Z",
        },
        timestamp: "2024-01-01T00:00:00.000Z",
      });
    });

    expect(result.current.onlineUsers).toHaveLength(1);
    expect(result.current.onlineUsers[0].id).toBe("user-1");
    expect(result.current.onlineUsers[0].name).toBe("Alice");
    expect(result.current.isUserOnline("user-1")).toBe(true);
  });

  it("should remove users from presence_leave events", () => {
    const { result } = renderHook(() => usePresence(mockManager, "room:lobby"));

    const messageHandler = mockManager.subscribe.mock.calls[0][1];

    // Add a user
    act(() => {
      messageHandler({
        type: "presence_join",
        channel: "room:lobby",
        payload: {
          id: "user-1",
          name: "Alice",
          lastSeen: "2024-01-01T00:00:00.000Z",
        },
        timestamp: "2024-01-01T00:00:00.000Z",
      });
    });

    expect(result.current.onlineUsers).toHaveLength(1);

    // Remove the user
    act(() => {
      messageHandler({
        type: "presence_leave",
        channel: "room:lobby",
        payload: { id: "user-1" },
        timestamp: "2024-01-01T00:00:01.000Z",
      });
    });

    expect(result.current.onlineUsers).toHaveLength(0);
    expect(result.current.isUserOnline("user-1")).toBe(false);
  });

  it("should sync users from presence_sync events", () => {
    const { result } = renderHook(() => usePresence(mockManager, "room:lobby"));

    const messageHandler = mockManager.subscribe.mock.calls[0][1];

    act(() => {
      messageHandler({
        type: "presence_sync",
        channel: "room:lobby",
        payload: [
          { id: "user-1", name: "Alice", lastSeen: "2024-01-01T00:00:00.000Z" },
          { id: "user-2", name: "Bob", lastSeen: "2024-01-01T00:00:00.000Z" },
          {
            id: "user-3",
            name: "Charlie",
            lastSeen: "2024-01-01T00:00:00.000Z",
          },
        ],
        timestamp: "2024-01-01T00:00:00.000Z",
      });
    });

    expect(result.current.onlineUsers).toHaveLength(3);
    expect(result.current.isUserOnline("user-1")).toBe(true);
    expect(result.current.isUserOnline("user-2")).toBe(true);
    expect(result.current.isUserOnline("user-3")).toBe(true);
    expect(result.current.isUserOnline("user-4")).toBe(false);
  });
});
