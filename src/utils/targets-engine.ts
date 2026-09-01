import { BusinessTarget, TargetProgress, TargetStatus, TargetsIntelligenceSummary } from '@/types/targets';
import { differenceInCalendarDays, parseISO, isPast } from 'date-fns';
import { formatCurrency } from './format';

export interface CommerceContext {
  currency?: string;
  now?: Date;
}

/**
 * Calculates live progress, pace analytics, projections, and intelligence narratives for a target
 */
export function calculateTargetProgress(
  target: BusinessTarget,
  currentValue: number,
  context: CommerceContext = {}
): TargetProgress {
  const now = context.now || new Date();
  const currency = context.currency || target.currency || 'GHS';

  const startDate = parseISO(target.start_date);
  const endDate = parseISO(target.end_date);

  const daysTotal = Math.max(1, differenceInCalendarDays(endDate, startDate) + 1);
  const daysElapsed = Math.max(1, Math.min(daysTotal, differenceInCalendarDays(now, startDate) + 1));
  const rawDaysRemaining = differenceInCalendarDays(endDate, now);
  const daysRemaining = Math.max(0, rawDaysRemaining);
  const isPeriodEnded = isPast(endDate) || rawDaysRemaining < 0;

  const targetValue = Math.max(1, target.target_value);
  const percentage = Math.round((currentValue / targetValue) * 100);
  const remainingValue = Math.max(0, targetValue - currentValue);

  const actualDailyPace = Math.round((currentValue / daysElapsed) * 10) / 10;
  const requiredDailyPace = daysRemaining > 0 ? Math.round((remainingValue / daysRemaining) * 10) / 10 : 0;

  const paceRatio = requiredDailyPace > 0 ? Math.round((actualDailyPace / requiredDailyPace) * 100) / 100 : 1;
  const projectedValue = Math.round(currentValue + actualDailyPace * daysRemaining);

  // Status Evaluation
  let status: TargetStatus = 'on_track';
  if (currentValue >= targetValue) {
    status = currentValue > targetValue ? 'exceeded' : 'achieved';
  } else if (isPeriodEnded) {
    status = 'expired';
  } else if (projectedValue < targetValue * 0.92 || (paceRatio < 0.85 && daysElapsed >= 3)) {
    status = 'at_risk';
  } else {
    status = 'on_track';
  }

  const statusLabel =
    status === 'on_track'
      ? 'On Track'
      : status === 'at_risk'
        ? 'At Risk'
        : status === 'achieved'
          ? 'Achieved'
          : status === 'exceeded'
            ? 'Exceeded'
            : 'Expired';

  // Format metric values (currency vs counts)
  const isMonetary = target.metric === 'revenue' || target.metric === 'preorder_revenue';
  const formatVal = (v: number) => (isMonetary ? formatCurrency(v, currency) : `${v.toLocaleString()}`);

  // Generate Intelligence Narrative
  let intelligenceNarrative = '';
  let projectionNote: string | undefined = undefined;

  if (status === 'exceeded') {
    intelligenceNarrative = `You've exceeded your ${target.name} target by ${formatVal(currentValue - targetValue)}!`;
  } else if (status === 'achieved') {
    intelligenceNarrative = `You've reached your ${target.name} target of ${formatVal(targetValue)}.`;
  } else if (status === 'expired') {
    intelligenceNarrative = `Target period has ended. You achieved ${percentage}% (${formatVal(currentValue)} of ${formatVal(targetValue)}).`;
  } else if (status === 'at_risk') {
    intelligenceNarrative = `You're ${percentage}% toward your ${target.name}. At your current daily pace of ${formatVal(actualDailyPace)}/day, you are below the ${formatVal(requiredDailyPace)}/day needed to reach your goal.`;
    projectionNote = `At your current pace, you're projected to finish around ${formatVal(projectedValue)}.`;
  } else {
    // On track
    if (daysRemaining <= 3 && daysRemaining > 0) {
      intelligenceNarrative = `${daysRemaining} ${daysRemaining === 1 ? 'day remains' : 'days remain'} with ${formatVal(remainingValue)} needed to reach your target.`;
    } else {
      intelligenceNarrative = `You're ${percentage}% toward your target with ${daysRemaining} days remaining. Current performance is on track.`;
    }
    projectionNote = `At your current pace, you're projected to reach ${formatVal(projectedValue)}.`;
  }

  // Generate Actionable Suggestion
  let recommendation: string | undefined = undefined;
  if (status === 'at_risk') {
    if (target.metric === 'revenue' || target.metric === 'orders') {
      recommendation = `Consider running a flash promotion or highlighting your top 3 bestsellers to close the ${formatVal(remainingValue)} gap.`;
    } else if (target.metric === 'new_customers' || target.metric === 'customers') {
      recommendation = `Share your storefront link across WhatsApp statuses and Instagram bio to accelerate new customer reach.`;
    } else if (target.metric === 'preorder_customers' || target.metric === 'preorder_revenue') {
      recommendation = `Send a closing reminder broadcast to interested buyers before the pre-order cutoff date.`;
    }
  }

  return {
    target,
    current_value: currentValue,
    target_value: targetValue,
    percentage,
    remaining_value: remainingValue,
    days_total: daysTotal,
    days_elapsed: daysElapsed,
    days_remaining: daysRemaining,
    actual_daily_pace: actualDailyPace,
    required_daily_pace: requiredDailyPace,
    pace_ratio: paceRatio,
    projected_value: projectedValue,
    status,
    status_label: statusLabel,
    intelligence_narrative: intelligenceNarrative,
    projection_note: projectionNote,
    recommendation,
  };
}

