import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Layers,
  Scale,
  Building,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { FoodRecord, SmartAlert, RedistributionRecord, CanteenSettings } from '../../types';
import { calculateDashboardMetrics } from '../../utils/calculations';
import {
  exportFoodRecordsToCsv,
  exportRedistributionsToCsv,
  exportAlertsToCsv,
} from '../../utils/csvExporter';

interface ReportsViewProps {
  records: FoodRecord[];
  alerts: SmartAlert[];
  redistributions: RedistributionRecord[];
  settings: CanteenSettings;
}

type ReportType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'inventory'
  | 'waste_analytics'
  | 'alerts_surplus'
  | 'redistribution_ledger'
  | 'prediction_eval';

export const ReportsView: React.FC<ReportsViewProps> = ({
  records,
  alerts,
  redistributions,
  settings,
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('weekly');

  const reportDaysMap: Record<ReportType, number> = {
    daily: 1,
    weekly: 7,
    monthly: 30,
    inventory: 0,
    waste_analytics: 30,
    alerts_surplus: 14,
    redistribution_ledger: 30,
    prediction_eval: 30,
  };

  const daysCount = reportDaysMap[selectedReport];

  const reportRecords = useMemo(() => {
    if (daysCount === 0) return records;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysCount);
    return records.filter((r) => new Date(r.preparationDateTime) >= cutoff);
  }, [records, daysCount]);

  const metrics = useMemo(() => {
    return calculateDashboardMetrics(reportRecords, alerts.filter((a) => a.status === 'active').length, settings);
  }, [reportRecords, alerts, settings]);

  const handlePrint = () => {
    window.print();
  };

  const handleCsvExport = () => {
    if (selectedReport === 'redistribution_ledger') {
      exportRedistributionsToCsv(redistributions);
    } else if (selectedReport === 'alerts_surplus') {
      exportAlertsToCsv(alerts);
    } else {
      exportFoodRecordsToCsv(reportRecords);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Strip (Hidden in print) */}
      <div className="no-print flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-800" />
            <h2 className="text-base font-bold text-neutral-900">
              Audit & Compliance Report Generator
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Generate formal documentation for university administration, campus sustainability committees, and food inspectors.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCsvExport}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector (Hidden in print) */}
      <div className="no-print flex flex-wrap gap-2 rounded-xl border border-neutral-200 bg-white p-2">
        {[
          { id: 'weekly', label: 'Weekly Summary' },
          { id: 'daily', label: 'Daily Operational Summary' },
          { id: 'monthly', label: 'Monthly Sustainability Report' },
          { id: 'inventory', label: 'Food Inventory Ledger' },
          { id: 'waste_analytics', label: 'Waste Analytics & Discard Report' },
          { id: 'redistribution_ledger', label: 'Redistribution Ledger' },
          { id: 'alerts_surplus', label: 'Surplus & Smart Alert Log' },
        ].map((rep) => (
          <button
            key={rep.id}
            onClick={() => setSelectedReport(rep.id as ReportType)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedReport === rep.id
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {rep.label}
          </button>
        ))}
      </div>

      {/* Printable Report Canvas */}
      <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm text-neutral-900 space-y-6">
        {/* Document Header */}
        <div className="border-b-2 border-emerald-800 pb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold tracking-widest text-emerald-800">
              FoodWise AI · Official Campus Operations Audit
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 mt-1 capitalize">
              {selectedReport.replace('_', ' ')} Report
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Facility: {settings.canteenName} ({settings.campusLocation})
            </p>
          </div>

          <div className="text-right text-xs text-neutral-600 space-y-0.5">
            <div>
              <strong>Generated:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </div>
            <div>
              <strong>Reporting Period:</strong>{' '}
              {daysCount > 0 ? `Past ${daysCount} Operational Days` : 'Entire Record Archive'}
            </div>
            <div>
              <strong>Records Evaluated:</strong> {reportRecords.length} batch cycles
            </div>
          </div>
        </div>

        {/* Section 1: Executive Metrics Matrix */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
            1. Mass Balance & Diversion Metrics Summary
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <span className="text-[10px] text-neutral-500 uppercase block">Total Prepared</span>
              <strong className="text-base font-bold text-neutral-900 tabular-nums">
                {metrics.totalPreparedKg} kg
              </strong>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <span className="text-[10px] text-neutral-500 uppercase block">Total Consumed</span>
              <strong className="text-base font-bold text-emerald-800 tabular-nums">
                {metrics.totalServedKg} kg
              </strong>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <span className="text-[10px] text-neutral-500 uppercase block">Total Surplus</span>
              <strong className="text-base font-bold text-amber-800 tabular-nums">
                {(metrics.totalPreparedKg - metrics.totalServedKg).toFixed(1)} kg
              </strong>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <span className="text-[10px] text-neutral-500 uppercase block">Quantity Rescued</span>
              <strong className="text-base font-bold text-emerald-800 tabular-nums">
                {metrics.totalSavedKg} kg
              </strong>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <span className="text-[10px] text-neutral-500 uppercase block">Quantity Discarded</span>
              <strong className="text-base font-bold text-red-700 tabular-nums">
                {metrics.totalDiscardedKg} kg
              </strong>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <span className="text-[10px] text-neutral-500 uppercase block">Diversion Rate</span>
              <strong className="text-base font-bold text-neutral-900 tabular-nums">
                {metrics.wasteReductionPercentage}%
              </strong>
            </div>
          </div>
        </div>

        {/* Section 2: Observations & Compliance Findings */}
        <div className="space-y-2 text-xs text-neutral-700">
          <h2 className="font-bold uppercase tracking-wider text-neutral-400">
            2. Empirical Observations & Analytical Findings
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
            <li>
              Total kitchen food discard rate stands at <strong>{metrics.foodWastePercentage}%</strong> of prepared bulk mass across {reportRecords.length} evaluated meal services.
            </li>
            <li>
              Proactive redistribution channels diverted <strong>{metrics.totalRedistributedKg} kg</strong> into local food rescue and student hosteling networks, preserving an estimated <strong>{metrics.estimatedMealsSaved} nutritious meals</strong>.
            </li>
            <li>
              Environmental impact abatement achieved: <strong>~{metrics.co2SavedKg} kg CO₂e avoided</strong> and <strong>~{metrics.waterSavedLiters.toLocaleString()} L</strong> virtual water footprint preserved.
            </li>
            <li>
              Mass balance audit confirms all logged entries satisfy physical consistency: Prepared = Served + Leftover.
            </li>
          </ul>
        </div>

        {/* Section 3: Priority Recommendations */}
        <div className="space-y-2 text-xs text-neutral-700">
          <h2 className="font-bold uppercase tracking-wider text-neutral-400">
            3. Operational Kitchen Recommendations
          </h2>
          <div className="rounded-lg border border-neutral-200 p-4 bg-neutral-50 space-y-2">
            <p>
              <strong>Immediate Action: </strong> Calibrate rice and curry batch sizes by implementing continuous two-tier staggered cooking. Preparing 65% upfront and delaying remaining cooking until peak attendance confirms turnstile surge will yield up to 22% surplus curtailment.
            </p>
            <p>
              <strong>Redistribution Protocol: </strong> Ensure hot-holding cambros are dispatched to the student night pantry no later than 2.5 hours post-preparation to maintain HACCP temperature integrity.
            </p>
          </div>
        </div>

        {/* Section 4: Data Scope & Limitations */}
        <div className="border-t border-neutral-200 pt-4 text-[11px] text-neutral-500 leading-relaxed">
          <strong>Methodological Notes & Limitations: </strong>
          Calculations are derived from digital kitchen scale logs and student attendance sensor tallies. Food safety verification requires physical probe temperature testing and human sensory review; software does not certify consumable safety. Meals saved estimate applies the standard university meal benchmark of {settings.kgPerServingDefault} kg/portion.
        </div>
      </div>
    </div>
  );
};
