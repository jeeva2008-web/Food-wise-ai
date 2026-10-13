import { FoodRecord, CanteenSettings } from '../types';

export interface DashboardMetrics {
  totalPreparedKg: number;
  totalServedKg: number;
  currentSurplusKg: number;
  totalSavedKg: number;
  totalRedistributedKg: number;
  totalReusedKg: number;
  totalDiscardedKg: number;
  foodWastePercentage: number;
  wasteReductionPercentage: number;
  estimatedMealsSaved: number;
  totalRecordsCount: number;
  activeSurplusAlertsCount: number;
  recordsRequiringReviewCount: number;
  co2SavedKg: number;
  waterSavedLiters: number;
  costSaved: number;
}

export function calculateDashboardMetrics(
  records: FoodRecord[],
  activeAlertsCount: number,
  settings: CanteenSettings
): DashboardMetrics {
  let totalPreparedKg = 0;
  let totalServedKg = 0;
  let currentSurplusKg = 0;
  let totalRedistributedKg = 0;
  let totalReusedKg = 0;
  let totalDiscardedKg = 0;
  let recordsRequiringReviewCount = 0;

  for (const r of records) {
    totalPreparedKg += Number(r.quantityPreparedKg) || 0;
    totalServedKg += Number(r.quantityServedKg) || 0;

    const remaining = Number(r.quantityRemainingKg) || 0;
    const reused = Number(r.quantityReusedKg) || 0;
    const redist = Number(r.quantityRedistributedKg) || 0;
    const discarded = Number(r.quantityDiscardedKg) || 0;

    totalRedistributedKg += redist;
    totalReusedKg += reused;
    totalDiscardedKg += discarded;

    // Current unassigned surplus remaining in facility
    const unallocatedRemaining = Math.max(0, remaining - (reused + redist + discarded));
    currentSurplusKg += unallocatedRemaining;

    if (r.status === 'Under Review' || r.status === 'Surplus Active') {
      recordsRequiringReviewCount++;
    }
  }

  // Total quantity saved from being thrown in the garbage
  const totalSavedKg = totalRedistributedKg + totalReusedKg;

  // Waste percentage: what fraction of prepared food was discarded as waste
  const foodWastePercentage =
    totalPreparedKg > 0 ? (totalDiscardedKg / totalPreparedKg) * 100 : 0;

  // Waste reduction percentage: proportion of total surplus that was rescued (reused/redistributed) instead of discarded
  const totalSurplusHandled = totalSavedKg + totalDiscardedKg;
  const wasteReductionPercentage =
    totalSurplusHandled > 0 ? (totalSavedKg / totalSurplusHandled) * 100 : 0;

  // Estimated meals saved (strictly converting saved kg via standard kg/serving)
  const kgPerMeal = settings.kgPerServingDefault || 0.35;
  const estimatedMealsSaved = Math.round(totalSavedKg / kgPerMeal);

  // Environmental and financial savings
  const co2SavedKg = Math.round(totalSavedKg * (settings.co2FactorKgPerKg || 2.5) * 10) / 10;
  const waterSavedLiters = Math.round(totalSavedKg * (settings.waterFactorLitersPerKg || 800));
  const costSaved = Math.round(totalSavedKg * (settings.costPerKgDefault || 2.5) * 100) / 100;

  return {
    totalPreparedKg: Math.round(totalPreparedKg * 10) / 10,
    totalServedKg: Math.round(totalServedKg * 10) / 10,
    currentSurplusKg: Math.round(currentSurplusKg * 10) / 10,
    totalSavedKg: Math.round(totalSavedKg * 10) / 10,
    totalRedistributedKg: Math.round(totalRedistributedKg * 10) / 10,
    totalReusedKg: Math.round(totalReusedKg * 10) / 10,
    totalDiscardedKg: Math.round(totalDiscardedKg * 10) / 10,
    foodWastePercentage: Math.round(foodWastePercentage * 10) / 10,
    wasteReductionPercentage: Math.round(wasteReductionPercentage * 10) / 10,
    estimatedMealsSaved,
    totalRecordsCount: records.length,
    activeSurplusAlertsCount: activeAlertsCount,
    recordsRequiringReviewCount,
    co2SavedKg,
    waterSavedLiters,
    costSaved,
  };
}

