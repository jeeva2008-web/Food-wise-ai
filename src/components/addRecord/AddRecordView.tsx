import React, { useState } from 'react';
import {
  PlusCircle,
  Scale,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { FoodRecord, FoodCategory, StorageCondition } from '../../types';
import { validateFoodRecord } from '../../utils/validation';
import { NavItemKey } from '../layout/Sidebar';

interface AddRecordViewProps {
  records: FoodRecord[];
  onAddRecord: (record: FoodRecord) => void;
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

const STORAGE_CONDITIONS: StorageCondition[] = [
  'Hot Holding (>=65°C)',
  'Chilled Storage (<=4°C)',
  'Frozen Storage (<=-18°C)',
  'Ambient / Room Temperature (20-25°C)',
  'Dry Pantry Storage',
];

export const AddRecordView: React.FC<AddRecordViewProps> = ({
  records,
  onAddRecord,
  onNavigate,
}) => {
  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Main Course');
  const [quantityPreparedKg, setQuantityPreparedKg] = useState<number>(35);
  const [quantityServedKg, setQuantityServedKg] = useState<number>(30);
  const [studentAttendance, setStudentAttendance] = useState<number>(450);
  const [expectedDemandServings, setExpectedDemandServings] = useState<number>(100);
  const [actualServingsServed, setActualServingsServed] = useState<number>(85);
  const [preparationDateTime, setPreparationDateTime] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [useByDateTime, setUseByDateTime] = useState<string>(
    new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 16)
  );
  const [storageCondition, setStorageCondition] = useState<StorageCondition>(
    'Hot Holding (>=65°C)'
  );
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [savedSuccess, setSavedSuccess] = useState<FoodRecord | null>(null);

  // Auto-calculated variables
  const prep = Number(quantityPreparedKg) || 0;
  const served = Number(quantityServedKg) || 0;
  const remaining = Math.max(0, Math.round((prep - served) * 100) / 100);
  const surplusPct = prep > 0 ? (remaining / prep) * 100 : 0;

  const handleQuickPortion = (kgPerPortion: number) => {
    if (prep > 0) {
      setExpectedDemandServings(Math.round(prep / kgPerPortion));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const recordToValidate: Partial<FoodRecord> = {
      foodName: foodName.trim(),
      category,
      quantityPreparedKg: prep,
      quantityServedKg: served,
      quantityRemainingKg: remaining,
      expectedDemandServings: Number(expectedDemandServings) || 0,
      actualServingsServed: Number(actualServingsServed) || 0,
      studentAttendance: Number(studentAttendance) || 0,
      preparationDateTime: new Date(preparationDateTime).toISOString(),
      useByDateTime: useByDateTime ? new Date(useByDateTime).toISOString() : '',
      storageCondition,
      quantityReusedKg: 0,
      quantityRedistributedKg: 0,
      quantityDiscardedKg: 0,
    };

    const val = validateFoodRecord(recordToValidate, records);
    if (!val.isValid) {
      setErrors(val.errors);
      setWarnings(val.warnings);
      setSavedSuccess(null);
      return;
    }

    const now = new Date().toISOString();
    const newRecord: FoodRecord = {
      id: `FW-${Date.now().toString().slice(-4)}`,
      foodName: foodName.trim(),
      category,
      quantityPreparedKg: prep,
      quantityServedKg: served,
      quantityRemainingKg: remaining,
      expectedDemandServings: Number(expectedDemandServings) || 0,
      actualServingsServed: Number(actualServingsServed) || 0,
      studentAttendance: Number(studentAttendance) || 0,
      preparationDateTime: new Date(preparationDateTime).toISOString(),
      useByDateTime: useByDateTime ? new Date(useByDateTime).toISOString() : '',
      storageCondition,
      storageNotes: notes,
      quantityReusedKg: 0,
      quantityRedistributedKg: 0,
      quantityDiscardedKg: 0,
      status: remaining > 2 ? 'Surplus Active' : 'Recorded',
      notes,
      createdAt: now,
      updatedAt: now,
      isSimulated: false,
    };

    onAddRecord(newRecord);
    setSavedSuccess(newRecord);
    setErrors([]);
    setWarnings(val.warnings);

    // Reset inputs for next batch
    setFoodName('');
    setNotes('');
  };

  return (
    <div className="max-w-4xl space-y-6">
      {savedSuccess && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-bold">
                Batch Logged Successfully (Record ID: {savedSuccess.id})
              </h2>
            </div>
            <button
              onClick={() => setSavedSuccess(null)}
              className="text-xs text-neutral-400 hover:text-neutral-700"
            >
              Dismiss
            </button>
          </div>
          <p className="mt-1 text-xs text-neutral-700">
            Recorded {savedSuccess.quantityPreparedKg} kg of {savedSuccess.foodName}. Leftover: {savedSuccess.quantityRemainingKg} kg ({((savedSuccess.quantityRemainingKg / savedSuccess.quantityPreparedKg) * 100).toFixed(1)}%).
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
            >
              <span>View in Inventory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            {savedSuccess.quantityRemainingKg > 2 && (
              <button
                onClick={() => onNavigate('surplus')}
                className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline"
              >
                <span>Check Surplus Alerts</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Guide Card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-sm">
          <Info className="h-4 w-4" />
          <span>University Dining Hall Batch Intake Guidelines</span>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Record batch measurements immediately after weighing on calibrated kitchen scales. Mass balance ensures accurate detection of unconsumed food so our AI model can evaluate demand and prevent avoidable canteen discard.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-6 space-y-6 shadow-2xs">
        {errors.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>Submission Blocked - Validation Errors:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 1: Item & Category */}
        <div>
          <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 mb-3">
            1. Food Identification
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Food Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Steamed Basmati Rice or Madras Sambar"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-hidden"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Mass Balance Weigh-In */}
        <div>
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-3">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-emerald-800" />
              2. Mass Balance Weigh-In (Kilograms)
            </h2>
            <span className="text-[11px] text-neutral-400">Continuous mass accountability</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Quantity Prepared (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={quantityPreparedKg || ''}
                onChange={(e) => setQuantityPreparedKg(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-bold tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
              <span className="text-[11px] text-neutral-400">Total cooked weight</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Quantity Served (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={quantityServedKg || ''}
                onChange={(e) => setQuantityServedKg(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-bold tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
              <span className="text-[11px] text-neutral-400">Dispensed to students</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Calculated Leftover (kg)
              </label>
              <div className="flex h-9.5 items-center rounded-lg border border-neutral-200 bg-neutral-100 px-3 text-sm font-bold tabular-nums text-neutral-900">
                {remaining.toFixed(1)} kg ({surplusPct.toFixed(1)}%)
              </div>
              <span className="text-[11px] text-neutral-400">Prepared minus served</span>
            </div>
          </div>
        </div>

        {/* Section 3: Attendance & Servings Correlation */}
        <div>
          <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 mb-3">
            3. Attendance & Demand Ratios
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Student Attendance (Turnout)
              </label>
              <input
                type="number"
                min="0"
                placeholder="450"
                value={studentAttendance || ''}
                onChange={(e) => setStudentAttendance(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Expected Servings
              </label>
              <input
                type="number"
                min="0"
                placeholder="100"
                value={expectedDemandServings || ''}
                onChange={(e) => setExpectedDemandServings(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-neutral-500">
                <span>Quick:</span>
                <button
                  type="button"
                  onClick={() => handleQuickPortion(0.35)}
                  className="text-emerald-800 hover:underline"
                >
                  0.35 kg/portion
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => handleQuickPortion(0.25)}
                  className="text-emerald-800 hover:underline"
                >
                  0.25 kg
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Actual Servings Served
              </label>
              <input
                type="number"
                min="0"
                placeholder="85"
                value={actualServingsServed || ''}
                onChange={(e) => setActualServingsServed(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Timestamps & Food Safety */}
        <div>
          <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 mb-3">
            4. Timestamps & Holding Environment
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Cooking / Preparation Time *
              </label>
              <input
                type="datetime-local"
                required
                value={preparationDateTime}
                onChange={(e) => setPreparationDateTime(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Use-By Safety Window *
              </label>
              <input
                type="datetime-local"
                required
                value={useByDateTime}
                onChange={(e) => setUseByDateTime(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Storage Method *
              </label>
              <select
                value={storageCondition}
                onChange={(e) => setStorageCondition(e.target.value as StorageCondition)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              >
                {STORAGE_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Notes */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Chef & Shift Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Prepared for lunch shift Block A; insulated thermal vessel #2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
          />
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between border-t border-neutral-200 pt-5">
          <div className="text-xs text-neutral-500">
            Mass balance check: <strong>{prep} kg = {served} kg + {remaining} kg</strong>
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Save Food Record</span>
          </button>
        </div>
      </form>
    </div>
  );
};
