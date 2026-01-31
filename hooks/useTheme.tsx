/**
 * @fileoverview Theme management with light/dark mode support
 * Provides context and hooks for managing app theme with system preference detection.
 * @module hooks/useTheme
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Theme mode options
 * - 'light': Force light theme
 * - 'dark': Force dark theme
 * - 'system': Follow device system preference
 */
type ThemeMode = "light" | "dark" | "system";

/**
 * Theme context type definition
 */
interface ThemeContextType {
  /** Current theme mode setting ('light', 'dark', or 'system') */
  mode: ThemeMode;
  /** Whether the current effective theme is dark */
  isDark: boolean;
  /** Whether the theme has been loaded from storage */
  isLoaded: boolean;
  /** Set the theme mode and persist to storage */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark mode */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "theme_mode";

/**
 * Theme Provider component.
 * Wraps your app to provide theme context with persistent preferences.
 *
 * Features:
 * - System theme detection
 * - Persistent theme preference
 * - Real-time system theme updates
 *
 * @param children - Child components to wrap
 *
 * @example
 * ```tsx
 * // In your app root
 * export default function RootLayout() {
 *   return (
 *     <ThemeProvider>
 *       <App />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadStoredTheme();
  }, []);

  const loadStoredTheme = async () => {
    try {
      const storedMode = await AsyncStorage.getItem(THEME_KEY);
      if (storedMode && ["light", "dark", "system"].includes(storedMode)) {
        setModeState(storedMode as ThemeMode);
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_KEY, newMode);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? "light" : "dark";
    setMode(newMode);
  };

  const isDark =
    mode === "system" ? systemColorScheme === "dark" : mode === "dark";

  return (
    <ThemeContext.Provider
      value={{
        mode,
        isDark,
        isLoaded,
        setMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme state and controls.
 * Must be used within a ThemeProvider.
 *
 * @returns Theme context with mode, isDark flag, and control functions
 * @throws Error if used outside of ThemeProvider
 *
 * @example
 * ```tsx
 * function SettingsScreen() {
 *   const { mode, isDark, setMode, toggleTheme } = useTheme();
 *
 *   return (
 *     <View>
 *       <Text>Current mode: {mode}</Text>
 *       <Text>Is dark: {isDark ? 'Yes' : 'No'}</Text>
 *
 *       <Button onPress={toggleTheme}>Toggle Theme</Button>
 *
 *       <Select
 *         value={mode}
 *         onValueChange={setMode}
 *         options={[
 *           { label: 'Light', value: 'light' },
 *           { label: 'Dark', value: 'dark' },
 *           { label: 'System', value: 'system' },
 *         ]}
 *       />
 *     </View>
 *   );
 * }
 * ```
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
