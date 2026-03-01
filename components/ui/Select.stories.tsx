import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";
import { Select } from "./Select";

const fruitOptions = [
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Cherry", value: "cherry" },
];

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
};

export default meta;
type Story = StoryObj<typeof Select>;

function SelectWrapper({
  label,
  error,
  disabled,
}: {
  label?: string;
  error?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState<string | undefined>(undefined);

  return (
    <View>
      <Select
        options={fruitOptions}
        value={value}
        onChange={setValue}
        placeholder="Pick a fruit"
        label={label}
        error={error}
        disabled={disabled}
      />
    </View>
  );
}

export const Default: Story = {
  render: () => <SelectWrapper />,
};

export const WithLabel: Story = {
  render: () => <SelectWrapper label="Fruit" />,
};

export const WithError: Story = {
  render: () => <SelectWrapper label="Fruit" error="Please select a fruit" />,
};

export const Disabled: Story = {
  render: () => <SelectWrapper label="Fruit" disabled />,
};
