import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";
import { Badge, Chip, CountBadge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "primary",
        "secondary",
        "success",
        "warning",
        "error",
        "info",
      ],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    outlined: {
      control: "boolean",
    },
    pill: {
      control: "boolean",
    },
  },
  args: {
    children: "Badge",
    variant: "default",
    size: "md",
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: "Default",
  },
};

export const AllVariants: Story = {
  render: () => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
    </View>
  ),
};

export const Outlined: Story = {
  args: {
    children: "Outlined",
    variant: "primary",
    outlined: true,
  },
};

export const Pill: Story = {
  args: {
    children: "Pill Badge",
    variant: "success",
    pill: true,
  },
};

export const WithIcon: Story = {
  args: {
    children: "Featured",
    variant: "warning",
    icon: "star",
  },
};

export const Chips: Story = {
  render: () => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Chip label="React" onPress={() => {}} />
      <Chip label="TypeScript" onPress={() => {}} selected />
      <Chip
        label="Removable"
        onPress={() => {}}
        removable
        onRemove={() => {}}
      />
      <Chip label="Disabled" onPress={() => {}} disabled />
    </View>
  ),
};

export const CountBadges: Story = {
  render: () => (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <CountBadge count={1} />
      <CountBadge count={5} />
      <CountBadge count={99} />
      <CountBadge count={150} />
    </View>
  ),
};
