import { Logger } from "@/services/logger/logger-adapter";
import type { LoggerAdapter, Breadcrumb } from "@/services/logger/types";
import { scrubString } from "@/utils/piiScrubber";

jest.mock("@/constants/config", () => ({
  LOGGER: { ENABLED: true, MIN_LEVEL: "debug", MAX_BREADCRUMBS: 100 },
}));

jest.mock("@/utils/piiScrubber", () => ({
  scrubString: jest.fn((s: string) => s.replace(/secret/gi, "[REDACTED]")),
  scrub: jest.fn((obj: unknown) => obj),
}));

describe("Logger facade", () => {
  let mockAdapter: jest.Mocked<LoggerAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdapter = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      addBreadcrumb: jest.fn(),
      getBreadcrumbs: jest.fn(() => []),
      setContext: jest.fn(),
      clearContext: jest.fn(),
    };
    Logger.setAdapter(mockAdapter);
  });

  describe("log level methods", () => {
    it("delegates debug() to adapter", () => {
      Logger.debug("test message", { key: "value" });

      expect(mockAdapter.debug).toHaveBeenCalledWith("test message", {
        key: "value",
      });
    });

    it("delegates info() to adapter", () => {
      Logger.info("info message");

      expect(mockAdapter.info).toHaveBeenCalledWith("info message", undefined);
    });

    it("delegates warn() to adapter", () => {
      Logger.warn("warning");

      expect(mockAdapter.warn).toHaveBeenCalledWith("warning", undefined);
    });

    it("delegates error() to adapter with error object", () => {
      const err = new Error("oops");
      Logger.error("error occurred", err, { extra: "data" });

      expect(mockAdapter.error).toHaveBeenCalledWith("error occurred", err, {
        extra: "data",
      });
    });

    it("delegates fatal() to adapter", () => {
      const err = new Error("critical");
      Logger.fatal("fatal error", err);

      expect(mockAdapter.fatal).toHaveBeenCalledWith(
        "fatal error",
        err,
        undefined
      );
    });
  });

  describe("PII scrubbing", () => {
    it("scrubs messages through scrubString before delegating", () => {
      Logger.info("my secret value");

      expect(scrubString).toHaveBeenCalledWith("my secret value");
      expect(mockAdapter.info).toHaveBeenCalledWith(
        "my [REDACTED] value",
        undefined
      );
    });
  });

  describe("breadcrumbs", () => {
    it("delegates addBreadcrumb to adapter", () => {
      Logger.addBreadcrumb("http", "GET /api", { status: 200 });

      expect(mockAdapter.addBreadcrumb).toHaveBeenCalledWith(
        "http",
        "GET /api",
        { status: 200 }
      );
    });

    it("delegates getBreadcrumbs to adapter", () => {
      const crumbs: Breadcrumb[] = [
        { timestamp: 1, category: "test", message: "hi" },
      ];
      mockAdapter.getBreadcrumbs.mockReturnValue(crumbs);

      expect(Logger.getBreadcrumbs()).toEqual(crumbs);
    });
  });

  describe("context", () => {
    it("delegates setContext to adapter", () => {
      Logger.setContext("userId", "123");

      expect(mockAdapter.setContext).toHaveBeenCalledWith("userId", "123");
    });

    it("delegates clearContext to adapter", () => {
      Logger.clearContext();

      expect(mockAdapter.clearContext).toHaveBeenCalled();
    });
  });

  describe("withContext", () => {
    it("merges context into every call", () => {
      const scoped = Logger.withContext({ module: "Auth" });

      scoped.info("login attempt", { ip: "1.2.3.4" });

      expect(mockAdapter.info).toHaveBeenCalledWith("login attempt", {
        module: "Auth",
        ip: "1.2.3.4",
      });
    });

    it("works with debug level", () => {
      const scoped = Logger.withContext({ module: "DB" });

      scoped.debug("query executed");

      expect(mockAdapter.debug).toHaveBeenCalledWith("query executed", {
        module: "DB",
      });
    });

    it("works with error level", () => {
      const scoped = Logger.withContext({ module: "API" });
      const err = new Error("timeout");

      scoped.error("request failed", err, { url: "/test" });

      expect(mockAdapter.error).toHaveBeenCalledWith("request failed", err, {
        module: "API",
        url: "/test",
      });
    });
  });

  describe("setAdapter", () => {
    it("switches the underlying adapter", () => {
      const newAdapter: jest.Mocked<LoggerAdapter> = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        fatal: jest.fn(),
        addBreadcrumb: jest.fn(),
        getBreadcrumbs: jest.fn(() => []),
        setContext: jest.fn(),
        clearContext: jest.fn(),
      };

      Logger.setAdapter(newAdapter);
      Logger.info("after swap");

      expect(newAdapter.info).toHaveBeenCalledWith("after swap", undefined);
      expect(mockAdapter.info).not.toHaveBeenCalled();
    });
  });
});
