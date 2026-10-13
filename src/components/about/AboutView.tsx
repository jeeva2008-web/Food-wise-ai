import React from 'react';
import {
  Info,
  Layers,
  BrainCircuit,
  Scale,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Cpu,
  CheckCircle2,
  FlaskConical,
  Building,
} from 'lucide-react';
import { NavItemKey } from '../layout/Sidebar';

interface AboutViewProps {
  onNavigate: (tab: NavItemKey) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl space-y-8">
      {/* Hero Card */}
      <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
          <span>Rathinam Global University</span>
          <span>·</span>
          <span>Smart Campus Hackathon Innovation</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
          FoodWise AI — Smart Campus Food Management System
        </h1>
        <p className="mt-2 text-sm text-neutral-700 leading-relaxed max-w-2xl">
          A high-performance, explainable food sustainability platform designed specifically for the dining halls and hostel mess facilities of <strong>Rathinam Global University</strong> (Coimbatore). Engineered to predict meal demand, prevent avoidable kitchen waste, and coordinate prompt, safe redistribution to local community pantries.
        </p>

        {/* Action strip */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href="#judge-walkthrough"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
          >
            <span>Judge 5-Step Demonstration Guide</span>
            <ArrowRight className="h-4 w-4" />
          </a>
          <button
            onClick={() => onNavigate('test-center')}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            <FlaskConical className="h-4 w-4 text-emerald-800" />
            <span>Open Test Centre (12 Automated Tests)</span>
          </button>
        </div>
      </div>

      {/* 5-Step Interactive Judge Demonstration Walkthrough */}
      <div id="judge-walkthrough" className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-emerald-800" />
            <h2 className="text-base font-bold text-neutral-900">
              Interactive 5-Step Hackathon Demonstration Guide
            </h2>
          </div>
          <span className="text-xs text-neutral-500 font-medium">Click buttons to test live workflows</span>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3.5 rounded-xl border border-neutral-200 p-4 bg-neutral-50/50">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-xs font-bold text-white">
              1
            </span>
            <div className="flex-1 text-xs space-y-1">
              <h3 className="font-bold text-neutral-900 text-sm">
                Inspect Real-Time Campus Dashboard & Mass Balance Conservation
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                Observe live metrics computed directly from Rathinam dining records: Prepared, Served, Leftover, Rescued, and Discarded. Strict distinction between mass (kg) and discrete meal portions.
              </p>
              <button
                onClick={() => onNavigate('dashboard')}
                className="mt-2 inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline"
              >
                <span>Jump to Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3.5 rounded-xl border border-neutral-200 p-4 bg-neutral-50/50">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-xs font-bold text-white">
              2
            </span>
            <div className="flex-1 text-xs space-y-1">
              <h3 className="font-bold text-neutral-900 text-sm">
                Log a New Batch with Real-Time Validation
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                Enter a test batch with 45 kg prepared and 36 kg served. The system immediately calculates 9.0 kg remaining (20% surplus) while blocking negative quantities, inverted timestamps, or duplicates.
              </p>
              <button
                onClick={() => onNavigate('add-record')}
                className="mt-2 inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline"
              >
                <span>Try Add Food Record</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3.5 rounded-xl border border-neutral-200 p-4 bg-neutral-50/50">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-xs font-bold text-white">
              3
            </span>
            <div className="flex-1 text-xs space-y-1">
              <h3 className="font-bold text-neutral-900 text-sm">
                Simulate Explainable AI Demand Prediction & Batch Sensitivity
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                Move the student attendance slider from 480 to 220 (e.g. exam week). The explainable engine recalibrates required cooking volume, displays transparent math steps, and highlights how smaller batches avoid high surplus costs.
              </p>
              <button
                onClick={() => onNavigate('prediction')}
                className="mt-2 inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline"
              >
                <span>Test Demand Predictor</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3.5 rounded-xl border border-neutral-200 p-4 bg-neutral-50/50">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-xs font-bold text-white">
              4
            </span>
            <div className="flex-1 text-xs space-y-1">
              <h3 className="font-bold text-neutral-900 text-sm">
                Review Surplus Alerts & Execute Human-Approved Redistribution
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                Review threshold warnings for excess food, verify the mandatory 4-point HACCP food safety checklist, and record authorized handover to the Rathinam Hostel Block 4 Night Pantry with human signoff.
              </p>
              <button
                onClick={() => onNavigate('redistribution')}
                className="mt-2 inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline"
              >
                <span>Open Redistribution Pipeline</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex items-start gap-3.5 rounded-xl border border-neutral-200 p-4 bg-neutral-50/50">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-xs font-bold text-white">
              5
            </span>
            <div className="flex-1 text-xs space-y-1">
              <h3 className="font-bold text-neutral-900 text-sm">
                Execute Test Suite in Test Centre (12 Automated Tests)
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                Run automated assertions against physical edge cases: negative weights, inverse timestamps, attendance drops, and MAPE accuracy metrics with zero artificial passes.
              </p>
              <button
                onClick={() => onNavigate('test-center')}
                className="mt-2 inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline"
              >
                <span>Open Test Centre</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* University Context & Challenge */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Building className="h-4 w-4 text-emerald-800" />
            <span>The Rathinam Campus Dining Challenge</span>
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Rathinam Global University hosts thousands of students across engineering, arts, and management colleges. Fluctuating attendance during campus placement drives, festival weekends, and symposiums often leads to kitchen over-preparation of rice, sambar, and curries by up to 30%, which risks being discarded if not quickly redistributed.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-emerald-800" />
            <span>The FoodWise AI Solution</span>
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            By combining real-time weighing station logs, attendance correlations, and staggered 2-stage cooking recommendations, the university can reduce kitchen surplus before cooking starts. Inevitable leftovers are safely audited and directed to hostel night pantries and Coimbatore community kitchens.
          </p>
        </div>
      </div>

      {/* Technical Architecture */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-emerald-800" />
          <h2 className="text-base font-bold text-neutral-900">
            System Architecture & Engineering Implementation
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
            <strong className="text-neutral-900 block mb-1">Frontend Engineering</strong>
            <p className="text-neutral-600 leading-relaxed">
              React 19 + TypeScript + Vite + Tailwind CSS. Tabular numerals (`tabular-nums`), Recharts analytics, zero dead clicks, and full keyboard accessibility.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
            <strong className="text-neutral-900 block mb-1">Persistence & Data Layer</strong>
            <p className="text-neutral-600 leading-relaxed">
              Modular StorageService with localStorage caching, RFC-4180 CSV generation, and backup JSON serialization for database portability.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
            <strong className="text-neutral-900 block mb-1">AI & Mathematical Engines</strong>
            <p className="text-neutral-600 leading-relaxed">
              Explainable statistical heuristic with attendance ratios, sensitivity analysis, and optional server-side Google GenAI (Gemini 2.5) integration.
            </p>
          </div>
        </div>
      </div>

      {/* Core Mathematical Formulations */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Scale className="h-4 w-4 text-emerald-800" />
          <span>Core Mathematical Formulations</span>
        </h2>

        <div className="rounded-xl bg-neutral-50 p-4 font-mono text-xs text-neutral-800 space-y-2 border border-neutral-200">
          <div>
            <strong>1. Conservation of Mass:</strong> QuantityPrepared = QuantityServed + QuantityLeftover
          </div>
          <div>
            <strong>2. Surplus Allocation:</strong> QuantityLeftover = Reused + Redistributed + Discarded + Unallocated
          </div>
          <div>
            <strong>3. Empirical Demand:</strong> EstimatedDemand(kg) = (StudentAttendance &times; HistoricalUptakeRatio) &times; AverageServingWeight(kg)
          </div>
          <div>
            <strong>4. Diversion Efficiency:</strong> SurplusDiverted(%) = (QuantityReused + QuantityRedistributed) / TotalSurplus &times; 100
          </div>
        </div>
      </div>
    </div>
  );
};
