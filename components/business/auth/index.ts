/**
 * Business Auth Components
 * Centralized exports for authentication UI components
 *
 * SCOPE: Business module ONLY
 */

// Layout components
export {
  SplitScreenAuthLayout,
  LoginLayout,
  SignupLayout,
  ForgotPasswordLayout,
  ResetPasswordLayout,
} from './split-screen-auth-layout';

export { AuthBrandPanel, AuthBrandHeader } from './auth-brand-panel';

export {
  AuthFormPanel,
  AuthFormCard,
  AuthFormHeader,
  AuthFormContainer,
  AuthFormField,
} from './auth-form-panel';

// Form components
export {
  PasswordInput,
  PasswordStrengthBar,
  PasswordRequirements,
} from './password-input';

export { SocialAuthButtons, SocialButton } from './social-auth-buttons';

export { AuthDivider } from './auth-divider';

export { AuthFooterLinks, ForgotPasswordLink } from './auth-footer-links';

// Feedback components
export { AnimatedAlert, InlineAlert } from './animated-alert';

// Legacy components (for backwards compatibility)
export {
  AuthPageWrapper,
  AnimatedIconBadge,
  AnimatedHeader,
  AnimatedCard,
  AnimatedFooter,
  authAnimations,
} from './auth-page-wrapper';
