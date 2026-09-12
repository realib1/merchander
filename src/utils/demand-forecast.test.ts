
import {
  calculateDailyVelocity,
  calculateRunOutDate,
  calculateDynamicReorderPoint,
  calculateSuggestedReorderQty,
  classifyStockHealth,
} from './demand-forecast';

describe('Demand Forecasting & Stock Math (Pure Utilities)', () => {
  describe('calculateDailyVelocity', () => {
    it('returns 0 for empty sales records', () => {
      expect(calculateDailyVelocity([])).toBe(0);
      expect(calculateDailyVelocity([], 30)).toBe(0);
    });

    it('calculates average daily velocity across days window', () => {
      const sales = [
        { quantity: 15, orderStatus: 'paid' },
        { quantity: 15, orderStatus: 'delivered' },
      ];
      // 30 units over 30 days = 1.0 unit/day
      expect(calculateDailyVelocity(sales, 30)).toBe(1);
    });

    it('filters out draft and cancelled orders', () => {
      const sales = [
        { quantity: 20, orderStatus: 'paid' },
        { quantity: 50, orderStatus: 'cancelled' },
        { quantity: 30, orderStatus: 'draft' },
        { quantity: 10, orderStatus: 'dispatched' },
      ];
      // only 30 units count over 10 days = 3.0 units/day
      expect(calculateDailyVelocity(sales, 10)).toBe(3);
    });

    it('safely handles non-positive days window', () => {
      const sales = [{ quantity: 10, orderStatus: 'paid' }];
      expect(calculateDailyVelocity(sales, 0)).toBe(10);
      expect(calculateDailyVelocity(sales, -5)).toBe(10);
    });
  });

  describe('calculateRunOutDate', () => {
    it('returns Infinity and null date if daily velocity is 0', () => {
      const res = calculateRunOutDate(50, 0);
      expect(res.daysOfStockRemaining).toBe(Infinity);
      expect(res.projectedRunOutDate).toBeNull();
    });

    it('returns 0 days and current date if stock is 0 or negative', () => {
      const baseDate = new Date('2026-09-10T12:00:00.000Z');
      const resZero = calculateRunOutDate(0, 5, baseDate);
      expect(resZero.daysOfStockRemaining).toBe(0);
      expect(resZero.projectedRunOutDate).toBe(baseDate.toISOString());

      const resNegative = calculateRunOutDate(-4, 5, baseDate);
      expect(resNegative.daysOfStockRemaining).toBe(0);
    });

    it('calculates correct days and forward ISO date for active inventory', () => {
      const baseDate = new Date('2026-09-01T00:00:00.000Z');
      // 20 items / 2 items per day = 10 days
      const res = calculateRunOutDate(20, 2, baseDate);
      expect(res.daysOfStockRemaining).toBe(10);
      expect(res.projectedRunOutDate).toBe('2026-09-11T00:00:00.000Z');
    });
  });

  describe('calculateDynamicReorderPoint', () => {
    it('returns 0 if daily velocity is 0 or negative', () => {
      expect(calculateDynamicReorderPoint(0, 14)).toBe(0);
      expect(calculateDynamicReorderPoint(-1, 14)).toBe(0);
    });

    it('computes reorder point factoring in lead time and buffer', () => {
      // 2 units/day * (14 days lead + 5 days buffer) = 38
      expect(calculateDynamicReorderPoint(2, 14, 5)).toBe(38);
    });

    it('defaults safetyBuffer to 5 days', () => {
      // 1 unit/day * (10 days lead + 5 days default buffer) = 15
      expect(calculateDynamicReorderPoint(1, 10)).toBe(15);
    });
  });

  describe('calculateSuggestedReorderQty', () => {
    it('returns defaultPackQty if velocity is 0 and stock is 0', () => {
      expect(calculateSuggestedReorderQty(0, 10, 30, 0, 25)).toBe(25);
    });

    it('returns 0 if velocity is 0 but stock exists', () => {
      expect(calculateSuggestedReorderQty(10, 10, 30, 0, 25)).toBe(0);
    });

    it('suggests quantity to restore target days of cover', () => {
      // 2 units/day * 30 days cover = 60 target inventory.
      // Current stock = 15. Shortfall = 45.
      // defaultPack = 20. Suggested = 45.
      expect(calculateSuggestedReorderQty(15, 30, 30, 2, 20)).toBe(45);
    });

    it('enforces defaultPackQty when shortfall is small', () => {
      // 1 unit/day * 30 days = 30 target. Current stock = 25. Shortfall = 5.
      // defaultPack = 20 -> should return 20.
      expect(calculateSuggestedReorderQty(25, 10, 30, 1, 20)).toBe(20);
    });

    it('returns 0 if current stock already exceeds target cover', () => {
      // 1 unit/day * 30 days = 30 target. Current stock = 50.
      expect(calculateSuggestedReorderQty(50, 10, 30, 1, 20)).toBe(0);
    });
  });

  describe('classifyStockHealth', () => {
    it('returns critical if stock is 0 or negative', () => {
      expect(classifyStockHealth(0, 10, 14, 2)).toBe('critical');
      expect(classifyStockHealth(-2, 10, 14, 2)).toBe('critical');
    });

    it('returns no_sales if daily velocity is 0', () => {
      expect(classifyStockHealth(15, 10, 14, 0)).toBe('no_sales');
    });

    it('returns critical if days remaining is less than or equal to lead time', () => {
      // 10 units / 2 per day = 5 days remaining. Lead time is 7 days.
      expect(classifyStockHealth(10, 20, 7, 2)).toBe('critical');
    });

    it('returns warning if stock is below reorder point but above lead time', () => {
      // 25 units / 2 per day = 12.5 days remaining. Lead time is 7 days.
      // Reorder point is 30.
      expect(classifyStockHealth(25, 30, 7, 2)).toBe('warning');
    });

    it('returns overstocked if inventory cover exceeds 90 days', () => {
      // 200 units / 1 per day = 200 days cover.
      expect(classifyStockHealth(200, 20, 14, 1)).toBe('overstocked');
    });

    it('returns healthy for balanced inventory', () => {
      // 50 units / 1 per day = 50 days cover. Reorder point = 20. Lead time = 14.
      expect(classifyStockHealth(50, 20, 14, 1)).toBe('healthy');
    });
  });
});
