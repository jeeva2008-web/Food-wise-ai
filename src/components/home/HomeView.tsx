import React, { useState, useMemo, useRef } from 'react';
import {
  Leaf,
  Scale,
  BrainCircuit,
  AlertTriangle,
  Truck,
  BarChart3,
  FileSpreadsheet,
  CheckCircle2,
  HeartHandshake,
  Clock,
  PlusCircle,
  Download,
  Search,
  Eye,
  Edit2,
  Trash2,
  Printer,
  Target,
  FlaskConical,
  Settings,
  Info,
  ArrowRight,
  ChevronRight,
  Filter,
  Sparkles,
  ShieldCheck,
  Droplets,
  DollarSign,
  Building,
  RotateCcw,
  Compass,
  Sliders,
  X,
  AlertCircle,
  TrendingUp,
  Share2,
  History,
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
} from 'recharts';
import {
  FoodRecord,
  SmartAlert,
  RedistributionRecord,
  CanteenSettings,
  FoodCategory,
  StorageCondition,
  PredictionResult,
} from '../../types';
import {
  calculateDashboardMetrics,
  getDailyTrends,
  getCategoryBreakdown,
  getTopWastedItems,
} from '../../utils/calculations';
import { runDemandPrediction, comparePreparationScenarios } from '../../utils/predictionEngine';
import { validateFoodRecord } from '../../utils/validation';
import {
  exportFoodRecordsToCsv,
  exportRedistributionsToCsv,
  exportAlertsToCsv,
} from '../../utils/csvExporter';
import { RecordFormModal } from '../inventory/RecordFormModal';
import { RecordDetailModal } from '../inventory/RecordDetailModal';
import { RedistributeModal } from '../redistribution/RedistributeModal';
import { NavItemKey } from '../layout/Sidebar';

interface HomeViewProps {
  records: FoodRecord[];
  alerts: SmartAlert[];
  redistributions: RedistributionRecord[];
  settings: CanteenSettings;
  onNavigate: (tab: NavItemKey) => void;
  onAddRecord: (record: FoodRecord) => void;
  onUpdateRecord: (record: FoodRecord) => void;
  onDeleteRecord: (id: string) => void;
  onUpdateAlert: (alert: SmartAlert) => void;
  onSaveRedistribution: (record: RedistributionRecord) => void;
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

const STORAGE_CONDITIONS: StorageCondition[] = [
  'Hot Holding (>=65°C)',
  'Chilled Storage (<=4°C)',
  'Frozen Storage (<=-18°C)',
  'Ambient / Room Temperature (20-25°C)',
  'Dry Pantry Storage',
];

export const HomeView: React.FC<HomeViewProps> = ({
  records,
  alerts,
  redistributions,
  settings,
  onNavigate,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onUpdateAlert,
  onSaveRedistribution,
}) => {
  // References for smooth scrolling from hero or quick action cards
  const addFoodRef = useRef<HTMLDivElement>(null);
  const predictionRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const inventoryRef = useRef<HTMLDivElement>(null);
  const redistRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const reportsRef = useRef<HTMLDivElement>(null);
  const sustainabilityRef = useRef<HTMLDivElement>(null);
  const testCenterRef = useRef<HTMLDivElement>(null);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // -------------------------------------------------------------
  // A. LIVE OVERVIEW METRICS
  // -------------------------------------------------------------
  const activeAlerts = useMemo(() => alerts.filter((a) => a.status === 'active'), [alerts]);
  const activeSurplusCount = useMemo(
    () => records.filter((r) => r.quantityRemainingKg > 0.5 && r.status !== 'Discarded').length,
    [records]
  );
  const metrics = useMemo(
    () => calculateDashboardMetrics(records, activeAlerts.length, settings),
    [records, activeAlerts, settings]
  );

  // -------------------------------------------------------------
  // C. ON-PAGE DIRECT ADD FOOD FORM STATE
  // -------------------------------------------------------------
  const [formFoodName, setFormFoodName] = useState('');
  const [formCategory, setFormCategory] = useState<FoodCategory>('Main Course');
  const [formPreparedKg, setFormPreparedKg] = useState<number>(40);
  const [formServedKg, setFormServedKg] = useState<number>(34);
  const [formAttendance, setFormAttendance] = useState<number>(480);
  const [formExpectedServings, setFormExpectedServings] = useState<number>(120);
  const [formStorage, setFormStorage] = useState<StorageCondition>('Hot Holding (>=65°C)');
  const [formPrepTime, setFormPrepTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [formUseByTime, setFormUseByTime] = useState<string>(
    new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 16)
  );
  const [formNotes, setFormNotes] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  const calculatedFormRemaining = Math.max(0, Math.round((formPreparedKg - formServedKg) * 100) / 100);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const recordToValidate: Partial<FoodRecord> = {
      foodName: formFoodName.trim(),
      category: formCategory,
      quantityPreparedKg: formPreparedKg,
      quantityServedKg: formServedKg,
      quantityRemainingKg: calculatedFormRemaining,
      expectedDemandServings: formExpectedServings,
      actualServingsServed: Math.round(formServedKg / (settings.kgPerServingDefault || 0.35)),
      studentAttendance: formAttendance,
      preparationDateTime: new Date(formPrepTime).toISOString(),
      useByDateTime: formUseByTime ? new Date(formUseByTime).toISOString() : '',
      storageCondition: formStorage,
      storageNotes: formNotes,
      quantityReusedKg: 0,
      quantityRedistributedKg: 0,
      quantityDiscardedKg: 0,
    };

    const val = validateFoodRecord(recordToValidate, records);
    if (!val.isValid) {
      setFormErrors(val.errors);
      setFormSuccessMessage(null);
      return;
    }

    const now = new Date().toISOString();
    const newRecord: FoodRecord = {
      id: `FW-${Date.now().toString().slice(-4)}`,
      foodName: formFoodName.trim(),
      category: formCategory,
      quantityPreparedKg: formPreparedKg,
      quantityServedKg: formServedKg,
      quantityRemainingKg: calculatedFormRemaining,
      expectedDemandServings: formExpectedServings,
      actualServingsServed: Math.round(formServedKg / (settings.kgPerServingDefault || 0.35)),
      studentAttendance: formAttendance,
      preparationDateTime: new Date(formPrepTime).toISOString(),
      useByDateTime: formUseByTime ? new Date(formUseByTime).toISOString() : '',
      storageCondition: formStorage,
      storageNotes: formNotes,
      quantityReusedKg: 0,
      quantityRedistributedKg: 0,
      quantityDiscardedKg: 0,
      status: calculatedFormRemaining > 2 ? 'Surplus Active' : 'Recorded',
      notes: formNotes,
      createdAt: now,
      updatedAt: now,
      isSimulated: false,
    };

    onAddRecord(newRecord);
    setFormErrors([]);
    setFormSuccessMessage(
      `Successfully logged ${newRecord.foodName} (${newRecord.quantityPreparedKg} kg prepared, ${newRecord.quantityRemainingKg} kg leftover). Record ID: ${newRecord.id}`
    );
    setFormFoodName('');
    setFormNotes('');
    setTimeout(() => setFormSuccessMessage(null), 5000);
  };

