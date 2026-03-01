import type { Meta, StoryObj } from "@storybook/react";
import { Text, View } from "react-native";
import { AnimatedCard } from "./AnimatedCard";

const meta: Meta<typeof AnimatedCard> = {
  title: "UI/AnimatedCard",
  component: AnimatedCard,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "elevated", "outlined"],
    },
  },
  args: {
    variant: "default",
  },
};

export default meta;
type Story = StoryObj<typeof AnimatedCard>;

export const Default: Story = {
  render: () => (
    <AnimatedCard>
      <View style={{ padding: 16 }}>
        <Text>This is a basic animated card with some content inside.</Text>
      </View>
    </AnimatedCard>
  ),
};

export const WithTitle: Story = {
  render: () => (
    <AnimatedCard>
      <View style={{ padding: 16, gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>Card Title</Text>
        <Text>
          This card has a title and body text to demonstrate a common layout
          pattern.
        </Text>
      </View>
    </AnimatedCard>
  ),
};
