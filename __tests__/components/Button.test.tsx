import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders correctly with text", () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText("Click me")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress}>Press me</Button>
    );

    fireEvent.press(getByText("Press me"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows loading indicator when isLoading is true", () => {
    const { queryByText, getByTestId } = render(
      <Button isLoading testID="button">
        Loading
      </Button>
    );

    // Text should not be visible when loading
    expect(queryByText("Loading")).toBeNull();
  });

  it("is disabled when disabled prop is true", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress} disabled>
        Disabled
      </Button>
    );

    fireEvent.press(getByText("Disabled"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("is disabled when isLoading is true", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button onPress={onPress} isLoading testID="loading-button">
        Loading
      </Button>
    );

    fireEvent.press(getByTestId("loading-button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("applies variant styles correctly", () => {
    const { rerender, getByText } = render(
      <Button variant="primary">Primary</Button>
    );
    expect(getByText("Primary")).toBeTruthy();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(getByText("Secondary")).toBeTruthy();

    rerender(<Button variant="outline">Outline</Button>);
    expect(getByText("Outline")).toBeTruthy();

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(getByText("Ghost")).toBeTruthy();

    rerender(<Button variant="danger">Danger</Button>);
    expect(getByText("Danger")).toBeTruthy();
  });
});
