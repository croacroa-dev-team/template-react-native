import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";
import { AnimatedButton } from "./AnimatedButton";

const meta: Meta<typeof AnimatedButton> = {
  title: "UI/AnimatedButton",
  component: AnimatedButton,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    isLoading: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
  args: {
    children: "Button",
    variant: "primary",
    size: "md",
    isLoading: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof AnimatedButton>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline Button",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost Button",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Danger Button",
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: "Loading",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled",
  },
};

export const Sizes: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <AnimatedButton size="sm">Small</AnimatedButton>
      <AnimatedButton size="md">Medium</AnimatedButton>
      <AnimatedButton size="lg">Large</AnimatedButton>
    </View>
  ),
};
