import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Scale,
  Utensils,
  Share2,
  Trash2,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  HeartHandshake,
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
} from 'recharts';
import { FoodRecord, SmartAlert, CanteenSettings, FoodCategory } from '../../types';
import {
  calculateDashboardMetrics,
  getDailyTrends,
  getCategoryBreakdown,
  getTopWastedItems,
} from '../../utils/calculations';
import { NavItemKey } from '../layout/Sidebar';

interface DashboardViewProps {
  records: FoodRecord[];
  alerts: SmartAlert[];
  settings: CanteenSettings;
  onNavigate: (tab: NavItemKey) => void;
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

const PIE_COLORS = ['#059669', '#10B981', '#34D399', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  alerts,
  settings,
  onNavigate,
}) => {
  const [selectedDays, setSelectedDays] = useState<number>(settings.defaultDashboardDays || 14);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter records based on selected timeframe & category
  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (selectedCategory !== 'all') {
      result = result.filter((r) => r.category === selectedCategory);
    }
    if (selectedDays > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - selectedDays);
      result = result.filter((r) => new Date(r.preparationDateTime) >= cutoff);
    }
    return result;
  }, [records, selectedDays, selectedCategory]);

  const activeAlerts = useMemo(() => alerts.filter((a) => a.status === 'active'), [alerts]);
  const metrics = useMemo(
    () => calculateDashboardMetrics(filteredRecords, activeAlerts.length, settings),
    [filteredRecords, activeAlerts, settings]
  );

  const dailyTrends = useMemo(() => getDailyTrends(filteredRecords, selectedDays || 7), [filteredRecords, selectedDays]);
  const categoryData = useMemo(() => getCategoryBreakdown(filteredRecords), [filteredRecords]);
  const topWasted = useMemo(() => getTopWastedItems(filteredRecords, 5), [filteredRecords]);

  // Surplus severity counts for donut chart
  const severityCounts = useMemo(() => {
    let low = 0;
    let med = 0;
    let high = 0;
    for (const r of filteredRecords) {
      if (r.quantityPreparedKg > 0) {
        const pct = (r.quantityRemainingKg / r.quantityPreparedKg) * 100;
        if (pct >= settings.surplusHighThreshold) high++;
        else if (pct >= settings.surplusMediumThreshold) med++;
        else if (pct > 0) low++;
      }
    }
    return [
      { name: 'Low Surplus (<20%)', value: low, color: '#10B981' },
      { name: 'Medium Surplus (20-30%)', value: med, color: '#F59E0B' },
      { name: 'High Surplus (>30%)', value: high, color: '#EF4444' },
    ].filter((item) => item.value > 0);
  }, [filteredRecords, settings]);

  return (
    <div className="space-y-6">
      {/* Filters & Control Strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Filter className="h-4 w-4 text-emerald-800" />
          <span className="font-medium text-neutral-800">Filter Overview:</span>
          <span>
            Analyzing <strong className="tabular-nums text-neutral-900">{filteredRecords.length}</strong> batch records
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center rounded-lg border border-neutral-200 bg-white p-1 text-xs font-medium">
            {[
              { label: 'Last 7 Days', value: 7 },
              { label: 'Last 14 Days', value: 14 },
              { label: 'Last 30 Days', value: 30 },
              { label: 'All Records', value: 0 },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedDays(tab.value)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  selectedDays === tab.value
                    ? 'bg-emerald-800 text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="all">All Food Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Grid (Mass Balance & Waste Metrics) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">Total Prepared</span>
            <Scale className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="text-xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {metrics.totalPreparedKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">Gross kitchen production</p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">Total Served</span>
            <Utensils className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {metrics.totalServedKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700 font-medium">
            {metrics.totalPreparedKg > 0 ? ((metrics.totalServedKg / metrics.totalPreparedKg) * 100).toFixed(1) : 0}% consumption rate
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">Active Surplus</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold tracking-tight text-amber-900 tabular-nums">
            {metrics.currentSurplusKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-700 font-medium">Awaiting disposal/redist</p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">Food Rescued</span>
            <Share2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold tracking-tight text-emerald-800 tabular-nums">
            {metrics.totalSavedKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            {metrics.totalRedistributedKg}kg redist / {metrics.totalReusedKg}kg reuse
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">Food Discarded</span>
            <Trash2 className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-xl font-bold tracking-tight text-red-700 tabular-nums">
            {metrics.totalDiscardedKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
          </div>
          <p className="mt-1 text-[11px] text-red-600 font-medium">
            {metrics.foodWastePercentage}% total waste rate
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">Meals Saved</span>
            <HeartHandshake className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="text-xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {metrics.estimatedMealsSaved.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            @ {settings.kgPerServingDefault} kg/meal portion
          </p>
        </div>
      </div>

      {/* Waste Reduction Banner Callout */}
      <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-white">
            <TrendingUp className="h-5 w-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-neutral-900">
                Surplus Diversion Efficiency: {metrics.wasteReductionPercentage}%
              </h2>
              <span className="text-xs font-medium text-emerald-800">
                ({metrics.totalSavedKg} kg diverted of {metrics.totalSavedKg + metrics.totalDiscardedKg} kg total excess)
              </span>
            </div>
            <p className="text-xs text-neutral-600">
              Prevented ~{metrics.co2SavedKg} kg CO₂ emissions and conserved ~{metrics.waterSavedLiters.toLocaleString()} L of virtual water through proactive redistribution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('prediction')}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Forecast Next Batch</span>
          </button>
          <button
            onClick={() => onNavigate('redistribution')}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <span>Dispatch Surplus</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Daily Prepared vs Served */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Daily Food Preparation vs. Actual Consumption
              </h3>
              <p className="text-xs text-neutral-500">
                Comparison of kitchen cooking volume and diner uptake (kg)
              </p>
            </div>
            <span className="text-xs text-neutral-400">Unit: Kilograms</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value: any) => [`${value} kg`, '']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="preparedKg" name="Prepared (kg)" fill="#235B3B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="servedKg" name="Served (kg)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Saved vs Discarded Trend */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Food Rescued vs. Food Discarded Trend
              </h3>
              <p className="text-xs text-neutral-500">
                Tracking surplus destination over consecutive operational days
              </p>
            </div>
            <span className="text-xs text-neutral-400">Unit: Kilograms</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value: any) => [`${value} kg`, '']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="savedKg"
                  name="Rescued (Redist/Reuse)"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="discardedKg"
                  name="Discarded Waste"
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Row: Categories, Most Wasted Items, and Active Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Category Waste Breakdown */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-bold text-neutral-900 mb-1">
            Waste by Food Category
          </h3>
          <p className="text-xs text-neutral-500 mb-4">
            Total kilograms discarded per culinary category
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis
                  dataKey="category"
                  type="category"
                  width={110}
                  tick={{ fontSize: 11, fill: '#334155' }}
                />
                <Tooltip
                  formatter={(val: any) => [`${val} kg discarded`, 'Waste']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="discardedKg" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Frequently Wasted Items */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-neutral-900">
              High Waste Culprits
            </h3>
            <button
              onClick={() => onNavigate('recommendations')}
              className="text-xs font-medium text-emerald-800 hover:underline"
            >
              Action Plan
            </button>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            Items responsible for the greatest cumulative discard volume
          </p>

          <div className="space-y-3">
            {topWasted.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center">No waste records logged.</p>
            ) : (
              topWasted.map((item, idx) => (
                <div key={item.foodName} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 font-semibold text-neutral-600">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold text-neutral-800 truncate">{item.foodName}</div>
                      <div className="text-[11px] text-neutral-400">{item.category}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-red-700 tabular-nums">
                      {item.totalDiscardedKg} kg
                    </div>
                    <div className="text-[10px] text-neutral-400 tabular-nums">
                      {item.occurrences} batch cycles
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Smart Alerts Snapshot */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-900">Active Smart Alerts</h3>
              {activeAlerts.length > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 tabular-nums">
                  {activeAlerts.length}
                </span>
              )}
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs font-medium text-emerald-800 hover:underline"
            >
              View All
            </button>
          </div>
          <p className="text-xs text-neutral-500 mb-3">
            Immediate items requiring kitchen manager attention
          </p>

          <div className="space-y-2.5 overflow-y-auto max-h-64">
            {activeAlerts.length === 0 ? (
              <div className="rounded-lg bg-neutral-50 p-6 text-center text-xs text-neutral-500">
                No active surplus or expiry alerts at this time.
              </div>
            ) : (
              activeAlerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg border p-2.5 text-xs transition-colors ${
                    alert.severity === 'critical' || alert.severity === 'high'
                      ? 'border-red-200 bg-red-50/50'
                      : alert.severity === 'medium'
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-neutral-200 bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span className="text-neutral-900 truncate">{alert.foodName}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-sm ${
                        alert.severity === 'critical' || alert.severity === 'high'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-amber-200 text-amber-800'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                    {alert.explanation}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
