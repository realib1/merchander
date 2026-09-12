
import {
  validateCredentialsStep,
  getPasswordMatchStatus,
  CredentialsStepInput,
} from './signup-validation';

describe('signup-validation', () => {
  const validPayload: CredentialsStepInput = {
    fullName: 'Kofi Mensah',
    email: 'kofi@example.com',
    phone: '0241234567',
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    termsAccepted: true,
  };

  describe('validateCredentialsStep', () => {
    it('returns isValid: true when all credentials and terms are valid', () => {
      const res = validateCredentialsStep(validPayload);
      expect(res).toEqual({ isValid: true });
    });

    it('fails when full name is missing or only whitespace', () => {
      expect(validateCredentialsStep({ ...validPayload, fullName: '' })).toEqual({
        isValid: false,
        error: 'Please enter your full name.',
      });
      expect(validateCredentialsStep({ ...validPayload, fullName: '   ' })).toEqual({
        isValid: false,
        error: 'Please enter your full name.',
      });
    });

    it('fails when email is invalid or missing dot/at-sign', () => {
      expect(validateCredentialsStep({ ...validPayload, email: '' })).toEqual({
        isValid: false,
        error: 'Please enter a valid business email.',
      });
      expect(validateCredentialsStep({ ...validPayload, email: 'notanemail' })).toEqual({
        isValid: false,
        error: 'Please enter a valid business email.',
      });
      expect(validateCredentialsStep({ ...validPayload, email: 'user@nodomain' })).toEqual({
        isValid: false,
        error: 'Please enter a valid business email.',
      });
    });

    it('fails when phone is missing or only whitespace', () => {
      expect(validateCredentialsStep({ ...validPayload, phone: '' })).toEqual({
        isValid: false,
        error: 'Please enter your phone number.',
      });
      expect(validateCredentialsStep({ ...validPayload, phone: '   ' })).toEqual({
        isValid: false,
        error: 'Please enter your phone number.',
      });
    });

    it('fails when password is less than 8 characters', () => {
      expect(
        validateCredentialsStep({
          ...validPayload,
          password: 'short',
          confirmPassword: 'short',
        })
      ).toEqual({
        isValid: false,
        error: 'Password must be at least 8 characters long.',
      });
    });

    it('fails when confirmPassword does not match password', () => {
      expect(
        validateCredentialsStep({
          ...validPayload,
          confirmPassword: 'DifferentPassword123!',
        })
      ).toEqual({
        isValid: false,
        error: 'Passwords do not match.',
      });
    });

    it('fails when terms are not accepted', () => {
      expect(
        validateCredentialsStep({
          ...validPayload,
          termsAccepted: false,
        })
      ).toEqual({
        isValid: false,
        error: 'You must agree to the Terms of Service and Privacy Policy to continue.',
      });
    });
  });

  describe('getPasswordMatchStatus', () => {
    it('does not show feedback when confirmPassword is empty or undefined', () => {
      expect(getPasswordMatchStatus('password123', '')).toEqual({
        isMatching: false,
        showFeedback: false,
      });
      expect(getPasswordMatchStatus('password123', undefined)).toEqual({
        isMatching: false,
        showFeedback: false,
      });
    });

    it('shows matching feedback when passwords match', () => {
      expect(getPasswordMatchStatus('Secret1234', 'Secret1234')).toEqual({
        isMatching: true,
        showFeedback: true,
        message: 'Passwords match',
      });
    });

    it('shows mismatch feedback when passwords do not match', () => {
      expect(getPasswordMatchStatus('Secret1234', 'Secret123')).toEqual({
        isMatching: false,
        showFeedback: true,
        message: 'Passwords do not match',
      });
    });

    it('handles undefined or empty password correctly', () => {
      expect(getPasswordMatchStatus(undefined, 'Secret123')).toEqual({
        isMatching: false,
        showFeedback: true,
        message: 'Passwords do not match',
      });
    });
  });
});
