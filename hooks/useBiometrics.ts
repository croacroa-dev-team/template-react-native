import { useState, useEffect, useCallback } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import { storage } from "@/services/storage";
import { ENABLE_BIOMETRIC_AUTH } from "@/constants/config";

// Storage key for biometric preference
const BIOMETRIC_ENABLED_KEY = "biometric_auth_enabled";

export type BiometricType = "fingerprint" | "face" | "iris" | "none";

interface BiometricCapabilities {
  /**
   * Whether biometric authentication is available on this device
   */
  isAvailable: boolean;

  /**
   * Whether biometrics are enrolled on the device
   */
  isEnrolled: boolean;

  /**
   * The type of biometric authentication available
   */
  biometricType: BiometricType;

  /**
   * Security level of the biometric hardware
   */
  securityLevel: LocalAuthentication.SecurityLevel;
}

interface UseBiometricsReturn {
  /**
   * Device biometric capabilities
   */
  capabilities: BiometricCapabilities;

  /**
   * Whether biometric auth is enabled by the user
   */
  isEnabled: boolean;

  /**
   * Whether the hook is still loading
   */
  isLoading: boolean;

  /**
   * Authenticate using biometrics
   * @returns true if authentication succeeded
   */
  authenticate: (options?: AuthenticateOptions) => Promise<boolean>;

  /**
   * Enable biometric authentication for the user
   */
  enable: () => Promise<boolean>;

  /**
   * Disable biometric authentication for the user
   */
  disable: () => Promise<void>;

  /**
   * Toggle biometric authentication
   */
  toggle: () => Promise<boolean>;
}

interface AuthenticateOptions {
  /**
   * Message to display in the authentication prompt
   */
  promptMessage?: string;

  /**
   * Message for the fallback button (e.g., "Use passcode")
   */
  fallbackLabel?: string;

  /**
   * Whether to allow device passcode as fallback
   * @default true
   */
  allowDeviceCredentials?: boolean;

  /**
   * Cancel button label
   */
  cancelLabel?: string;
}

/**
 * Get the biometric type from the available types
 */
function getBiometricType(
  types: LocalAuthentication.AuthenticationType[]
): BiometricType {
  if (
    types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
  ) {
    return "face";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return "fingerprint";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return "iris";
  }
  return "none";
}

/**
 * Hook for handling biometric authentication
 *
 * @example
 * ```tsx
 * function LoginScreen() {
 *   const {
 *     capabilities,
 *     isEnabled,
 *     authenticate,
 *     enable,
 *     disable
 *   } = useBiometrics();
 *
 *   const handleBiometricLogin = async () => {
 *     const success = await authenticate({
 *       promptMessage: 'Authenticate to sign in',
 *     });
 *
 *     if (success) {
 *       // Proceed with login
 *     }
 *   };
 *
 *   if (!capabilities.isAvailable) {
 *     return null;
 *   }
 *
 *   return (
 *     <Button onPress={handleBiometricLogin}>
 *       Sign in with {capabilities.biometricType === 'face' ? 'Face ID' : 'Touch ID'}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useBiometrics(): UseBiometricsReturn {
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({
    isAvailable: false,
    isEnrolled: false,
    biometricType: "none",
    securityLevel: LocalAuthentication.SecurityLevel.NONE,
  });
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check biometric capabilities on mount
  useEffect(() => {
    async function checkCapabilities() {
      try {
        // Check if feature flag is enabled
        if (!ENABLE_BIOMETRIC_AUTH) {
          setIsLoading(false);
          return;
        }

        const [hasHardware, isEnrolled, supportedTypes, securityLevel] =
          await Promise.all([
            LocalAuthentication.hasHardwareAsync(),
            LocalAuthentication.isEnrolledAsync(),
            LocalAuthentication.supportedAuthenticationTypesAsync(),
            LocalAuthentication.getEnrolledLevelAsync(),
          ]);

        setCapabilities({
          isAvailable: hasHardware,
          isEnrolled,
          biometricType: getBiometricType(supportedTypes),
          securityLevel,
        });

        // Load user preference
        if (hasHardware && isEnrolled) {
          const enabled = await storage.get<boolean>(BIOMETRIC_ENABLED_KEY);
          setIsEnabled(enabled ?? false);
        }
      } catch (error) {
        console.error("Failed to check biometric capabilities:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkCapabilities();
  }, []);

  /**
   * Authenticate using biometrics
   */
  const authenticate = useCallback(
    async (options: AuthenticateOptions = {}): Promise<boolean> => {
      if (!capabilities.isAvailable || !capabilities.isEnrolled) {
        console.warn("Biometric authentication not available");
        return false;
      }

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: options.promptMessage || "Authenticate to continue",
          fallbackLabel: options.fallbackLabel || "Use passcode",
          cancelLabel: options.cancelLabel || "Cancel",
          disableDeviceFallback: options.allowDeviceCredentials === false,
        });

        return result.success;
      } catch (error) {
        console.error("Biometric authentication error:", error);
        return false;
      }
    },
    [capabilities]
  );

  /**
   * Enable biometric authentication
   * Requires successful authentication first
   */
  const enable = useCallback(async (): Promise<boolean> => {
    if (!capabilities.isAvailable || !capabilities.isEnrolled) {
      return false;
    }

    // Require authentication before enabling
    const authenticated = await authenticate({
      promptMessage: "Authenticate to enable biometric login",
    });

    if (authenticated) {
      await storage.set(BIOMETRIC_ENABLED_KEY, true);
      setIsEnabled(true);
      return true;
    }

    return false;
  }, [capabilities, authenticate]);

  /**
   * Disable biometric authentication
   */
  const disable = useCallback(async (): Promise<void> => {
    await storage.set(BIOMETRIC_ENABLED_KEY, false);
    setIsEnabled(false);
  }, []);

  /**
   * Toggle biometric authentication
   */
  const toggle = useCallback(async (): Promise<boolean> => {
    if (isEnabled) {
      await disable();
      return false;
    } else {
      return enable();
    }
  }, [isEnabled, enable, disable]);

  return {
    capabilities,
    isEnabled,
    isLoading,
    authenticate,
    enable,
    disable,
    toggle,
  };
}

/**
 * Get a human-readable name for the biometric type
 */
export function getBiometricName(type: BiometricType): string {
  switch (type) {
    case "face":
      return "Face ID";
    case "fingerprint":
      return "Touch ID";
    case "iris":
      return "Iris Scan";
    default:
      return "Biometrics";
  }
}
