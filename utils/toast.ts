import * as Burnt from "burnt";

type ToastPreset = "done" | "error" | "none";

interface ToastOptions {
  title: string;
  message?: string;
  preset?: ToastPreset;
  duration?: number;
  haptic?: "success" | "warning" | "error" | "none";
}

/**
 * Centralized toast notification system using Burnt
 * Works on iOS (native) and Android (custom implementation)
 */
export const toast = {
  /**
   * Show a success toast
   */
  success: (title: string, message?: string) => {
    Burnt.toast({
      title,
      message,
      preset: "done",
      haptic: "success",
      duration: 3,
    });
  },

  /**
   * Show an error toast
   */
  error: (title: string, message?: string) => {
    Burnt.toast({
      title,
      message,
      preset: "error",
      haptic: "error",
      duration: 4,
    });
  },

  /**
   * Show an info toast
   */
  info: (title: string, message?: string) => {
    Burnt.toast({
      title,
      message,
      preset: "none",
      haptic: "none",
      duration: 3,
    });
  },

  /**
   * Show a custom toast with full options
   */
  custom: (options: ToastOptions) => {
    Burnt.toast({
      title: options.title,
      message: options.message,
      preset: options.preset ?? "none",
      haptic: options.haptic ?? "none",
      duration: options.duration ?? 3,
    });
  },

  /**
   * Show a native alert dialog
   */
  alert: (title: string, message?: string, preset?: "done" | "error" | "heart") => {
    Burnt.alert({
      title,
      message,
      preset: preset ?? "done",
    });
  },

  /**
   * Dismiss all visible toasts
   */
  dismiss: () => {
    Burnt.dismissAllAlerts();
  },
};

/**
 * Handle API errors and show appropriate toast
 */
export const handleApiError = (error: unknown, fallbackMessage = "Something went wrong") => {
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes("Network") || error.message.includes("fetch")) {
      toast.error("Connection Error", "Please check your internet connection");
      return;
    }

    // Check for timeout
    if (error.message.includes("timeout")) {
      toast.error("Request Timeout", "The server took too long to respond");
      return;
    }

    // API error with message
    toast.error("Error", error.message);
    return;
  }

  // Fallback for unknown errors
  toast.error("Error", fallbackMessage);
};
