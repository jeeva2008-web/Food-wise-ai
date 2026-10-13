import React, { useMemo } from 'react';
import {
  Target,
  Leaf,
  Droplets,
  HeartHandshake,
  DollarSign,
  TrendingDown,
  Globe2,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { FoodRecord, CanteenSettings } from '../../types';
import { calculateDashboardMetrics } from '../../utils/calculations';

interface SustainabilityViewProps {
  records: FoodRecord[];
  settings: CanteenSettings;
}

export const SustainabilityView: React.FC<SustainabilityViewProps> = ({ records, settings }) => {
  const metrics = useMemo(() => calculateDashboardMetrics(records, 0, settings), [records, settings]);

  // Target benchmarks
  const targetWasteRate = 8.0; // Target <8% waste
  const targetMeals = 1000;
  const targetCo2Kg = 1500;

  const currentMeals = metrics.estimatedMealsSaved;
  const currentCo2 = metrics.co2SavedKg;
  const mealsProgressPct = Math.min(100, Math.round((currentMeals / targetMeals) * 100));
  const co2ProgressPct = Math.min(100, Math.round((currentCo2 / targetCo2Kg) * 100));

  // Tangible real-world environmental conversions
  // 1 kg CO2e ~= 4.2 km driven by an average passenger car
  const kmDrivenEquivalent = Math.round(metrics.co2SavedKg * 4.2);
  // Average shower uses ~65 Liters of water
  const showersSavedEquivalent = Math.round(metrics.waterSavedLiters / 65);
  // Smartphone charges ~= 0.012 kg CO2e
  const phoneChargesEquivalent = Math.round(metrics.co2SavedKg / 0.012);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-2">
          <Globe2 className="h-5 w-5 text-emerald-800" />
          <h2 className="text-base font-bold text-neutral-900">
            Campus Sustainability & UN SDG 12.3 Alignment
          </h2>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          FoodWise AI directly advances <strong>United Nations Sustainable Development Goal 12.3</strong> (Halving per capita food waste by 2030) and <strong>SDG 2 (Zero Hunger)</strong> by tracking avoided environmental externalities and food security dividends from dining hall operations.
        </p>
      </div>

      {/* Target Progress Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Goal 1: Waste Rate Target */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Target Waste Rate</span>
            <Target className="h-4 w-4 text-emerald-800" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900 tabular-nums">
              {metrics.foodWastePercentage}%
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Target: &le;{targetWasteRate}% (Campus Benchmark)
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                metrics.foodWastePercentage <= targetWasteRate ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, (targetWasteRate / Math.max(1, metrics.foodWastePercentage)) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-600">
            {metrics.foodWastePercentage <= targetWasteRate
              ? 'Status: On track to meet semester sustainability criteria!'
              : `Gap: Curtail batch cooking by ${(metrics.foodWastePercentage - targetWasteRate).toFixed(1)}% to reach target.`}
          </p>
        </div>

        {/* Goal 2: Meals Saved */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Meals Rescued Goal</span>
            <HeartHandshake className="h-4 w-4 text-emerald-800" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-800 tabular-nums">
              {currentMeals.toLocaleString()} <span className="text-xs text-neutral-500 font-normal">/ {targetMeals}</span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Progress: {mealsProgressPct}% of semester goal
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${mealsProgressPct}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-600">
            Preserved {metrics.totalSavedKg} kg nutritious food from entering landfill.
          </p>
        </div>

        {/* Goal 3: Carbon Abatement */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">CO₂e Abatement Target</span>
            <Leaf className="h-4 w-4 text-emerald-800" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900 tabular-nums">
              {currentCo2.toLocaleString()} <span className="text-xs text-neutral-500 font-normal">kg CO₂e</span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Progress: {co2ProgressPct}% of {targetCo2Kg} kg target
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${co2ProgressPct}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-600">
            Calculated at {settings.co2FactorKgPerKg} kg CO₂e avoided per kg food rescued.
          </p>
        </div>
      </div>

      {/* Tangible Environmental Equivalence Indicators */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">
            Tangible Environmental Equivalents (Life-Cycle Analysis)
          </h3>
          <p className="text-xs text-neutral-500">
            Translating avoided food waste into everyday resources saved
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-1">
            <span className="text-xs text-neutral-500 font-medium">Passenger Vehicle Travel</span>
            <div className="text-xl font-bold text-neutral-900 tabular-nums">
              {kmDrivenEquivalent.toLocaleString()} km
            </div>
            <p className="text-[11px] text-neutral-500">
              Equivalent emissions of an average gasoline car prevented.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-1">
            <span className="text-xs text-neutral-500 font-medium">Virtual Water Conserved</span>
            <div className="text-xl font-bold text-emerald-800 tabular-nums">
              {metrics.waterSavedLiters.toLocaleString()} L
            </div>
            <p className="text-[11px] text-neutral-500">
              Equivalent to ~{showersSavedEquivalent.toLocaleString()} eight-minute domestic showers.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-1">
            <span className="text-xs text-neutral-500 font-medium">Financial Capital Conserved</span>
            <div className="text-xl font-bold text-neutral-900 tabular-nums">
              {settings.currencySymbol}{metrics.costSaved.toLocaleString()}
            </div>
            <p className="text-[11px] text-neutral-500">
              Direct raw ingredient purchasing funds saved for the dining hall.
            </p>
          </div>
        </div>
      </div>

      {/* Institutional Sustainability Milestones */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Award className="h-4 w-4 text-emerald-800" />
          <span>Campus Sustainability Milestones</span>
        </h3>

        <div className="space-y-3">
          {[
            {
              title: 'Phase 1: Real-Time Digital Scale Integration & Mass Balance Auditing',
              status: 'Achieved',
              desc: 'Continuous kitchen digital weigh-in implemented. Inconsistencies flagged in real-time.',
            },
            {
              title: 'Phase 2: Automated Surplus Diversion Network',
              status: 'Achieved',
              desc: 'Active partner channels established with Campus Student Night Pantry & Shanti Shelter.',
            },
            {
              title: 'Phase 3: AI-Driven Staggered Cooking Deployment',
              status: 'In Progress',
              desc: 'Correlating turnstile attendance with 2-tier batch preparation to reach sub-8% waste.',
            },
            {
              title: 'Phase 4: Closed-Loop Composting of Inevitable Kitchen Scraps',
              status: 'Upcoming',
              desc: 'Partnering with campus botany department for organic peel and vegetable scrap biogas generation.',
            },
          ].map((mile, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-neutral-100 p-3 bg-neutral-50/50">
              <CheckCircle2
                className={`h-4 w-4 shrink-0 mt-0.5 ${
                  mile.status === 'Achieved' ? 'text-emerald-700' : 'text-neutral-400'
                }`}
              />
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900">{mile.title}</span>
                  <span
                    className={`rounded-sm px-1.5 py-0.2 text-[10px] font-bold ${
                      mile.status === 'Achieved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {mile.status}
                  </span>
                </div>
                <p className="text-neutral-500 mt-0.5">{mile.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
