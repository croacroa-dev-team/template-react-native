/**
 * @fileoverview Snapshot tests for UI components
 * Ensures visual consistency of components across changes.
 */

import React from "react";
import { render } from "@testing-library/react-native";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// Mock useTheme hook for components that use it
jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    isDark: false,
    mode: "light",
    isLoaded: true,
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
  }),
}));

describe("UI Components Snapshots", () => {
  describe("Button", () => {
    it("renders primary variant correctly", () => {
      const { toJSON } = render(<Button variant="primary">Primary</Button>);
      expect(toJSON()).toMatchSnapshot();
    });

    it("renders secondary variant correctly", () => {
      const { toJSON } = render(<Button variant="secondary">Secondary</Button>);
      expect(toJSON()).toMatchSnapshot();
    });

    it("renders outline variant correctly", () => {
      const { toJSON } = render(<Button variant="outline">Outline</Button>);
      expect(toJSON()).toMatchSnapshot();
    });

    it("renders ghost variant correctly", () => {
      const { toJSON } = render(<Button variant="ghost">Ghost</Button>);
      expect(toJSON()).toMatchSnapshot();
    });

    it("renders danger variant correctly", () => {
      const { toJSON } = render(<Button variant="danger">Danger</Button>);
      expect(toJSON()).toMatchSnapshot();
    });

    it("renders small size correctly", () => {
      const { toJSON } = render(<Button size="sm">Small</Button>);
      expect(toJSON()).toMatchSnapshot();
    });

    it("renders large size correctly", () => {
      const { toJSON } = render(<Button size="lg">Large</Button>);
      expect(toJSON()).toMatchSnapshot();
    });

    it("renders loading state correctly", () => {
      const { toJSON } = render(<Button isLoading>Loading</Button>);
      expect(toJSON()).toMatchSnapshot();
    });

    it("renders disabled state correctly", () => {
      const { toJSON } = render(<Button disabled>Disabled</Button>);
      expect(toJSON()).toMatchSnapshot();
    });

    it("renders with custom children correctly", () => {
      const { toJSON } = render(
        <Button>
          <View>
            <Text>Custom Content</Text>
          </View>
        </Button>
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe("Card", () => {
    it("renders default variant correctly", () => {
      const { toJSON } = render(
        <Card>
          <Text>Default Card</Text>
        </Card>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it("renders elevated variant correctly", () => {
      const { toJSON } = render(
        <Card variant="elevated">
          <Text>Elevated Card</Text>
        </Card>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it("renders outlined variant correctly", () => {
      const { toJSON } = render(
        <Card variant="outlined">
          <Text>Outlined Card</Text>
        </Card>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it("renders with custom className correctly", () => {
      const { toJSON } = render(
        <Card className="p-4 m-2">
          <Text>Custom Styled Card</Text>
        </Card>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it("renders complex content correctly", () => {
      const { toJSON } = render(
        <Card variant="elevated" className="p-4">
          <Text>Title</Text>
          <Text>Description text here</Text>
          <Button>Action</Button>
        </Card>
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
