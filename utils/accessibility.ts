import { AccessibilityInfo, AccessibilityRole } from "react-native";
import { useEffect, useState } from "react";

// ============================================================================
// Types
// ============================================================================

export interface AccessibilityProps {
  /**
   * A brief description of the element
   */
  accessibilityLabel?: string;

  /**
   * Additional context about what will happen when the element is activated
   */
  accessibilityHint?: string;

  /**
   * The role of the element (button, link, header, etc.)
   */
  accessibilityRole?: AccessibilityRole;

  /**
   * State of the element (selected, disabled, checked, etc.)
   */
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | "mixed";
    busy?: boolean;
    expanded?: boolean;
  };

  /**
   * Value for sliders, progress bars, etc.
   */
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };

  /**
   * Whether the element is accessible
   */
  accessible?: boolean;

  /**
   * Test ID for testing
   */
  testID?: string;
}

// ============================================================================
// Accessibility Builders
// ============================================================================

/**
 * Build accessibility props for a button
 */
export function buttonA11y(
  label: string,
  options?: {
    hint?: string;
    disabled?: boolean;
    loading?: boolean;
    testID?: string;
  }
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: "button",
    accessibilityLabel: label,
    accessibilityHint: options?.hint,
    accessibilityState: {
      disabled: options?.disabled || options?.loading,
      busy: options?.loading,
    },
    testID: options?.testID,
  };
}

/**
 * Build accessibility props for a link
 */
export function linkA11y(
  label: string,
  options?: {
    hint?: string;
    testID?: string;
  }
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: "link",
    accessibilityLabel: label,
    accessibilityHint: options?.hint || "Double tap to open",
    testID: options?.testID,
  };
}

/**
 * Build accessibility props for a text input
 */
export function inputA11y(
  label: string,
  options?: {
    hint?: string;
    error?: string;
    required?: boolean;
    testID?: string;
  }
): AccessibilityProps {
  let accessibilityLabel = label;
  if (options?.required) {
    accessibilityLabel += ", required";
  }
  if (options?.error) {
    accessibilityLabel += `, error: ${options.error}`;
  }

  return {
    accessible: true,
    accessibilityLabel,
    accessibilityHint: options?.hint || "Double tap to edit",
    testID: options?.testID,
  };
}

/**
 * Build accessibility props for a checkbox/switch
 */
export function toggleA11y(
  label: string,
  checked: boolean,
  options?: {
    hint?: string;
    disabled?: boolean;
    testID?: string;
  }
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: "checkbox",
    accessibilityLabel: label,
    accessibilityHint:
      options?.hint || `Double tap to ${checked ? "uncheck" : "check"}`,
    accessibilityState: {
      checked,
      disabled: options?.disabled,
    },
    testID: options?.testID,
  };
}

/**
 * Build accessibility props for a header
 */
export function headerA11y(
  label: string,
  level: 1 | 2 | 3 | 4 | 5 | 6 = 1
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: "header",
    accessibilityLabel: `${label}, heading level ${level}`,
  };
}

/**
 * Build accessibility props for an image
 */
export function imageA11y(
  description: string,
  options?: {
    isDecorative?: boolean;
    testID?: string;
  }
): AccessibilityProps {
  if (options?.isDecorative) {
    return {
      accessible: false,
      accessibilityElementsHidden: true,
    } as AccessibilityProps;
  }

  return {
    accessible: true,
    accessibilityRole: "image",
    accessibilityLabel: description,
    testID: options?.testID,
  };
}

/**
 * Build accessibility props for a list item
 */
export function listItemA11y(
  label: string,
  position: number,
  total: number,
  options?: {
    hint?: string;
    selected?: boolean;
    testID?: string;
  }
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityLabel: `${label}, ${position} of ${total}`,
    accessibilityHint: options?.hint,
    accessibilityState: {
      selected: options?.selected,
    },
    testID: options?.testID,
  };
}

/**
 * Build accessibility props for a progress indicator
 */
export function progressA11y(
  label: string,
  value: number,
  options?: {
    min?: number;
    max?: number;
    testID?: string;
  }
): AccessibilityProps {
  const min = options?.min ?? 0;
  const max = options?.max ?? 100;
  const percentage = Math.round(((value - min) / (max - min)) * 100);

  return {
    accessible: true,
    accessibilityRole: "progressbar",
    accessibilityLabel: `${label}, ${percentage}% complete`,
    accessibilityValue: {
      min,
      max,
      now: value,
      text: `${percentage}%`,
    },
    testID: options?.testID,
  };
}

/**
 * Build accessibility props for a tab
 */
export function tabA11y(
  label: string,
  selected: boolean,
  position: number,
  total: number,
  options?: {
    hint?: string;
    testID?: string;
  }
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: "tab",
    accessibilityLabel: `${label}, tab ${position} of ${total}`,
    accessibilityHint: options?.hint,
    accessibilityState: {
      selected,
    },
    testID: options?.testID,
  };
}

/**
 * Build accessibility props for an alert/notification
 */
export function alertA11y(
  message: string,
  options?: {
    type?: "info" | "success" | "warning" | "error";
    testID?: string;
  }
): AccessibilityProps {
  const typeLabel = options?.type ? `${options.type}: ` : "";

  return {
    accessible: true,
    accessibilityRole: "alert",
    accessibilityLabel: `${typeLabel}${message}`,
    accessibilityLiveRegion: "polite",
    testID: options?.testID,
  } as AccessibilityProps;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to check if screen reader is enabled
 */
export function useScreenReader(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setIsEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setIsEnabled
    );

    return () => subscription.remove();
  }, []);

  return isEnabled;
}

/**
 * Hook to check if reduce motion is enabled
 */
export function useReduceMotion(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setIsEnabled
    );

    return () => subscription.remove();
  }, []);

  return isEnabled;
}

/**
 * Hook to check if bold text is enabled
 */
export function useBoldText(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isBoldTextEnabled().then(setIsEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      "boldTextChanged",
      setIsEnabled
    );

    return () => subscription.remove();
  }, []);

  return isEnabled;
}

/**
 * Hook to get all accessibility preferences
 */
export function useAccessibilityPreferences() {
  const isScreenReaderEnabled = useScreenReader();
  const isReduceMotionEnabled = useReduceMotion();
  const isBoldTextEnabled = useBoldText();

  return {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    isBoldTextEnabled,
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Announce a message to screen readers
 */
export function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Set focus to a specific element (requires a ref)
 */
export function setAccessibilityFocus(ref: React.RefObject<unknown>): void {
  if (ref.current) {
    AccessibilityInfo.setAccessibilityFocus(ref.current);
  }
}

/**
 * Format a price for accessibility
 */
export function formatPriceA11y(
  amount: number,
  currency = "EUR",
  locale = "fr-FR"
): string {
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);

  // Convert to speakable format
  return formatted
    .replace("€", "euros")
    .replace("$", "dollars")
    .replace("£", "pounds");
}

/**
 * Format a date for accessibility
 */
export function formatDateA11y(date: Date | string, locale = "fr-FR"): string {
  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a duration for accessibility
 */
export function formatDurationA11y(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs} second${secs !== 1 ? "s" : ""}`);
  }

  return parts.join(", ");
}