  // -------------------------------------------------------------
  // D. ON-PAGE AI DEMAND PREDICTION STATE
  // -------------------------------------------------------------
  const [predFood, setPredFood] = useState('Steamed Basmati Rice');
  const [predCategory, setPredCategory] = useState<FoodCategory>('Rice & Breads');
  const [predDay, setPredDay] = useState('Tuesday');
  const [predAttendance, setPredAttendance] = useState<number>(480);
  const [predExpectedServings, setPredExpectedServings] = useState<number>(130);
  const [predTestPrepKg, setPredTestPrepKg] = useState<number>(45);

  const homePredictionResult: PredictionResult = useMemo(() => {
    return runDemandPrediction(
      {
        foodName: predFood,
        category: predCategory,
        dayOfWeek: predDay,
        studentAttendance: predAttendance,
        expectedServings: predExpectedServings,
        testQuantityPreparedKg: predTestPrepKg,
      },
      records,
      settings
    );
  }, [predFood, predCategory, predDay, predAttendance, predExpectedServings, predTestPrepKg, records, settings]);

  const homeScenarios = useMemo(() => {
    return comparePreparationScenarios(predTestPrepKg, homePredictionResult.estimatedDemandKg, settings);
  }, [predTestPrepKg, homePredictionResult.estimatedDemandKg, settings]);

  // -------------------------------------------------------------
  // F. ON-PAGE INVENTORY PREVIEW STATE & MODALS
  // -------------------------------------------------------------
  const [invSearch, setInvSearch] = useState('');
  const [invCatFilter, setInvCatFilter] = useState('all');
  const [editingRecord, setEditingRecord] = useState<FoodRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<FoodRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [redistTargetRecord, setRedistTargetRecord] = useState<FoodRecord | null>(null);

  const previewRecords = useMemo(() => {
    return records
      .filter((r) => {
        const matchesSearch =
          r.foodName.toLowerCase().includes(invSearch.toLowerCase()) ||
          r.id.toLowerCase().includes(invSearch.toLowerCase());
        const matchesCat = invCatFilter === 'all' || r.category === invCatFilter;
        return matchesSearch && matchesCat;
      })
      .slice(0, 7); // Show top 7 recent records on home page
  }, [records, invSearch, invCatFilter]);

  // -------------------------------------------------------------
  // I. ANALYTICS PREVIEW DATA
  // -------------------------------------------------------------
  const [analyticsDays, setAnalyticsDays] = useState<number>(14);
  const dailyTrends = useMemo(() => getDailyTrends(records, analyticsDays), [records, analyticsDays]);
  const categoryData = useMemo(() => getCategoryBreakdown(records), [records]);
  const topWasted = useMemo(() => getTopWastedItems(records, 4), [records]);

  // -------------------------------------------------------------
  // J. SUSTAINABILITY GOAL STATE
  // -------------------------------------------------------------
  const [targetGoalWastePct, setTargetGoalWastePct] = useState<number>(8.0);

