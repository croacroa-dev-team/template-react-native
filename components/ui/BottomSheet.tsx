import { forwardRef, useCallback, useMemo, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/utils/cn";

/**
 * Hook to control BottomSheet imperatively
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ref, open, close, snapTo } = useBottomSheet();
 *
 *   return (
 *     <>
 *       <Button onPress={() => open()}>Open Sheet</Button>
 *       <BottomSheet ref={ref}>
 *         <Text>Content</Text>
 *       </BottomSheet>
 *     </>
 *   );
 * }
 * ```
 */
import { useRef } from "react";

interface BottomSheetProps {
  /**
   * Content to render inside the bottom sheet
   */
  children: ReactNode;

  /**
   * Snap points for the bottom sheet (e.g., ['25%', '50%', '90%'])
   */
  snapPoints?: (string | number)[];

  /**
   * Initial snap point index
   */
  index?: number;

  /**
   * Title displayed in the header
   */
  title?: string;

  /**
   * Show close button in header
   */
  showCloseButton?: boolean;

  /**
   * Called when the sheet is closed
   */
  onClose?: () => void;

  /**
   * Called when the sheet index changes
   */
  onChange?: (index: number) => void;

  /**
   * Whether to enable backdrop
   */
  enableBackdrop?: boolean;

  /**
   * Whether to close on backdrop press
   */
  closeOnBackdropPress?: boolean;

  /**
   * Whether content is scrollable
   */
  scrollable?: boolean;

  /**
   * Whether to enable handle
   */
  enableHandle?: boolean;

  /**
   * Additional styles for the container
   */
  containerClassName?: string;

  /**
   * Additional styles for the content
   */
  contentClassName?: string;
}

export type BottomSheetRef = GorhomBottomSheet;

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      children,
      snapPoints: customSnapPoints,
      index = -1,
      title,
      showCloseButton = true,
      onClose,
      onChange,
      enableBackdrop = true,
      closeOnBackdropPress = true,
      scrollable = false,
      enableHandle = true,
      containerClassName,
      contentClassName,
    },
    ref
  ) => {
    const { isDark } = useTheme();

    // Default snap points
    const snapPoints = useMemo(
      () => customSnapPoints || ["50%", "90%"],
      [customSnapPoints]
    );

    // Handle sheet changes
    const handleSheetChanges = useCallback(
      (sheetIndex: number) => {
        onChange?.(sheetIndex);
        if (sheetIndex === -1) {
          onClose?.();
        }
      },
      [onChange, onClose]
    );

    // Handle close button press
    const handleClose = useCallback(() => {
      if (ref && "current" in ref && ref.current) {
        ref.current.close();
      }
      onClose?.();
    }, [ref, onClose]);

    // Backdrop component
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior={closeOnBackdropPress ? "close" : "none"}
          opacity={0.5}
        />
      ),
      [closeOnBackdropPress]
    );

    // Handle component
    const renderHandle = useCallback(() => {
      if (!enableHandle) return null;

      return (
        <View className="items-center pt-2 pb-1">
          <View
            className={cn(
              "w-10 h-1 rounded-full",
              isDark ? "bg-gray-600" : "bg-gray-300"
            )}
          />
        </View>
      );
    }, [enableHandle, isDark]);

    const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

    return (
      <GorhomBottomSheet
        ref={ref}
        index={index}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={enableBackdrop ? renderBackdrop : undefined}
        handleComponent={renderHandle}
        enablePanDownToClose
        backgroundStyle={[
          styles.background,
          { backgroundColor: isDark ? "#1e293b" : "#ffffff" },
        ]}
        style={styles.sheet}
      >
        <View
          className={cn(
            "flex-1",
            isDark ? "bg-surface-dark" : "bg-white",
            containerClassName
          )}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View
              className={cn(
                "flex-row items-center justify-between px-4 py-3 border-b",
                isDark ? "border-gray-700" : "border-gray-100"
              )}
            >
              <Text
                className={cn(
                  "text-lg font-semibold",
                  isDark ? "text-text-dark" : "text-text-light"
                )}
              >
                {title || ""}
              </Text>
              {showCloseButton && (
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="p-1"
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={isDark ? "#f8fafc" : "#0f172a"}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          <ContentWrapper
            style={styles.contentContainer}
            contentContainerStyle={[
              styles.content,
              scrollable && styles.scrollContent,
            ]}
          >
            <View className={cn("flex-1", contentClassName)}>{children}</View>
          </ContentWrapper>
        </View>
      </GorhomBottomSheet>
    );
  }
);

BottomSheet.displayName = "BottomSheet";

const styles = StyleSheet.create({
  sheet: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  background: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});

export function useBottomSheet() {
  const ref = useRef<BottomSheetRef>(null);

  const open = useCallback((snapIndex = 0) => {
    ref.current?.snapToIndex(snapIndex);
  }, []);

  const close = useCallback(() => {
    ref.current?.close();
  }, []);

  const snapTo = useCallback((index: number) => {
    ref.current?.snapToIndex(index);
  }, []);

  const expand = useCallback(() => {
    ref.current?.expand();
  }, []);

  const collapse = useCallback(() => {
    ref.current?.collapse();
  }, []);

  return {
    ref,
    open,
    close,
    snapTo,
    expand,
    collapse,
  };
}
