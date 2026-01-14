import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(public)/login");
  };

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
            Profile
          </Text>
        </View>

        {/* Avatar */}
        <View className="items-center py-8">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            <Text className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-text-light dark:text-text-dark">
            {user?.name || "User"}
          </Text>
          <Text className="text-muted-light dark:text-muted-dark">
            {user?.email || "user@example.com"}
          </Text>
        </View>

        {/* Info Cards */}
        <View className="px-4">
          <Card className="mb-4">
            <Pressable className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
                <Text className="ml-3 text-text-light dark:text-text-dark">
                  Edit Profile
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#64748b" : "#94a3b8"}
              />
            </Pressable>
          </Card>

          <Card className="mb-4">
            <Pressable className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
                <Text className="ml-3 text-text-light dark:text-text-dark">
                  Notifications
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#64748b" : "#94a3b8"}
              />
            </Pressable>
          </Card>

          <Card className="mb-4">
            <Pressable className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons
                  name="shield-outline"
                  size={24}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
                <Text className="ml-3 text-text-light dark:text-text-dark">
                  Privacy & Security
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#64748b" : "#94a3b8"}
              />
            </Pressable>
          </Card>

          <Card className="mb-4">
            <Pressable className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons
                  name="help-circle-outline"
                  size={24}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
                <Text className="ml-3 text-text-light dark:text-text-dark">
                  Help & Support
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#64748b" : "#94a3b8"}
              />
            </Pressable>
          </Card>

          {/* Sign Out */}
          <Button
            variant="outline"
            onPress={handleSignOut}
            className="mt-4 mb-8 border-red-500"
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#ef4444"
              style={{ marginRight: 8 }}
            />
            <Text className="text-red-500">Sign Out</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
