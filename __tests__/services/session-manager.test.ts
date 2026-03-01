// Import after mock so the singleton picks up test config
import { SessionManager } from "@/services/session/session-manager";

jest.mock("@/constants/config", () => ({
  SESSION: {
    ENABLED: true,
    TIMEOUT_MS: 5000,
    WARNING_BEFORE_MS: 2000,
  },
  LOGGER: { ENABLED: false, MIN_LEVEL: "warn", MAX_BREADCRUMBS: 100 },
}));

describe("SessionManager", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    SessionManager.stopMonitoring();
    // Reset internal state by touching
    SessionManager.touch();
  });

  afterEach(() => {
    SessionManager.stopMonitoring();
    jest.useRealTimers();
  });

  describe("touch", () => {
    it("resets the activity timer", () => {
      // Advance time so session would be close to warning
      jest.advanceTimersByTime(3500);
      expect(SessionManager.isWarning()).toBe(true);

      SessionManager.touch();
      expect(SessionManager.isWarning()).toBe(false);
      expect(SessionManager.isExpired()).toBe(false);
    });
  });

  describe("isExpired", () => {
    it("returns false before timeout", () => {
      expect(SessionManager.isExpired()).toBe(false);
    });

    it("returns true after timeout", () => {
      jest.advanceTimersByTime(5000);
      expect(SessionManager.isExpired()).toBe(true);
    });
  });

  describe("isWarning", () => {
    it("returns false when session is fresh", () => {
      expect(SessionManager.isWarning()).toBe(false);
    });

    it("returns true in warning zone (timeout - warningBefore)", () => {
      // Warning zone is 5000 - 2000 = 3000ms
      jest.advanceTimersByTime(3500);
      expect(SessionManager.isWarning()).toBe(true);
    });

    it("returns false when session is expired", () => {
      jest.advanceTimersByTime(5500);
      expect(SessionManager.isWarning()).toBe(false);
    });
  });

  describe("getRemainingMs", () => {
    it("returns full timeout when fresh", () => {
      expect(SessionManager.getRemainingMs()).toBe(5000);
    });

    it("decreases over time", () => {
      jest.advanceTimersByTime(1000);
      expect(SessionManager.getRemainingMs()).toBe(4000);
    });

    it("returns 0 when expired", () => {
      jest.advanceTimersByTime(6000);
      expect(SessionManager.getRemainingMs()).toBe(0);
    });
  });

  describe("callbacks", () => {
    it("fires onWarning callback when entering warning zone", () => {
      const onWarning = jest.fn();
      SessionManager.onWarning(onWarning);
      SessionManager.startMonitoring();

      // Advance into warning zone (3000ms + a bit)
      jest.advanceTimersByTime(3500);

      expect(onWarning).toHaveBeenCalledTimes(1);
    });

    it("fires onExpired callback when session expires", () => {
      const onExpired = jest.fn();
      SessionManager.onExpired(onExpired);
      SessionManager.startMonitoring();

      jest.advanceTimersByTime(5500);

      expect(onExpired).toHaveBeenCalledTimes(1);
    });

    it("does not fire warning callback more than once before touch", () => {
      const onWarning = jest.fn();
      SessionManager.onWarning(onWarning);
      SessionManager.startMonitoring();

      jest.advanceTimersByTime(3500);
      jest.advanceTimersByTime(500);

      expect(onWarning).toHaveBeenCalledTimes(1);
    });
  });

  describe("startMonitoring / stopMonitoring", () => {
    it("stops monitoring and no more callbacks fire", () => {
      const onExpired = jest.fn();
      SessionManager.onExpired(onExpired);
      SessionManager.startMonitoring();

      SessionManager.stopMonitoring();
      jest.advanceTimersByTime(10000);

      expect(onExpired).not.toHaveBeenCalled();
    });

    it("does not start monitoring twice", () => {
      const onWarning = jest.fn();
      SessionManager.onWarning(onWarning);

      SessionManager.startMonitoring();
      SessionManager.startMonitoring(); // second call is a no-op

      jest.advanceTimersByTime(3500);

      // Should only fire once, not twice (one per interval)
      expect(onWarning).toHaveBeenCalledTimes(1);
    });
  });
});
