import { CircuitBreaker } from "@/services/api/circuit-breaker";

jest.mock("@/constants/config", () => ({
  CIRCUIT_BREAKER: { THRESHOLD: 3, RESET_TIMEOUT_MS: 1000 },
  LOGGER: { ENABLED: false, MIN_LEVEL: "warn", MAX_BREADCRUMBS: 100 },
}));

describe("CircuitBreaker", () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker({ threshold: 3, resetTimeoutMs: 1000 });
  });

  it("starts in closed state", () => {
    expect(cb.state).toBe("closed");
  });

  it("stays closed when calls succeed", async () => {
    await cb.execute(() => Promise.resolve("ok"));
    expect(cb.state).toBe("closed");
  });

  it("opens after reaching failure threshold", async () => {
    const fail = () => Promise.reject(new Error("fail"));

    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(fail)).rejects.toThrow("fail");
    }

    expect(cb.state).toBe("open");
  });

  it("rejects calls when open", async () => {
    const fail = () => Promise.reject(new Error("fail"));
    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(fail)).rejects.toThrow();
    }

    await expect(cb.execute(() => Promise.resolve("ok"))).rejects.toThrow(
      "Circuit breaker is open"
    );
  });

  it("transitions to half-open after reset timeout", async () => {
    const fail = () => Promise.reject(new Error("fail"));
    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(fail)).rejects.toThrow();
    }
    expect(cb.state).toBe("open");

    // Advance past reset timeout
    jest.spyOn(Date, "now").mockReturnValue(Date.now() + 1500);
    expect(cb.state).toBe("half-open");
    jest.restoreAllMocks();
  });

  it("closes again after a successful call in half-open state", async () => {
    const fail = () => Promise.reject(new Error("fail"));
    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(fail)).rejects.toThrow();
    }

    // Force half-open
    jest.spyOn(Date, "now").mockReturnValue(Date.now() + 1500);
    expect(cb.state).toBe("half-open");
    jest.restoreAllMocks();

    await cb.execute(() => Promise.resolve("recovered"));
    expect(cb.state).toBe("closed");
  });

  it("reset() restores to closed state", async () => {
    const fail = () => Promise.reject(new Error("fail"));
    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(fail)).rejects.toThrow();
    }
    expect(cb.state).toBe("open");

    cb.reset();
    expect(cb.state).toBe("closed");
  });

  it("resets failure count on success before threshold", async () => {
    const fail = () => Promise.reject(new Error("fail"));

    // 2 failures (below threshold of 3)
    await expect(cb.execute(fail)).rejects.toThrow();
    await expect(cb.execute(fail)).rejects.toThrow();

    // A success resets the count
    await cb.execute(() => Promise.resolve("ok"));
    expect(cb.state).toBe("closed");

    // 2 more failures should NOT open (count was reset)
    await expect(cb.execute(fail)).rejects.toThrow();
    await expect(cb.execute(fail)).rejects.toThrow();
    expect(cb.state).toBe("closed");
  });
});
