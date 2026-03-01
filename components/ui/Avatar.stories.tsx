import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";
import { Avatar, AvatarGroup } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: {
    source: "https://i.pravatar.cc/150?img=3",
    size: "lg",
  },
};

export const WithInitials: Story = {
  args: {
    name: "John Doe",
    size: "lg",
  },
};

export const Placeholder: Story = {
  args: {
    size: "lg",
  },
};

export const WithOnlineIndicator: Story = {
  args: {
    name: "Jane Smith",
    size: "lg",
    showOnlineIndicator: true,
    isOnline: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Avatar name="AB" size="xs" />
      <Avatar name="CD" size="sm" />
      <Avatar name="EF" size="md" />
      <Avatar name="GH" size="lg" />
      <Avatar name="IJ" size="xl" />
      <Avatar name="KL" size="2xl" />
    </View>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup
      avatars={[
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
        { name: "Diana" },
        { name: "Eve" },
        { name: "Frank" },
      ]}
      max={4}
      size="md"
    />
  ),
};
