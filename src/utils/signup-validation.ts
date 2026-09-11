/**
 * Pure validation utilities for merchant self-service signup credentials step.
 */

export interface CredentialsStepInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PasswordMatchStatus {
  isMatching: boolean;
  showFeedback: boolean;
  message?: string;
}

/**
 * Validates the Step 1 (Account Credentials) form fields.
 */
export function validateCredentialsStep(
  input: Partial<CredentialsStepInput>
): ValidationResult {
  const fullName = input.fullName?.trim();
  if (!fullName) {
    return { isValid: false, error: 'Please enter your full name.' };
  }

  const email = input.email?.trim();
  if (!email || !email.includes('@') || !email.includes('.')) {
    return { isValid: false, error: 'Please enter a valid business email.' };
  }

  const phone = input.phone?.trim();
  if (!phone) {
    return { isValid: false, error: 'Please enter your phone number.' };
  }

  const password = input.password || '';
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long.' };
  }

  const confirmPassword = input.confirmPassword || '';
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match.' };
  }

  if (!input.termsAccepted) {
    return {
      isValid: false,
      error: 'You must agree to the Terms of Service and Privacy Policy to continue.',
    };
  }

  return { isValid: true };
}

/**
 * Returns real-time feedback status when the user is typing their confirmation password.
 */
export function getPasswordMatchStatus(
  password?: string,
  confirmPassword?: string
): PasswordMatchStatus {
  if (!confirmPassword) {
    return { isMatching: false, showFeedback: false };
  }

  const isMatching = (password || '') === confirmPassword;
  return {
    isMatching,
    showFeedback: true,
    message: isMatching ? 'Passwords match' : 'Passwords do not match',
  };
}
