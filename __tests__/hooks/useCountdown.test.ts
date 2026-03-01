import { renderHook, act } from "@testing-library/react-native";
import { useCountdown } from "@/hooks/useCountdown";

describe("useCountdown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts with the correct duration", () => {
    const { result } = renderHook(() => useCountdown({ duration: 10 }));

    expect(result.current.remaining).toBe(10);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isFinished).toBe(false);
  });

  it("countdown decrements each second after start", () => {
    const { result } = renderHook(() => useCountdown({ duration: 5 }));

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.remaining).toBe(4);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.remaining).toBe(3);
  });

  it("calls onFinish when reaching 0", () => {
    const onFinish = jest.fn();
    const { result } = renderHook(() =>
      useCountdown({ duration: 3, onFinish })
    );

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.remaining).toBe(0);
    expect(result.current.isFinished).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("pause stops the countdown", () => {
    const { result } = renderHook(() => useCountdown({ duration: 10 }));

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.remaining).toBe(8);

    act(() => {
      result.current.pause();
    });

    expect(result.current.isRunning).toBe(false);

    // Advance more time — should not decrement
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.remaining).toBe(8);
  });

  it("reset restores initial values", () => {
    const { result } = renderHook(() => useCountdown({ duration: 10 }));

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.remaining).toBe(5);

    act(() => {
      result.current.reset();
    });

    expect(result.current.remaining).toBe(10);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isFinished).toBe(false);
  });

  it("progress decreases from 1 to 0", () => {
    const { result } = renderHook(() => useCountdown({ duration: 4 }));

    expect(result.current.progress).toBe(1);

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.progress).toBe(0.75);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.progress).toBe(0.5);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.progress).toBe(0);
    expect(result.current.isFinished).toBe(true);
  });

  it("autoStart sets isRunning to true on mount", () => {
    const { result } = renderHook(() =>
      useCountdown({ duration: 5, autoStart: true })
    );

    // autoStart=true sets isRunning state to true at initialization
    expect(result.current.isRunning).toBe(true);
    expect(result.current.remaining).toBe(5);
  });

  it("does not go below 0 after running to completion", () => {
    const onFinish = jest.fn();
    const { result } = renderHook(() =>
      useCountdown({ duration: 2, onFinish })
    );

    act(() => {
      result.current.start();
    });

    // Advance well past the end
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.remaining).toBe(0);
    expect(result.current.isFinished).toBe(true);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
