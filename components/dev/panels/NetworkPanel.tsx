import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Logger } from "@/services/logger/logger-adapter";

export function NetworkPanel() {
  const breadcrumbs = Logger.getBreadcrumbs()
    .filter((b) => b.category === "http")
    .reverse()
    .slice(0, 50);

  return (
    <ScrollView className="flex-1 p-4">
      {breadcrumbs.length === 0 ? (
        <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
          No network requests captured yet
        </Text>
      ) : (
        breadcrumbs.map((b, i) => (
          <View
            key={`${b.timestamp}-${i}`}
            className="mb-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800"
          >
            <Text className="font-mono text-xs text-gray-900 dark:text-white">
              {b.message}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(b.timestamp).toLocaleTimeString()}
              {b.data?.status ? ` — ${b.data.status}` : ""}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
