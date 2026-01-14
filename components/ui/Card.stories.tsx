import type { Meta, StoryObj } from "@storybook/react";
import { View, Text } from "react-native";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
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
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="p-4">
      <Text>Default Card Content</Text>
    </Card>
  ),
};

export const Elevated: Story = {
  render: () => (
    <Card variant="elevated" className="p-4">
      <Text>Elevated Card with Shadow</Text>
    </Card>
  ),
};

export const Outlined: Story = {
  render: () => (
    <Card variant="outlined" className="p-4">
      <Text>Outlined Card with Border</Text>
    </Card>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Card variant="default" className="p-4">
        <Text style={{ fontWeight: "bold" }}>Default</Text>
        <Text>Background color, no border</Text>
      </Card>
      <Card variant="elevated" className="p-4">
        <Text style={{ fontWeight: "bold" }}>Elevated</Text>
        <Text>Background color with shadow</Text>
      </Card>
      <Card variant="outlined" className="p-4">
        <Text style={{ fontWeight: "bold" }}>Outlined</Text>
        <Text>Transparent with border</Text>
      </Card>
    </View>
  ),
};

export const ComplexContent: Story = {
  render: () => (
    <Card className="p-4">
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>Card Title</Text>
        <Text style={{ color: "#64748b" }}>
          This is a more complex card with multiple elements inside.
        </Text>
        <View
          style={{
            height: 100,
            backgroundColor: "#f1f5f9",
            borderRadius: 8,
            marginTop: 8,
          }}
        />
      </View>
    </Card>
  ),
};
