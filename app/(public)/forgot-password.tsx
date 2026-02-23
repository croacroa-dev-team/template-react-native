import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleResetPassword = async () => {
    if (!email) {
      setError(t("forgotPassword.emailRequired"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // TODO: Implement password reset API call
      // await api.resetPassword(email);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(true);
    } catch {
      setError(t("forgotPassword.sendFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Ionicons name="mail-outline" size={40} color="#22c55e" />
          </View>
          <Text className="text-center text-2xl font-bold text-text-light dark:text-text-dark">
            {t("forgotPassword.checkEmail")}
          </Text>
          <Text className="mt-2 text-center text-muted-light dark:text-muted-dark">
            {t("forgotPassword.resetSent", { email })}
          </Text>
          <Button
            onPress={() => router.replace("/(public)/login")}
            className="mt-8"
          >
            {t("forgotPassword.backToSignIn")}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <Pressable
            onPress={() => router.back()}
            className="mb-8 flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#64748b" />
            <Text className="ml-2 text-muted-light dark:text-muted-dark">
              {t("common.back")}
            </Text>
          </Pressable>

          <View className="mb-8">
            <Text className="text-3xl font-bold text-text-light dark:text-text-dark">
              {t("forgotPassword.title")}
            </Text>
            <Text className="mt-2 text-muted-light dark:text-muted-dark">
              {t("forgotPassword.subtitle")}
            </Text>
          </View>

          {error ? (
            <View className="mb-4 rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
              <Text className="text-red-600 dark:text-red-400">{error}</Text>
            </View>
          ) : null}

          <View className="gap-4">
            <Input
              label={t("auth.email")}
              placeholder={t("auth.enterEmail")}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Button
              onPress={handleResetPassword}
              isLoading={isLoading}
              className="mt-4"
            >
              {t("forgotPassword.sendResetLink")}
            </Button>
          </View>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-muted-light dark:text-muted-dark">
              {t("forgotPassword.rememberPassword")}{" "}
            </Text>
            <Link href="/(public)/login" asChild>
              <Pressable>
                <Text className="font-semibold text-primary-600 dark:text-primary-400">
                  {t("auth.signIn")}
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
