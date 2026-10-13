import { FoodRecord, PredictionInput, PredictionResult, CanteenSettings } from '../types';

export function runDemandPrediction(
  input: PredictionInput,
  historicalRecords: FoodRecord[],
  settings: CanteenSettings
): PredictionResult {
  const reasoningSteps: string[] = [];

  // Step 1: Filter historical records matching same foodName (case-insensitive) or category
  const exactFoodRecords = historicalRecords.filter(
    (r) => r.foodName.toLowerCase().trim() === input.foodName.toLowerCase().trim()
  );

  const categoryRecords = historicalRecords.filter((r) => r.category === input.category);

  const matchedRecords = exactFoodRecords.length > 0 ? exactFoodRecords : categoryRecords;
  const recordsCount = matchedRecords.length;

  let confidence: 'High' | 'Medium' | 'Baseline Fallback' = 'Baseline Fallback';
  let averageKgPerServing = settings.kgPerServingDefault || 0.35;
  let estimatedDemandServings = 0;
  let estimatedDemandKg = 0;

  if (exactFoodRecords.length >= 5) {
    confidence = 'High';
    reasoningSteps.push(
      `High confidence: Found ${exactFoodRecords.length} historical preparation cycles specifically for "${input.foodName}".`
    );
  } else if (exactFoodRecords.length > 0) {
    confidence = 'Medium';
    reasoningSteps.push(
      `Medium confidence: Found ${exactFoodRecords.length} historical preparation cycles for "${input.foodName}".`
    );
  } else if (categoryRecords.length > 0) {
    confidence = 'Medium';
    reasoningSteps.push(
      `Category baseline: No exact prior records for "${input.foodName}", relying on ${categoryRecords.length} records in category "${input.category}".`
    );
  } else {
    confidence = 'Baseline Fallback';
    reasoningSteps.push(
      `No historical records found for item or category. Using system default portion baseline of ${settings.kgPerServingDefault} kg/serving.`
    );
  }

  // Calculate empirical average portion size (kg per serving) from historical data
  if (matchedRecords.length > 0) {
    const validPortionPairs = matchedRecords.filter(
      (r) => r.quantityServedKg > 0 && r.actualServingsServed > 0
    );
    if (validPortionPairs.length > 0) {
      const sumPortion = validPortionPairs.reduce(
        (acc, r) => acc + r.quantityServedKg / r.actualServingsServed,
        0
      );
      averageKgPerServing = Math.round((sumPortion / validPortionPairs.length) * 1000) / 1000;
      reasoningSteps.push(
        `Empirical portion size: Historical data indicates students consume an average of ${averageKgPerServing} kg per serving for this item.`
      );
    }
  }

  // Step 2: Demand baseline calculation
  if (matchedRecords.length > 0) {
    // Check for day-of-week affinity
    const dayMatches = matchedRecords.filter((r) => {
      const d = new Date(r.preparationDateTime);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      return dayName.toLowerCase() === input.dayOfWeek.toLowerCase();
    });

    const targetPool = dayMatches.length >= 2 ? dayMatches : matchedRecords;
    if (dayMatches.length >= 2) {
      reasoningSteps.push(
        `Day-of-week affinity applied: Filtered ${dayMatches.length} historical cycles for ${input.dayOfWeek}.`
      );
    }

    // Historical attendance to demand ratio
    const ratios: number[] = [];
    for (const r of targetPool) {
      if (r.studentAttendance > 0 && r.actualServingsServed > 0) {
        ratios.push(r.actualServingsServed / r.studentAttendance);
      }
    }

    if (ratios.length > 0 && input.studentAttendance > 0) {
      const avgTakeUpRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      estimatedDemandServings = Math.round(input.studentAttendance * avgTakeUpRatio);
      reasoningSteps.push(
        `Attendance correlation: Historical student uptake rate is ${(avgTakeUpRatio * 100).toFixed(1)}% of total attendance (${input.studentAttendance} expected students -> ${estimatedDemandServings} servings).`
      );
    } else {
      // Direct average of actual servings served or expected servings
      const totalServed = targetPool.reduce((acc, r) => acc + (r.actualServingsServed || r.expectedDemandServings), 0);
      estimatedDemandServings = Math.round(totalServed / targetPool.length);
      reasoningSteps.push(
        `Historical mean: Calculated average historical consumption of ${estimatedDemandServings} servings across comparable sessions.`
      );
    }
  } else {
    // Pure fallback
    estimatedDemandServings = input.expectedServings > 0 ? input.expectedServings : Math.round(input.studentAttendance * 0.45);
    reasoningSteps.push(
      `Algorithmic fallback: Estimated ${estimatedDemandServings} servings based on expected turnout.`
    );
  }

  // Convert estimated demand to kg
  estimatedDemandKg = Math.round(estimatedDemandServings * averageKgPerServing * 10) / 10;
  reasoningSteps.push(
    `Mass requirement: ${estimatedDemandServings} servings x ${averageKgPerServing} kg/serving = ${estimatedDemandKg} kg required food.`
  );

  // Step 3: Compare with test preparation quantity
  const testPrepKg = input.testQuantityPreparedKg;
  const potentialSurplusKg = Math.round(Math.max(0, testPrepKg - estimatedDemandKg) * 10) / 10;
  const surplusPercentage = testPrepKg > 0 ? Math.round((potentialSurplusKg / testPrepKg) * 1000) / 10 : 0;

  // Step 4: Classify severity
  let surplusSeverity: 'Low' | 'Medium' | 'High' = 'Low';
  if (surplusPercentage >= settings.surplusHighThreshold) {
    surplusSeverity = 'High';
  } else if (surplusPercentage >= settings.surplusMediumThreshold) {
    surplusSeverity = 'Medium';
  } else {
    surplusSeverity = 'Low';
  }

  // Step 5: Recommended Action
  let recommendedAction = '';
  // Recommended prep includes a safe 5% buffer to avoid stockouts
  const recommendedPrepKg = Math.round(estimatedDemandKg * 1.05 * 10) / 10;

  if (potentialSurplusKg > 0 && surplusSeverity === 'High') {
    const diff = Math.round((testPrepKg - recommendedPrepKg) * 10) / 10;
    recommendedAction = `High surplus risk (${surplusPercentage}%). Reduce planned batch from ${testPrepKg} kg down to ${recommendedPrepKg} kg (a reduction of ${diff} kg) to prevent excessive food waste.`;
  } else if (potentialSurplusKg > 0 && surplusSeverity === 'Medium') {
    recommendedAction = `Moderate surplus forecast (${surplusPercentage}%). Consider staggering preparation in 2 batches or capping total cooking to ${recommendedPrepKg} kg.`;
  } else if (testPrepKg < estimatedDemandKg) {
    const deficit = Math.round((estimatedDemandKg - testPrepKg) * 10) / 10;
    recommendedAction = `Demand deficit detected! Planned batch of ${testPrepKg} kg may be insufficient for ${estimatedDemandKg} kg estimated demand (deficit of ~${deficit} kg / ${Math.round(deficit / averageKgPerServing)} servings).`;
  } else {
    recommendedAction = `Optimal batch balance. Planned ${testPrepKg} kg matches demand within safe tolerance (surplus ~${potentialSurplusKg} kg, ${surplusPercentage}%).`;
  }

  return {
    estimatedDemandServings,
    estimatedDemandKg,
    testQuantityPreparedKg: testPrepKg,
    potentialSurplusKg,
    surplusPercentage,
    surplusSeverity,
    confidence,
    historicalRecordsCount: recordsCount,
    averageHistoricalServingKg: averageKgPerServing,
    reasoningSteps,
    recommendedAction,
    recommendedPrepKg,
  };
}

