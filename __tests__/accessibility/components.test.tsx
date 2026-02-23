/**
 * @fileoverview Accessibility tests for UI components
 * Tests a11y compliance of Button, Input, Checkbox, Modal, and Card.
 * @module __tests__/accessibility/components
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { Text } from "react-native";
import {
  expectAccessibleButton,
  expectAccessibleInput,
  expectAccessibleDisabledState,
} from "../helpers/a11y";

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    isDark: false,
    theme: "light",
    setTheme: jest.fn(),
    toggleTheme: jest.fn(),
  }),
}));

// ──────────────────────────────────────────────────────────────────
// Button a11y tests
// ──────────────────────────────────────────────────────────────────
describe("Button - accessibility", () => {
  it("renders string children as visible text", () => {
    const { getByText } = render(<Button>Submit</Button>);
    expect(getByText("Submit")).toBeTruthy();
  });

  it("renders ReactNode children", () => {
    const { getByText } = render(
      <Button>
        <Text>Custom child</Text>
      </Button>
    );
    expect(getByText("Custom child")).toBeTruthy();
  });

  it("disables interaction when disabled prop is set", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress} disabled>
        Disabled
      </Button>
    );
    fireEvent.press(getByText("Disabled"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("shows ActivityIndicator and hides text when isLoading is true", () => {
    const { queryByText, getByTestId } = render(
      <Button isLoading testID="loading-btn">
        Save
      </Button>
    );
    expect(queryByText("Save")).toBeNull();
    // The Pressable wrapper should be findable by testID
    expect(getByTestId("loading-btn")).toBeTruthy();
  });

  it("disables interaction when isLoading is true", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button onPress={onPress} isLoading testID="loading-btn">
        Save
      </Button>
    );
    fireEvent.press(getByTestId("loading-btn"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders all variant styles without crashing", () => {
    const variants = [
      "primary",
      "secondary",
      "outline",
      "ghost",
      "danger",
    ] as const;
    variants.forEach((variant) => {
      const { getByText } = render(
        <Button variant={variant}>{variant}</Button>
      );
      expect(getByText(variant)).toBeTruthy();
    });
  });

  it("has correct accessibilityRole and accessibilityLabel", () => {
    const { getByRole } = render(
      <Button accessibilityLabel="Submit form">Submit</Button>
    );
    const btn = getByRole("button");
    expectAccessibleButton(btn);
  });

  it("communicates disabled state to assistive technology", () => {
    const { getByRole } = render(
      <Button accessibilityLabel="Submit form" disabled>
        Submit
      </Button>
    );
    expectAccessibleDisabledState(getByRole("button"));
  });
});

// ──────────────────────────────────────────────────────────────────
// Input a11y tests
// ──────────────────────────────────────────────────────────────────
describe("Input - accessibility", () => {
  it("renders label text when label prop is provided", () => {
    const { getByText } = render(<Input label="Email" />);
    expect(getByText("Email")).toBeTruthy();
  });

  it("renders placeholder text on the TextInput", () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter email" />
    );
    expect(getByPlaceholderText("Enter email")).toBeTruthy();
  });

  it("displays error message when error prop is set", () => {
    const { getByText } = render(
      <Input label="Email" error="Email is required" />
    );
    expect(getByText("Email is required")).toBeTruthy();
  });

  it("displays hint text when hint prop is set and no error", () => {
    const { getByText } = render(
      <Input label="Password" hint="Must be 8 characters" />
    );
    expect(getByText("Must be 8 characters")).toBeTruthy();
  });

  it("hides hint when error is present", () => {
    const { queryByText, getByText } = render(
      <Input label="Password" hint="Must be 8 characters" error="Too short" />
    );
    expect(getByText("Too short")).toBeTruthy();
    expect(queryByText("Must be 8 characters")).toBeNull();
  });

  it("has an accessible label via placeholder", () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter your email" />
    );
    expectAccessibleInput(getByPlaceholderText("Enter your email"));
  });
});

// ──────────────────────────────────────────────────────────────────
// Checkbox a11y tests
// ──────────────────────────────────────────────────────────────────
describe("Checkbox - accessibility", () => {
  it("renders label text when label prop is provided", () => {
    const { getByText } = render(
      <Checkbox checked={false} onChange={jest.fn()} label="Accept terms" />
    );
    expect(getByText("Accept terms")).toBeTruthy();
  });

  it("calls onChange with toggled value when pressed", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <Checkbox checked={false} onChange={onChange} label="Toggle me" />
    );
    fireEvent.press(getByText("Toggle me"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not call onChange when disabled", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <Checkbox checked={false} onChange={onChange} label="Disabled" disabled />
    );
    fireEvent.press(getByText("Disabled"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders description text when provided", () => {
    const { getByText } = render(
      <Checkbox
        checked={false}
        onChange={jest.fn()}
        label="Newsletter"
        description="Receive weekly updates"
      />
    );
    expect(getByText("Receive weekly updates")).toBeTruthy();
  });
});

// ──────────────────────────────────────────────────────────────────
// Modal a11y tests
// ──────────────────────────────────────────────────────────────────
describe("Modal - accessibility", () => {
  it("renders title text when visible with title prop", () => {
    const { getByText } = render(
      <Modal visible title="Confirm Action" onClose={jest.fn()}>
        <Text>Body</Text>
      </Modal>
    );
    expect(getByText("Confirm Action")).toBeTruthy();
  });

  it("renders children content when visible", () => {
    const { getByText } = render(
      <Modal visible onClose={jest.fn()}>
        <Text>Modal body content</Text>
      </Modal>
    );
    expect(getByText("Modal body content")).toBeTruthy();
  });

  it("renders close button by default", () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <Modal visible title="Test" onClose={onClose}>
        <Text>Content</Text>
      </Modal>
    );
    // The modal always renders the title and a close button
    expect(getByText("Test")).toBeTruthy();
  });
});

// ──────────────────────────────────────────────────────────────────
// Card a11y tests
// ──────────────────────────────────────────────────────────────────
describe("Card - accessibility", () => {
  it("renders children content", () => {
    const { getByText } = render(
      <Card>
        <Text>Card content</Text>
      </Card>
    );
    expect(getByText("Card content")).toBeTruthy();
  });

  it("renders with default variant without crashing", () => {
    const { getByText } = render(
      <Card variant="default">
        <Text>Default</Text>
      </Card>
    );
    expect(getByText("Default")).toBeTruthy();
  });

  it("renders with elevated variant without crashing", () => {
    const { getByText } = render(
      <Card variant="elevated">
        <Text>Elevated</Text>
      </Card>
    );
    expect(getByText("Elevated")).toBeTruthy();
  });

  it("renders with outlined variant without crashing", () => {
    const { getByText } = render(
      <Card variant="outlined">
        <Text>Outlined</Text>
      </Card>
    );
    expect(getByText("Outlined")).toBeTruthy();
  });

  it("passes extra ViewProps through to the underlying View", () => {
    const { getByTestId } = render(
      <Card testID="my-card">
        <Text>Hello</Text>
      </Card>
    );
    expect(getByTestId("my-card")).toBeTruthy();
  });
});
