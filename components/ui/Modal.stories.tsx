import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Text, View } from "react-native";
import { Modal } from "./Modal";
import { Button } from "./Button";

const meta: Meta<typeof Modal> = {
  title: "UI/Modal",
  component: Modal,
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "full"],
    },
    showCloseButton: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

function ModalWrapper({
  title,
  showCloseButton,
  size,
}: {
  title?: string;
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg" | "full";
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <Button onPress={() => setVisible(true)}>Open Modal</Button>
      <Modal
        visible={visible}
        title={title}
        onClose={() => setVisible(false)}
        showCloseButton={showCloseButton}
        size={size}
      >
        <Text>
          This is the modal content. Tap outside or press the close button to
          dismiss.
        </Text>
      </Modal>
    </View>
  );
}

export const Default: Story = {
  render: () => <ModalWrapper title="Example Modal" />,
};

export const WithoutCloseButton: Story = {
  render: () => (
    <ModalWrapper title="No Close Button" showCloseButton={false} />
  ),
};

export const SmallSize: Story = {
  render: () => <ModalWrapper title="Small Modal" size="sm" />,
};

export const LargeSize: Story = {
  render: () => <ModalWrapper title="Large Modal" size="lg" />,
};
