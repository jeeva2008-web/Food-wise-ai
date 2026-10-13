import React, { useState, useMemo } from 'react';
import {
  Leaf,
  Sparkles,
  TrendingDown,
  Scale,
  RefreshCw,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { FoodRecord, CanteenSettings, WasteRecommendation } from '../../types';
import { generateWasteRecommendations } from '../../utils/alertEngine';
import { getTopWastedItems } from '../../utils/calculations';

interface RecommendationsViewProps {
  records: FoodRecord[];
  settings: CanteenSettings;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  records,
  settings,
}) => {
  const recommendations: WasteRecommendation[] = useMemo(() => {
    return generateWasteRecommendations(records, settings);
  }, [records, settings]);

  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiEngine, setAiEngine] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  const totalPotentialSavingsKg = useMemo(() => {
    return recommendations.reduce((acc, r) => acc + r.potentialSavingsKg, 0);
  }, [recommendations]);

  const totalPotentialMoneySaved = Math.round(
    totalPotentialSavingsKg * (settings.costPerKgDefault || 2.75) * 100
  ) / 100;

  const topWasted = useMemo(() => getTopWastedItems(records, 4), [records]);

  const handleFetchAiStrategy = async () => {
    setIsLoadingAi(true);
    try {
      const totalPreparedKg = records.reduce((a, b) => a + b.quantityPreparedKg, 0);
      const totalDiscardedKg = records.reduce((a, b) => a + b.quantityDiscardedKg, 0);
      const wastePercentage =
        totalPreparedKg > 0 ? ((totalDiscardedKg / totalPreparedKg) * 100).toFixed(1) : '0';

      const res = await fetch('/api/ai/reduction-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topWastedItems: topWasted,
          totalPreparedKg,
          totalDiscardedKg,
          wastePercentage,
        }),
      });
      const data = await res.json();
      setAiAdvice(data.summary);
      setAiEngine(data.source === 'gemini_api' ? 'Gemini 2.5 Flash' : 'Local Waste Reduction Rulebase');
    } catch (e) {
      setAiAdvice(
        'Executive Advice: Focus on top volume items (rice & dal). Shift from single large batch boiling to 2-stage staggered cooking based on entrance turnstile counts.'
      );
      setAiEngine('Local Rulebase');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-800" />
            <h2 className="text-base font-bold text-neutral-900">
              Data-Backed Food Waste Reduction Recommendations
            </h2>
          </div>

          <button
            onClick={handleFetchAiStrategy}
            disabled={isLoadingAi}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isLoadingAi ? 'Synthesizing...' : 'Generate AI Executive Brief'}</span>
          </button>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Every recommendation below was triggered by observable patterns in your canteen's historical records. We strictly avoid generic canned advice; each card outlines the empirical rule, triggering batch data, and realistic recovery potential.
        </p>

        {/* Aggregate potential impact */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-neutral-100 pt-3 text-xs">
          <div>
            <span className="text-neutral-500">Total Achievable Waste Reduction: </span>
            <strong className="text-emerald-800 tabular-nums font-bold">
              ~{totalPotentialSavingsKg.toFixed(1)} kg/cycle
            </strong>
          </div>
          <div>
            <span className="text-neutral-500">Estimated Cost Savings: </span>
            <strong className="text-emerald-800 tabular-nums font-bold">
              {settings.currencySymbol}{totalPotentialMoneySaved.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* Optional AI Strategy Callout */}
      {aiAdvice && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-700" />
              <span>AI Sustainability Executive Briefing</span>
            </div>
            <span className="text-[10px] text-neutral-500 font-normal">Generated via {aiEngine}</span>
          </div>
          <p className="text-xs text-neutral-800 leading-relaxed whitespace-pre-line">
            {aiAdvice}
          </p>
        </div>
      )}

      {/* Grid of Recommendations */}
      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`rounded-xl border p-5 bg-white shadow-2xs transition-all ${
              rec.severity === 'high_impact'
                ? 'border-emerald-300 bg-emerald-50/10'
                : rec.severity === 'warning'
                ? 'border-amber-200 bg-amber-50/10'
                : 'border-neutral-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                      rec.severity === 'high_impact'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.severity === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {rec.severity.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">{rec.category}</span>
                  <h3 className="text-sm font-bold text-neutral-900">{rec.title}</h3>
                </div>

                {/* Triggering Rule & Evidence */}
                <div className="space-y-1 text-xs text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div>
                    <strong className="text-neutral-800">Trigger Rule: </strong>
                    <span>{rec.triggerRule}</span>
                  </div>
                  <div>
                    <strong className="text-neutral-800">Canteen Audit Data: </strong>
                    <span className="text-neutral-700">{rec.triggerData}</span>
                  </div>
                </div>

                {/* Recommended Operational Action */}
                <div className="text-xs text-emerald-900 font-medium">
                  <strong>Recommended Culinary Intervention: </strong>
                  <span>{rec.recommendedAction}</span>
                </div>
              </div>

              {/* Potential Savings badge */}
              <div className="rounded-lg bg-neutral-50 p-3 text-right border border-neutral-200 shrink-0 self-start sm:self-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                  Potential Savings
                </span>
                <span className="text-base font-bold text-emerald-800 tabular-nums">
                  ~{rec.potentialSavingsKg} kg
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  ~{settings.currencySymbol}{(rec.potentialSavingsKg * (settings.costPerKgDefault || 2.75)).toFixed(1)} saved
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
