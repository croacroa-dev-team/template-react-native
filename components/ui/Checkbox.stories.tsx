import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";
import { Checkbox, CheckboxGroup } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

function CheckboxWrapper({
  label,
  description,
  disabled,
  size,
}: {
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [checked, setChecked] = useState(false);

  return (
    <Checkbox
      checked={checked}
      onChange={setChecked}
      label={label}
      description={description}
      disabled={disabled}
      size={size}
    />
  );
}

function CheckboxGroupWrapper() {
  const [value, setValue] = useState<string[]>([]);

  return (
    <CheckboxGroup
      label="Select your interests"
      options={[
        { value: "music", label: "Music", description: "Listen to songs" },
        { value: "sports", label: "Sports", description: "Play games" },
        { value: "reading", label: "Reading", description: "Read books" },
        { value: "cooking", label: "Cooking", disabled: true },
      ]}
      value={value}
      onChange={setValue}
    />
  );
}

export const Default: Story = {
  render: () => <CheckboxWrapper />,
};

export const WithLabel: Story = {
  render: () => <CheckboxWrapper label="Accept terms and conditions" />,
};

export const WithDescription: Story = {
  render: () => (
    <CheckboxWrapper
      label="Email notifications"
      description="Receive email updates about your account"
    />
  ),
};

export const Disabled: Story = {
  render: () => <CheckboxWrapper label="Disabled option" disabled />,
};

export const Sizes: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <CheckboxWrapper label="Small" size="sm" />
      <CheckboxWrapper label="Medium" size="md" />
      <CheckboxWrapper label="Large" size="lg" />
    </View>
  ),
};

export const Group: Story = {
  render: () => <CheckboxGroupWrapper />,
};
