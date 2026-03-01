import type { Meta, StoryObj } from "@storybook/react";
import { ForceUpdateScreen } from "./ForceUpdateScreen";

const meta: Meta<typeof ForceUpdateScreen> = {
  title: "UI/ForceUpdateScreen",
  component: ForceUpdateScreen,
  args: {
    storeUrl: "https://apps.apple.com/app/example",
    currentVersion: "1.0.0",
    minimumVersion: "2.0.0",
  },
};

export default meta;
type Story = StoryObj<typeof ForceUpdateScreen>;

export const Default: Story = {};
