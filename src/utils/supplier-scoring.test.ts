import { describe, it, expect } from 'vitest';
import {
  calculatePunctualityRate,
  calculateLeadTimeVariance,
  calculateFulfillmentAccuracy,
  calculateQualityMetrics,
  calculateCompositeSupplierScore,
} from './supplier-scoring';

describe('Supplier Scoring & Performance Analytics (Pure Utilities)', () => {
  describe('calculatePunctualityRate', () => {
    it('returns 100.0 baseline if no completed purchase orders exist with dates', () => {
      expect(calculatePunctualityRate([])).toBe(100.0);
      expect(calculatePunctualityRate([{ status: 'ordered' }])).toBe(100.0);
    });

    it('calculates on-time percentage accurately', () => {
      const pos = [
        {
          expectedDeliveryDate: '2026-09-10T00:00:00.000Z',
          actualDeliveryDate: '2026-09-09T00:00:00.000Z', // 1 day early -> on time
        },
        {
          expectedDeliveryDate: '2026-09-15T00:00:00.000Z',
          actualDeliveryDate: '2026-09-15T10:00:00.000Z', // same day -> on time
        },
        {
          expectedDeliveryDate: '2026-09-20T00:00:00.000Z',
          actualDeliveryDate: '2026-09-25T00:00:00.000Z', // 5 days late -> late
        },
        {
          expectedDeliveryDate: '2026-09-22T00:00:00.000Z',
          actualDeliveryDate: '2026-09-22T00:00:00.000Z', // on time
        },
      ];

      // 3 on-time out of 4 = 75.0%
      expect(calculatePunctualityRate(pos)).toBe(75.0);
    });
  });

  describe('calculateLeadTimeVariance', () => {
    it('returns 0 when no completed purchase orders exist', () => {
      expect(calculateLeadTimeVariance([])).toBe(0);
    });

    it('computes average lead time deviation in days', () => {
      const pos = [
        {
          expectedDeliveryDate: '2026-09-10T00:00:00.000Z',
          actualDeliveryDate: '2026-09-12T00:00:00.000Z', // +2 days
        },
        {
          expectedDeliveryDate: '2026-09-10T00:00:00.000Z',
          actualDeliveryDate: '2026-09-14T00:00:00.000Z', // +4 days
        },
      ];
      // (+2 + +4) / 2 = +3.0 days
      expect(calculateLeadTimeVariance(pos)).toBe(3.0);
    });
  });

  describe('calculateFulfillmentAccuracy', () => {
    it('returns 100.0 if no orders have quantities', () => {
      expect(calculateFulfillmentAccuracy([])).toBe(100.0);
    });

    it('calculates ratio of received vs ordered units', () => {
      const pos = [
        { orderedQty: 100, receivedQty: 100 },
        { orderedQty: 50, receivedQty: 40 }, // 10 short
      ];
      // 140 received / 150 ordered = 93.3%
      expect(calculateFulfillmentAccuracy(pos)).toBe(93.3);
    });

    it('caps fulfillment accuracy at 100%', () => {
      const pos = [{ orderedQty: 50, receivedQty: 55 }]; // supplier sent extras
      expect(calculateFulfillmentAccuracy(pos)).toBe(100.0);
    });
  });

  describe('calculateQualityMetrics', () => {
    it('returns null average rating and 0 defect rate when empty', () => {
      const res = calculateQualityMetrics([]);
      expect(res.averageQualityRating).toBeNull();
      expect(res.defectRate).toBe(0);
    });

    it('aggregates star rating and defect percentage', () => {
      const pos = [
        { qualityRating: 5, defectCount: 0, orderedQty: 100 },
        { qualityRating: 4, defectCount: 2, orderedQty: 100 },
      ];
      const res = calculateQualityMetrics(pos);
      // (5 + 4) / 2 = 4.5
      expect(res.averageQualityRating).toBe(4.5);
      // 2 defects out of 200 items = 1.0%
      expect(res.defectRate).toBe(1.0);
    });
  });

  describe('calculateCompositeSupplierScore', () => {
    it('returns Unrated and 100.0 baseline for suppliers without order history', () => {
      const res = calculateCompositeSupplierScore({
        hasHistory: false,
        punctualityRate: 100,
        fulfillmentAccuracy: 100,
        defectRate: 0,
      });

      expect(res.compositeScore).toBe(100.0);
      expect(res.grade).toBe('Unrated');
    });

    it('assigns Grade A for excellent performance (score >= 90)', () => {
      const res = calculateCompositeSupplierScore({
        hasHistory: true,
        punctualityRate: 95.0,
        fulfillmentAccuracy: 98.0,
        defectRate: 0.5,
        qualityRating: 5, // 100%
      });

      // (95 * 0.4) + (98 * 0.3) + (100 * 0.2) + 10 = 38 + 29.4 + 20 + 10 = 97.4
      expect(res.compositeScore).toBe(97.4);
      expect(res.grade).toBe('A');
    });

    it('assigns Grade B for good performance (80-89.9)', () => {
      const res = calculateCompositeSupplierScore({
        hasHistory: true,
        punctualityRate: 80.0,
        fulfillmentAccuracy: 85.0,
        defectRate: 2.0,
        qualityRating: 4, // 80%
      });

      // (80 * 0.4) + (85 * 0.3) + (80 * 0.2) + 10 = 32 + 25.5 + 16 + 10 = 83.5
      expect(res.compositeScore).toBe(83.5);
      expect(res.grade).toBe('B');
    });

    it('assigns Grade C for acceptable performance (70-79.9)', () => {
      const res = calculateCompositeSupplierScore({
        hasHistory: true,
        punctualityRate: 70.0,
        fulfillmentAccuracy: 75.0,
        defectRate: 4.0,
        qualityRating: 3, // 60%
      });

      // (70 * 0.4) + (75 * 0.3) + (60 * 0.2) + 10 = 28 + 22.5 + 12 + 10 = 72.5
      expect(res.compositeScore).toBe(72.5);
      expect(res.grade).toBe('C');
    });

    it('assigns Needs Attention for substandard performance (< 70)', () => {
      const res = calculateCompositeSupplierScore({
        hasHistory: true,
        punctualityRate: 40.0,
        fulfillmentAccuracy: 50.0,
        defectRate: 15.0,
        qualityRating: 2, // 40%
      });

      // (40 * 0.4) + (50 * 0.3) + (40 * 0.2) + 10 = 16 + 15 + 8 + 10 = 49.0
      expect(res.compositeScore).toBe(49.0);
      expect(res.grade).toBe('Needs Attention');
    });
  });
});
