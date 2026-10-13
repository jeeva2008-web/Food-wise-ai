import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Scale,
  Clock,
  Share2,
  Trash2,
  CheckCircle2,
  Filter,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { FoodRecord, CanteenSettings } from '../../types';
import { NavItemKey } from '../layout/Sidebar';

interface SurplusDetectionViewProps {
  records: FoodRecord[];
  settings: CanteenSettings;
  onInitiateRedistribution: (record: FoodRecord) => void;
  onUpdateRecord: (record: FoodRecord) => void;
  onNavigate: (tab: NavItemKey) => void;
}

export const SurplusDetectionView: React.FC<SurplusDetectionViewProps> = ({
  records,
  settings,
  onInitiateRedistribution,
  onUpdateRecord,
  onNavigate,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Filter records that have remaining surplus
  const surplusRecords = useMemo(() => {
    return records
      .filter((r) => r.quantityRemainingKg > 0.2)
      .map((r) => {
        const prep = r.quantityPreparedKg;
        const rem = r.quantityRemainingKg;
        const pct = prep > 0 ? (rem / prep) * 100 : 0;
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (pct >= settings.surplusHighThreshold) severity = 'high';
        else if (pct >= settings.surplusMediumThreshold) severity = 'medium';

        return {
          ...r,
          surplusPercent: Math.round(pct * 10) / 10,
          surplusSeverity: severity,
        };
      })
      .filter((r) => selectedSeverity === 'all' || r.surplusSeverity === selectedSeverity)
      .sort((a, b) => b.quantityRemainingKg - a.quantityRemainingKg);
  }, [records, settings, selectedSeverity]);

  const handleMarkDiscarded = (record: FoodRecord) => {
    const updated: FoodRecord = {
      ...record,
      quantityDiscardedKg: record.quantityRemainingKg,
      status: 'Discarded',
      updatedAt: new Date().toISOString(),
      notes: `${record.notes || ''} [Discarded due to holding limit]`.trim(),
    };
    onUpdateRecord(updated);
  };

  const handleMarkReused = (record: FoodRecord) => {
    const updated: FoodRecord = {
      ...record,
      quantityReusedKg: record.quantityRemainingKg,
      status: 'Reused',
      updatedAt: new Date().toISOString(),
      notes: `${record.notes || ''} [Repurposed for evening snack counter]`.trim(),
    };
    onUpdateRecord(updated);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-bold text-neutral-900">
              Active Food Surplus Monitor
            </h2>
          </div>
          <button
            onClick={() => onNavigate('redistribution')}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline"
          >
            <span>Open Redistribution Queue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Real-time tracking of unserved food batches. Items are categorized by surplus severity threshold ({settings.surplusLowThreshold}% low, {settings.surplusMediumThreshold}% medium, {settings.surplusHighThreshold}% high) to ensure prompt diversion before holding deadlines expire.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-neutral-400" />
        <span className="text-xs font-semibold text-neutral-700">Filter Severity:</span>
        <div className="flex rounded-lg border border-neutral-200 bg-white p-1 text-xs font-medium">
          {['all', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`rounded-md px-3 py-1 uppercase text-[11px] font-bold transition-colors ${
                selectedSeverity === sev
                  ? 'bg-emerald-800 text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {sev === 'all' ? 'All Surpluses' : `${sev} Severity`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Surplus Cards */}
      {surplusRecords.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
          <h3 className="text-sm font-bold text-neutral-900">Zero Active Surplus</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            All logged batches are either fully consumed, redistributed to campus shelters, or accounted for.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {surplusRecords.map((item) => {
            const prepTime = new Date(item.preparationDateTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const useByTime = item.useByDateTime
              ? new Date(item.useByDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Unassigned';

            const mealsValue = Math.round(item.quantityRemainingKg / (settings.kgPerServingDefault || 0.35));

            return (
              <div
                key={item.id}
                className={`rounded-xl border bg-white p-5 shadow-2xs flex flex-col justify-between ${
                  item.surplusSeverity === 'high'
                    ? 'border-red-200 hover:border-red-300'
                    : item.surplusSeverity === 'medium'
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-mono text-neutral-400">{item.id}</span>
                      <h3 className="text-sm font-bold text-neutral-900 leading-snug">{item.foodName}</h3>
                      <span className="text-[11px] text-neutral-500">{item.category}</span>
                    </div>

                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        item.surplusSeverity === 'high'
                          ? 'bg-red-100 text-red-800'
                          : item.surplusSeverity === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.surplusSeverity} Surplus ({item.surplusPercent}%)
                    </span>
                  </div>

                  {/* Weight Stats */}
                  <div className="my-3 rounded-lg bg-neutral-50 p-3 text-xs border border-neutral-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-neutral-500">Unserved Leftover:</span>
                      <strong className="text-neutral-900 tabular-nums text-sm font-bold">
                        {item.quantityRemainingKg.toFixed(1)} kg
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Prepared: {item.quantityPreparedKg}kg · Served: {item.quantityServedKg}kg</span>
                      <span className="text-emerald-700 font-semibold">~{mealsValue} meals</span>
                    </div>
                  </div>

                  {/* Context */}
                  <div className="space-y-1 text-[11px] text-neutral-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <span>Cooked at {prepTime} · Use by {useByTime}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 truncate">
                      {item.storageCondition}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-neutral-100 pt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onInitiateRedistribution(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Redistribute</span>
                  </button>

                  <button
                    onClick={() => handleMarkReused(item)}
                    title="Repurpose for snacks / next service"
                    className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Reuse
                  </button>

                  <button
                    onClick={() => handleMarkDiscarded(item)}
                    title="Mark Discarded to compost"
                    className="rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
