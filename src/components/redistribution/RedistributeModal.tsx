import React, { useState } from 'react';
import { X, Truck, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { RedistributionRecord, FoodRecord, RedistributionStatus } from '../../types';

interface RedistributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodRecord: FoodRecord | null;
  onSave: (record: RedistributionRecord) => void;
}

const RECIPIENTS = [
  'Rathinam Hostel Block 4 Student Night Pantry',
  'Coimbatore Shanti Shelter Kitchen (Echanari)',
  'Rathinam TechZone EcoCare Network',
  'Rathinam Staff Mess & Campus Security Evening Shift',
  'Coimbatore City Food Relief Network',
];

export const RedistributeModal: React.FC<RedistributeModalProps> = ({
  isOpen,
  onClose,
  foodRecord,
  onSave,
}) => {
  if (!isOpen || !foodRecord) return null;

  const maxAvailable = foodRecord.quantityRemainingKg;

  const [proposedRecipient, setProposedRecipient] = useState<string>(RECIPIENTS[0]);
  const [recipientContact, setRecipientContact] = useState<string>('+1 (555) 019-4820');
  const [quantityToRedistribute, setQuantityToRedistribute] = useState<number>(maxAvailable);
  const [approvedBy, setApprovedBy] = useState<string>('Prof. A. Sharma (Canteen Food Safety Supervisor)');
  const [actionNotes, setActionNotes] = useState<string>('Dispatched in clean insulated food cambros.');

  // Safety checklist
  const [tempVerified, setTempVerified] = useState<boolean>(true);
  const [sensoryTestPassed, setSensoryTestPassed] = useState<boolean>(true);
  const [packagedHygiene, setPackagedHygiene] = useState<boolean>(true);
  const [withinTimeWindow, setWithinTimeWindow] = useState<boolean>(true);

  // Status
  const [status, setStatus] = useState<RedistributionStatus>('Approved');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (quantityToRedistribute <= 0) {
      setError('Redistribution quantity must be greater than 0 kg.');
      return;
    }

    if (quantityToRedistribute > maxAvailable) {
      setError(`Quantity to redistribute (${quantityToRedistribute} kg) exceeds available surplus (${maxAvailable} kg).`);
      return;
    }

    if (!tempVerified || !sensoryTestPassed || !packagedHygiene || !withinTimeWindow) {
      setError('All 4 safety hygiene checklist items must be physically verified before surplus can be approved for redistribution.');
      return;
    }

    const now = new Date().toISOString();
    const redistRecord: RedistributionRecord = {
      id: `REDIST-${Date.now().toString().slice(-4)}`,
      recordId: foodRecord.id,
      foodName: foodRecord.foodName,
      category: foodRecord.category,
      quantityAvailableKg: maxAvailable,
      preparationDateTime: foodRecord.preparationDateTime,
      useByDateTime: foodRecord.useByDateTime,
      storageCondition: foodRecord.storageCondition,
      proposedRecipient,
      recipientContact,
      reviewStatus: status,
      approvedBy: status === 'Approved' || status === 'Redistributed' ? approvedBy : undefined,
      safetyChecklist: {
        tempVerified,
        sensoryTestPassed,
        packagedHygiene,
        withinTimeWindow,
      },
      quantityApprovedKg: quantityToRedistribute,
      quantityRedistributedKg: status === 'Redistributed' ? quantityToRedistribute : 0,
      quantityRemainingKg: Math.max(0, maxAvailable - quantityToRedistribute),
      actionNotes,
      createdAt: now,
      updatedAt: now,
    };

    onSave(redistRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-6 shadow-xl my-8">
        <div className="flex items-start justify-between border-b border-neutral-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-800">{foodRecord.id}</span>
              <span className="text-xs text-neutral-400">·</span>
              <span className="text-xs text-neutral-500">{foodRecord.category}</span>
            </div>
            <h2 className="text-base font-bold text-neutral-900 mt-1">
              Initiate Surplus Redistribution: {foodRecord.foodName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quantity selector */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1">
              <span>Quantity to Dispatch (Max: {maxAvailable} kg)</span>
              <span className="text-emerald-800 font-bold tabular-nums">
                {quantityToRedistribute} kg
              </span>
            </div>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max={maxAvailable}
              required
              value={quantityToRedistribute}
              onChange={(e) => setQuantityToRedistribute(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-bold tabular-nums focus:border-emerald-600 focus:outline-hidden"
            />
            <div className="text-[11px] text-neutral-500 mt-1">
              Will leave ~{(maxAvailable - quantityToRedistribute).toFixed(1)} kg remaining in kitchen.
            </div>
          </div>

          {/* Recipient Organization */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Designated Recipient Organization *
            </label>
            <select
              value={proposedRecipient}
              onChange={(e) => setProposedRecipient(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-800 focus:border-emerald-600 focus:outline-hidden"
            >
              {RECIPIENTS.map((rec) => (
                <option key={rec} value={rec}>
                  {rec}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Recipient Dispatch Contact
              </label>
              <input
                type="text"
                value={recipientContact}
                onChange={(e) => setRecipientContact(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Workflow Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RedistributionStatus)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden font-semibold"
              >
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved by Staff</option>
                <option value="Redistributed">Dispatched & Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Responsible Approver *
            </label>
            <input
              type="text"
              required
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Food Safety Physical Verification Checklist */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <span>Mandatory Food Safety Checklist</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Food safety rules require physical human verification prior to handover.
            </p>

            <div className="space-y-1.5 pt-1 text-xs text-neutral-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempVerified}
                  onChange={(e) => setTempVerified(e.target.checked)}
                  className="rounded text-emerald-700 accent-emerald-800"
                />
                <span>Holding temperature verified (&gt;=65°C for hot, &lt;=4°C for chilled)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sensoryTestPassed}
                  onChange={(e) => setSensoryTestPassed(e.target.checked)}
                  className="rounded text-emerald-700 accent-emerald-800"
                />
                <span>Sensory evaluation passed (aroma, texture, and visual integrity verified)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={packagedHygiene}
                  onChange={(e) => setPackagedHygiene(e.target.checked)}
                  className="rounded text-emerald-700 accent-emerald-800"
                />
                <span>Packed in sanitized, food-grade thermal containers with sealing lids</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={withinTimeWindow}
                  onChange={(e) => setWithinTimeWindow(e.target.checked)}
                  className="rounded text-emerald-700 accent-emerald-800"
                />
                <span>Dispatch is scheduled within safe 2-hour transit window before use-by deadline</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Handover Notes
            </label>
            <input
              type="text"
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
              placeholder="e.g. Van driver collected at 14:30 in insulated cambro #4"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Confirm Redistribution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
