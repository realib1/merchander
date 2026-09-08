import { describe, it, expect } from 'vitest';
import {
  classifyActionSafety,
  PAYMENT_ASSURANCE_NOTICE,
  ORDER_ASSURANCE_NOTICE,
  HUMAN_HANDOFF_NOTICE,
  GENERAL_YELLOW_ASSURANCE_NOTICE,
} from './safety';

describe('Action Safety Classifier (Green / Yellow / Red)', () => {
  describe('Green Tier (Auto-Send)', () => {
    it('classifies high-confidence product Q&A as Green', () => {
      const result = classifyActionSafety({
        intent: 'check_stock',
        confidence: 0.95,
        requires_human_approval: false,
      });

      expect(result.tier).toBe('green');
      expect(result.actionType).toBe('reply');
      expect(result.autoDispatch).toBe(true);
      expect(result.requiresHumanApproval).toBe(false);
      expect(result.customerAssuranceNotice).toBeUndefined();
    });

    it('classifies high-confidence order tracking inquiries as Green', () => {
      const result = classifyActionSafety({
        intent: 'check_order',
        confidence: 0.90,
        requires_human_approval: false,
      });

      expect(result.tier).toBe('green');
      expect(result.autoDispatch).toBe(true);
      expect(result.requiresHumanApproval).toBe(false);
    });
  });

  describe('Yellow Tier (Gated Approval Queue)', () => {
    it('classifies payment confirmation claims as Yellow with payment assurance notice', () => {
      const result = classifyActionSafety({
        intent: 'confirm_payment',
        confidence: 0.95,
        requires_human_approval: true,
        escalation_reason: 'Payment claim requires merchant verification',
      });

      expect(result.tier).toBe('yellow');
      expect(result.actionType).toBe('confirm_payment');
      expect(result.autoDispatch).toBe(false);
      expect(result.requiresHumanApproval).toBe(true);
      expect(result.customerAssuranceNotice).toBe(PAYMENT_ASSURANCE_NOTICE);
      expect(result.escalationReason).toContain('Payment claim');
    });

    it('classifies draft order requests as Yellow with order assurance notice', () => {
      const result = classifyActionSafety({
        intent: 'create_order',
        confidence: 0.95,
        requires_human_approval: false,
      });

      expect(result.tier).toBe('yellow');
      expect(result.actionType).toBe('draft_order');
      expect(result.autoDispatch).toBe(false);
      expect(result.requiresHumanApproval).toBe(true);
      expect(result.customerAssuranceNotice).toBe(ORDER_ASSURANCE_NOTICE);
    });

    it('classifies medium confidence (0.50 - 0.84) as Yellow with general assurance notice', () => {
      const result = classifyActionSafety({
        intent: 'check_stock',
        confidence: 0.72,
        requires_human_approval: false,
      });

      expect(result.tier).toBe('yellow');
      expect(result.autoDispatch).toBe(false);
      expect(result.requiresHumanApproval).toBe(true);
      expect(result.customerAssuranceNotice).toBe(GENERAL_YELLOW_ASSURANCE_NOTICE);
      expect(result.escalationReason).toContain('Medium AI confidence');
    });
  });

  describe('Red Tier (Human-Only Exceptions)', () => {
    it('classifies explicit human agent requests as Red with handoff notice', () => {
      const result = classifyActionSafety({
        intent: 'human_agent',
        confidence: 0.95,
        requires_human_approval: true,
        escalation_reason: 'Customer requested human representative',
      });

      expect(result.tier).toBe('red');
      expect(result.actionType).toBe('human_handoff');
      expect(result.autoDispatch).toBe(false);
      expect(result.requiresHumanApproval).toBe(true);
      expect(result.customerAssuranceNotice).toBe(HUMAN_HANDOFF_NOTICE);
    });

    it('classifies low confidence (< 0.50) as Red', () => {
      const result = classifyActionSafety({
        intent: 'unknown',
        confidence: 0.35,
        requires_human_approval: false,
      });

      expect(result.tier).toBe('red');
      expect(result.actionType).toBe('human_handoff');
      expect(result.autoDispatch).toBe(false);
      expect(result.requiresHumanApproval).toBe(true);
      expect(result.customerAssuranceNotice).toBe(HUMAN_HANDOFF_NOTICE);
      expect(result.escalationReason).toContain('Low AI confidence');
    });

    it('classifies complaints or disputes as Red', () => {
      const result = classifyActionSafety({
        intent: 'complaint',
        confidence: 0.85,
        requires_human_approval: true,
        escalation_reason: 'Customer dispute regarding damaged goods',
      });

      expect(result.tier).toBe('red');
      expect(result.actionType).toBe('human_handoff');
      expect(result.autoDispatch).toBe(false);
      expect(result.requiresHumanApproval).toBe(true);
      expect(result.customerAssuranceNotice).toBe(HUMAN_HANDOFF_NOTICE);
    });

    it('safely handles missing or NaN confidence as Red', () => {
      const result = classifyActionSafety({
        intent: 'unknown',
        confidence: NaN,
      });

      expect(result.tier).toBe('red');
      expect(result.autoDispatch).toBe(false);
    });
  });
});
