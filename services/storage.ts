import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Logger } from "@/services/logger/logger-adapter";

const log = Logger.withContext({ module: "Storage" });

/**
 * Regular storage for non-sensitive data
 * Uses AsyncStorage under the hood
 */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      log.error(`Failed to get ${key} from storage`, error as Error);
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      log.error(`Failed to set ${key} in storage`, error as Error);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      log.error(`Failed to remove ${key} from storage`, error as Error);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      log.error("Failed to clear storage", error as Error);
    }
  },

  async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      log.error("Failed to get all keys from storage", error as Error);
      return [];
    }
  },
};

/**
 * Secure storage for sensitive data (tokens, credentials)
 * Uses expo-secure-store (Keychain on iOS, EncryptedSharedPreferences on Android)
 */
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      log.error(`Failed to get ${key} from secure storage`, error as Error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      log.error(`Failed to set ${key} in secure storage`, error as Error);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      log.error(`Failed to remove ${key} from secure storage`, error as Error);
    }
  },
};
