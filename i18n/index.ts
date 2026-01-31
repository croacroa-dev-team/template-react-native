/**
 * @fileoverview Internationalization (i18n) setup with RTL support
 * Provides multi-language support with automatic device language detection.
 * @module i18n
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { I18nManager } from "react-native";
import { storage } from "@/services/storage";

import en from "./locales/en.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import de from "./locales/de.json";

/**
 * Supported languages configuration.
 * Each language includes its English name, native name, and RTL flag.
 */
export const LANGUAGES = {
  en: { name: "English", nativeName: "English", rtl: false },
  fr: { name: "French", nativeName: "Français", rtl: false },
  es: { name: "Spanish", nativeName: "Español", rtl: false },
  de: { name: "German", nativeName: "Deutsch", rtl: false },
  // Add RTL languages here:
  // ar: { name: "Arabic", nativeName: "العربية", rtl: true },
  // he: { name: "Hebrew", nativeName: "עברית", rtl: true },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

const LANGUAGE_STORAGE_KEY = "app_language";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
  de: { translation: de },
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
 * Change the app language and apply RTL settings if needed.
 * Note: RTL changes require an app restart to take full effect.
 *
 * @param language - The language code to switch to
 * @returns Promise that resolves when the language is changed
 */
export async function changeLanguage(language: LanguageCode): Promise<void> {
  await i18n.changeLanguage(language);
  await storage.set(LANGUAGE_STORAGE_KEY, language);

  // Handle RTL layout direction
  const isRTL = LANGUAGES[language].rtl;
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    // Note: App restart is required for RTL changes to take full effect
  }
}

/**
 * Check if the current language is RTL
 */
export function isCurrentLanguageRTL(): boolean {
  const currentLang = getCurrentLanguage();
  return LANGUAGES[currentLang]?.rtl ?? false;
}

/**
 * Get all available languages as an array for UI selectors
 */
export function getAvailableLanguages(): Array<{
  code: LanguageCode;
  name: string;
  nativeName: string;
  rtl: boolean;
}> {
  return Object.entries(LANGUAGES).map(([code, config]) => ({
    code: code as LanguageCode,
    ...config,
  }));
}

/**
 * Get current language
 */
export function getCurrentLanguage(): LanguageCode {
  return (i18n.language || "en") as LanguageCode;
}

export { i18n };
export default i18n;
