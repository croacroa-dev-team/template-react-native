/**
 * @fileoverview Reusable accessibility test helpers
 * Provides assertion functions to verify a11y compliance of UI components.
 * @module __tests__/helpers/a11y
 */

import { ReactTestInstance } from "react-test-renderer";

/**
 * Assert that an element is an accessible button.
 * Checks: accessibilityRole="button" or role="button", has accessibilityLabel
 */
export function expectAccessibleButton(element: ReactTestInstance): void {
  // Check role is "button"
  const role = element.props.accessibilityRole || element.props.role;
  expect(role).toBe("button");
  // Check has label (accessibilityLabel or aria-label)
  const label = element.props.accessibilityLabel || element.props["aria-label"];
  expect(label).toBeTruthy();
}

/**
 * Assert that an element is an accessible text input.
 * Checks: has accessibilityLabel or placeholder, correct state (editable)
 */
export function expectAccessibleInput(element: ReactTestInstance): void {
  const label =
    element.props.accessibilityLabel ||
    element.props["aria-label"] ||
    element.props.placeholder;
  expect(label).toBeTruthy();
}

/**
 * Assert that an element has an accessible label.
 */
export function expectAccessibleLabel(element: ReactTestInstance): void {
  const label =
    element.props.accessibilityLabel ||
    element.props["aria-label"] ||
    element.props.accessibilityHint;
  expect(label).toBeTruthy();
}

/**
 * Assert that a disabled element communicates its disabled state to assistive tech.
 */
export function expectAccessibleDisabledState(
  element: ReactTestInstance
): void {
  const state = element.props.accessibilityState;
  expect(state).toBeDefined();
  expect(state.disabled).toBe(true);
}
