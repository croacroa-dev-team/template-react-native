import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  argTypes: {
    label: {
      control: "text",
    },
    placeholder: {
      control: "text",
    },
    error: {
      control: "text",
    },
    hint: {
      control: "text",
    },
    secureTextEntry: {
      control: "boolean",
    },
  },
  args: {
    label: "Label",
    placeholder: "Enter text...",
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    label: "Email",
    placeholder: "Enter your email",
  },
};

export const WithIcon: Story = {
  args: {
    label: "Search",
    placeholder: "Search...",
    leftIcon: "search",
  },
};

export const Password: Story = {
  args: {
    label: "Password",
    placeholder: "Enter password",
    secureTextEntry: true,
  },
};

export const WithError: Story = {
  args: {
    label: "Email",
    placeholder: "Enter your email",
    value: "invalid-email",
    error: "Please enter a valid email address",
  },
};

export const WithHint: Story = {
  args: {
    label: "Username",
    placeholder: "Choose a username",
    hint: "Username must be 3-20 characters",
  },
};

export const AllStates: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Input label="Default" placeholder="Enter text..." />
      <Input
        label="With Value"
        placeholder="Enter text..."
        value="Hello World"
      />
      <Input
        label="With Error"
        placeholder="Enter text..."
        value="Invalid"
        error="This field has an error"
      />
      <Input
        label="With Hint"
        placeholder="Enter text..."
        hint="This is a helpful hint"
      />
      <Input
        label="Password"
        placeholder="Enter password"
        secureTextEntry
      />
      <Input
        label="With Icon"
        placeholder="Search..."
        leftIcon="search"
      />
    </View>
  ),
};
