import React from "react";
import { View, Text, Pressable, Modal as RNModal } from "react-native";
import { useTranslation } from "react-i18next";

interface SessionTimeoutModalProps {
  visible: boolean;
  remainingSeconds: number;
  onContinue: () => void;
  onLogout: () => void;
}

export function SessionTimeoutModal({
  visible,
  remainingSeconds,
  onContinue,
  onLogout,
}: SessionTimeoutModalProps) {
  const { t } = useTranslation();

  return (
    <RNModal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-gray-800">
          <Text className="mb-2 text-center text-lg font-bold text-gray-900 dark:text-white">
            {t("session.expiringSoon")}
          </Text>
          <Text className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("session.remainingTime", { seconds: remainingSeconds })}
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={onLogout}
              className="flex-1 items-center rounded-xl border border-gray-300 py-3 dark:border-gray-600"
              accessibilityRole="button"
              accessibilityLabel={t("session.logout")}
            >
              <Text className="font-semibold text-gray-700 dark:text-gray-300">
                {t("session.logout")}
              </Text>
            </Pressable>
            <Pressable
              onPress={onContinue}
              className="flex-1 items-center rounded-xl bg-blue-500 py-3"
              accessibilityRole="button"
              accessibilityLabel={t("session.continue")}
            >
              <Text className="font-semibold text-white">
                {t("session.continue")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </RNModal>
  );
}
