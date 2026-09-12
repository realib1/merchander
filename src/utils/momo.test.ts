
import { extractMomoReference, extractMomoAmount, extractMomoSender } from './momo';

describe('extractMomoReference', () => {
  it('returns null for empty input', () => {
    expect(extractMomoReference('')).toBeNull();
  });

  it('extracts reference from "Ref:" format', () => {
    const sms = 'Payment received for GHS 450.00 from Kwame Mensah. Ref: 48928172901';
    expect(extractMomoReference(sms)).toBe('48928172901');
  });

  it('extracts reference from "Trans ID:" format', () => {
    const sms = 'MTN Mobile Money transaction confirmed. Trans ID: AB12CD34EF56';
    expect(extractMomoReference(sms)).toBe('AB12CD34EF56');
  });

  it('extracts reference from "Reference:" format', () => {
    const sms = 'Your payment of GHS 200.00 was successful. Reference: 1234567890';
    expect(extractMomoReference(sms)).toBe('1234567890');
  });

  it('falls back to standalone digit sequence', () => {
    const sms = 'Payment successful 1234567890 confirmed';
    expect(extractMomoReference(sms)).toBe('1234567890');
  });

  it('returns null when no reference found', () => {
    const sms = 'Hello, how are you doing today?';
    expect(extractMomoReference(sms)).toBeNull();
  });

  it('handles case-insensitive matching', () => {
    const sms = 'Transaction confirmed! REF: ABCDEF12345';
    expect(extractMomoReference(sms)).toBe('ABCDEF12345');
  });
});

describe('extractMomoAmount', () => {
  it('returns null for empty input', () => {
    expect(extractMomoAmount('')).toBeNull();
  });

  it('extracts amount from GHS format', () => {
    const sms = 'Payment received for GHS 150.00 from 0244123456';
    expect(extractMomoAmount(sms)).toBe(150.0);
  });

  it('extracts amount with commas from GHS format', () => {
    const sms = 'Received GHS 1,450.50 from Kwesi';
    expect(extractMomoAmount(sms)).toBe(1450.5);
  });

  it('extracts amount from GHc format', () => {
    const sms = 'Payment of GHc 75.00 completed successfully';
    expect(extractMomoAmount(sms)).toBe(75.0);
  });
});

describe('extractMomoSender', () => {
  it('extracts phone and name from standard SMS', () => {
    const sms = 'Payment received for GHS 150.00 from 0244123456 - Kwesi Mensah. Ref: 1234567890';
    const sender = extractMomoSender(sms);
    expect(sender.phone).toBe('0244123456');
    expect(sender.name).toBe('Kwesi Mensah');
  });
});
