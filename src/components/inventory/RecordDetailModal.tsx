import React from 'react';
import { X, Calendar, Clock, Scale, Thermometer, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { FoodRecord } from '../../types';

interface RecordDetailModalProps {
  record: FoodRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (record: FoodRecord) => void;
  onRedistribute?: (record: FoodRecord) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  isOpen,
  onClose,
  onEdit,
  onRedistribute,
}) => {
  if (!isOpen || !record) return null;

  const prep = record.quantityPreparedKg;
  const served = record.quantityServedKg;
  const remaining = record.quantityRemainingKg;
  const reused = record.quantityReusedKg;
  const redist = record.quantityRedistributedKg;
  const discarded = record.quantityDiscardedKg;
  const unallocated = Math.max(0, remaining - (reused + redist + discarded));

  const surplusPct = prep > 0 ? (remaining / prep) * 100 : 0;
  const prepTime = new Date(record.preparationDateTime).toLocaleString();
  const useByTime = record.useByDateTime ? new Date(record.useByDateTime).toLocaleString() : 'Not recorded';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-800">{record.id}</span>
              <span className="text-xs text-neutral-400">·</span>
              <span className="text-xs text-neutral-500">{record.category}</span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mt-1">{record.foodName}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mass Balance Breakdown */}
        <div className="my-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
            <span className="flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-emerald-800" />
              Mass Balance Audit
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">
              {prep.toFixed(1)}kg = {served.toFixed(1)}kg + {remaining.toFixed(1)}kg
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-md bg-white p-2 border border-neutral-200">
              <span className="block text-[10px] text-neutral-500 uppercase">Prepared</span>
              <span className="text-sm font-bold text-neutral-900 tabular-nums">{prep} kg</span>
            </div>
            <div className="rounded-md bg-white p-2 border border-neutral-200">
              <span className="block text-[10px] text-neutral-500 uppercase">Served</span>
              <span className="text-sm font-bold text-emerald-800 tabular-nums">{served} kg</span>
            </div>
            <div className="rounded-md bg-white p-2 border border-neutral-200">
              <span className="block text-[10px] text-neutral-500 uppercase">Leftover</span>
              <span className="text-sm font-bold text-amber-800 tabular-nums">
                {remaining} kg ({surplusPct.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Disposition Trail */}
          <div className="pt-2 border-t border-neutral-200 text-xs text-neutral-600">
            <div className="font-semibold text-neutral-800 mb-1">Leftover Allocation:</div>
            <div className="grid grid-cols-4 gap-1 text-[11px] tabular-nums">
              <div>Reused: <strong>{reused} kg</strong></div>
              <div>Redistributed: <strong>{redist} kg</strong></div>
              <div>Discarded: <strong>{discarded} kg</strong></div>
              <div>Unassigned: <strong className="text-amber-700">{unallocated.toFixed(1)} kg</strong></div>
            </div>
          </div>
        </div>

        {/* Operational Context */}
        <div className="grid grid-cols-2 gap-3 text-xs text-neutral-700 mb-4">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
            <div>
              <span className="block font-medium text-neutral-500">Prepared</span>
              <span className="text-neutral-900">{prepTime}</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
            <div>
              <span className="block font-medium text-neutral-500">Use-By Window</span>
              <span className="text-neutral-900">{useByTime}</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Thermometer className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
            <div>
              <span className="block font-medium text-neutral-500">Storage Environment</span>
              <span className="text-neutral-900">{record.storageCondition}</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
            <div>
              <span className="block font-medium text-neutral-500">Turnout & Servings</span>
              <span className="text-neutral-900">
                {record.studentAttendance} attendees · {record.actualServingsServed} servings
              </span>
            </div>
          </div>
        </div>

        {record.notes && (
          <div className="rounded-lg bg-neutral-50 p-2.5 text-xs text-neutral-600 border border-neutral-200/60 mb-5">
            <span className="font-semibold text-neutral-800">Notes: </span>
            {record.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
          {unallocated > 0 && onRedistribute && (
            <button
              onClick={() => {
                onRedistribute(record);
                onClose();
              }}
              className="rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Initiate Redistribution ({unallocated.toFixed(1)} kg)
            </button>
          )}
          <button
            onClick={() => {
              onEdit(record);
              onClose();
            }}
            className="rounded-lg border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Edit Record
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
