import { FoodRecord, SmartAlert, CanteenSettings, WasteRecommendation } from '../types';

export function generateSmartAlerts(
  records: FoodRecord[],
  existingAlerts: SmartAlert[],
  settings: CanteenSettings
): SmartAlert[] {
  const existingMap = new Map<string, SmartAlert>();
  for (const a of existingAlerts) {
    existingMap.set(a.id, a);
  }

  // Calculate canteen average attendance for drop detection
  const validAttendance = records.filter((r) => r.studentAttendance > 0);
  const avgAttendance =
    validAttendance.length > 0
      ? validAttendance.reduce((acc, r) => acc + r.studentAttendance, 0) / validAttendance.length
      : 0;

  const now = new Date().getTime();
  const alerts: SmartAlert[] = [];

  for (const record of records) {
    const prepared = Number(record.quantityPreparedKg) || 0;
    const remaining = Number(record.quantityRemainingKg) || 0;
    const served = Number(record.quantityServedKg) || 0;
    const surplusPercent = prepared > 0 ? (remaining / prepared) * 100 : 0;

    // 1. Surplus Severity Alerts
    if (remaining > 1.0) {
      if (surplusPercent >= settings.surplusHighThreshold) {
        const id = `alert-${record.id}-surplus_high`;
        const existing = existingMap.get(id);
        alerts.push(
          existing || {
            id,
            recordId: record.id,
            foodName: record.foodName,
            category: record.category,
            type: 'surplus_high',
            severity: 'high',
            quantityInvolvedKg: remaining,
            surplusPercentage: Math.round(surplusPercent * 10) / 10,
            detectionTime: record.preparationDateTime,
            explanation: `Critical surplus detected: ${remaining.toFixed(1)} kg remaining out of ${prepared.toFixed(1)} kg prepared (${surplusPercent.toFixed(1)}%). Exceeds high threshold of ${settings.surplusHighThreshold}%.`,
            suggestedAction: 'Immediately initiate Food Redistribution workflow or safely chill for same-day evening hostel dinner service.',
            status: 'active',
          }
        );
      } else if (surplusPercent >= settings.surplusMediumThreshold) {
        const id = `alert-${record.id}-surplus_medium`;
        const existing = existingMap.get(id);
        alerts.push(
          existing || {
            id,
            recordId: record.id,
            foodName: record.foodName,
            category: record.category,
            type: 'surplus_medium',
            severity: 'medium',
            quantityInvolvedKg: remaining,
            surplusPercentage: Math.round(surplusPercent * 10) / 10,
            detectionTime: record.preparationDateTime,
            explanation: `Moderate surplus: ${remaining.toFixed(1)} kg remaining (${surplusPercent.toFixed(1)}%). Exceeds medium threshold of ${settings.surplusMediumThreshold}%.`,
            suggestedAction: 'Assess condition for campus snack counter reuse or coordinate with NGO partner.',
            status: 'active',
          }
        );
      } else if (surplusPercent >= settings.surplusLowThreshold) {
        const id = `alert-${record.id}-surplus_low`;
        const existing = existingMap.get(id);
        alerts.push(
          existing || {
            id,
            recordId: record.id,
            foodName: record.foodName,
            category: record.category,
            type: 'surplus_low',
            severity: 'low',
            quantityInvolvedKg: remaining,
            surplusPercentage: Math.round(surplusPercent * 10) / 10,
            detectionTime: record.preparationDateTime,
            explanation: `Low surplus: ${remaining.toFixed(1)} kg remaining (${surplusPercent.toFixed(1)}%). Within normal variance but should be tracked.`,
            suggestedAction: 'Log in inventory ledger and monitor hot-holding temperatures.',
            status: 'active',
          }
        );
      }
    }

    // 2. Unusually high leftover quantity (>35% leftover)
    if (prepared > 10 && surplusPercent > 35) {
      const id = `alert-${record.id}-high_leftover`;
      const existing = existingMap.get(id);
      alerts.push(
        existing || {
          id,
          recordId: record.id,
          foodName: record.foodName,
          category: record.category,
          type: 'high_leftover',
          severity: 'high',
          quantityInvolvedKg: remaining,
          surplusPercentage: Math.round(surplusPercent * 10) / 10,
          detectionTime: record.preparationDateTime,
          explanation: `Unusually high leftover: Over 35% of cooked food remained unconsumed (${remaining.toFixed(1)} kg of ${prepared.toFixed(1)} kg).`,
          suggestedAction: 'Audit recipe acceptance and verify whether portion size or unexpected event dampened meal attendance.',
          status: 'active',
        }
      );
    }

    // 3. Unexpectedly low attendance warning
    if (avgAttendance > 50 && record.studentAttendance > 0 && record.studentAttendance < avgAttendance * 0.7) {
      const id = `alert-${record.id}-attendance_drop`;
      const existing = existingMap.get(id);
      alerts.push(
        existing || {
          id,
          recordId: record.id,
          foodName: record.foodName,
          category: record.category,
          type: 'attendance_drop',
          severity: 'medium',
          quantityInvolvedKg: remaining,
          detectionTime: record.preparationDateTime,
          explanation: `Student attendance was ${record.studentAttendance}, which is ${Math.round((1 - record.studentAttendance / avgAttendance) * 100)}% below historical average (${Math.round(avgAttendance)}).`,
          suggestedAction: 'Check academic calendar for exams, sports meets, or holidays before cooking subsequent meals.',
          status: 'active',
        }
      );
    }

    // 4. Data inconsistency: Mass balance mismatch
    const balanceDiscrepancy = Math.abs(prepared - (served + remaining));
    if (prepared > 0 && balanceDiscrepancy > 0.1) {
      const id = `alert-${record.id}-mass_balance_mismatch`;
      const existing = existingMap.get(id);
      alerts.push(
        existing || {
          id,
          recordId: record.id,
          foodName: record.foodName,
          category: record.category,
          type: 'mass_balance_mismatch',
          severity: 'medium',
          quantityInvolvedKg: Math.round(balanceDiscrepancy * 10) / 10,
          detectionTime: record.preparationDateTime,
          explanation: `Mass balance discrepancy of ${balanceDiscrepancy.toFixed(1)} kg detected between prepared (${prepared} kg) and served (${served} kg) + remaining (${remaining} kg).`,
          suggestedAction: 'Verify weighing station calibration and re-enter accurate scale measurements.',
          status: 'active',
        }
      );
    }

    // 5. Missing use-by date
    if (!record.useByDateTime) {
      const id = `alert-${record.id}-missing_use_by`;
      const existing = existingMap.get(id);
      alerts.push(
        existing || {
          id,
          recordId: record.id,
          foodName: record.foodName,
          category: record.category,
          type: 'missing_use_by',
          severity: 'low',
          quantityInvolvedKg: remaining,
          detectionTime: record.preparationDateTime,
          explanation: `Record has no documented use-by datetime. Perishable cooked canteen items must have strict holding duration logged.`,
          suggestedAction: 'Edit record to assign safe use-by window based on HACCP food safety standards.',
          status: 'active',
        }
      );
    }

    // 6. Near-expiry or past-deadline review
    if (record.useByDateTime && (record.status === 'Surplus Active' || record.status === 'Under Review')) {
      const useByTime = new Date(record.useByDateTime).getTime();
      const hoursRemaining = (useByTime - now) / (1000 * 60 * 60);

      if (hoursRemaining <= 0) {
        const id = `alert-${record.id}-near_expiry_expired`;
        const existing = existingMap.get(id);
        alerts.push(
          existing || {
            id,
            recordId: record.id,
            foodName: record.foodName,
            category: record.category,
            type: 'near_expiry',
            severity: 'critical',
            quantityInvolvedKg: remaining,
            detectionTime: new Date().toISOString(),
            explanation: `Holding deadline has elapsed (${Math.abs(Math.round(hoursRemaining))} hours ago). Food must NOT be served without supervisory inspection.`,
            suggestedAction: 'Conduct physical sensory & temperature audit. If past safe consumption window, record as safely discarded or composted.',
            status: 'active',
          }
        );
      } else if (hoursRemaining <= 3) {
        const id = `alert-${record.id}-near_expiry_imminent`;
        const existing = existingMap.get(id);
        alerts.push(
          existing || {
            id,
            recordId: record.id,
            foodName: record.foodName,
            category: record.category,
            type: 'near_expiry',
            severity: 'high',
            quantityInvolvedKg: remaining,
            detectionTime: new Date().toISOString(),
            explanation: `Imminent deadline: Only ${Math.round(hoursRemaining * 10) / 10} hours left until recorded use-by deadline.`,
            suggestedAction: 'Expedite redistribution dispatch immediately or confirm rapid chilling/freezing.',
            status: 'active',
          }
        );
      }
    }
  }

  return alerts;
}

