import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function StoragePanel() {
  const [keys, setKeys] = useState<
    Array<{ key: string; value: string }>
  >([]);

  const loadKeys = async () => {
    const allKeys = await AsyncStorage.getAllKeys();
    const entries = await AsyncStorage.multiGet(
      allKeys as string[],
    );
    setKeys(
      entries.map(([key, value]) => ({
        key,
        value: value ?? "",
      })),
    );
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const clearAll = async () => {
    await AsyncStorage.clear();
    setKeys([]);
  };

  return (
    <ScrollView className="flex-1 p-4">
      <Pressable
        onPress={loadKeys}
        className="mb-3 items-center rounded-lg bg-blue-500 py-2"
      >
        <Text className="text-sm font-semibold text-white">
          Refresh
        </Text>
      </Pressable>
      <Pressable
        onPress={clearAll}
        className="mb-4 items-center rounded-lg bg-red-500 py-2"
      >
        <Text className="text-sm font-semibold text-white">
          Clear All
        </Text>
      </Pressable>
      {keys.length === 0 ? (
        <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
          No stored data
        </Text>
      ) : (
        keys.map(({ key, value }) => (
          <View
            key={key}
            className="mb-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800"
          >
            <Text className="text-xs font-bold text-gray-900 dark:text-white">
              {key}
            </Text>
            <Text
              className="font-mono text-xs text-gray-600 dark:text-gray-400"
              numberOfLines={3}
            >
              {value}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
