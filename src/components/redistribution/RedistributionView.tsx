import React, { useState, useMemo } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  Share2,
  AlertCircle,
  Building,
  UserCheck,
} from 'lucide-react';
import { RedistributionRecord, FoodRecord, CanteenSettings } from '../../types';
import { RedistributeModal } from './RedistributeModal';
import { exportRedistributionsToCsv } from '../../utils/csvExporter';

interface RedistributionViewProps {
  redistributions: RedistributionRecord[];
  records: FoodRecord[];
  settings: CanteenSettings;
  onSaveRedistribution: (record: RedistributionRecord) => void;
  onUpdateFoodRecord: (record: FoodRecord) => void;
}

export const RedistributionView: React.FC<RedistributionViewProps> = ({
  redistributions,
  records,
  settings,
  onSaveRedistribution,
  onUpdateFoodRecord,
}) => {
  const [selectedRecordForRedist, setSelectedRecordForRedist] = useState<FoodRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmCompleteId, setConfirmCompleteId] = useState<string | null>(null);

  // Available surplus records that haven't been fully routed yet
  const availableSurplus = useMemo(() => {
    return records.filter((r) => r.quantityRemainingKg > 0.5 && r.status !== 'Discarded');
  }, [records]);

  // Aggregate stats
  const totalRedistributedKg = useMemo(() => {
    return redistributions.reduce((acc, r) => acc + (r.quantityRedistributedKg || 0), 0);
  }, [redistributions]);

  const mealsDiverted = Math.round(totalRedistributedKg / (settings.kgPerServingDefault || 0.35));

  const handleOpenRedist = (record: FoodRecord) => {
    setSelectedRecordForRedist(record);
    setIsModalOpen(true);
  };

  const handleRedistributionSave = (newRedist: RedistributionRecord) => {
    onSaveRedistribution(newRedist);

    // Sync back with source food record
    const source = records.find((r) => r.id === newRedist.recordId);
    if (source) {
      const updatedSource: FoodRecord = {
        ...source,
        quantityRedistributedKg: source.quantityRedistributedKg + newRedist.quantityRedistributedKg,
        status: newRedist.quantityRemainingKg <= 0.1 ? 'Redistributed' : 'Under Review',
        updatedAt: new Date().toISOString(),
      };
      onUpdateFoodRecord(updatedSource);
    }
  };

  const handleMarkComplete = (item: RedistributionRecord) => {
    const updated: RedistributionRecord = {
      ...item,
      reviewStatus: 'Redistributed',
      quantityRedistributedKg: item.quantityApprovedKg,
      updatedAt: new Date().toISOString(),
    };
    onSaveRedistribution(updated);

    // Update parent food record
    const source = records.find((r) => r.id === item.recordId);
    if (source) {
      const updatedSource: FoodRecord = {
        ...source,
        quantityRedistributedKg: source.quantityRedistributedKg + item.quantityApprovedKg,
        status: 'Redistributed',
        updatedAt: new Date().toISOString(),
      };
      onUpdateFoodRecord(updatedSource);
    }
    setConfirmCompleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Intro & Workflow banner */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-800" />
            <h2 className="text-base font-bold text-neutral-900">
              Food Surplus Redistribution Pipeline
            </h2>
          </div>
          <button
            onClick={() => exportRedistributionsToCsv(redistributions)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Redistribution CSV</span>
          </button>
        </div>

        {/* 4-Step Visual Sequence */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-2">
          <div className="rounded-lg bg-neutral-50 p-2.5 border border-neutral-200/60 text-xs">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Step 1</span>
            <span className="font-bold text-neutral-800">1. Available Surplus</span>
            <p className="text-[11px] text-neutral-500 mt-0.5">Weighed & identified unserved food</p>
          </div>
          <div className="rounded-lg bg-neutral-50 p-2.5 border border-neutral-200/60 text-xs">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Step 2</span>
            <span className="font-bold text-neutral-800">2. Under Review</span>
            <p className="text-[11px] text-neutral-500 mt-0.5">Holding temp & sensory inspection</p>
          </div>
          <div className="rounded-lg bg-neutral-50 p-2.5 border border-neutral-200/60 text-xs">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Step 3</span>
            <span className="font-bold text-neutral-800">3. Staff Approval</span>
            <p className="text-[11px] text-neutral-500 mt-0.5">Authorized handover & thermal packaging</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-200 text-xs">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Step 4</span>
            <span className="font-bold text-emerald-900">4. Community Transfer</span>
            <p className="text-[11px] text-emerald-700 mt-0.5">Delivered to partner pantry / shelter</p>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 font-medium">Cumulative Food Rescued</span>
          <div className="text-xl font-bold text-emerald-800 tabular-nums mt-1">
            {totalRedistributedKg.toFixed(1)} <span className="text-xs font-normal text-neutral-500">kg</span>
          </div>
          <span className="text-[11px] text-neutral-400">Successfully transferred</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 font-medium">Nutritious Meals Provided</span>
          <div className="text-xl font-bold text-neutral-900 tabular-nums mt-1">
            {mealsDiverted.toLocaleString()} <span className="text-xs font-normal text-neutral-500">meals</span>
          </div>
          <span className="text-[11px] text-neutral-400">Across campus & community partners</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <span className="text-xs text-neutral-500 font-medium">Pending Unallocated Surplus</span>
          <div className="text-xl font-bold text-amber-800 tabular-nums mt-1">
            {availableSurplus.reduce((a, b) => a + b.quantityRemainingKg, 0).toFixed(1)}{' '}
            <span className="text-xs font-normal text-neutral-500">kg</span>
          </div>
          <span className="text-[11px] text-amber-700 font-medium">
            {availableSurplus.length} batches awaiting dispatch
          </span>
        </div>
      </div>

      {/* Section 1: Ready Surplus to Dispatch */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <h3 className="text-sm font-bold text-neutral-900">
            Available Kitchen Surplus Ready for Dispatch
          </h3>
          <span className="text-xs text-neutral-400">
            {availableSurplus.length} items currently available
          </span>
        </div>

        {availableSurplus.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4 text-center">
            No unallocated surplus currently awaiting dispatch.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableSurplus.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-neutral-200 p-3 hover:border-emerald-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono mb-1">
                    <span>{item.id}</span>
                    <span className="text-neutral-500 font-sans">{item.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900">{item.foodName}</h4>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Available:</span>
                    <strong className="text-neutral-900 font-bold tabular-nums">
                      {item.quantityRemainingKg.toFixed(1)} kg
                    </strong>
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Use-by: {item.useByDateTime ? new Date(item.useByDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Logged'}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenRedist(item)}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Route to Recipient</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Complete Redistribution Log History */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xs">
        <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900">
            Redistribution History Ledger
          </h3>
          <span className="text-xs text-neutral-500">
            Audit trail of authorized transfers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Redist ID</th>
                <th className="px-4 py-3">Food Item</th>
                <th className="px-3 py-3">Recipient Partner</th>
                <th className="px-3 py-3 text-right">Approved (kg)</th>
                <th className="px-3 py-3 text-right">Dispatched (kg)</th>
                <th className="px-3 py-3">Approver</th>
                <th className="px-3 py-3">Safety Audit</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {redistributions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-xs text-neutral-400">
                    No redistribution records logged yet.
                  </td>
                </tr>
              ) : (
                redistributions.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono font-semibold text-neutral-900 whitespace-nowrap">
                      {item.id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-900 whitespace-nowrap">
                      <div>{item.foodName}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{item.recordId}</div>
                    </td>
                    <td className="px-3 py-3 max-w-xs truncate text-neutral-800">
                      {item.proposedRecipient}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-neutral-900 tabular-nums">
                      {item.quantityApprovedKg.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-emerald-800 tabular-nums">
                      {item.quantityRedistributedKg.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-neutral-600 text-[11px] max-w-[140px] truncate">
                      {item.approvedBy || 'Pending'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-800 font-medium">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>HACCP Passed</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`font-semibold text-xs ${
                          item.reviewStatus === 'Redistributed'
                            ? 'text-emerald-800'
                            : item.reviewStatus === 'Approved'
                            ? 'text-indigo-800'
                            : 'text-amber-800'
                        }`}
                      >
                        {item.reviewStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {item.reviewStatus !== 'Redistributed' ? (
                        <button
                          onClick={() => setConfirmCompleteId(item.id)}
                          className="rounded-md bg-emerald-800 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                        >
                          Mark Dispatched
                        </button>
                      ) : (
                        <span className="text-[11px] text-neutral-400 flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Delivered</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmCompleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">
              Confirm Food Handover Dispatch
            </h3>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Confirm that the approved food has been physically transferred into the vehicle/recipient's custody and thermal log signoff completed.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmCompleteId(null)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const target = redistributions.find((r) => r.id === confirmCompleteId);
                  if (target) handleMarkComplete(target);
                }}
                className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Yes, Food Handover Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <RedistributeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRecordForRedist(null);
        }}
        foodRecord={selectedRecordForRedist}
        onSave={handleRedistributionSave}
      />
    </div>
  );
};
