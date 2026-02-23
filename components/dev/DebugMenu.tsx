import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal as RNModal,
  SafeAreaView,
} from "react-native";
import { EnvPanel } from "./panels/EnvPanel";
import { NetworkPanel } from "./panels/NetworkPanel";
import { StoragePanel } from "./panels/StoragePanel";
import { FeatureFlagsPanel } from "./panels/FeatureFlagsPanel";

const TABS = ["Env", "Network", "Storage", "Flags"] as const;
type Tab = (typeof TABS)[number];

interface DebugMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function DebugMenu({ visible, onClose }: DebugMenuProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Env");

  return (
    <RNModal visible={visible} animationType="slide">
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            Debug Menu
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text className="text-base font-semibold text-blue-500">Close</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-gray-200 dark:border-gray-700"
        >
          <View className="flex-row px-2 py-2">
            {TABS.map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`mr-2 rounded-full px-4 py-1.5 ${activeTab === tab ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`}
              >
                <Text
                  className={`text-sm font-medium ${activeTab === tab ? "text-white" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View className="flex-1">
          {activeTab === "Env" && <EnvPanel />}
          {activeTab === "Network" && <NetworkPanel />}
          {activeTab === "Storage" && <StoragePanel />}
          {activeTab === "Flags" && <FeatureFlagsPanel />}
        </View>
      </SafeAreaView>
    </RNModal>
  );
}
