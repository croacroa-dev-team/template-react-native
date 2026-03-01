import React from "react";
import { render } from "@testing-library/react-native";
import { CountdownTimer } from "@/components/ui/CountdownTimer";

// Mock useCountdown to control the timer state deterministically
jest.mock("@/hooks/useCountdown", () => ({
  useCountdown: jest.fn(),
}));

// Mock nativewind cn utility
jest.mock("@/utils/cn", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

const mockUseCountdown = require("@/hooks/useCountdown")
  .useCountdown as jest.Mock;

describe("CountdownTimer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCountdown.mockReturnValue({
      remaining: 30,
      isRunning: true,
      isFinished: false,
      progress: 1,
      start: jest.fn(),
      pause: jest.fn(),
      reset: jest.fn(),
    });
  });

  it("renders the remaining time", () => {
    mockUseCountdown.mockReturnValue({
      remaining: 45,
      isRunning: true,
      isFinished: false,
      progress: 0.75,
      start: jest.fn(),
      pause: jest.fn(),
      reset: jest.fn(),
    });

    const { getByText } = render(<CountdownTimer duration={60} />);

    expect(getByText("45")).toBeTruthy();
  });

  it("renders formatted time with minutes", () => {
    mockUseCountdown.mockReturnValue({
      remaining: 90,
      isRunning: true,
      isFinished: false,
      progress: 0.5,
      start: jest.fn(),
      pause: jest.fn(),
      reset: jest.fn(),
    });

    const { getByText } = render(<CountdownTimer duration={180} />);

    expect(getByText("1:30")).toBeTruthy();
  });

  it('shows "Time\'s up!" when finished', () => {
    mockUseCountdown.mockReturnValue({
      remaining: 0,
      isRunning: false,
      isFinished: true,
      progress: 0,
      start: jest.fn(),
      pause: jest.fn(),
      reset: jest.fn(),
    });

    const { getByText } = render(<CountdownTimer duration={10} />);

    expect(getByText("Time's up!")).toBeTruthy();
    expect(getByText("0")).toBeTruthy();
  });

  it("renders progress bar when showProgress=true (default)", () => {
    const { toJSON } = render(<CountdownTimer duration={10} />);

    // The component tree should contain the progress bar View (with overflow hidden)
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain("overflow");
  });

  it("hides progress bar when showProgress=false", () => {
    const { toJSON } = render(
      <CountdownTimer duration={10} showProgress={false} />
    );

    const tree = JSON.stringify(toJSON());
    // Without showProgress, there should be no progress bar container with overflow
    expect(tree).not.toContain("overflow");
  });

  it('uses accessibilityRole="timer"', () => {
    const { getByRole } = render(<CountdownTimer duration={10} />);

    expect(getByRole("timer")).toBeTruthy();
  });

  it("includes accessibility label with remaining seconds", () => {
    mockUseCountdown.mockReturnValue({
      remaining: 15,
      isRunning: true,
      isFinished: false,
      progress: 0.5,
      start: jest.fn(),
      pause: jest.fn(),
      reset: jest.fn(),
    });

    const { getByLabelText } = render(<CountdownTimer duration={30} />);

    expect(getByLabelText("15 seconds remaining")).toBeTruthy();
  });
});
