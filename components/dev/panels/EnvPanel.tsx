import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";
import { getBuildInfo } from "@/utils/buildInfo";
import { IS_DEV, IS_PREVIEW, API_URL } from "@/constants/config";

export function EnvPanel() {
  const deviceInfo = useDeviceInfo();
  const buildInfo = getBuildInfo();

  const envLabel = IS_DEV
    ? "Development"
    : IS_PREVIEW
      ? "Preview"
      : "Production";

  const items = [
    { label: "Environment", value: envLabel },
    { label: "API URL", value: API_URL },
    { label: "App Version", value: buildInfo.version },
    { label: "Build Number", value: buildInfo.buildNumber },
    { label: "Bundle ID", value: buildInfo.bundleId },
    { label: "Platform", value: buildInfo.platform },
    ...(deviceInfo
      ? [
          {
            label: "OS Version",
            value: deviceInfo.osVersion,
          },
          { label: "Device", value: deviceInfo.deviceModel },
          {
            label: "Screen",
            value: `${deviceInfo.screenWidth}x${deviceInfo.screenHeight} @${deviceInfo.pixelRatio}x`,
          },
          { label: "Timezone", value: deviceInfo.timezone },
          {
            label: "Emulator",
            value: deviceInfo.isEmulator ? "Yes" : "No",
          },
        ]
      : []),
  ];

  return (
    <ScrollView className="flex-1 p-4">
      {items.map(({ label, value }) => (
        <View
          key={label}
          className="mb-3 flex-row justify-between border-b border-gray-200 pb-2 dark:border-gray-700"
        >
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {label}
          </Text>
          <Text className="text-sm text-gray-900 dark:text-white" selectable>
            {value}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
