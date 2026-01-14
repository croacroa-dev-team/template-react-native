import { View, Text, ScrollView } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

export default function HomeScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-muted-light dark:text-muted-dark">
              Welcome back,
            </Text>
            <Text className="text-2xl font-bold text-text-light dark:text-text-dark">
              {user?.name || "User"}
            </Text>
          </View>
          <Link href="/(auth)/profile" asChild>
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
              <Ionicons
                name="person"
                size={24}
                color={isDark ? "#93c5fd" : "#2563eb"}
              />
            </View>
          </Link>
        </View>

        {/* Quick Actions */}
        <Text className="mb-3 text-lg font-semibold text-text-light dark:text-text-dark">
          Quick Actions
        </Text>
        <View className="mb-6 flex-row gap-3">
          <Card className="flex-1 items-center p-4">
            <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Ionicons
                name="add"
                size={24}
                color={isDark ? "#93c5fd" : "#2563eb"}
              />
            </View>
            <Text className="text-sm text-text-light dark:text-text-dark">
              New Item
            </Text>
          </Card>
          <Card className="flex-1 items-center p-4">
            <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Ionicons
                name="search"
                size={24}
                color={isDark ? "#86efac" : "#16a34a"}
              />
            </View>
            <Text className="text-sm text-text-light dark:text-text-dark">
              Search
            </Text>
          </Card>
          <Card className="flex-1 items-center p-4">
            <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Ionicons
                name="stats-chart"
                size={24}
                color={isDark ? "#c4b5fd" : "#7c3aed"}
              />
            </View>
            <Text className="text-sm text-text-light dark:text-text-dark">
              Stats
            </Text>
          </Card>
        </View>

        {/* Recent Activity */}
        <Text className="mb-3 text-lg font-semibold text-text-light dark:text-text-dark">
          Recent Activity
        </Text>
        <Card className="mb-4 p-4">
          <View className="items-center py-8">
            <Ionicons
              name="time-outline"
              size={48}
              color={isDark ? "#64748b" : "#94a3b8"}
            />
            <Text className="mt-2 text-muted-light dark:text-muted-dark">
              No recent activity
            </Text>
            <Text className="mt-1 text-sm text-muted-light dark:text-muted-dark">
              Your activity will appear here
            </Text>
          </View>
        </Card>

        {/* Settings Link */}
        <Link href="/(auth)/settings" asChild>
          <Button variant="outline" className="mb-8">
            <Ionicons
              name="settings-outline"
              size={20}
              color={isDark ? "#f8fafc" : "#0f172a"}
              style={{ marginRight: 8 }}
            />
            Settings
          </Button>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