  return (
    <div className="space-y-12 pb-16">
      {/* =========================================================
          1. PREMIUM HERO SECTION
      ========================================================= */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-gradient-to-b from-white via-emerald-50/40 to-white p-6 sm:p-10 lg:p-12 shadow-xs">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left Text Zone */}
          <div className="space-y-5 lg:col-span-7">
            {/* Elegant Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/95 px-3.5 py-1.5 text-xs font-bold text-emerald-950 shadow-2xs backdrop-blur-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>AI-POWERED CAMPUS SUSTAINABILITY</span>
              <span className="text-neutral-300">·</span>
              <span className="text-emerald-800">Rathinam Global University</span>
            </div>

            {/* Title & Headline */}
            <div>
              <div className="text-xs font-extrabold tracking-widest text-emerald-900 uppercase mb-1">
                FoodWise AI · Smart Campus Food Management
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl leading-tight">
                Smarter Food.{' '}
                <span className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 bg-clip-text text-transparent">
                  Less Waste.
                </span>{' '}
                A Greener Campus.
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-base text-neutral-600 sm:text-lg leading-relaxed max-w-2xl">
              An intelligent campus food management platform built to help Rathinam Global University predict food demand, prevent avoidable waste, and make every meal count.
            </p>

            {/* Two Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => scrollToRef(addFoodRef)}
                className="flex items-center gap-2 rounded-xl bg-emerald-900 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-800 transition-all hover:translate-y-[-1px] cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 text-emerald-300" />
                <span>+ Add Food Record</span>
              </button>

              <button
                onClick={() => scrollToRef(predictionRef)}
                className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3.5 text-sm font-bold text-neutral-800 shadow-2xs hover:bg-neutral-50 transition-all hover:translate-y-[-1px] cursor-pointer"
              >
                <BrainCircuit className="h-4 w-4 text-emerald-800" />
                <span>Explore AI Prediction</span>
              </button>

              <button
                onClick={() => scrollToRef(inventoryRef)}
                className="rounded-xl px-4 py-3.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <span>Live Inventory Table</span>
              </button>
            </div>

            {/* Trust Markers */}
            <div className="flex flex-wrap items-center gap-5 border-t border-neutral-200/70 pt-5 text-xs text-neutral-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Continuous Mass Balance Tracking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Explainable Heuristics & Local Fallback</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Zero Hallucinated Metrics</span>
              </div>
            </div>
          </div>

          {/* Right Visual Zone: Image with live glass-effect cards */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-xl">
                <img
                  src="/src/assets/images/hero_campus_dining_1791894896617.jpg"
                  alt="Rathinam Global University Dining Hall"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900 to-emerald-800 p-6 text-center text-white">
                  <Leaf className="h-12 w-12 text-emerald-300 mb-2" />
                  <span className="font-bold text-lg">Rathinam Global University</span>
                  <span className="text-xs text-emerald-200">Central Dining Operations</span>
                </div>
              </div>

              {/* Glass Stat Card 1 */}
              <div className="absolute -left-4 -top-4 rounded-xl border border-white/60 bg-white/95 p-3.5 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <Leaf className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Food Rescued</span>
                    <span className="text-base font-bold text-emerald-900 tabular-nums">
                      {metrics.totalSavedKg.toLocaleString()} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Glass Stat Card 2 */}
              <div className="absolute -bottom-4 -right-2 rounded-xl border border-white/60 bg-white/95 p-3.5 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <HeartHandshake className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Meals Saved</span>
                    <span className="text-base font-bold text-neutral-900 tabular-nums">
                      {metrics.estimatedMealsSaved.toLocaleString()} meals
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          2A. LIVE OVERVIEW CARDS (8 Critical Live Metrics)
      ========================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-800" />
              <h2 className="text-lg font-bold text-neutral-900">
                Live Campus Dining Operations Overview
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Live mass balance equations computed from {records.length} authenticated batch logs. Click any card to inspect details.
            </p>
          </div>
          <span className="text-xs text-neutral-400">Unit: Kilograms (kg) & Servings</span>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-8">
          {/* Card 1: Total Prepared */}
          <div
            onClick={() => scrollToRef(inventoryRef)}
            className="cursor-pointer rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs hover:border-emerald-300 hover:shadow-sm transition-all"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Prepared</span>
            <div className="mt-1 text-xl font-bold text-neutral-900 tabular-nums">
              {metrics.totalPreparedKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">Gross cooked</span>
          </div>

          {/* Card 2: Total Served */}
          <div
            onClick={() => scrollToRef(inventoryRef)}
            className="cursor-pointer rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs hover:border-emerald-300 hover:shadow-sm transition-all"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Served</span>
            <div className="mt-1 text-xl font-bold text-emerald-800 tabular-nums">
              {metrics.totalServedKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
              {metrics.totalPreparedKg > 0 ? ((metrics.totalServedKg / metrics.totalPreparedKg) * 100).toFixed(1) : 0}% uptake
            </span>
          </div>

          {/* Card 3: Potential Surplus */}
          <div
            onClick={() => scrollToRef(redistRef)}
            className="cursor-pointer rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs hover:border-amber-300 hover:shadow-sm transition-all"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Current Surplus</span>
            <div className="mt-1 text-xl font-bold text-amber-900 tabular-nums">
              {metrics.currentSurplusKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
            </div>
            <span className="text-[10px] text-amber-700 font-medium mt-1 block">Unassigned leftovers</span>
          </div>

          {/* Card 4: Food Saved */}
          <div
            onClick={() => scrollToRef(redistRef)}
            className="cursor-pointer rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs hover:border-emerald-300 hover:shadow-sm transition-all"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Food Rescued</span>
            <div className="mt-1 text-xl font-bold text-emerald-900 tabular-nums">
              {metrics.totalSavedKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium mt-1 block">Diverted from waste</span>
          </div>

          {/* Card 5: Food Redistributed */}
          <div
            onClick={() => scrollToRef(redistRef)}
            className="cursor-pointer rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs hover:border-emerald-300 hover:shadow-sm transition-all"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Redistributed</span>
            <div className="mt-1 text-xl font-bold text-emerald-800 tabular-nums">
              {metrics.totalRedistributedKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">To hostellers & shelter</span>
          </div>

          {/* Card 6: Food Wasted */}
          <div
            onClick={() => scrollToRef(analyticsRef)}
            className="cursor-pointer rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs hover:border-red-300 hover:shadow-sm transition-all"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Food Discarded</span>
            <div className="mt-1 text-xl font-bold text-red-700 tabular-nums">
              {metrics.totalDiscardedKg.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kg</span>
            </div>
            <span className="text-[10px] text-red-600 font-medium mt-1 block">{metrics.foodWastePercentage}% waste rate</span>
          </div>

          {/* Card 7: Active Alerts */}
          <div
            onClick={() => scrollToRef(alertsRef)}
            className="cursor-pointer rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs hover:border-red-300 hover:shadow-sm transition-all"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Active Alerts</span>
            <div className="mt-1 text-xl font-bold text-red-600 tabular-nums">
              {activeAlerts.length}
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">Requiring review</span>
          </div>

          {/* Card 8: Meals Saved */}
          <div
            onClick={() => scrollToRef(sustainabilityRef)}
            className="cursor-pointer rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs hover:border-emerald-300 hover:shadow-sm transition-all"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Meals Saved</span>
            <div className="mt-1 text-xl font-bold text-neutral-900 tabular-nums">
              {metrics.estimatedMealsSaved.toLocaleString()}
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">@ {settings.kgPerServingDefault}kg/meal</span>
          </div>
        </div>
      </section>

      {/* =========================================================
          2B. QUICK ACTION CENTRE (All 12 Features Accessible)
      ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-emerald-800" />
              <h2 className="text-lg font-bold text-neutral-900">
                Quick Action Centre
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Access all 12 operational modules directly from this home page.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {[
            {
              id: 1,
              title: 'Add Food Record',
              desc: 'Enter batch weight & attendance with mass balance check.',
              icon: PlusCircle,
              onClick: () => scrollToRef(addFoodRef),
              highlight: true,
            },
            {
              id: 2,
              title: 'Manage Inventory',
              desc: 'View, edit, search, and delete all batch logs.',
              icon: Scale,
              onClick: () => scrollToRef(inventoryRef),
            },
            {
              id: 3,
              title: 'Predict Demand',
              desc: 'AI estimation based on attendance and day of week.',
              icon: BrainCircuit,
              onClick: () => scrollToRef(predictionRef),
              highlight: true,
            },
            {
              id: 4,
              title: 'Detect Surplus',
              desc: 'Classify Low, Medium, and High leftover levels.',
              icon: AlertTriangle,
              onClick: () => scrollToRef(redistRef),
            },
            {
              id: 5,
              title: 'Smart Alerts',
              desc: 'Review mass balance mismatches and deadline warnings.',
              icon: Clock,
              onClick: () => scrollToRef(alertsRef),
              badge: activeAlerts.length > 0 ? activeAlerts.length : undefined,
            },
            {
              id: 6,
              title: 'Redistribution',
              desc: 'Dispatch leftovers to Rathinam hostels & local kitchens.',
              icon: Truck,
              onClick: () => scrollToRef(redistRef),
            },
            {
              id: 7,
              title: 'Track Expiry',
              desc: 'Monitor use-by holding windows & sensory safety check.',
              icon: ShieldCheck,
              onClick: () => onNavigate('freshness'),
            },
            {
              id: 8,
              title: 'View Analytics',
              desc: 'Interactive Recharts of prep vs served & category waste.',
              icon: BarChart3,
              onClick: () => scrollToRef(analyticsRef),
            },
            {
              id: 9,
              title: 'Generate Reports',
              desc: 'Audit summaries, CSV exports, and printable PDF reports.',
              icon: FileSpreadsheet,
              onClick: () => scrollToRef(reportsRef),
            },
            {
              id: 10,
              title: 'Import/Export',
              desc: 'Download CSV datasets or backup JSON database snapshots.',
              icon: Download,
              onClick: () => onNavigate('settings'),
            },
            {
              id: 11,
              title: 'Open Test Centre',
              desc: 'Run 12 automated verification scenarios against edge cases.',
              icon: FlaskConical,
              onClick: () => onNavigate('test-center'),
            },
            {
              id: 12,
              title: 'Manage Settings',
              desc: 'Adjust thresholds, portions, costs, and reset demo data.',
              icon: Settings,
              onClick: () => onNavigate('settings'),
            },
          ].map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={act.onClick}
                className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer ${
                  act.highlight
                    ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-500'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 group-hover:bg-emerald-900 group-hover:text-white transition-colors">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    {act.badge !== undefined && (
                      <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {act.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-neutral-900 leading-snug">{act.title}</h3>
                  <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">{act.desc}</p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                  <span>Open</span>
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          2C & 2D. TWO-COLUMN: ADD FOOD DIRECTLY & AI PREDICTION PANEL
      ========================================================= */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* 2C. ADD FOOD DIRECTLY (6 cols) */}
        <div ref={addFoodRef} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xs lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-emerald-800" />
                <h2 className="text-base font-bold text-neutral-900">
                  Add Food Record Directly
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Log freshly cooked batch weights with real-time mass balance calculation.
              </p>
            </div>
            <button
              onClick={() => scrollToRef(inventoryRef)}
              className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
            >
              View Inventory
            </button>
          </div>

          {formSuccessMessage && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{formSuccessMessage}</span>
            </div>
          )}

          {formErrors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Please correct errors:</span>
              </div>
              <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                {formErrors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleQuickAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Food Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steamed Basmati Rice"
                  value={formFoodName}
                  onChange={(e) => setFormFoodName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-800 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as FoodCategory)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-800 focus:border-emerald-600 focus:outline-hidden"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mass balance inputs */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                <span>Scale Weigh-In (Kilograms)</span>
                <span className="text-[11px] text-neutral-500 font-mono">
                  Remaining = {formPreparedKg} - {formServedKg} = {calculatedFormRemaining.toFixed(1)} kg
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-neutral-600 mb-1">Prepared (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formPreparedKg}
                    onChange={(e) => setFormPreparedKg(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-600 mb-1">Served (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formServedKg}
                    onChange={(e) => setFormServedKg(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-600 mb-1">Leftover (kg)</label>
                  <div className="flex h-7 items-center rounded-lg border border-neutral-200 bg-neutral-100 px-2 text-xs font-bold text-neutral-900 tabular-nums">
                    {calculatedFormRemaining.toFixed(1)} kg
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance & Servings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Student Attendance
                </label>
                <input
                  type="number"
                  min="0"
                  value={formAttendance}
                  onChange={(e) => setFormAttendance(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs tabular-nums focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Expected Servings
                </label>
                <input
                  type="number"
                  min="0"
                  value={formExpectedServings}
                  onChange={(e) => setFormExpectedServings(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs tabular-nums focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Storage & Timestamps */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Storage Condition
                </label>
                <select
                  value={formStorage}
                  onChange={(e) => setFormStorage(e.target.value as StorageCondition)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                >
                  {STORAGE_CONDITIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Use-By Deadline *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formUseByTime}
                  onChange={(e) => setFormUseByTime(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <span className="text-[11px] text-neutral-400">All fields validated strictly</span>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Save Food Record</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2D. AI DEMAND PREDICTION PANEL (6 cols) */}
        <div ref={predictionRef} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xs lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-emerald-800" />
                <h2 className="text-base font-bold text-neutral-900">
                  AI Demand Prediction Panel
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Transparent demand forecasting based on historical campus consumption.
              </p>
            </div>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                homePredictionResult.confidence === 'High'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {homePredictionResult.confidence}
            </span>
          </div>

          {/* Interactive controls */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Dish to Forecast</label>
              <input
                type="text"
                value={predFood}
                onChange={(e) => setPredFood(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Day of Week</label>
              <select
                value={predDay}
                onChange={(e) => setPredDay(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1">
                <span>Expected Student Attendance</span>
                <span className="font-bold text-emerald-800 tabular-nums">{predAttendance} students</span>
              </div>
              <input
                type="range"
                min="100"
                max="700"
                step="10"
                value={predAttendance}
                onChange={(e) => setPredAttendance(parseInt(e.target.value))}
                className="w-full accent-emerald-800 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1">
                <span>Planned Batch Size</span>
                <span className="font-bold text-neutral-900 tabular-nums">{predTestPrepKg} kg</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="1"
                value={predTestPrepKg}
                onChange={(e) => setPredTestPrepKg(parseFloat(e.target.value))}
                className="w-full accent-emerald-800 cursor-pointer"
              />
            </div>
          </div>

          {/* Prediction Output Matrix */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
              <div className="rounded-lg bg-white p-2.5 border border-neutral-200/80">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Est. Demand</span>
                <span className="text-base font-bold text-neutral-900 tabular-nums">
                  {homePredictionResult.estimatedDemandKg} kg
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  ({homePredictionResult.estimatedDemandServings} portions)
                </span>
              </div>

              <div className="rounded-lg bg-white p-2.5 border border-neutral-200/80">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Tested Batch</span>
                <span className="text-base font-bold text-neutral-900 tabular-nums">
                  {homePredictionResult.testQuantityPreparedKg} kg
                </span>
                <span className="text-[10px] text-neutral-500 block">Planned cooking</span>
              </div>

              <div className="rounded-lg bg-white p-2.5 border border-neutral-200/80">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Surplus Excess</span>
                <span
                  className={`text-base font-bold tabular-nums ${
                    homePredictionResult.surplusSeverity === 'High'
                      ? 'text-red-600'
                      : homePredictionResult.surplusSeverity === 'Medium'
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {homePredictionResult.potentialSurplusKg} kg
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  ({homePredictionResult.surplusPercentage}% excess)
                </span>
              </div>

              <div className="rounded-lg bg-white p-2.5 border border-neutral-200/80">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Ideal Prep</span>
                <span className="text-base font-bold text-emerald-800 tabular-nums">
                  {homePredictionResult.recommendedPrepKg} kg
                </span>
                <span className="text-[10px] text-emerald-700 block">+5% buffer</span>
              </div>
            </div>

            {/* Recommendation callout */}
            <div className="rounded-xl border border-emerald-200 bg-white p-3 text-xs text-neutral-700 leading-relaxed">
              <strong className="text-emerald-900">Recommended Action: </strong>
              <span>{homePredictionResult.recommendedAction}</span>
            </div>

            <div className="text-[11px] text-neutral-500 font-mono">
              Formula: ({predAttendance} attendance &times; historical ratio) &times; portion weight = {homePredictionResult.estimatedDemandKg} kg demand.
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          2E. SMART ALERTS DIRECT FEED
      ========================================================= */}
      <section ref={alertsRef} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h2 className="text-base font-bold text-neutral-900">
                Active Smart Alerts Feed
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Automated triggers monitoring excess surplus, attendance drops, and holding deadlines.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
              {activeAlerts.length} Active Alerts
            </span>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
            >
              View All Alerts
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {activeAlerts.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-xs text-neutral-400">
              No active surplus or deadline alerts at this time.
            </div>
          ) : (
            activeAlerts.slice(0, 6).map((al) => (
              <div
                key={al.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                  al.severity === 'critical' || al.severity === 'high'
                    ? 'border-red-200 bg-red-50/40'
                    : 'border-amber-200 bg-amber-50/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <span className="text-[10px] font-mono text-neutral-400">{al.recordId}</span>
                      <h4 className="text-xs font-bold text-neutral-900">{al.foodName}</h4>
                    </div>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        al.severity === 'critical' || al.severity === 'high'
                          ? 'bg-red-200 text-red-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {al.severity}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 leading-relaxed line-clamp-2 mb-2">
                    {al.explanation}
                  </p>

                  <div className="rounded-lg bg-white/90 p-2 text-[11px] text-emerald-950 border border-neutral-200/60 mb-3">
                    <strong>Suggested Action: </strong> {al.suggestedAction}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-2">
                  <button
                    onClick={() => {
                      onUpdateAlert({ ...al, status: 'reviewed' });
                    }}
                    className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => scrollToRef(redistRef)}
                    className="rounded-lg bg-emerald-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    Action
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* =========================================================
          2F. FOOD INVENTORY PREVIEW (Searchable & Filterable)
      ========================================================= */}
      <section ref={inventoryRef} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-800" />
              <h2 className="text-base font-bold text-neutral-900">
                Food Inventory Ledger Preview
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Recent batch records with continuous mass balance check. Edit, view, or delete records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportFoodRecordsToCsv(records)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 cursor-pointer"
            >
              <span>View Full Inventory ({records.length})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search recent batch..."
              value={invSearch}
              onChange={(e) => setInvSearch(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 pl-8 pr-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <select
            value={invCatFilter}
            onChange={(e) => setInvCatFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="all">All Food Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2.5">Food Item</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5 text-right">Prepared</th>
                <th className="px-3 py-2.5 text-right">Served</th>
                <th className="px-3 py-2.5 text-right">Leftover</th>
                <th className="px-3 py-2.5 text-right">Surplus %</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {previewRecords.map((r) => {
                const pct = r.quantityPreparedKg > 0 ? (r.quantityRemainingKg / r.quantityPreparedKg) * 100 : 0;
                return (
                  <tr key={r.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-neutral-900">
                      <div>{r.foodName}</div>
                      <div className="text-[10px] text-neutral-400 font-mono font-normal">{r.id}</div>
                    </td>
                    <td className="px-3 py-2.5 text-neutral-600">{r.category}</td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">{r.quantityPreparedKg} kg</td>
                    <td className="px-3 py-2.5 text-right font-medium text-emerald-800 tabular-nums">{r.quantityServedKg} kg</td>
                    <td className="px-3 py-2.5 text-right font-bold text-neutral-900 tabular-nums">{r.quantityRemainingKg} kg</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                      <span className={pct >= 30 ? 'text-red-600' : pct >= 20 ? 'text-amber-700' : 'text-neutral-500'}>
                        {pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-semibold text-[11px] text-neutral-800">{r.status}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingRecord(r)}
                          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingRecord(r)}
                          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(r.id)}
                          className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================================================
          2G. FOOD REDISTRIBUTION PANEL
      ========================================================= */}
      <section ref={redistRef} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-800" />
              <h2 className="text-base font-bold text-neutral-900">
                Food Surplus Redistribution Pipeline
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Available leftovers ready for dispatch to Rathinam hostel pantries and community partners.
            </p>
          </div>
          <button
            onClick={() => onNavigate('redistribution')}
            className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
          >
            Open Full Redistribution Hub
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {records
            .filter((r) => r.quantityRemainingKg > 0.5 && r.status !== 'Discarded')
            .slice(0, 4)
            .map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 flex flex-col justify-between hover:border-emerald-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mb-1">
                    <span>{item.id}</span>
                    <span className="font-sans text-neutral-600">{item.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900">{item.foodName}</h4>

                  <div className="my-2.5 rounded-lg bg-white p-2.5 border border-neutral-200 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Available:</span>
                      <strong className="text-emerald-900 font-bold tabular-nums">
                        {item.quantityRemainingKg} kg
                      </strong>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      ~{Math.round(item.quantityRemainingKg / (settings.kgPerServingDefault || 0.35))} meals
                    </div>
                  </div>
                  <div className="text-[11px] text-neutral-500 truncate">
                    Use-by: {item.useByDateTime ? new Date(item.useByDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Set'}
                  </div>
                </div>

                <button
                  onClick={() => setRedistTargetRecord(item)}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-900 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Initiate Handover</span>
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* =========================================================
          2H & 2I. ANALYTICS & EXPIRY PREVIEW
      ========================================================= */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* 2I. ANALYTICS PREVIEW (8 cols) */}
        <div ref={analyticsRef} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xs lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-800" />
                <h2 className="text-base font-bold text-neutral-900">
                  Kitchen Preparation vs. Actual Consumption Trends
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Comparison of cooked mass vs student plate consumption over time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-xs">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => setAnalyticsDays(days)}
                    className={`rounded-md px-2.5 py-0.5 font-medium transition-colors cursor-pointer ${
                      analyticsDays === days ? 'bg-emerald-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {days}D
                  </button>
                ))}
              </div>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
              >
                Full Analytics
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
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
                <Bar dataKey="preparedKg" name="Cooked (kg)" fill="#14532D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="servedKg" name="Consumed (kg)" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2H. FRESHNESS & EXPIRY TRACKER (4 cols) */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xs lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-800" />
                <h2 className="text-base font-bold text-neutral-900">Freshness Tracker</h2>
              </div>
              <button
                onClick={() => onNavigate('freshness')}
                className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
              >
                Inspect
              </button>
            </div>

            <div className="my-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-900 leading-relaxed">
              <strong>Food Safety Protocol: </strong> Software never certifies safety. Physical probe temperature inspection (&ge;65&deg;C) is mandatory before serving.
            </div>

            <div className="space-y-2.5">
              {records
                .filter((r) => r.useByDateTime)
                .slice(0, 3)
                .map((r) => {
                  const useBy = new Date(r.useByDateTime!).getTime();
                  const hoursLeft = Math.round(((useBy - Date.now()) / 3600000) * 10) / 10;
                  return (
                    <div key={r.id} className="rounded-xl border border-neutral-200 p-2.5 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-neutral-900">{r.foodName}</div>
                        <div className="text-[10px] text-neutral-400">{r.storageCondition}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          hoursLeft <= 2 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {hoursLeft <= 0 ? 'Review Needed' : `${hoursLeft}h left`}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          <button
            onClick={() => onNavigate('freshness')}
            className="w-full rounded-xl border border-neutral-300 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            View Freshness Queue
          </button>
        </div>
      </div>

      {/* =========================================================
          2J. SUSTAINABILITY GOALS & IMPACT
      ========================================================= */}
      <section ref={sustainabilityRef} className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-800" />
              <h2 className="text-base font-bold text-neutral-900">
                Rathinam Campus Food Waste Reduction Goals (UN SDG 12.3)
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Target vs measured progress derived from authentic dining hall weigh-in logs.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500">Configure Target:</span>
            <input
              type="number"
              step="0.5"
              min="2"
              max="20"
              value={targetGoalWastePct}
              onChange={(e) => setTargetGoalWastePct(parseFloat(e.target.value) || 8.0)}
              className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-center font-bold text-neutral-800"
            />
            <span className="font-bold text-neutral-700">% max waste</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 text-xs">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-1">
            <span className="text-neutral-500 uppercase text-[10px] font-bold block">Current Waste Rate</span>
            <div className="text-2xl font-bold text-neutral-900 tabular-nums">
              {metrics.foodWastePercentage}%
            </div>
            <p className="text-[11px] text-neutral-500">
              Campus target is &le;{targetGoalWastePct}%
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-1">
            <span className="text-neutral-500 uppercase text-[10px] font-bold block">Meals Saved Goal</span>
            <div className="text-2xl font-bold text-emerald-800 tabular-nums">
              {metrics.estimatedMealsSaved} / 1,000
            </div>
            <p className="text-[11px] text-neutral-500">
              {Math.min(100, Math.round((metrics.estimatedMealsSaved / 1000) * 100))}% of semester target
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-1">
            <span className="text-neutral-500 uppercase text-[10px] font-bold block">Carbon Abatement</span>
            <div className="text-2xl font-bold text-neutral-900 tabular-nums">
              {metrics.co2SavedKg} kg CO₂e
            </div>
            <p className="text-[11px] text-neutral-500">
              ~{Math.round(metrics.co2SavedKg * 4.2)} km driven equivalent
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-1">
            <span className="text-neutral-500 uppercase text-[10px] font-bold block">Virtual Water Conserved</span>
            <div className="text-2xl font-bold text-emerald-800 tabular-nums">
              {metrics.waterSavedLiters.toLocaleString()} L
            </div>
            <p className="text-[11px] text-neutral-500">
              Conserved agricultural irrigation
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          2K. REPORTS AND DATA TOOLS SHORTCUTS
      ========================================================= */}
      <section ref={reportsRef} className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-800" />
              <h2 className="text-base font-bold text-neutral-900">
                Campus Reports & Data Export Centre
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Instant generation of RFC-compliant CSVs and printable audit PDFs for university administrators.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Page PDF</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 cursor-pointer"
            >
              <span>Full Reports Hub</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
          {[
            { title: 'Daily Report', onClick: () => onNavigate('reports') },
            { title: 'Weekly Report', onClick: () => onNavigate('reports') },
            { title: 'Monthly Report', onClick: () => onNavigate('reports') },
            { title: 'Export Inventory CSV', onClick: () => exportFoodRecordsToCsv(records) },
            { title: 'Export Redist CSV', onClick: () => exportRedistributionsToCsv(redistributions) },
            { title: 'Export Alerts CSV', onClick: () => exportAlertsToCsv(alerts) },
          ].map((rep, idx) => (
            <button
              key={idx}
              onClick={rep.onClick}
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 font-semibold text-neutral-800 hover:border-emerald-300 hover:bg-white transition-all cursor-pointer"
            >
              <span className="truncate">{rep.title}</span>
              <Download className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* =========================================================
          2L. TEST CENTRE & PROJECT INFORMATION
      ========================================================= */}
      <section ref={testCenterRef} className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-emerald-800" />
              <h2 className="text-base font-bold text-neutral-900">
                System Test Centre & Hackathon Verification
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Automated testing suite covering zero-leftovers, low attendance, negative weights, and MAPE accuracy.
            </p>
          </div>

          <button
            onClick={() => onNavigate('test-center')}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <span>Run 12 Test Scenarios</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3.5 space-y-1">
            <span className="font-bold text-neutral-900 block">1. Mathematical Integrity</span>
            <p className="text-neutral-600 leading-relaxed">
              Automated tests verify mass conservation: Prepared = Served + Leftover across all input edge cases.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3.5 space-y-1">
            <span className="font-bold text-neutral-900 block">2. Physical Safety Constraints</span>
            <p className="text-neutral-600 leading-relaxed">
              Software strictly blocks negative weights, inverted timestamps, and transfers exceeding available surplus.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3.5 space-y-1">
            <span className="font-bold text-neutral-900 block">3. Transparent Heuristics</span>
            <p className="text-neutral-600 leading-relaxed">
              Calculated using empirical university attendance coefficients with full audit log and zero fake AI tags.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-neutral-200 pt-8 text-xs text-neutral-500 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900 text-white font-bold text-xs">
              <Leaf className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <span className="font-bold text-neutral-900 block">FoodWise AI</span>
              <span className="text-[11px] text-neutral-500">Rathinam Global University · Smart Campus Food System</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-neutral-600">
            <button onClick={() => onNavigate('dashboard')} className="hover:text-emerald-800 cursor-pointer">
              Dashboard
            </button>
            <button onClick={() => onNavigate('inventory')} className="hover:text-emerald-800 cursor-pointer">
              Inventory
            </button>
            <button onClick={() => onNavigate('prediction')} className="hover:text-emerald-800 cursor-pointer">
              Prediction
            </button>
            <button onClick={() => onNavigate('reports')} className="hover:text-emerald-800 cursor-pointer">
              Reports
            </button>
            <button onClick={() => onNavigate('test-center')} className="hover:text-emerald-800 cursor-pointer">
              Test Centre
            </button>
            <button onClick={() => onNavigate('about')} className="hover:text-emerald-800 cursor-pointer">
              About
            </button>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-neutral-400">
          <span>Rathinam TechZone Campus, Coimbatore, Tamil Nadu 641021</span>
          <span>University Hackathon Project Edition · v2.1 All-In-One Production Architecture</span>
        </div>
      </footer>

      {/* MODALS */}
      {editingRecord && (
        <RecordFormModal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={(updated) => {
            onUpdateRecord(updated);
            setEditingRecord(null);
          }}
          existingRecord={editingRecord}
          existingRecords={records}
        />
      )}

      {viewingRecord && (
        <RecordDetailModal
          record={viewingRecord}
          isOpen={!!viewingRecord}
          onClose={() => setViewingRecord(null)}
          onEdit={(rec) => {
            setViewingRecord(null);
            setEditingRecord(rec);
          }}
          onRedistribute={(rec) => {
            setViewingRecord(null);
            setRedistTargetRecord(rec);
          }}
        />
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-xl">
            <div className="flex items-center gap-2 text-red-700 mb-2 font-bold text-sm">
              <AlertCircle className="h-5 w-5" />
              <span>Confirm Record Deletion</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              Are you sure you want to delete batch record <strong className="font-mono text-neutral-900">{deleteConfirmId}</strong>? All mass balance calculations will update automatically.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteRecord(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {redistTargetRecord && (
        <RedistributeModal
          isOpen={!!redistTargetRecord}
          onClose={() => setRedistTargetRecord(null)}
          foodRecord={redistTargetRecord}
          onSave={(newRedist) => {
            onSaveRedistribution(newRedist);
            // Sync with source record
            const source = records.find((r) => r.id === newRedist.recordId);
            if (source) {
              onUpdateRecord({
                ...source,
                quantityRedistributedKg: source.quantityRedistributedKg + newRedist.quantityRedistributedKg,
                status: newRedist.quantityRemainingKg <= 0.1 ? 'Redistributed' : 'Under Review',
                updatedAt: new Date().toISOString(),
              });
            }
            setRedistTargetRecord(null);
          }}
        />
      )}
    </div>
  );
};
