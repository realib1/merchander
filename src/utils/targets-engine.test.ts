import { describe, it, expect } from 'vitest';
import { calculateTargetProgress, generateTargetsIntelligenceSummary, sortTargetsByPriority } from './targets-engine';
import { BusinessTarget } from '@/types/targets';
import { addDays, subDays } from 'date-fns';

describe('Merchander Intelligence Targets Engine', () => {
  const baseTarget: BusinessTarget = {
    id: 'target-1',
    tenant_id: 'tenant-1',
    name: 'September Revenue',
    metric: 'revenue',
    target_value: 50000,
    start_date: subDays(new Date(), 15).toISOString(),
    end_date: addDays(new Date(), 15).toISOString(),
    period: 'monthly',
    currency: 'GHS',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('calculates progress percentage, remaining value and pace accurately', () => {
    const progress = calculateTargetProgress(baseTarget, 32450);

    expect(progress.percentage).toBe(65);
    expect(progress.remaining_value).toBe(17550);
    expect(progress.days_remaining).toBeGreaterThanOrEqual(14);
    expect(progress.status).toBe('on_track');
    expect(progress.intelligence_narrative).toContain('65% toward your target');
  });

  it('detects at_risk status when pace is insufficient to meet target', () => {
    // 10,000 achieved after 20 days with only 5 days remaining for 50,000
    const riskTarget: BusinessTarget = {
      ...baseTarget,
      start_date: subDays(new Date(), 20).toISOString(),
      end_date: addDays(new Date(), 5).toISOString(),
    };

    const progress = calculateTargetProgress(riskTarget, 10000);
    expect(progress.status).toBe('at_risk');
    expect(progress.status_label).toBe('At Risk');
    expect(progress.intelligence_narrative).toContain('below');
    expect(progress.projection_note).toBeDefined();
    expect(progress.recommendation).toBeDefined();
  });

  it('detects achieved and exceeded targets', () => {
    const achieved = calculateTargetProgress(baseTarget, 50000);
    expect(achieved.status).toBe('achieved');
    expect(achieved.percentage).toBe(100);
    expect(achieved.intelligence_narrative).toContain('reached your September Revenue target');

    const exceeded = calculateTargetProgress(baseTarget, 54000);
    expect(exceeded.status).toBe('exceeded');
    expect(exceeded.percentage).toBe(108);
    expect(exceeded.intelligence_narrative).toContain('exceeded');
  });

  it('calculates pre-order batch customer targets', () => {
    const preorderTarget: BusinessTarget = {
      id: 'target-preorder',
      tenant_id: 'tenant-1',
      name: 'Batch A Customers',
      metric: 'preorder_customers',
      target_value: 50,
      start_date: subDays(new Date(), 10).toISOString(),
      end_date: addDays(new Date(), 3).toISOString(),
      period: 'custom',
      batch_id: 'batch-a',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const progress = calculateTargetProgress(preorderTarget, 37);
    expect(progress.percentage).toBe(74);
    expect(progress.remaining_value).toBe(13);
  });

  it('generates an accurate executive intelligence summary', () => {
    const onTrackProg = calculateTargetProgress(baseTarget, 32450);
    const summary = generateTargetsIntelligenceSummary([onTrackProg]);

    expect(summary.total_active_targets).toBe(1);
    expect(summary.on_track_count).toBe(1);
    expect(summary.at_risk_count).toBe(0);
    expect(summary.headline).toBe('All Active Targets On Track');
  });

  it('sorts targets by priority with at_risk and deadline approaching first', () => {
    const onTrack = calculateTargetProgress(baseTarget, 32450);
    const atRisk = calculateTargetProgress(
      {
        ...baseTarget,
        id: 'target-risk',
        name: 'New Customers',
        start_date: subDays(new Date(), 20).toISOString(),
        end_date: addDays(new Date(), 2).toISOString(),
      },
      5000
    );

    const sorted = sortTargetsByPriority([onTrack, atRisk]);
    expect(sorted[0].target.id).toBe('target-risk');
  });
});