export function generateWasteRecommendations(
  records: FoodRecord[],
  settings: CanteenSettings
): WasteRecommendation[] {
  const recommendations: WasteRecommendation[] = [];

  // 1. Group records by foodName to find chronic waste items
  const itemMap = new Map<
    string,
    { category: string; discarded: number; prepared: number; timesWasted: number; totalSessions: number }
  >();

  for (const r of records) {
    const existing = itemMap.get(r.foodName) || {
      category: r.category,
      discarded: 0,
      prepared: 0,
      timesWasted: 0,
      totalSessions: 0,
    };
    existing.discarded += r.quantityDiscardedKg;
    existing.prepared += r.quantityPreparedKg;
    if (r.quantityDiscardedKg > 1.5) {
      existing.timesWasted++;
    }
    existing.totalSessions++;
    itemMap.set(r.foodName, existing);
  }

  // Find worst offender items
  itemMap.forEach((stats, foodName) => {
    const wastePercent = stats.prepared > 0 ? (stats.discarded / stats.prepared) * 100 : 0;
    if (stats.timesWasted >= 2 && wastePercent > 18) {
      const potentialSavings = Math.round(stats.discarded * 0.65 * 10) / 10;
      recommendations.push({
        id: `rec-chronic-${foodName.replace(/\s+/g, '-').toLowerCase()}`,
        title: `Reduce Batch Size for ${foodName}`,
        severity: 'high_impact',
        triggerRule: 'Repeated Excessive Discard: Item experienced >18% waste across multiple preparation sessions.',
        triggerData: `${foodName} discarded a total of ${stats.discarded.toFixed(1)} kg (${wastePercent.toFixed(1)}% waste rate across ${stats.totalSessions} sessions).`,
        recommendedAction: `Curtail initial batch size by 15-20% and implement on-demand second batch cooking if cafeteria rush demands it.`,
        potentialSavingsKg: potentialSavings,
        category: stats.category as any,
      });
    }
  });

  // 2. Day-of-week analysis: Check if specific days have elevated waste
  const dayStats = new Map<string, { discarded: number; prepared: number; count: number }>();
  for (const r of records) {
    const day = new Date(r.preparationDateTime).toLocaleDateString('en-US', { weekday: 'long' });
    const existing = dayStats.get(day) || { discarded: 0, prepared: 0, count: 0 };
    existing.discarded += r.quantityDiscardedKg;
    existing.prepared += r.quantityPreparedKg;
    existing.count++;
    dayStats.set(day, existing);
  }

  dayStats.forEach((stats, dayName) => {
    const dayWasteRate = stats.prepared > 0 ? (stats.discarded / stats.prepared) * 100 : 0;
    if (stats.count >= 3 && dayWasteRate > 22) {
      recommendations.push({
        id: `rec-day-${dayName.toLowerCase()}`,
        title: `Calibrate Friday/Weekend Cooking Volumes (${dayName})`,
        severity: 'warning',
        triggerRule: `Day-of-Week Volatility: ${dayName} sessions exhibit an elevated average waste rate of ${dayWasteRate.toFixed(1)}%.`,
        triggerData: `On ${dayName}s, ${stats.discarded.toFixed(1)} kg discarded out of ${stats.prepared.toFixed(1)} kg cooked. Often correlates with student travel or off-campus dining.`,
        recommendedAction: `Apply a -18% attendance dampening coefficient in AI Demand Predictor for ${dayName} meal preparation.`,
        potentialSavingsKg: Math.round(stats.discarded * 0.5 * 10) / 10,
        category: 'General',
      });
    }
  });

  // 3. Category level recommendations
  const categoryMap = new Map<string, { discarded: number; prepared: number }>();
  for (const r of records) {
    const existing = categoryMap.get(r.category) || { discarded: 0, prepared: 0 };
    existing.discarded += r.quantityDiscardedKg;
    existing.prepared += r.quantityPreparedKg;
    categoryMap.set(r.category, existing);
  }

  categoryMap.forEach((stats, cat) => {
    const rate = stats.prepared > 0 ? (stats.discarded / stats.prepared) * 100 : 0;
    if (stats.discarded > 15 && rate > 20) {
      recommendations.push({
        id: `rec-category-${cat.replace(/\s+/g, '-').toLowerCase()}`,
        title: `Optimize ${cat} Portion Control`,
        severity: 'warning',
        triggerRule: `Category Spillover: ${cat} represents ${stats.discarded.toFixed(1)} kg total discard (${rate.toFixed(1)}% waste rate).`,
        triggerData: `Category cumulative preparation was ${stats.prepared.toFixed(1)} kg.`,
        recommendedAction: `Transition from pre-plated large ladles to standard self-service portion scoops or dual-size plate options.`,
        potentialSavingsKg: Math.round(stats.discarded * 0.4 * 10) / 10,
        category: cat as any,
      });
    }
  });

  // 4. Redistribution Opportunity Recommendation
  const totalDiscarded = records.reduce((a, b) => a + b.quantityDiscardedKg, 0);
  const totalRedist = records.reduce((a, b) => a + b.quantityRedistributedKg, 0);
  if (totalDiscarded > totalRedist && totalDiscarded > 20) {
    recommendations.push({
      id: 'rec-redist-channel',
      title: 'Expand Evening Redistribution Windows',
      severity: 'high_impact',
      triggerRule: 'Unrescued Surplus: Discarded volume exceeds redistributed food quantity.',
      triggerData: `Total discarded: ${totalDiscarded.toFixed(1)} kg vs redistributed: ${totalRedist.toFixed(1)} kg.`,
      recommendedAction: `Partner with additional campus night study canteens or local shelter logistics to pick up unconsumed food before 20:00.`,
      potentialSavingsKg: Math.round((totalDiscarded - totalRedist) * 0.7 * 10) / 10,
      category: 'General',
    });
  }

  // 5. General Best Practice
  recommendations.push({
    id: 'rec-staggered-cooking',
    title: 'Adopt Staggered Two-Tier Batch Cooking',
    severity: 'info',
    triggerRule: 'Continuous Production Best Practice for Higher Education Dining Halls.',
    triggerData: 'Standard practice reduces buffer over-preparation by up to 28% without cafeteria shortages.',
    recommendedAction: 'Cook 65% of forecasted volume by 11:30 AM; trigger the remaining 35% at 12:45 PM based on real gate attendance.',
    potentialSavingsKg: Math.round(records.reduce((a, b) => a + b.quantityPreparedKg, 0) * 0.08 * 10) / 10,
    category: 'General',
  });

  return recommendations;
}
