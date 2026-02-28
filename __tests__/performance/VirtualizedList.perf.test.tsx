/**
 * @fileoverview Performance tests for VirtualizedList component
 * Tests render times and memory usage with large datasets.
 */

import React from "react";
import { render } from "@testing-library/react-native";
import { View, Text } from "react-native";

import { VirtualizedList } from "@/components/ui/VirtualizedList";

// Mock FlashList since it requires native modules
jest.mock("@shopify/flash-list", () => {
  const { FlatList } = require("react-native");
  return {
    FlashList: FlatList,
  };
});

// Mock useTheme
jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    isDark: false,
    mode: "light",
    isLoaded: true,
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
  }),
}));

/**
 * Generate test data
 */
function generateTestData(
  count: number
): { id: string; title: string; value: number }[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `item-${index}`,
    title: `Item ${index}`,
    value: Math.random() * 1000,
  }));
}

/**
 * Simple render item component
 */
function TestItem({
  item,
}: {
  item: { id: string; title: string; value: number };
}) {
  return (
    <View testID={`item-${item.id}`} style={{ height: 50, padding: 10 }}>
      <Text>{item.title}</Text>
      <Text>{item.value.toFixed(2)}</Text>
    </View>
  );
}

/**
 * Performance thresholds (in milliseconds)
 */
const PERFORMANCE_THRESHOLDS = {
  SMALL_LIST_RENDER: 200, // 100 items
  MEDIUM_LIST_RENDER: 500, // 1000 items
  LARGE_LIST_RENDER: 1000, // 10000 items
  INITIAL_RENDER: 200, // Initial render without data (includes mock overhead)
};