export interface ScenarioComparisonPoint {
  prepKg: number;
  estimatedDemandKg: number;
  surplusKg: number;
  surplusPercent: number;
  severity: 'Low' | 'Medium' | 'High';
  mealsWasted: number;
  costImpact: number;
}

export function comparePreparationScenarios(
  basePrepKg: number,
  estimatedDemandKg: number,
  settings: CanteenSettings
): ScenarioComparisonPoint[] {
  const deltas = [-30, -15, 0, +15, +30]; // percentage differences
  const scenarios: ScenarioComparisonPoint[] = [];

  for (const delta of deltas) {
    const prep = Math.round(Math.max(2, basePrepKg * (1 + delta / 100)) * 10) / 10;
    const surplusKg = Math.round(Math.max(0, prep - estimatedDemandKg) * 10) / 10;
    const surplusPercent = prep > 0 ? Math.round((surplusKg / prep) * 1000) / 10 : 0;

    let severity: 'Low' | 'Medium' | 'High' = 'Low';
    if (surplusPercent >= settings.surplusHighThreshold) severity = 'High';
    else if (surplusPercent >= settings.surplusMediumThreshold) severity = 'Medium';

    const mealsWasted = Math.round(surplusKg / (settings.kgPerServingDefault || 0.35));
    const costImpact = Math.round(surplusKg * (settings.costPerKgDefault || 2.5) * 100) / 100;

    scenarios.push({
      prepKg: prep,
      estimatedDemandKg,
      surplusKg,
      surplusPercent,
      severity,
      mealsWasted,
      costImpact,
    });
  }

  return scenarios;
}
