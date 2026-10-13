import React, { useState, useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  ShieldAlert,
  Thermometer,
  CheckCircle2,
  Filter,
  Info,
} from 'lucide-react';
import { FoodRecord } from '../../types';

interface FreshnessTrackingViewProps {
  records: FoodRecord[];
  onUpdateRecord: (record: FoodRecord) => void;
}

export const FreshnessTrackingView: React.FC<FreshnessTrackingViewProps> = ({
  records,
  onUpdateRecord,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const now = new Date().getTime();

  // Evaluate records based on deadline and current time
  const evaluatedRecords = useMemo(() => {
    return records
      .map((r) => {
        if (!r.useByDateTime) {
          return {
            ...r,
            deadlineStatus: 'missing_deadline' as const,
            hoursRemaining: null,
          };
        }

        const useByTime = new Date(r.useByDateTime).getTime();
        const diffHours = (useByTime - now) / (1000 * 60 * 60);

        let deadlineStatus: 'approaching' | 'expired' | 'safe' = 'safe';
        if (diffHours <= 0) {
          deadlineStatus = 'expired';
        } else if (diffHours <= 3.5) {
          deadlineStatus = 'approaching';
        }

        return {
          ...r,
          deadlineStatus,
          hoursRemaining: Math.round(diffHours * 10) / 10,
        };
      })
      .filter((r) => {
        if (filterType === 'all') return true;
        if (filterType === 'approaching') return r.deadlineStatus === 'approaching';
        if (filterType === 'expired') return r.deadlineStatus === 'expired';
        if (filterType === 'missing') return r.deadlineStatus === 'missing_deadline';
        return true;
      })
      .sort((a, b) => {
        // Expired first, then approaching
        const score = (status: string) => (status === 'expired' ? 3 : status === 'approaching' ? 2 : 1);
        return score(b.deadlineStatus) - score(a.deadlineStatus);
      });
  }, [records, now, filterType]);

  const handleMarkInspectedSafe = (record: FoodRecord) => {
    onUpdateRecord({
      ...record,
      status: 'Under Review',
      notes: `${record.notes || ''} [Physical temperature & sensory inspection verified by chef]`.trim(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleMarkDiscardSafety = (record: FoodRecord) => {
    onUpdateRecord({
      ...record,
      quantityDiscardedKg: record.quantityRemainingKg,
      status: 'Discarded',
      notes: `${record.notes || ''} [Holding deadline elapsed; discarded per food safety guidelines]`.trim(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Mandatory Regulatory Food Safety Disclaimer Banner */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-5 shadow-2xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-amber-900">
              Food Safety Compliance Notice & Human Verification Protocol
            </h2>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Critical Requirement:</strong> Food safety cannot be determined solely by software algorithms, automated countdown timers, or visual appearance. Software does not certify food as safe to consume. All cooked batches require mandatory physical temperature checks (probe thermometer &ge;65&deg;C for hot holding, &le;4&deg;C for chilled) and evaluation by certified kitchen staff before serving, redistribution, or consumption.
            </p>
          </div>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-800" />
          <h3 className="text-xs font-bold text-neutral-800">Filter Freshness State:</h3>
          <div className="flex rounded-lg border border-neutral-200 bg-white p-1 text-xs font-medium">
            {[
              { id: 'all', label: 'All Batches' },
              { id: 'approaching', label: 'Approaching Deadline' },
              { id: 'expired', label: 'Past Deadline (Audit Required)' },
              { id: 'missing', label: 'Missing Deadline' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilterType(btn.id)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  filterType === btn.id
                    ? 'bg-emerald-800 text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-neutral-500">
          Tracking <strong className="text-neutral-900 tabular-nums">{evaluatedRecords.length}</strong> active batches
        </span>
      </div>

      {/* Freshness Feed Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {evaluatedRecords.map((item) => {
          const prepTime = new Date(item.preparationDateTime).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const useByTime = item.useByDateTime
            ? new Date(item.useByDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Missing';

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-5 flex flex-col justify-between shadow-2xs ${
                item.deadlineStatus === 'expired'
                  ? 'border-red-300 bg-red-50/40'
                  : item.deadlineStatus === 'approaching'
                  ? 'border-amber-300 bg-amber-50/40'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400">{item.id}</span>
                    <h4 className="text-sm font-bold text-neutral-900">{item.foodName}</h4>
                    <span className="text-[11px] text-neutral-500">{item.category}</span>
                  </div>

                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                      item.deadlineStatus === 'expired'
                        ? 'bg-red-600 text-white'
                        : item.deadlineStatus === 'approaching'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.deadlineStatus === 'expired'
                      ? 'Past Deadline'
                      : item.deadlineStatus === 'approaching'
                      ? 'Approaching'
                      : 'Active Window'}
                  </span>
                </div>

                {/* Remaining Time / Counter */}
                <div className="my-3 rounded-lg bg-white p-3 border border-neutral-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Leftover Volume:</span>
                    <strong className="text-neutral-900 tabular-nums">
                      {item.quantityRemainingKg.toFixed(1)} kg
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Holding Method:</span>
                    <span className="text-neutral-700 truncate max-w-[150px]">{item.storageCondition}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Holding Window:</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        item.deadlineStatus === 'expired'
                          ? 'text-red-700'
                          : item.deadlineStatus === 'approaching'
                          ? 'text-amber-800'
                          : 'text-neutral-800'
                      }`}
                    >
                      {item.hoursRemaining !== null
                        ? item.hoursRemaining <= 0
                          ? `${Math.abs(item.hoursRemaining)}h overdue`
                          : `${item.hoursRemaining}h remaining`
                        : 'No use-by set'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-500 space-y-0.5 mb-3">
                  <div>Cooked: {prepTime}</div>
                  <div>Use-by deadline: {useByTime}</div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="border-t border-neutral-100 pt-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleMarkInspectedSafe(item)}
                  className="flex-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 text-center"
                >
                  Log Physical Audit
                </button>
                {item.quantityRemainingKg > 0 && (
                  <button
                    onClick={() => handleMarkDiscardSafety(item)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors"
                  >
                    Safely Discard
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
