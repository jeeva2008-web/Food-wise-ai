import React, { useState, useMemo } from 'react';
import {
  BrainCircuit,
  Scale,
  Sparkles,
  HelpCircle,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { FoodRecord, CanteenSettings, FoodCategory, PredictionResult } from '../../types';
import { runDemandPrediction, comparePreparationScenarios } from '../../utils/predictionEngine';

interface PredictionViewProps {
  records: FoodRecord[];
  settings: CanteenSettings;
}

const CATEGORIES: FoodCategory[] = [
  'Main Course',
  'Rice & Breads',
  'Curries & Dal',
  'Breakfast & Tiffin',
  'Snacks & Beverages',
  'Sweets & Desserts',
  'Accompaniments',
];

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const PredictionView: React.FC<PredictionViewProps> = ({ records, settings }) => {
  // Preset list of items from history
  const historicalItemNames = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.foodName));
    return Array.from(set);
  }, [records]);

  // Inputs
  const [foodName, setFoodName] = useState<string>('Steamed Basmati Rice');
  const [category, setCategory] = useState<FoodCategory>('Rice & Breads');
  const [dayOfWeek, setDayOfWeek] = useState<string>('Tuesday');
  const [studentAttendance, setStudentAttendance] = useState<number>(480);
  const [expectedServings, setExpectedServings] = useState<number>(130);
  const [testQuantityPreparedKg, setTestQuantityPreparedKg] = useState<number>(45);

  // Optional AI Insight state
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  // Live prediction computation
  const prediction: PredictionResult = useMemo(() => {
    return runDemandPrediction(
      {
        foodName,
        category,
        dayOfWeek,
        studentAttendance,
        expectedServings,
        testQuantityPreparedKg,
      },
      records,
      settings
    );
  }, [foodName, category, dayOfWeek, studentAttendance, expectedServings, testQuantityPreparedKg, records, settings]);

  // Scenario comparisons
  const scenarios = useMemo(() => {
    return comparePreparationScenarios(testQuantityPreparedKg, prediction.estimatedDemandKg, settings);
  }, [testQuantityPreparedKg, prediction.estimatedDemandKg, settings]);

  const handleSelectItem = (name: string) => {
    setFoodName(name);
    const matched = records.find((r) => r.foodName.toLowerCase() === name.toLowerCase());
    if (matched) {
      setCategory(matched.category);
      setTestQuantityPreparedKg(matched.quantityPreparedKg);
      setExpectedServings(matched.expectedDemandServings);
    }
    setAiInsight(null);
  };

  const handleFetchAiAdvice = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/ai/predict-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName,
          category,
          attendance: studentAttendance,
          estimatedDemandKg: prediction.estimatedDemandKg,
          testPrepKg: testQuantityPreparedKg,
          surplusKg: prediction.potentialSurplusKg,
          surplusPercent: prediction.surplusPercentage,
        }),
      });
      const data = await res.json();
      setAiInsight(data.insights);
      setAiSource(data.source === 'gemini_api' ? 'Gemini 2.5 Flash' : 'Local Heuristic Engine');
    } catch (e) {
      setAiInsight(
        `Recommendation: Consider staggered 2-stage cooking. Cook ${prediction.recommendedPrepKg} kg initially to prevent ${prediction.potentialSurplusKg} kg excess.`
      );
      setAiSource('Offline Heuristic');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-2">
          <BrainCircuit className="h-5 w-5 text-emerald-800" />
          <h2 className="text-base font-bold text-neutral-900">
            Explainable AI Demand & Surplus Estimator
          </h2>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Unlike opaque black-box systems, FoodWise AI transparently computes demand based on empirical university canteen data: attendance ratios, day-of-week consumption history, and mass portion benchmarks.
        </p>
      </div>

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Inputs (5 cols) */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Session Simulation Inputs
            </h3>
            <Sliders className="h-4 w-4 text-neutral-400" />
          </div>

          {/* Quick Select from History */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Select or Enter Food Item
            </label>
            <input
              type="text"
              list="historical-food-names"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold focus:border-emerald-600 focus:outline-hidden"
              placeholder="e.g. Steamed Basmati Rice"
            />
            <datalist id="historical-food-names">
              {historicalItemNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1 mt-2">
              {historicalItemNames.slice(0, 4).map((name) => (
                <button
                  key={name}
                  onClick={() => handleSelectItem(name)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                    foodName === name
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Day */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Food Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-700 focus:border-emerald-600 focus:outline-hidden"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Day of Week
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-700 focus:border-emerald-600 focus:outline-hidden"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Attendance Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1">
              <span>Student Turnout Forecast</span>
              <span className="font-bold text-emerald-800 tabular-nums">{studentAttendance} students</span>
            </div>
            <input
              type="range"
              min="100"
              max="700"
              step="10"
              value={studentAttendance}
              onChange={(e) => setStudentAttendance(parseInt(e.target.value))}
              className="w-full accent-emerald-800 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
              <span>100 (Exam / Holiday)</span>
              <span>450 (Normal)</span>
              <span>700 (Special Event)</span>
            </div>
          </div>

          {/* Test Batch Size (kg) */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex justify-between text-xs font-semibold text-neutral-800 mb-1">
              <span>Planned Kitchen Batch (kg)</span>
              <span className="font-bold text-neutral-900 tabular-nums">
                {testQuantityPreparedKg} kg
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="1"
              value={testQuantityPreparedKg}
              onChange={(e) => setTestQuantityPreparedKg(parseFloat(e.target.value))}
              className="w-full accent-emerald-800 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
              <span>Estimated Servings: ~{Math.round(testQuantityPreparedKg / (settings.kgPerServingDefault || 0.35))}</span>
              <span>Buffer tolerance: +/- 5%</span>
            </div>
          </div>
        </div>

        {/* Right Column: Prediction Results & Confidence (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          {/* Result Card */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Forecast Evaluation
                </span>
                <h3 className="text-base font-bold text-neutral-900">
                  {foodName} for {dayOfWeek}
                </h3>
              </div>

              {/* Confidence Badge */}
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 block">Confidence Level</span>
                <span
                  className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${
                    prediction.confidence === 'High'
                      ? 'bg-emerald-100 text-emerald-800'
                      : prediction.confidence === 'Medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {prediction.confidence} ({prediction.historicalRecordsCount} cycles)
                </span>
              </div>
            </div>

            {/* Metric outputs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
              <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200/60">
                <span className="text-[10px] uppercase text-neutral-500 block">Estimated Demand</span>
                <span className="text-base font-bold text-neutral-900 tabular-nums">
                  {prediction.estimatedDemandKg} <span className="text-xs font-normal">kg</span>
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  ({prediction.estimatedDemandServings} portions)
                </span>
              </div>

              <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200/60">
                <span className="text-[10px] uppercase text-neutral-500 block">Planned Batch</span>
                <span className="text-base font-bold text-neutral-900 tabular-nums">
                  {prediction.testQuantityPreparedKg} <span className="text-xs font-normal">kg</span>
                </span>
                <span className="text-[10px] text-neutral-500 block">Tested cooking volume</span>
              </div>

              <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200/60">
                <span className="text-[10px] uppercase text-neutral-500 block">Potential Surplus</span>
                <span
                  className={`text-base font-bold tabular-nums ${
                    prediction.surplusSeverity === 'High'
                      ? 'text-red-600'
                      : prediction.surplusSeverity === 'Medium'
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {prediction.potentialSurplusKg} <span className="text-xs font-normal">kg</span>
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  ({prediction.surplusPercentage}% excess)
                </span>
              </div>

              <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200/60">
                <span className="text-[10px] uppercase text-neutral-500 block">Ideal Prep Batch</span>
                <span className="text-base font-bold text-emerald-800 tabular-nums">
                  {prediction.recommendedPrepKg} <span className="text-xs font-normal">kg</span>
                </span>
                <span className="text-[10px] text-emerald-700 block">+5% safe service buffer</span>
              </div>
            </div>

            {/* Actionable Kitchen Recommendation */}
            <div
              className={`rounded-lg p-3.5 text-xs leading-relaxed border ${
                prediction.surplusSeverity === 'High'
                  ? 'border-red-200 bg-red-50 text-red-900'
                  : prediction.surplusSeverity === 'Medium'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 mb-1">
                {prediction.surplusSeverity === 'High' ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                )}
                <span>Kitchen Operational Recommendation:</span>
              </div>
              <p>{prediction.recommendedAction}</p>
            </div>
          </div>

          {/* Mathematical Step-by-Step Reason Log */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
              Explainable Calculation Log (University Audit Trail)
            </h4>
            <ol className="space-y-2 text-xs text-neutral-600 list-decimal pl-4">
              {prediction.reasoningSteps.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* AI Insights (Gemini or Local) */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-800" />
                <h4 className="text-xs font-bold text-neutral-800">
                  AI Culinary Insights & Batch Advice
                </h4>
              </div>
              <button
                onClick={handleFetchAiAdvice}
                disabled={isLoadingAi}
                className="flex items-center gap-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingAi ? 'animate-spin' : ''}`} />
                <span>{isLoadingAi ? 'Analyzing...' : 'Generate Insight'}</span>
              </button>
            </div>

            {aiInsight ? (
              <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700 border border-neutral-200/60 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                  <span>Engine: {aiSource}</span>
                  <span>Real-time operations analysis</span>
                </div>
                <div className="whitespace-pre-line leading-relaxed">{aiInsight}</div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400">
                Click "Generate Insight" to request batch scheduling guidance from the Gemini AI backend.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Scenario Comparator: Testing Different Batch Sizes */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">
            Batch Size Scenario Sensitivity Analysis
          </h3>
          <p className="text-xs text-neutral-500">
            Compare financial cost, surplus risk, and meals wasted across alternative preparation quantities
          </p>
        </div>

        {/* Chart comparing scenarios */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scenarios} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="prepKg"
                tickFormatter={(val) => `${val} kg`}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(val: any, name: any) => [`${val} kg`, name]}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <ReferenceLine
                y={prediction.estimatedDemandKg}
                stroke="#10B981"
                strokeDasharray="3 3"
                label={{ value: `Demand (${prediction.estimatedDemandKg}kg)`, fill: '#059669', fontSize: 11 }}
              />
              <Bar dataKey="prepKg" name="Cooked (kg)" fill="#235B3B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="surplusKg" name="Surplus Excess (kg)" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table of Scenarios */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2">Batch Scenario</th>
                <th className="px-3 py-2 text-right">Prepared (kg)</th>
                <th className="px-3 py-2 text-right">Demand (kg)</th>
                <th className="px-3 py-2 text-right">Potential Leftover</th>
                <th className="px-3 py-2 text-right">Surplus Rate</th>
                <th className="px-3 py-2 text-right">Risk Level</th>
                <th className="px-3 py-2 text-right">Meals at Risk</th>
                <th className="px-3 py-2 text-right">Estimated Waste Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {scenarios.map((sc, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-neutral-50 ${
                    sc.prepKg === testQuantityPreparedKg ? 'bg-emerald-50/50 font-semibold' : ''
                  }`}
                >
                  <td className="px-3 py-2">
                    {sc.prepKg === testQuantityPreparedKg ? 'Current Plan' : `Scenario ${idx + 1}`}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{sc.prepKg} kg</td>
                  <td className="px-3 py-2 text-right tabular-nums">{sc.estimatedDemandKg} kg</td>
                  <td className="px-3 py-2 text-right tabular-nums">{sc.surplusKg} kg</td>
                  <td className="px-3 py-2 text-right tabular-nums">{sc.surplusPercent}%</td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={`text-[11px] font-bold ${
                        sc.severity === 'High'
                          ? 'text-red-600'
                          : sc.severity === 'Medium'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {sc.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{sc.mealsWasted} meals</td>
                  <td className="px-3 py-2 text-right tabular-nums text-red-700">
                    {settings.currencySymbol}
                    {sc.costImpact.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
