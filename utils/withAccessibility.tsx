/**
 * @fileoverview Accessibility enforcement HOC and utilities
 * Provides HOCs and hooks to enforce accessibility props on components.
 * @module utils/withAccessibility
 */

import React, { ComponentType, forwardRef } from "react";
import { AccessibilityProps, AccessibilityRole } from "react-native";

/**
 * Required accessibility props that must be provided
 */
interface RequiredA11yProps {
  accessibilityLabel: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityHint?: string;
  testID?: string;
}

/**
 * A11y configuration for the HOC
 */
interface A11yConfig {
  /** Default role if not provided */
  defaultRole?: AccessibilityRole;
  /** Whether to require accessibilityHint */
  requireHint?: boolean;
  /** Whether to auto-generate testID from label */
  autoTestID?: boolean;
  /** Prefix for auto-generated testIDs */
  testIDPrefix?: string;
}

/**
 * Higher-Order Component that enforces accessibility props.
 * Wraps a component and ensures required a11y props are provided.
 *
 * @param WrappedComponent - The component to wrap
 * @param config - A11y configuration options
 * @returns Enhanced component with a11y enforcement
 *
 * @example
 * ```tsx
 * // Create an accessible button
 * const AccessibleButton = withAccessibility(Button, {
 *   defaultRole: 'button',
 *   autoTestID: true,
 *   testIDPrefix: 'btn',
 * });
 *
 * // Usage - will error if accessibilityLabel is missing
 * <AccessibleButton
 *   accessibilityLabel="Submit form"
 *   onPress={handleSubmit}
 * >
 *   Submit
 * </AccessibleButton>
 * ```
 */
export function withAccessibility<P extends AccessibilityProps>(
  WrappedComponent: ComponentType<P>,
  config: A11yConfig = {}
) {
  const {
    defaultRole,
    requireHint = false,
    autoTestID = true,
    testIDPrefix = "",
  } = config;

  type EnhancedProps = P & RequiredA11yProps;

  const EnhancedComponent = forwardRef<unknown, EnhancedProps>((props, ref) => {
    const {
      accessibilityLabel,
      accessibilityRole = defaultRole,
      accessibilityHint,
      testID,
      ...restProps
    } = props;

    // Development-time validation
    if (__DEV__) {
      if (!accessibilityLabel) {
        console.warn(
          `[A11y] ${WrappedComponent.displayName || "Component"} is missing accessibilityLabel`
        );
      }
      if (requireHint && !accessibilityHint) {
        console.warn(
          `[A11y] ${WrappedComponent.displayName || "Component"} is missing accessibilityHint`
        );
      }
    }

    // Auto-generate testID if not provided
    const finalTestID =
      testID ||
      (autoTestID && accessibilityLabel
        ? `${testIDPrefix}${testIDPrefix ? "-" : ""}${accessibilityLabel
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")}`
        : undefined);

    return (
      <WrappedComponent
        {...(restProps as P)}
        ref={ref}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityHint={accessibilityHint}
        testID={finalTestID}
        accessible={true}
      />
    );
  });

  EnhancedComponent.displayName = `WithAccessibility(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return EnhancedComponent;
}

/**
 * Hook to validate accessibility props at runtime
 *
 * @example
 * ```tsx
 * function MyComponent({ accessibilityLabel, ...props }) {
 *   useAccessibilityValidation({ accessibilityLabel }, 'MyComponent');
 *   return <View {...props} />;
 * }
 * ```
 */
export function useAccessibilityValidation(
  props: Partial<AccessibilityProps>,
  componentName: string
): void {
  if (__DEV__) {
    if (!props.accessibilityLabel && !props.accessibilityLabelledBy) {
      console.warn(
        `[A11y] ${componentName}: Missing accessibilityLabel or accessibilityLabelledBy`
      );
    }
  }
}

/**
 * Create accessible props from a label
 * Utility to quickly generate standard a11y props
 *
 * @example
 * ```tsx
 * <Button {...createA11yProps('Submit form', 'button', 'Saves your changes')} />
 * ```
 */
export function createA11yProps(
  label: string,
  role?: AccessibilityRole,
  hint?: string
): AccessibilityProps & { testID: string } {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: role,
    accessibilityHint: hint,
    testID: label
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, ""),
  };
}

/**
 * Accessibility context for screen readers
 */
export const A11yContext = {
  /**
   * Check if accessibility features should be used
   */
  isEnabled: (): boolean => {
    // In a real app, check AccessibilityInfo.isScreenReaderEnabled()
    return true;
  },

  /**
   * Standard roles for common components
   */
  roles: {
    button: "button" as AccessibilityRole,
    link: "link" as AccessibilityRole,
    image: "image" as AccessibilityRole,
    text: "text" as AccessibilityRole,
    header: "header" as AccessibilityRole,
    search: "search" as AccessibilityRole,
    checkbox: "checkbox" as AccessibilityRole,
    radio: "radio" as AccessibilityRole,
    switch: "switch" as AccessibilityRole,
    slider: "adjustable" as AccessibilityRole,
    tab: "tab" as AccessibilityRole,
    tablist: "tablist" as AccessibilityRole,
    menu: "menu" as AccessibilityRole,
    menuitem: "menuitem" as AccessibilityRole,
    alert: "alert" as AccessibilityRole,
    progressbar: "progressbar" as AccessibilityRole,
  },
};

/**
 * ESLint-like runtime checker for a11y compliance
 * Call this in development to audit component trees
 */
export function auditAccessibility(
  element: React.ReactElement,
  path: string = "root"
): string[] {
  const warnings: string[] = [];

  if (!element || typeof element !== "object") {
    return warnings;
  }

  const props = element.props || {};
  const type = element.type;
  const typeName =
    typeof type === "string"
      ? type
      : (type as ComponentType)?.displayName ||
        (type as ComponentType)?.name ||
        "Unknown";

  // Check for interactive elements without labels
  const interactiveTypes = [
    "Button",
    "Pressable",
    "TouchableOpacity",
    "TouchableHighlight",
    "TouchableWithoutFeedback",
    "Switch",
    "TextInput",
  ];

  if (
    interactiveTypes.some(
      (t) => typeName.includes(t) || (typeof type === "string" && type === t)
    )
  ) {
    if (!props.accessibilityLabel && !props["aria-label"]) {
      warnings.push(`${path}/${typeName}: Missing accessibility label`);
    }
  }

  // Check images
  if (typeName === "Image" || typeName === "OptimizedImage") {
    if (!props.accessibilityLabel && !props.alt) {
      warnings.push(`${path}/${typeName}: Image missing alt text/label`);
    }
  }

  // Recursively check children
  if (props.children) {
    React.Children.forEach(props.children, (child, index) => {
      if (React.isValidElement(child)) {
        warnings.push(
          ...auditAccessibility(child, `${path}/${typeName}[${index}]`)
        );
      }
    });
  }

  return warnings;
}
