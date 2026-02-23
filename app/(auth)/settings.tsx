import { View, Text, ScrollView, Pressable, Switch } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/useTheme";
import { useNotificationStore } from "@/stores/notificationStore";

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { isEnabled, toggleNotifications } = useNotificationStore();
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? "#f8fafc" : "#0f172a"}
            />
          </Pressable>
          <Text className="text-xl font-semibold text-text-light dark:text-text-dark">
            {t("settings.title")}
          </Text>
        </View>

        <View className="px-4 pt-4">
          {/* Appearance */}
          <Text className="mb-3 text-sm font-medium uppercase text-muted-light dark:text-muted-dark">
            {t("settings.appearance")}
          </Text>
          <Card className="mb-6">
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={24}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
                <Text className="ml-3 text-text-light dark:text-text-dark">
                  {t("settings.darkMode")}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#cbd5e1", true: "#3b82f6" }}
                thumbColor="#ffffff"
              />
            </View>
          </Card>

          {/* Notifications */}
          <Text className="mb-3 text-sm font-medium uppercase text-muted-light dark:text-muted-dark">
            {t("settings.notifications")}
          </Text>
          <Card className="mb-6">
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
                <Text className="ml-3 text-text-light dark:text-text-dark">
                  {t("settings.pushNotifications")}
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: "#cbd5e1", true: "#3b82f6" }}
                thumbColor="#ffffff"
              />
            </View>
          </Card>

          {/* About */}
          <Text className="mb-3 text-sm font-medium uppercase text-muted-light dark:text-muted-dark">
            {t("settings.about")}
          </Text>
          <Card className="mb-6">
            <Pressable className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
                <Text className="ml-3 text-text-light dark:text-text-dark">
                  {t("settings.appVersion")}
                </Text>
              </View>
              <Text className="text-muted-light dark:text-muted-dark">
                1.0.0
              </Text>
            </Pressable>

            <View className="mx-4 h-px bg-gray-200 dark:bg-gray-700" />

            <Pressable className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
                <Text className="ml-3 text-text-light dark:text-text-dark">
                  {t("settings.terms")}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#64748b" : "#94a3b8"}
              />
            </Pressable>

            <View className="mx-4 h-px bg-gray-200 dark:bg-gray-700" />

            <Pressable className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons
                  name="lock-closed-outline"
                  size={24}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
                <Text className="ml-3 text-text-light dark:text-text-dark">
                  {t("settings.privacy")}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#64748b" : "#94a3b8"}
              />
            </Pressable>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
