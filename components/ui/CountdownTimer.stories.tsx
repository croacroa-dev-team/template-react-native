import type { Meta, StoryObj } from "@storybook/react";
import { CountdownTimer } from "./CountdownTimer";

const meta: Meta<typeof CountdownTimer> = {
  title: "UI/CountdownTimer",
  component: CountdownTimer,
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    showProgress: {
      control: "boolean",
    },
  },
  args: {
    duration: 30,
    size: "md",
    showProgress: true,
  },
};

export default meta;
type Story = StoryObj<typeof CountdownTimer>;

export const Default: Story = {
  args: {
    duration: 30,
  },
};

export const SmallSize: Story = {
  args: {
    duration: 30,
    size: "sm",
  },
};

export const LargeSize: Story = {
  args: {
    duration: 30,
    size: "lg",
  },
};

export const WithoutProgress: Story = {
  args: {
    duration: 30,
    showProgress: false,
  },
};

export const CustomColors: Story = {
  args: {
    duration: 30,
    progressColor: "#10b981",
    urgentColor: "#f59e0b",
  },
};
