/**
 * @fileoverview High-performance virtualized list component
 * Wraps @shopify/flash-list for optimal list rendering with large datasets.
 * @module components/ui/VirtualizedList
 */

import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/utils/cn";

/**
 * Props for VirtualizedList component
 */
interface VirtualizedListProps<T> extends Omit<FlashListProps<T>, "renderItem" | "estimatedItemSize"> {
  /**
   * Array of data items to render
   */
  data: T[];

  /**
   * Render function for each item
   */
  renderItem: (info: { item: T; index: number }) => React.ReactElement | null;

  /**
   * Unique key extractor for items
   */
  keyExtractor: (item: T, index: number) => string;

  /**
   * Estimated height of each item for better performance
   * Required for optimal FlashList performance
   */
  estimatedItemSize?: number;

  /**
   * Whether the list is currently loading
   */
  isLoading?: boolean;

  /**
   * Whether the list is refreshing (pull-to-refresh)
   */
  isRefreshing?: boolean;

  /**
   * Callback when user pulls to refresh
   */
  onRefresh?: () => void;

  /**
   * Whether there's more data to load
   */
  hasMore?: boolean;

  /**
   * Callback when user scrolls near the end
   */
  onLoadMore?: () => void;

  /**
   * Component to render when list is empty
   */
  emptyComponent?: React.ReactElement;

  /**
   * Message to show when list is empty
   */
  emptyMessage?: string;

  /**
   * Component to render at the bottom when loading more
   */
  loadingMoreComponent?: React.ReactElement;

  /**
   * Additional class name for container
   */
  className?: string;

  /**
   * Threshold for onEndReached (0 to 1)
   * @default 0.5
   */
  onEndReachedThreshold?: number;

  /**
   * Whether to show scroll indicator
   * @default false
   */
  showsVerticalScrollIndicator?: boolean;

  /**
   * Draw distance for rendering items outside visible area
   * Higher values = smoother scroll but more memory
   * @default 250
   */
  drawDistance?: number;
}

/**
 * Default empty component
 */
function DefaultEmptyComponent({ message }: { message: string }) {
  const { isDark } = useTheme();

  return (
    <View className="flex-1 items-center justify-center py-12">
      <Text
        className={cn(
          "text-base",
          isDark ? "text-muted-dark" : "text-muted-light"
        )}
      >
        {message}
      </Text>
    </View>
  );
}

/**
 * Default loading more component
 */
function DefaultLoadingMoreComponent() {
  return (
    <View className="items-center justify-center py-4">
      <ActivityIndicator size="small" />
    </View>
  );
}

/**
 * High-performance virtualized list component.
 * Optimized for rendering large datasets with minimal memory usage.
 *
 * Features:
 * - Automatic item recycling
 * - Pull-to-refresh support
 * - Infinite scroll (load more)
 * - Empty state handling
 * - Loading states
 *
 * @example
 * ```tsx
 * interface User {
 *   id: string;
 *   name: string;
 * }
 *
 * function UserList() {
 *   const { data, isLoading, refetch, hasNextPage, fetchNextPage } = useUsers();
 *
 *   return (
 *     <VirtualizedList<User>
 *       data={data}
 *       renderItem={({ item }) => <UserCard user={item} />}
 *       keyExtractor={(item) => item.id}
 *       estimatedItemSize={72}
 *       isLoading={isLoading}
 *       isRefreshing={isLoading}
 *       onRefresh={refetch}
 *       hasMore={hasNextPage}
 *       onLoadMore={fetchNextPage}
 *       emptyMessage="No users found"
 *     />
 *   );
 * }
 * ```
 */
export function VirtualizedList<T>({
  data,
  renderItem,
  keyExtractor,
  estimatedItemSize = 50,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  hasMore = false,
  onLoadMore,
  emptyComponent,
  emptyMessage = "No items found",
  loadingMoreComponent,
  className,
  onEndReachedThreshold = 0.5,
  showsVerticalScrollIndicator = false,
  drawDistance = 250,
  ...flashListProps
}: VirtualizedListProps<T>) {
  const { isDark } = useTheme();

  // Memoize empty component
  const ListEmptyComponent = useMemo(() => {
    if (isLoading) return null;
    if (emptyComponent) return emptyComponent;
    return <DefaultEmptyComponent message={emptyMessage} />;
  }, [isLoading, emptyComponent, emptyMessage]);

  // Memoize footer component
  const ListFooterComponent = useCallback(() => {
    if (!hasMore || data.length === 0) return null;
    if (loadingMoreComponent) return loadingMoreComponent;
    return <DefaultLoadingMoreComponent />;
  }, [hasMore, data.length, loadingMoreComponent]);

  // Handle end reached
  const handleEndReached = useCallback(() => {
    if (hasMore && onLoadMore && !isLoading) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore, isLoading]);

  // Memoize refresh control
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;

    return (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        tintColor={isDark ? "#94a3b8" : "#64748b"}
        colors={["#3b82f6"]}
      />
    );
  }, [onRefresh, isRefreshing, isDark]);

  // Loading state
  if (isLoading && data.length === 0) {
    return (
      <View className={cn("flex-1 items-center justify-center", className)}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      refreshControl={refreshControl}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      // FlashList specific optimizations
      estimatedItemSize={estimatedItemSize}
      drawDistance={drawDistance}
      {...flashListProps}
      contentContainerStyle={[
        styles.container,
        flashListProps.contentContainerStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
});

/**
 * Horizontal virtualized list variant
 */
export function HorizontalVirtualizedList<T>(
  props: Omit<VirtualizedListProps<T>, "horizontal">
) {
  return (
    <VirtualizedList
      {...props}
      horizontal
      showsHorizontalScrollIndicator={false}
    />
  );
}