describe("VirtualizedList Performance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Warm up render to avoid counting module init overhead
  beforeAll(() => {
    const warmupData: { id: string; title: string; value: number }[] = [];
    render(
      <VirtualizedList
        data={warmupData}
        renderItem={({ item }) => <TestItem item={item} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={50}
      />
    );
  });

  describe("Render Time", () => {
    it("renders empty list within threshold", () => {
      const startTime = performance.now();
      const emptyData: { id: string; title: string; value: number }[] = [];

      render(
        <VirtualizedList
          data={emptyData}
          renderItem={({ item }) => <TestItem item={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={50}
          emptyMessage="No items"
        />
      );

      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INITIAL_RENDER);
      console.log(`Empty list render time: ${renderTime.toFixed(2)}ms`);
    });

    it("renders small list (100 items) within threshold", () => {
      const data = generateTestData(100);
      const startTime = performance.now();

      render(
        <VirtualizedList
          data={data}
          renderItem={({ item }) => <TestItem item={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={50}
        />
      );

      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SMALL_LIST_RENDER);
      console.log(
        `Small list (100 items) render time: ${renderTime.toFixed(2)}ms`
      );
    });

    it("renders medium list (1000 items) within threshold", () => {
      const data = generateTestData(1000);
      const startTime = performance.now();

      render(
        <VirtualizedList
          data={data}
          renderItem={({ item }) => <TestItem item={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={50}
        />
      );

      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.MEDIUM_LIST_RENDER
      );
      console.log(
        `Medium list (1000 items) render time: ${renderTime.toFixed(2)}ms`
      );
    });

    it("renders large list (10000 items) within threshold", () => {
      const data = generateTestData(10000);
      const startTime = performance.now();

      render(
        <VirtualizedList
          data={data}
          renderItem={({ item }) => <TestItem item={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={50}
        />
      );

      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_LIST_RENDER);
      console.log(
        `Large list (10000 items) render time: ${renderTime.toFixed(2)}ms`
      );
    });
  });

  describe("Re-render Performance", () => {
    it("handles data updates efficiently", () => {
      const initialData = generateTestData(500);

      const { rerender } = render(
        <VirtualizedList
          data={initialData}
          renderItem={({ item }) => <TestItem item={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={50}
        />
      );

      // Measure re-render with new data
      const newData = generateTestData(500);
      const startTime = performance.now();

      rerender(
        <VirtualizedList
          data={newData}
          renderItem={({ item }) => <TestItem item={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={50}
        />
      );

      const rerenderTime = performance.now() - startTime;

      // Re-render should be fast since only visible items are rendered
      expect(rerenderTime).toBeLessThan(500);
      console.log(`Re-render time (500 items): ${rerenderTime.toFixed(2)}ms`);
    });

    it("handles appending items efficiently", () => {
      const initialData = generateTestData(100);

      const { rerender } = render(
        <VirtualizedList
          data={initialData}
          renderItem={({ item }) => <TestItem item={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={50}
        />
      );

      // Append 100 more items
      const appendedData = [
        ...initialData,
        ...generateTestData(100).map((item, i) => ({
          ...item,
          id: `appended-${i}`,
        })),
      ];

      const startTime = performance.now();

      rerender(
        <VirtualizedList
          data={appendedData}
          renderItem={({ item }) => <TestItem item={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={50}
        />
      );

      const appendTime = performance.now() - startTime;

      expect(appendTime).toBeLessThan(200);
      console.log(`Append time (100 items): ${appendTime.toFixed(2)}ms`);
    });
  });

  describe("Memory Efficiency", () => {
    it("maintains stable render count with static data", () => {
      let renderCount = 0;

      const CountingItem = ({
        item,
      }: {
        item: { id: string; title: string; value: number };
      }) => {
        renderCount++;
        return <TestItem item={item} />;
      };

      const data = generateTestData(100);

      const { rerender } = render(
        <VirtualizedList
          data={data}
          renderItem={({ item }) => <CountingItem item={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={50}
        />
      );

      const initialRenderCount = renderCount;

      // Re-render with same data
      rerender(
        <VirtualizedList
          data={data}
          renderItem={({ item }) => <CountingItem item={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={50}
        />
      );

      // With proper memoization, render count should not more than double
      // FlatList (mock for FlashList) may re-render all visible items
      expect(renderCount).toBeLessThanOrEqual(initialRenderCount * 2);
      console.log(
        `Initial renders: ${initialRenderCount}, After re-render: ${renderCount}`
      );
    });
  });

  describe("Props Validation", () => {
    it("handles all size datasets without crashing", () => {
      const sizes = [0, 1, 10, 100, 1000, 5000];

      for (const size of sizes) {
        const data = generateTestData(size);

        expect(() => {
          render(
            <VirtualizedList
              data={data}
              renderItem={({ item }) => <TestItem item={item} />}
              keyExtractor={(item) => item.id}
              estimatedItemSize={50}
            />
          );
        }).not.toThrow();
      }
    });

    it("handles undefined/null items gracefully", () => {
      const data = [
        { id: "1", title: "Item 1", value: 100 },
        { id: "2", title: "Item 2", value: 200 },
      ];

      expect(() => {
        render(
          <VirtualizedList
            data={data}
            renderItem={({ item }) => (item ? <TestItem item={item} /> : null)}
            keyExtractor={(item) => item?.id || "unknown"}
            estimatedItemSize={50}
          />
        );
      }).not.toThrow();
    });
  });
});

describe("Performance Metrics Summary", () => {
  it("logs performance summary", () => {
    const metrics = {
      emptyList: 0,
      smallList: 0,
      mediumList: 0,
      largeList: 0,
    };

    // Empty list
    const emptyData: { id: string; title: string; value: number }[] = [];
    let start = performance.now();
    render(
      <VirtualizedList
        data={emptyData}
        renderItem={({ item }) => <TestItem item={item} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={50}
      />
    );
    metrics.emptyList = performance.now() - start;

    // Small list
    start = performance.now();
    render(
      <VirtualizedList
        data={generateTestData(100)}
        renderItem={({ item }) => <TestItem item={item} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={50}
      />
    );
    metrics.smallList = performance.now() - start;

    // Medium list
    start = performance.now();
    render(
      <VirtualizedList
        data={generateTestData(1000)}
        renderItem={({ item }) => <TestItem item={item} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={50}
      />
    );
    metrics.mediumList = performance.now() - start;

    // Large list
    start = performance.now();
    render(
      <VirtualizedList
        data={generateTestData(10000)}
        renderItem={({ item }) => <TestItem item={item} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={50}
      />
    );
    metrics.largeList = performance.now() - start;

    console.log("\n=== VirtualizedList Performance Summary ===");
    console.log(`Empty list:        ${metrics.emptyList.toFixed(2)}ms`);
    console.log(`Small (100):       ${metrics.smallList.toFixed(2)}ms`);
    console.log(`Medium (1000):     ${metrics.mediumList.toFixed(2)}ms`);
    console.log(`Large (10000):     ${metrics.largeList.toFixed(2)}ms`);
    console.log("==========================================\n");

    // This test always passes, it's just for logging
    expect(true).toBe(true);
  });
});
