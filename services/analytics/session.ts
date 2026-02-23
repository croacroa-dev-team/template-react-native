/**
 * @fileoverview Analytics session tracking
 * @module services/analytics/session
 */

import { AppState, AppStateStatus } from "react-native";
import { Logger } from "@/services/logger/logger-adapter";

const SESSION_GAP_MS = 30 * 60 * 1000;

function generateSessionId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    },
  );
}

class AnalyticsSessionManager {
  private sessionId = generateSessionId();
  private startTime = Date.now();
  private eventCount = 0;
  private screensVisited = new Set<string>();
  private lastActiveTime = Date.now();
  private subscription: { remove: () => void } | null = null;

  /** Start tracking (call once at app launch) */
  start(): void {
    this.subscription = AppState.addEventListener(
      "change",
      this.handleAppStateChange,
    );
    Logger.info("Analytics session started", {
      sessionId: this.sessionId,
    });
  }

  /** Stop tracking */
  stop(): void {
    this.subscription?.remove();
    this.subscription = null;
  }

  private handleAppStateChange = (
    state: AppStateStatus,
  ): void => {
    if (state === "active") {
      const gap = Date.now() - this.lastActiveTime;
      if (gap >= SESSION_GAP_MS) {
        this.newSession();
      }
    }
    this.lastActiveTime = Date.now();
  };

  private newSession(): void {
    Logger.info("New analytics session (gap exceeded)", {
      previousSessionId: this.sessionId,
      previousDuration: this.getSessionDuration(),
      previousEventCount: this.eventCount,
    });
    this.sessionId = generateSessionId();
    this.startTime = Date.now();
    this.eventCount = 0;
    this.screensVisited.clear();
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getSessionDuration(): number {
    return Date.now() - this.startTime;
  }

  trackEvent(): void {
    this.eventCount++;
    this.lastActiveTime = Date.now();
  }

  trackScreen(name: string): void {
    this.screensVisited.add(name);
    this.lastActiveTime = Date.now();
  }

  getStats(): {
    sessionId: string;
    duration: number;
    eventCount: number;
    screens: string[];
  } {
    return {
      sessionId: this.sessionId,
      duration: this.getSessionDuration(),
      eventCount: this.eventCount,
      screens: Array.from(this.screensVisited),
    };
  }
}

export const AnalyticsSession = new AnalyticsSessionManager();
