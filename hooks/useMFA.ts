/**
 * @fileoverview Multi-Factor Authentication (MFA) hook
 * Provides OTP-based two-factor authentication functionality.
 * @module hooks/useMFA
 */

import { useState, useCallback } from "react";
import { api } from "@/services/api";
import { storage } from "@/services/storage";
import { toast } from "@/utils/toast";

/**
 * MFA methods supported by the app
 */
export type MFAMethod = "totp" | "sms" | "email";

/**
 * MFA setup data returned when enabling MFA
 */
export interface MFASetupData {
  /** Secret key for TOTP apps (e.g., Google Authenticator) */
  secret: string;
  /** QR code URL for easy setup */
  qrCodeUrl: string;
  /** Backup codes for account recovery */
  backupCodes: string[];
  /** Selected MFA method */
  method: MFAMethod;
}

/**
 * MFA state interface
 */
interface MFAState {
  /** Whether MFA is enabled for the user */
  isEnabled: boolean;
  /** Active MFA method */
  method: MFAMethod | null;
  /** Whether MFA is required for current session */
  isRequired: boolean;
  /** Whether currently in MFA verification flow */
  isPendingVerification: boolean;
}

/**
 * Return type for useMFA hook
 */
interface UseMFAReturn {
  /** Current MFA state */
  state: MFAState;
  /** Whether any MFA operation is in progress */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;

  /**
   * Begin MFA setup process
   * @param method - The MFA method to set up
   * @returns Setup data including secret and QR code
   */
  beginSetup: (method: MFAMethod) => Promise<MFASetupData | null>;

  /**
   * Complete MFA setup by verifying the first code
   * @param code - The verification code from authenticator app
   * @returns Whether setup was successful
   */
  completeSetup: (code: string) => Promise<boolean>;

  /**
   * Verify an MFA code during login
   * @param code - The verification code
   * @returns Whether verification was successful
   */
  verifyCode: (code: string) => Promise<boolean>;

  /**
   * Send a verification code (for SMS/email methods)
   * @returns Whether code was sent successfully
   */
  sendCode: () => Promise<boolean>;

  /**
   * Disable MFA for the user
   * @param code - Current verification code to confirm
   * @returns Whether MFA was disabled
   */
  disable: (code: string) => Promise<boolean>;

  /**
   * Use a backup code for authentication
   * @param backupCode - One of the backup codes
   * @returns Whether the backup code was valid
   */
  useBackupCode: (backupCode: string) => Promise<boolean>;

  /**
   * Check if MFA is enabled for current user
   */
  checkStatus: () => Promise<void>;

  /**
   * Clear error state
   */
  clearError: () => void;
}

const MFA_STORAGE_KEY = "mfa_state";

/**
 * Hook for managing Multi-Factor Authentication.
 *
 * Supports:
 * - TOTP (Time-based One-Time Password) with authenticator apps
 * - SMS verification codes
 * - Email verification codes
 * - Backup codes for account recovery
 *
 * @example
 * ```tsx
 * function MFASetupScreen() {
 *   const { state, beginSetup, completeSetup, isLoading } = useMFA();
 *   const [setupData, setSetupData] = useState<MFASetupData | null>(null);
 *   const [code, setCode] = useState('');
 *
 *   const handleSetup = async () => {
 *     const data = await beginSetup('totp');
 *     if (data) {
 *       setSetupData(data);
 *       // Show QR code for user to scan
 *     }
 *   };
 *
 *   const handleVerify = async () => {
 *     const success = await completeSetup(code);
 *     if (success) {
 *       // MFA is now enabled
 *       // Save backup codes securely
 *     }
 *   };
 *
 *   if (state.isEnabled) {
 *     return <Text>MFA is enabled</Text>;
 *   }
 *
 *   return (
 *     <View>
 *       {!setupData ? (
 *         <Button onPress={handleSetup} isLoading={isLoading}>
 *           Enable 2FA
 *         </Button>
 *       ) : (
 *         <View>
 *           <QRCode value={setupData.qrCodeUrl} />
 *           <Input
 *             value={code}
 *             onChangeText={setCode}
 *             placeholder="Enter verification code"
 *             keyboardType="number-pad"
 *           />
 *           <Button onPress={handleVerify} isLoading={isLoading}>
 *             Verify
 *           </Button>
 *         </View>
 *       )}
 *     </View>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // During login when MFA is required
 * function MFAVerificationScreen() {
 *   const { verifyCode, sendCode, useBackupCode, isLoading } = useMFA();
 *   const [code, setCode] = useState('');
 *
 *   const handleVerify = async () => {
 *     const success = await verifyCode(code);
 *     if (success) {
 *       // Proceed with login
 *       router.replace('/(auth)/home');
 *     }
 *   };
 *
 *   return (
 *     <View>
 *       <Text>Enter your verification code</Text>
 *       <OTPInput value={code} onChange={setCode} />
 *       <Button onPress={handleVerify} isLoading={isLoading}>
 *         Verify
 *       </Button>
 *       <Button variant="ghost" onPress={() => setShowBackupInput(true)}>
 *         Use backup code
 *       </Button>
 *     </View>
 *   );
 * }
 * ```
 */
