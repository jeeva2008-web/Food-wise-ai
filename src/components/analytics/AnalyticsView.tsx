import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingDown,
  Filter,
  Calendar,
  Layers,
  Scale,
  Sparkles,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { FoodRecord, CanteenSettings, FoodCategory } from '../../types';
import {
  getDailyTrends,
  getCategoryBreakdown,
  getTopWastedItems,
  calculateDashboardMetrics,
} from '../../utils/calculations';

interface AnalyticsViewProps {
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

const COLORS = ['#059669', '#10B981', '#34D399', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ records, settings }) => {
  const [timeRange, setTimeRange] = useState<number>(30); // 7, 14, 30, 0 (all)
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (selectedCat !== 'all') {
      result = result.filter((r) => r.category === selectedCat);
    }
    if (timeRange > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - timeRange);
      result = result.filter((r) => new Date(r.preparationDateTime) >= cutoff);
    }
    return result;
  }, [records, timeRange, selectedCat]);

  const metrics = useMemo(
    () => calculateDashboardMetrics(filteredRecords, 0, settings),
    [filteredRecords, settings]
  );

  const dailyTrends = useMemo(() => getDailyTrends(filteredRecords, timeRange || 14), [filteredRecords, timeRange]);
  const categoryData = useMemo(() => getCategoryBreakdown(filteredRecords), [filteredRecords]);
  const topWasted = useMemo(() => getTopWastedItems(filteredRecords, 6), [filteredRecords]);

  // Model Demand Estimation Performance (Predicted vs Actual)
  const demandPerformanceData = useMemo(() => {
    return filteredRecords
      .filter((r) => r.expectedDemandServings > 0 && r.actualServingsServed > 0)
      .slice(-10)
      .map((r) => {
        const errorServings = Math.abs(r.expectedDemandServings - r.actualServingsServed);
        const errorPct = (errorServings / r.actualServingsServed) * 100;
        return {
          foodName: r.foodName.length > 12 ? r.foodName.slice(0, 12) + '...' : r.foodName,
          expected: r.expectedDemandServings,
          actual: r.actualServingsServed,
          errorPct: Math.round(errorPct * 10) / 10,
        };
      });
  }, [filteredRecords]);

  // Mean Absolute Percentage Error (MAPE)
  const meanMape = useMemo(() => {
    if (demandPerformanceData.length === 0) return 0;
    const sum = demandPerformanceData.reduce((acc, d) => acc + d.errorPct, 0);
    return Math.round((sum / demandPerformanceData.length) * 10) / 10;
  }, [demandPerformanceData]);

  return (
    <div className="space-y-6">
      {/* Filters Strip */}
      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-emerald-800" />
          <h2 className="text-xs font-bold text-neutral-800">Analytics Range & Slice:</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-neutral-200 bg-white p-1 text-xs font-medium">
            {[
              { id: 7, label: 'Last 7 Days' },
              { id: 14, label: 'Last 14 Days' },
              { id: 30, label: 'Last 30 Days' },
              { id: 0, label: 'All History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeRange(tab.id)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  timeRange === tab.id
                    ? 'bg-emerald-800 text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-700 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="all">All Food Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 font-medium">Gross Preparation</span>
          <div className="text-xl font-bold text-neutral-900 tabular-nums mt-1">
            {metrics.totalPreparedKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
          </div>
          <span className="text-[11px] text-neutral-400">Total kitchen throughput</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 font-medium">Overall Waste Rate</span>
          <div className="text-xl font-bold text-red-700 tabular-nums mt-1">
            {metrics.foodWastePercentage}%
          </div>
          <span className="text-[11px] text-red-600 font-medium">
            {metrics.totalDiscardedKg} kg discarded
          </span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 font-medium">Diversion Success Rate</span>
          <div className="text-xl font-bold text-emerald-800 tabular-nums mt-1">
            {metrics.wasteReductionPercentage}%
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">
            {metrics.totalSavedKg} kg rescued
          </span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 font-medium">Forecast Accuracy (MAPE)</span>
          <div className="text-xl font-bold text-neutral-900 tabular-nums mt-1">
            {100 - meanMape > 0 ? (100 - meanMape).toFixed(1) : 0}%
          </div>
          <span className="text-[11px] text-neutral-400">
            Average prediction variance: {meanMape}%
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Time Series Preparation vs Consumption */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-neutral-900">
              Kitchen Preparation vs. Actual Dining Uptake
            </h3>
            <p className="text-xs text-neutral-500">
              Daily weight in kilograms across selected date range
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="prepGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#235B3B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#235B3B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="servedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} kg`, '']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="preparedKg"
                  name="Prepared (kg)"
                  stroke="#235B3B"
                  fillOpacity={1}
                  fill="url(#prepGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="servedKg"
                  name="Consumed (kg)"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#servedGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Saved vs Discarded Cumulative */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-neutral-900">
              Rescued vs. Discarded Surplus Split
            </h3>
            <p className="text-xs text-neutral-500">
              Tracking positive diversion to shelter & student pantry vs bin disposal
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} kg`, '']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="savedKg" name="Rescued (Redist/Reuse)" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="discardedKg" name="Discarded to Compost/Trash" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Category Waste Composition */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-neutral-900">
              Waste Volume by Culinary Category
            </h3>
            <p className="text-xs text-neutral-500">
              Proportion of total food waste originating from each kitchen section
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} kg`, name]}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="preparedKg" name="Cooked (kg)" fill="#235B3B" />
                <Bar dataKey="discardedKg" name="Discarded (kg)" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Model Demand Estimation Accuracy */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Demand Forecasting Model Accuracy
              </h3>
              <p className="text-xs text-neutral-500">
                Expected Servings vs. Actual Servings Consumed
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800">
              MAPE: {meanMape}%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandPerformanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="foodName" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} servings`, name]}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="expected" name="Forecast Demand" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual Consumed" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
