import React, { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheet, BottomSheetRef } from "./BottomSheet";
import { Button } from "./Button";

const meta: Meta<typeof BottomSheet> = {
  title: "UI/BottomSheet",
  component: BottomSheet,
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Story />
      </GestureHandlerRootView>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BottomSheet>;

function BottomSheetWrapper() {
  const ref = useRef<BottomSheetRef>(null);

  return (
    <View style={{ flex: 1 }}>
      <Button onPress={() => ref.current?.expand()}>Open Bottom Sheet</Button>
      <BottomSheet ref={ref} title="Bottom Sheet" snapPoints={["50%", "90%"]}>
        <View style={{ padding: 16 }}>
          <Text>
            This is the bottom sheet content. You can drag it up and down or tap
            the backdrop to close.
          </Text>
        </View>
      </BottomSheet>
    </View>
  );
}

export const Default: Story = {
  render: () => <BottomSheetWrapper />,
};
