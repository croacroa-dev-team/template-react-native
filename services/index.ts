export { api, ApiClient } from "./api";
export { storage, secureStorage } from "./storage";
export {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
} from "./sentry";
export { authAdapter, mockAuthAdapter } from "./authAdapter";
export type { AuthAdapter, AuthResult, AuthError } from "./authAdapter";
export {
  analytics,
  track,
  identify,
  screen,
  resetAnalytics,
  setUserProperties,
  trackRevenue,
  AnalyticsEvents,
} from "./analytics";
export type { AnalyticsAdapter, AnalyticsEvent } from "./analytics";
export {
  getCertificatePins,
  isSslPinningEnabled,
  getSecurityHeaders,
  isUrlAllowed,
  sanitizeInput,
  checkSecurityEnvironment,
  SSL_PINNING_CONFIG,
} from "./security";
export {
  queueMutation,
  getMutationQueue,
  removeMutation,
  clearMutationQueue,
  getPendingMutationCount,
  processQueue,
  registerBackgroundSync,
  unregisterBackgroundSync,
  isBackgroundSyncRegistered,
  getBackgroundSyncStatus,
  isNetworkError,
  registerConflictResolver,
  unregisterConflictResolver,
  getPendingConflicts,
  clearPendingConflict,
} from "./backgroundSync";
export type {
  QueuedMutation,
  ConflictResolutionStrategy,
  SyncConflict,
  ConflictResolver,
} from "./backgroundSync";
export {
  PermissionManager,
  normalizeStatus,
} from "./permissions/permission-manager";
export { DEFAULT_PERMISSION_CONFIGS } from "./permissions/types";
export type {
  PermissionType,
  PermissionStatus,
  PermissionResult,
  PermissionConfig,
} from "./permissions/types";
export { Analytics } from "./analytics/analytics-adapter";
export { ConsoleAnalyticsAdapter } from "./analytics/adapters/console";
export type {
  AnalyticsAdapter as AnalyticsAdapterInterface,
  AnalyticsConfig,
} from "./analytics/types";
export { Payments } from "./payments/payment-adapter";
export { MockPaymentAdapter, MOCK_PRODUCTS } from "./payments/adapters/mock";
export type {
  PaymentAdapter,
  Product,
  Purchase,
  ProductType,
  SubscriptionPeriod,
  SubscriptionStatus,
  SubscriptionInfo,
} from "./payments/types";
export { pickFromLibrary, pickFromCamera } from "./media/media-picker";
export type { PickedMedia, PickOptions } from "./media/media-picker";
export { compressImage } from "./media/compression";
export type {
  CompressionOptions,
  CompressionResult,
} from "./media/compression";
export { uploadFile } from "./media/media-upload";
export type {
  UploadProgress,
  UploadOptions,
  UploadResult,
} from "./media/media-upload";
export { WebSocketManager } from "./realtime/websocket-manager";
export type {
  ConnectionStatus,
  WebSocketConfig,
  WebSocketMessage,
  MessageHandler,
  StatusHandler,
  PresenceUser,
} from "./realtime/types";
export { checkForUpdate, isVersionLessThan } from "./force-update";
export type {
  ForceUpdateConfig,
  ForceUpdateResponse,
  ForceUpdateResult,
} from "./force-update";
export { FeatureFlags } from "./feature-flags/feature-flag-adapter";
export { MockFeatureFlagAdapter } from "./feature-flags/adapters/mock";
export type {
  FeatureFlagAdapter,
  FeatureFlagConfig,
} from "./feature-flags/types";
export { Logger } from "./logger/logger-adapter";
export { ConsoleLoggerAdapter } from "./logger/adapters/console";
export type { LoggerAdapter, LogLevel, Breadcrumb } from "./logger/types";
export { RemoteConfig } from "./config/config-adapter";
export { MockRemoteConfigAdapter } from "./config/adapters/mock";
export type { RemoteConfigAdapter } from "./config/types";
export { Database } from "./database/database-adapter";
export { SQLiteAdapter } from "./database/adapters/sqlite";
export { MockDatabaseAdapter } from "./database/adapters/mock";
export type { DatabaseAdapter, TransactionContext, Migration } from "./database/types";
export { withRetry } from "./api/retry";
export type { RetryConfig } from "./api/retry";
export { CircuitBreaker } from "./api/circuit-breaker";
export { deduplicate, getDeduplicationKey, getInflightCount } from "./api/deduplicator";
export { SessionManager } from "./session/session-manager";
export { InterceptorManager, correlationIdInterceptor, userAgentInterceptor, requestTimingInterceptor, requestSigningInterceptor } from "./api/interceptors";
export type { RequestConfig, RequestInterceptor, ResponseInterceptor } from "./api/interceptors";
export { AnalyticsSession } from "./analytics/session";
