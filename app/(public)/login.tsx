import { View, Text, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { FormInput } from "@/components/forms/FormInput";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, LoginFormData } from "@/utils/validation";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
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
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className="mb-8"
          >
            <Text className="text-3xl font-bold text-text-light dark:text-text-dark">
              {t('auth.welcomeBack')}
            </Text>
            <Text className="mt-2 text-muted-light dark:text-muted-dark">
              {t('auth.signInToContinue')}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="gap-4"
          >
            <FormInput
              name="email"
              control={control}
              label={t('auth.email')}
              placeholder={t('auth.enterEmail')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
            />

            <FormInput
              name="password"
              control={control}
              label={t('auth.password')}
              placeholder={t('auth.enterPassword')}
              secureTextEntry
              autoComplete="password"
              leftIcon="lock-closed-outline"
            />

            <Link href="/(public)/forgot-password" asChild>
              <Pressable className="self-end">
                <Text className="text-primary-600 dark:text-primary-400">
                  {t('auth.forgotPassword')}
                </Text>
              </Pressable>
            </Link>

            <AnimatedButton
              onPress={handleSubmit(onSubmit)}
              isLoading={isSubmitting}
              className="mt-4"
            >
              {t('auth.signIn')}
            </AnimatedButton>
          </Animated.View>

          {/* Divider */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className="my-6 flex-row items-center"
          >
            <View className="h-px flex-1 bg-muted-light/30 dark:bg-muted-dark/30" />
            <Text className="mx-4 text-muted-light dark:text-muted-dark">
              {t('socialAuth.orContinueWith')}
            </Text>
            <View className="h-px flex-1 bg-muted-light/30 dark:bg-muted-dark/30" />
          </Animated.View>

          {/* Social Login */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <SocialLoginButtons
              onSuccess={(result) => {
                if (__DEV__) console.log('Social login succeeded:', result.provider, result.user.email);
                // TODO: Send result.idToken to your backend
              }}
            />
          </Animated.View>

          {/* Footer */}
          <Animated.View
            entering={FadeInDown.delay(500).springify()}
            className="mt-8 flex-row justify-center"
          >
            <Text className="text-muted-light dark:text-muted-dark">
              {t('auth.noAccount')}{" "}
            </Text>
            <Link href="/(public)/register" asChild>
              <Pressable>
                <Text className="font-semibold text-primary-600 dark:text-primary-400">
                  {t('auth.signUp')}
                </Text>
              </Pressable>
            </Link>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
