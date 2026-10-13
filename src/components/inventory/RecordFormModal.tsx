import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Scale } from 'lucide-react';
import { FoodRecord, FoodCategory, StorageCondition, RecordStatus } from '../../types';
import { validateFoodRecord } from '../../utils/validation';

interface RecordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: FoodRecord) => void;
  existingRecord?: FoodRecord | null;
  existingRecords: FoodRecord[];
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

const STATUSES: RecordStatus[] = [
  'Recorded',
  'Surplus Active',
  'Under Review',
  'Redistributed',
  'Reused',
  'Discarded',
];

export const RecordFormModal: React.FC<RecordFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingRecord,
  existingRecords,
}) => {
  const [formData, setFormData] = useState<Partial<FoodRecord>>({
    foodName: '',
    category: 'Main Course',
    quantityPreparedKg: 0,
    quantityServedKg: 0,
    quantityRemainingKg: 0,
    expectedDemandServings: 0,
    actualServingsServed: 0,
    studentAttendance: 0,
    preparationDateTime: new Date().toISOString().slice(0, 16),
    useByDateTime: new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 16),
    storageCondition: 'Hot Holding (>=65°C)',
    storageNotes: '',
    quantityReusedKg: 0,
    quantityRedistributedKg: 0,
    quantityDiscardedKg: 0,
    status: 'Recorded',
    notes: '',
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (existingRecord) {
      setFormData({
        ...existingRecord,
        preparationDateTime: existingRecord.preparationDateTime.slice(0, 16),
        useByDateTime: existingRecord.useByDateTime ? existingRecord.useByDateTime.slice(0, 16) : '',
      });
    } else {
      setFormData({
        foodName: '',
        category: 'Main Course',
        quantityPreparedKg: 0,
        quantityServedKg: 0,
        quantityRemainingKg: 0,
        expectedDemandServings: 0,
        actualServingsServed: 0,
        studentAttendance: 0,
        preparationDateTime: new Date().toISOString().slice(0, 16),
        useByDateTime: new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 16),
        storageCondition: 'Hot Holding (>=65°C)',
        storageNotes: '',
        quantityReusedKg: 0,
        quantityRedistributedKg: 0,
        quantityDiscardedKg: 0,
        status: 'Recorded',
        notes: '',
      });
    }
    setErrors([]);
    setWarnings([]);
  }, [existingRecord, isOpen]);

  // Dynamic automatic calculation of remaining quantity and default servings
  const handlePreparedChange = (val: number) => {
    const served = Number(formData.quantityServedKg) || 0;
    const remaining = Math.max(0, Math.round((val - served) * 100) / 100);
    const expected = Math.round(val / 0.35);
    setFormData((prev) => ({
      ...prev,
      quantityPreparedKg: val,
      quantityRemainingKg: remaining,
      expectedDemandServings: prev.expectedDemandServings || expected,
    }));
  };

  const handleServedChange = (val: number) => {
    const prep = Number(formData.quantityPreparedKg) || 0;
    const remaining = Math.max(0, Math.round((prep - val) * 100) / 100);
    const actualServings = Math.round(val / 0.35);
    setFormData((prev) => ({
      ...prev,
      quantityServedKg: val,
      quantityRemainingKg: remaining,
      actualServingsServed: actualServings,
      status: remaining > 2 ? 'Surplus Active' : prev.status,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const prep = Number(formData.quantityPreparedKg) || 0;
    const serv = Number(formData.quantityServedKg) || 0;
    const rem = Math.round((prep - serv) * 100) / 100;

    const recordToValidate: Partial<FoodRecord> = {
      ...formData,
      quantityPreparedKg: prep,
      quantityServedKg: serv,
      quantityRemainingKg: rem,
      quantityReusedKg: Number(formData.quantityReusedKg) || 0,
      quantityRedistributedKg: Number(formData.quantityRedistributedKg) || 0,
      quantityDiscardedKg: Number(formData.quantityDiscardedKg) || 0,
      expectedDemandServings: Number(formData.expectedDemandServings) || 0,
      actualServingsServed: Number(formData.actualServingsServed) || 0,
      studentAttendance: Number(formData.studentAttendance) || 0,
      preparationDateTime: new Date(formData.preparationDateTime || '').toISOString(),
      useByDateTime: formData.useByDateTime ? new Date(formData.useByDateTime).toISOString() : '',
    };

    const validation = validateFoodRecord(
      recordToValidate,
      existingRecords,
      existingRecord?.id
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      setWarnings(validation.warnings);
      return;
    }

    const now = new Date().toISOString();
    const finalRecord: FoodRecord = {
      id: existingRecord?.id || `FW-${Date.now().toString().slice(-4)}`,
      foodName: recordToValidate.foodName!.trim(),
      category: recordToValidate.category as FoodCategory,
      quantityPreparedKg: recordToValidate.quantityPreparedKg!,
      quantityServedKg: recordToValidate.quantityServedKg!,
      quantityRemainingKg: rem,
      expectedDemandServings: recordToValidate.expectedDemandServings!,
      actualServingsServed: recordToValidate.actualServingsServed!,
      studentAttendance: recordToValidate.studentAttendance!,
      preparationDateTime: recordToValidate.preparationDateTime!,
      useByDateTime: recordToValidate.useByDateTime!,
      storageCondition: recordToValidate.storageCondition as StorageCondition,
      storageNotes: recordToValidate.storageNotes,
      quantityReusedKg: recordToValidate.quantityReusedKg!,
      quantityRedistributedKg: recordToValidate.quantityRedistributedKg!,
      quantityDiscardedKg: recordToValidate.quantityDiscardedKg!,
      status: recordToValidate.status as RecordStatus,
      notes: recordToValidate.notes,
      createdAt: existingRecord?.createdAt || now,
      updatedAt: now,
      isSimulated: existingRecord?.isSimulated || false,
    };

    onSave(finalRecord);
    onClose();
  };

  if (!isOpen) return null;

  const currentPrepared = Number(formData.quantityPreparedKg) || 0;
  const currentServed = Number(formData.quantityServedKg) || 0;
  const calculatedSurplus = Math.max(0, currentPrepared - currentServed);
  const surplusPct = currentPrepared > 0 ? (calculatedSurplus / currentPrepared) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-neutral-200 bg-white shadow-xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              {existingRecord ? 'Edit Food Record' : 'Log Food Preparation Batch'}
            </h2>
            <p className="text-xs text-neutral-500">
              Ensure accurate scale weights for mass balance tracking
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Please correct the following errors:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>Notice:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Food Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Steamed Basmati Rice"
                value={formData.foodName}
                onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Food Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as FoodCategory })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mass Balance Quantities (kg) */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-emerald-800" />
                Weight Measurements (Kilograms)
              </span>
              <span className="text-[11px] text-neutral-500">
                Formula: Remaining = Prepared - Served
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  Quantity Prepared (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={formData.quantityPreparedKg || ''}
                  onChange={(e) => handlePreparedChange(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm tabular-nums font-semibold focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  Quantity Served (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.quantityServedKg || ''}
                  onChange={(e) => handleServedChange(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm tabular-nums font-semibold focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  Calculated Leftover (kg)
                </label>
                <div className="flex items-center h-9 rounded-lg border border-neutral-200 bg-neutral-100 px-3 text-sm font-bold text-neutral-800 tabular-nums">
                  {calculatedSurplus.toFixed(1)} kg ({surplusPct.toFixed(1)}%)
                </div>
              </div>
            </div>
          </div>

          {/* Demand & Attendance Correlation */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Student Attendance
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 450"
                value={formData.studentAttendance || ''}
                onChange={(e) => setFormData({ ...formData, studentAttendance: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Expected Demand (servings)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 130"
                value={formData.expectedDemandServings || ''}
                onChange={(e) => setFormData({ ...formData, expectedDemandServings: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Actual Servings Served
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 115"
                value={formData.actualServingsServed || ''}
                onChange={(e) => setFormData({ ...formData, actualServingsServed: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Time & Storage */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Preparation Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.preparationDateTime}
                onChange={(e) => setFormData({ ...formData, preparationDateTime: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Use-By Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.useByDateTime}
                onChange={(e) => setFormData({ ...formData, useByDateTime: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Storage Method
              </label>
              <select
                value={formData.storageCondition}
                onChange={(e) => setFormData({ ...formData, storageCondition: e.target.value as StorageCondition })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
              >
                {STORAGE_CONDITIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Disposition Breakdown (When Editing or Logging Disposition) */}
          <div className="rounded-lg border border-neutral-200 p-3 bg-white">
            <label className="block text-xs font-bold text-neutral-800 mb-2">
              Surplus Allocation (Reused / Redistributed / Discarded)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-600 mb-1">Reused (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.quantityReusedKg || ''}
                  onChange={(e) => setFormData({ ...formData, quantityReusedKg: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-neutral-300 px-2.5 py-1 text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-600 mb-1">Redistributed (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.quantityRedistributedKg || ''}
                  onChange={(e) => setFormData({ ...formData, quantityRedistributedKg: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-neutral-300 px-2.5 py-1 text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-600 mb-1">Discarded (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.quantityDiscardedKg || ''}
                  onChange={(e) => setFormData({ ...formData, quantityDiscardedKg: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-neutral-300 px-2.5 py-1 text-xs tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Status and Notes */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Batch Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as RecordStatus })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Operational Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Insulated thermal cambro #3"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-800 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
            >
              {existingRecord ? 'Update Record' : 'Save Batch Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
