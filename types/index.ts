// Re-export all types from a single entry point
export * from "./user";

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  status: number;
  details?: Record<string, string[]>;
}

// Navigation types (extend as needed)
export type RootStackParamList = {
  "(public)/login": undefined;
  "(public)/register": undefined;
  "(public)/forgot-password": undefined;
  "(auth)/home": undefined;
  "(auth)/profile": undefined;
  "(auth)/settings": undefined;
};

// Notification types
export interface NotificationData {
  type: "message" | "alert" | "promotion";
  screen?: string;
  params?: Record<string, unknown>;
}