/**
 * Summarizes the overall business performance across all targets
 */
export function generateTargetsIntelligenceSummary(progressList: TargetProgress[]): TargetsIntelligenceSummary {
  if (progressList.length === 0) {
    return {
      headline: 'No Active Goals Set',
      narrative:
        'Set revenue, customer, or pre-order targets to enable automated pace tracking and intelligence forecasts.',
      total_active_targets: 0,
      on_track_count: 0,
      at_risk_count: 0,
      achieved_count: 0,
      recently_achieved_count: 0,
    };
  }

  const active = progressList.filter((p) => p.status !== 'expired');
  const onTrack = progressList.filter((p) => p.status === 'on_track');
  const atRisk = progressList.filter((p) => p.status === 'at_risk');
  const achieved = progressList.filter((p) => p.status === 'achieved' || p.status === 'exceeded');

  let headline = 'All Active Targets On Track';
  let narrative = `You are on pace across your active performance metrics.`;

  if (atRisk.length > 0) {
    const riskNames = atRisk.map((r) => r.target.name).join(', ');
    headline = `${atRisk.length} ${atRisk.length === 1 ? 'Target Requires Attention' : 'Targets Require Attention'}`;
    narrative = `${riskNames} ${atRisk.length === 1 ? 'is' : 'are'} currently tracking below required pace.`;
  } else if (achieved.length > 0 && onTrack.length === 0) {
    headline = 'All Targets Achieved';
    narrative = 'Outstanding performance! You have reached your active targets for this period.';
  } else if (achieved.length > 0) {
    headline = `${achieved.length} ${achieved.length === 1 ? 'Target Achieved' : 'Targets Achieved'}`;
    narrative = `You've achieved ${achieved.length} of your goals while remaining on track for other metrics.`;
  }

  return {
    headline,
    narrative,
    total_active_targets: active.length,
    on_track_count: onTrack.length,
    at_risk_count: atRisk.length,
    achieved_count: achieved.length,
    recently_achieved_count: achieved.length,
  };
}

/**
 * Sorts targets so the most critical and time-sensitive appear first
 */
export function sortTargetsByPriority(progressList: TargetProgress[]): TargetProgress[] {
  return [...progressList].sort((a, b) => {
    // 1. At risk comes first
    if (a.status === 'at_risk' && b.status !== 'at_risk') return -1;
    if (b.status === 'at_risk' && a.status !== 'at_risk') return 1;

    // 2. Deadline approaching (< 4 days remaining and not achieved)
    const aUrgent = a.days_remaining <= 3 && a.status !== 'achieved' && a.status !== 'exceeded' && a.days_remaining > 0;
    const bUrgent = b.days_remaining <= 3 && b.status !== 'achieved' && b.status !== 'exceeded' && b.days_remaining > 0;
    if (aUrgent && !bUrgent) return -1;
    if (bUrgent && !aUrgent) return 1;

    // 3. On track
    if (a.status === 'on_track' && b.status !== 'on_track') return -1;
    if (b.status === 'on_track' && a.status !== 'on_track') return 1;

    // 4. Achieved
    if ((a.status === 'achieved' || a.status === 'exceeded') && b.status === 'expired') return -1;
    if ((b.status === 'achieved' || b.status === 'exceeded') && a.status === 'expired') return 1;

    return 0;
  });
}