export interface DailyComparisonPoint {
  date: string;
  preparedKg: number;
  servedKg: number;
  surplusKg: number;
  discardedKg: number;
  savedKg: number;
}

export function getDailyTrends(records: FoodRecord[], daysCount: number = 7): DailyComparisonPoint[] {
  const map = new Map<string, { prepared: number; served: number; discarded: number; saved: number }>();

  // Sort chronologically
  const sorted = [...records].sort(
    (a, b) => new Date(a.preparationDateTime).getTime() - new Date(b.preparationDateTime).getTime()
  );

  for (const r of sorted) {
    const dStr = r.preparationDateTime.slice(0, 10);
    const existing = map.get(dStr) || { prepared: 0, served: 0, discarded: 0, saved: 0 };
    existing.prepared += r.quantityPreparedKg;
    existing.served += r.quantityServedKg;
    existing.discarded += r.quantityDiscardedKg;
    existing.saved += r.quantityRedistributedKg + r.quantityReusedKg;
    map.set(dStr, existing);
  }

  const entries = Array.from(map.entries())
    .slice(-daysCount)
    .map(([date, vals]) => {
      const surplus = Math.max(0, vals.prepared - vals.served);
      return {
        date: date.slice(5), // 'MM-DD'
        preparedKg: Math.round(vals.prepared * 10) / 10,
        servedKg: Math.round(vals.served * 10) / 10,
        surplusKg: Math.round(surplus * 10) / 10,
        discardedKg: Math.round(vals.discarded * 10) / 10,
        savedKg: Math.round(vals.saved * 10) / 10,
      };
    });

  return entries;
}

export interface CategoryWastePoint {
  category: string;
  discardedKg: number;
  savedKg: number;
  preparedKg: number;
  wastePercentage: number;
}

export function getCategoryBreakdown(records: FoodRecord[]): CategoryWastePoint[] {
  const map = new Map<string, { discarded: number; saved: number; prepared: number }>();

  for (const r of records) {
    const existing = map.get(r.category) || { discarded: 0, saved: 0, prepared: 0 };
    existing.discarded += r.quantityDiscardedKg;
    existing.saved += r.quantityRedistributedKg + r.quantityReusedKg;
    existing.prepared += r.quantityPreparedKg;
    map.set(r.category, existing);
  }

  return Array.from(map.entries()).map(([category, val]) => ({
    category,
    discardedKg: Math.round(val.discarded * 10) / 10,
    savedKg: Math.round(val.saved * 10) / 10,
    preparedKg: Math.round(val.prepared * 10) / 10,
    wastePercentage: val.prepared > 0 ? Math.round((val.discarded / val.prepared) * 1000) / 10 : 0,
  }));
}

export interface TopWastedItemPoint {
  foodName: string;
  category: string;
  totalDiscardedKg: number;
  totalSurplusKg: number;
  occurrences: number;
}

export function getTopWastedItems(records: FoodRecord[], limit: number = 6): TopWastedItemPoint[] {
  const map = new Map<string, { category: string; discarded: number; surplus: number; count: number }>();

  for (const r of records) {
    const existing = map.get(r.foodName) || {
      category: r.category,
      discarded: 0,
      surplus: 0,
      count: 0,
    };
    existing.discarded += r.quantityDiscardedKg;
    existing.surplus += r.quantityRemainingKg;
    existing.count += 1;
    map.set(r.foodName, existing);
  }

  return Array.from(map.entries())
    .map(([foodName, val]) => ({
      foodName,
      category: val.category,
      totalDiscardedKg: Math.round(val.discarded * 10) / 10,
      totalSurplusKg: Math.round(val.surplus * 10) / 10,
      occurrences: val.count,
    }))
    .sort((a, b) => b.totalDiscardedKg - a.totalDiscardedKg)
    .slice(0, limit);
}
