import React from "react";
import { View, Text, Pressable, Modal as RNModal } from "react-native";
import { useTranslation } from "react-i18next";

interface PermissionRationaleProps {
  visible: boolean;
  permission:
    | "camera"
    | "photos"
    | "location"
    | "contacts"
    | "microphone"
    | "notifications";
  onAllow: () => void;
  onDeny: () => void;
}

export function PermissionRationale({
  visible,
  permission,
  onAllow,
  onDeny,
}: PermissionRationaleProps) {
  const { t } = useTranslation();

  return (
    <RNModal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-gray-800">
          <Text className="mb-2 text-center text-lg font-bold text-gray-900 dark:text-white">
            {t(`permissionRationale.${permission}.title`)}
          </Text>
          <Text className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t(`permissionRationale.${permission}.description`)}
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={onDeny}
              className="flex-1 items-center rounded-xl border border-gray-300 py-3 dark:border-gray-600"
              accessibilityRole="button"
              accessibilityLabel={t("permissionRationale.deny")}
            >
              <Text className="font-semibold text-gray-700 dark:text-gray-300">
                {t("permissionRationale.deny")}
              </Text>
            </Pressable>
            <Pressable
              onPress={onAllow}
              className="flex-1 items-center rounded-xl bg-blue-500 py-3"
              accessibilityRole="button"
              accessibilityLabel={t("permissionRationale.allow")}
            >
              <Text className="font-semibold text-white">
                {t("permissionRationale.allow")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </RNModal>
  );
}
