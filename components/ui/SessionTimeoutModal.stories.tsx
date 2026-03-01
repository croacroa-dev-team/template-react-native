import type { Meta, StoryObj } from "@storybook/react";
import { SessionTimeoutModal } from "./SessionTimeoutModal";

const noop = () => {};

const meta: Meta<typeof SessionTimeoutModal> = {
  title: "UI/SessionTimeoutModal",
  component: SessionTimeoutModal,
  args: {
    onContinue: noop,
    onLogout: noop,
  },
};

export default meta;
type Story = StoryObj<typeof SessionTimeoutModal>;

export const Warning: Story = {
  args: {
    visible: true,
    remainingSeconds: 30,
  },
};

export const Urgent: Story = {
  args: {
    visible: true,
    remainingSeconds: 5,
  },
};
