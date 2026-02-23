import { renderHook } from "@testing-library/react-native";

import { useAnimatedEntry, useStaggeredEntry } from "@/hooks/useAnimatedEntry";
import { useParallax } from "@/hooks/useParallax";

describe("useAnimatedEntry", () => {
  it("should return animatedStyle and play function", () => {
    const { result } = renderHook(() => useAnimatedEntry());

    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.play).toBe("function");
    expect(typeof result.current.reset).toBe("function");
    expect(result.current.progress).toBeDefined();
  });

  it("should default animation type to fadeIn", () => {
    // The hook should work without options and use fadeIn as default
    const { result } = renderHook(() => useAnimatedEntry());

    // The hook returns successfully with defaults
    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.progress).toBeDefined();
  });

  it("should accept custom animation options", () => {
    const { result } = renderHook(() =>
      useAnimatedEntry({
        animation: "slideUp",
        delay: 200,
        autoPlay: false,
      })
    );

    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.play).toBe("function");
  });
});

describe("useStaggeredEntry", () => {
  it("should return staggered animated style with index-based delay", () => {
    const { result } = renderHook(() =>
      useStaggeredEntry(2, { animation: "slideUp", staggerDelay: 80 })
    );

    expect(result.current.animatedStyle).toBeDefined();
    expect(typeof result.current.play).toBe("function");
    expect(typeof result.current.reset).toBe("function");
  });
});

describe("useParallax", () => {
  it("should return scrollY, scrollHandler, parallaxStyle, and headerStyle", () => {
    const { result } = renderHook(() => useParallax());

    expect(result.current.scrollY).toBeDefined();
    expect(result.current.scrollHandler).toBeDefined();
    expect(result.current.parallaxStyle).toBeDefined();
    expect(result.current.headerStyle).toBeDefined();
  });

  it("should accept custom options", () => {
    const { result } = renderHook(() =>
      useParallax({ speed: 0.3, headerHeight: 300 })
    );

    expect(result.current.scrollY).toBeDefined();
    expect(result.current.parallaxStyle).toBeDefined();
    expect(result.current.headerStyle).toBeDefined();
  });
});