export function useMFA(): UseMFAReturn {
  const [state, setState] = useState<MFAState>({
    isEnabled: false,
    method: null,
    isRequired: false,
    isPendingVerification: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSetupSecret, setPendingSetupSecret] = useState<string | null>(
    null
  );

  /**
   * Check MFA status for current user
   */
  const checkStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get cached status first
      const cached = await storage.get<MFAState>(MFA_STORAGE_KEY);
      if (cached) {
        setState(cached);
      }

      // TODO: Replace with actual API call
      // const response = await api.get<{ mfa: MFAState }>('/auth/mfa/status');
      // setState(response.mfa);
      // await storage.set(MFA_STORAGE_KEY, response.mfa);

      // Mock implementation
      // In real implementation, this would fetch from your API
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check MFA status";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Begin MFA setup
   */
  const beginSetup = useCallback(
    async (method: MFAMethod): Promise<MFASetupData | null> => {
      try {
        setIsLoading(true);
        setError(null);

        // TODO: Replace with actual API call
        // const response = await api.post<MFASetupData>('/auth/mfa/setup', { method });
        // setPendingSetupSecret(response.secret);
        // return response;

        // Mock implementation
        const mockSecret = "JBSWY3DPEHPK3PXP"; // Example TOTP secret
        const mockSetupData: MFASetupData = {
          secret: mockSecret,
          qrCodeUrl: `otpauth://totp/YourApp:user@example.com?secret=${mockSecret}&issuer=YourApp`,
          backupCodes: [
            "ABC123DEF",
            "GHI456JKL",
            "MNO789PQR",
            "STU012VWX",
            "YZA345BCD",
          ],
          method,
        };

        setPendingSetupSecret(mockSecret);
        return mockSetupData;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to begin MFA setup";
        setError(message);
        toast.error("Setup failed", message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Complete MFA setup by verifying the first code
   */
  const completeSetup = useCallback(
    async (code: string): Promise<boolean> => {
      if (!pendingSetupSecret) {
        setError("No pending setup. Please start setup first.");
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        // TODO: Replace with actual API call
        // await api.post('/auth/mfa/verify-setup', {
        //   secret: pendingSetupSecret,
        //   code,
        // });

        // Mock implementation - verify code format (6 digits)
        if (!/^\d{6}$/.test(code)) {
          throw new Error("Invalid code format. Please enter 6 digits.");
        }

        // Update state
        const newState: MFAState = {
          isEnabled: true,
          method: "totp",
          isRequired: false,
          isPendingVerification: false,
        };
        setState(newState);
        await storage.set(MFA_STORAGE_KEY, newState);
        setPendingSetupSecret(null);

        toast.success("MFA enabled", "Two-factor authentication is now active");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Verification failed";
        setError(message);
        toast.error("Verification failed", message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [pendingSetupSecret]
  );

  /**
   * Verify an MFA code during login
   */
  const verifyCode = useCallback(async (code: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // await api.post('/auth/mfa/verify', { code });

      // Mock implementation
      if (!/^\d{6}$/.test(code)) {
        throw new Error("Invalid code format");
      }

      setState((prev) => ({
        ...prev,
        isPendingVerification: false,
        isRequired: false,
      }));

      toast.success("Verified", "Authentication successful");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setError(message);
      toast.error("Invalid code", "Please try again");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Send a verification code (for SMS/email methods)
   */
  const sendCode = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // await api.post('/auth/mfa/send-code');

      toast.success("Code sent", "Check your phone or email");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send code";
      setError(message);
      toast.error("Failed to send code", message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Disable MFA
   */
  const disable = useCallback(async (code: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // await api.post('/auth/mfa/disable', { code });

      // Mock implementation
      if (!/^\d{6}$/.test(code)) {
        throw new Error("Invalid code format");
      }

      const newState: MFAState = {
        isEnabled: false,
        method: null,
        isRequired: false,
        isPendingVerification: false,
      };
      setState(newState);
      await storage.set(MFA_STORAGE_KEY, newState);

      toast.success("MFA disabled", "Two-factor authentication has been turned off");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disable MFA";
      setError(message);
      toast.error("Failed to disable MFA", message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Use a backup code
   */
  const useBackupCode = useCallback(
    async (backupCode: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        // TODO: Replace with actual API call
        // await api.post('/auth/mfa/backup-code', { code: backupCode });

        // Mock implementation
        if (!/^[A-Z0-9]{9}$/.test(backupCode.toUpperCase())) {
          throw new Error("Invalid backup code format");
        }

        setState((prev) => ({
          ...prev,
          isPendingVerification: false,
          isRequired: false,
        }));

        toast.success("Backup code accepted", "You are now logged in");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid backup code";
        setError(message);
        toast.error("Invalid backup code", message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    state,
    isLoading,
    error,
    beginSetup,
    completeSetup,
    verifyCode,
    sendCode,
    disable,
    useBackupCode,
    checkStatus,
    clearError,
  };
}

/**
 * Generate a TOTP code from a secret (client-side)
 * Note: For production, use a proper TOTP library
 */
export function generateTOTP(_secret: string): string {
  // This is a placeholder - in production use a library like 'otpauth'
  // import { TOTP } from 'otpauth';
  // const totp = new TOTP({ secret: secret });
  // return totp.generate();
  return "000000";
}
