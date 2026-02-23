import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { FormInput } from "@/components/forms/FormInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, RegisterFormData } from "@/utils/validation";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUp(data.email, data.password, data.name);
      router.replace("/(auth)/home");
    } catch {
      // Error is handled by useAuth with toast
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-8">
            {/* Header */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="mb-8"
            >
              <Text className="text-3xl font-bold text-text-light dark:text-text-dark">
                {t("auth.createAccount")}
              </Text>
              <Text className="mt-2 text-muted-light dark:text-muted-dark">
                {t("auth.joinUs")}
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              className="gap-4"
            >
              <FormInput
                name="name"
                control={control}
                label={t("auth.name")}
                placeholder={t("auth.enterName")}
                autoComplete="name"
                leftIcon="person-outline"
              />

              <FormInput
                name="email"
                control={control}
                label={t("auth.email")}
                placeholder={t("auth.enterEmail")}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon="mail-outline"
              />

              <FormInput
                name="password"
                control={control}
                label={t("auth.password")}
                placeholder={t("auth.createPasswordPlaceholder")}
                secureTextEntry
                autoComplete="new-password"
                leftIcon="lock-closed-outline"
                hint={t("auth.passwordHintFull")}
              />

              <FormInput
                name="confirmPassword"
                control={control}
                label={t("auth.confirmPassword")}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                secureTextEntry
                autoComplete="new-password"
                leftIcon="lock-closed-outline"
              />

              <AnimatedButton
                onPress={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                className="mt-4"
              >
                {t("auth.createAccount")}
              </AnimatedButton>
            </Animated.View>

            {/* Footer */}
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              className="mt-8 flex-row justify-center"
            >
              <Text className="text-muted-light dark:text-muted-dark">
                {t("auth.haveAccount")}{" "}
              </Text>
              <Link href="/(public)/login" asChild>
                <Pressable>
                  <Text className="font-semibold text-primary-600 dark:text-primary-400">
                    {t("auth.signIn")}
                  </Text>
                </Pressable>
              </Link>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
