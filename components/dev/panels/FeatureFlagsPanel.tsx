import React from "react";
import { View, Text, ScrollView, Switch } from "react-native";
import { FEATURES } from "@/constants/config";

export function FeatureFlagsPanel() {
  const flags = Object.entries(FEATURES);

  return (
    <ScrollView className="flex-1 p-4">
      {flags.map(([key, value]) => (
        <View
          key={key}
          className="mb-3 flex-row items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700"
        >
          <Text className="flex-1 text-sm text-gray-900 dark:text-white">
            {key}
          </Text>
          <Switch value={!!value} disabled />
        </View>
      ))}
      <Text className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
        Feature flags are read-only. Configure in constants/config.ts
      </Text>
    </ScrollView>
  );
}
