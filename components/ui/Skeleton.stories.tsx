import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";
import { Skeleton, SkeletonText, SkeletonCircle } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    width: "100%",
    height: 20,
  },
};

export const TextSkeleton: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <SkeletonText width="100%" />
      <SkeletonText width="80%" />
      <SkeletonText width="60%" />
    </View>
  ),
};

export const CircleSkeleton: Story = {
  render: () => (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <SkeletonCircle size={32} />
      <SkeletonCircle size={48} />
      <SkeletonCircle size={64} />
    </View>
  ),
};

export const CardSkeleton: Story = {
  render: () => (
    <View
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#f8fafc",
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <SkeletonCircle size={48} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonText width="60%" height={14} />
          <SkeletonText width="40%" height={12} />
        </View>
      </View>
      <Skeleton width="100%" height={120} borderRadius={8} />
      <View style={{ gap: 6 }}>
        <SkeletonText width="100%" />
        <SkeletonText width="90%" />
        <SkeletonText width="70%" />
      </View>
    </View>
  ),
};
