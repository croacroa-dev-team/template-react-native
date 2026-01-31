export { cn } from "./cn";
export { toast, handleApiError } from "./toast";
export {
  emailSchema,
  passwordSchema,
  nameSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  profileSchema,
} from "./validation";
export type {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ChangePasswordFormData,
  ProfileFormData,
} from "./validation";

// Accessibility utilities
export {
  buttonA11y,
  linkA11y,
  inputA11y,
  toggleA11y,
  headerA11y,
  imageA11y,
  listItemA11y,
  progressA11y,
  tabA11y,
  alertA11y,
  useScreenReader,
  useReduceMotion,
  useBoldText,
  useAccessibilityPreferences,
  announce,
  setAccessibilityFocus,
  formatPriceA11y,
  formatDateA11y,
  formatDurationA11y,
} from "./accessibility";
export type { AccessibilityProps } from "./accessibility";

// Accessibility enforcement HOC and utilities
export {
  withAccessibility,
  useAccessibilityValidation,
  createA11yProps,
  A11yContext,
  auditAccessibility,
} from "./withAccessibility";
