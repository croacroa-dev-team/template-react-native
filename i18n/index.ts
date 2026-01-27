import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { storage } from "@/services/storage";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

export const LANGUAGES = {
  en: { name: "English", nativeName: "English" },
  fr: { name: "French", nativeName: "Français" },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

const LANGUAGE_STORAGE_KEY = "app_language";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

/**
 * Get the device's preferred language
 * Falls back to 'en' if not supported
 */
function getDeviceLanguage(): LanguageCode {
  const locale = Localization.getLocales()[0];
  const languageCode = locale?.languageCode || "en";

  // Check if we support this language
  if (languageCode in LANGUAGES) {
    return languageCode as LanguageCode;
  }

  return "en";
}

/**
 * Initialize i18n with the saved language or device language
 */
export async function initI18n(): Promise<void> {
  // Try to get saved language preference
  const savedLanguage = await storage.get<LanguageCode>(LANGUAGE_STORAGE_KEY);
  const initialLanguage = savedLanguage || getDeviceLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: "en",
    compatibilityJSON: "v3",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Prevents issues with SSR/async loading
    },
  });
}

/**
 * Change the app language
 */
export async function changeLanguage(language: LanguageCode): Promise<void> {
  await i18n.changeLanguage(language);
  await storage.set(LANGUAGE_STORAGE_KEY, language);
}

/**
 * Get current language
 */
export function getCurrentLanguage(): LanguageCode {
  return (i18n.language || "en") as LanguageCode;
}

export { i18n };
export default i18n;
