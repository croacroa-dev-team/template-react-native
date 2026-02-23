/**
 * @fileoverview Circuit breaker pattern for API resilience
 * @module services/api/circuit-breaker
 */

import { CIRCUIT_BREAKER } from "@/constants/config";
import { Logger } from "@/services/logger/logger-adapter";

type CircuitState = "closed" | "open" | "half-open";

export class CircuitBreaker {
  private _state: CircuitState = "closed";
  private failureCount = 0;
  private lastFailureTime = 0;
  private threshold: number;
  private resetTimeoutMs: number;

  constructor(options?: {
    threshold?: number;
    resetTimeoutMs?: number;
  }) {
    this.threshold =
      options?.threshold ?? CIRCUIT_BREAKER.THRESHOLD;
    this.resetTimeoutMs =
      options?.resetTimeoutMs ?? CIRCUIT_BREAKER.RESET_TIMEOUT_MS;
  }

  get state(): CircuitState {
    if (this._state === "open") {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.resetTimeoutMs) {
        this._state = "half-open";
      }
    }
    return this._state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      throw new Error(
        "Circuit breaker is open — request rejected",
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this._state === "half-open") {
      Logger.info(
        "Circuit breaker closed after successful test request",
      );
    }
    this.failureCount = 0;
    this._state = "closed";
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this._state = "open";
      Logger.warn(
        `Circuit breaker opened after ${this.failureCount} failures`,
      );
    }
  }

  reset(): void {
    this._state = "closed";
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}
