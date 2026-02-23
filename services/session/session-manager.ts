/**
 * @fileoverview Session timeout manager
 * @module services/session/session-manager
 */

import { SESSION } from "@/constants/config";
import { Logger } from "@/services/logger/logger-adapter";

type SessionCallback = () => void;

class SessionManagerClass {
  private lastActivity = Date.now();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onWarningCallback: SessionCallback | null = null;
  private onExpiredCallback: SessionCallback | null = null;
  private warningEmitted = false;

  /** Update the last activity timestamp */
  touch(): void {
    this.lastActivity = Date.now();
    this.warningEmitted = false;
  }

  /** Check if the session has expired */
  isExpired(): boolean {
    return Date.now() - this.lastActivity >= SESSION.TIMEOUT_MS;
  }

  /** Check if we should show the warning */
  isWarning(): boolean {
    const elapsed = Date.now() - this.lastActivity;
    return (
      elapsed >= SESSION.TIMEOUT_MS - SESSION.WARNING_BEFORE_MS &&
      !this.isExpired()
    );
  }

  /** Remaining time in milliseconds */
  getRemainingMs(): number {
    return Math.max(0, SESSION.TIMEOUT_MS - (Date.now() - this.lastActivity));
  }

  /** Register event callbacks */
  onWarning(callback: SessionCallback): void {
    this.onWarningCallback = callback;
  }

  onExpired(callback: SessionCallback): void {
    this.onExpiredCallback = callback;
  }

  /** Start monitoring session activity */
  startMonitoring(): void {
    if (!SESSION.ENABLED || this.intervalId) return;

    this.lastActivity = Date.now();
    this.intervalId = setInterval(() => {
      if (this.isExpired()) {
        Logger.warn("Session expired");
        this.onExpiredCallback?.();
        this.stopMonitoring();
      } else if (this.isWarning() && !this.warningEmitted) {
        this.warningEmitted = true;
        this.onWarningCallback?.();
      }
    }, 1000);

    Logger.info("Session monitoring started");
  }

  /** Stop monitoring */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const SessionManager = new SessionManagerClass();
