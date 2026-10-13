import React, { useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Building,
  Scale,
  DollarSign,
  Leaf,
} from 'lucide-react';
import { CanteenSettings } from '../../types';
import { StorageService } from '../../utils/storage';

interface SettingsViewProps {
  settings: CanteenSettings;
  onUpdateSettings: (settings: CanteenSettings) => void;
  onResetDemoData: () => void;
  onReloadAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetDemoData,
  onReloadAllData,
}) => {
  const [formData, setFormData] = useState<CanteenSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const json = StorageService.exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `foodwise_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importFullBackup(content);
      if (success) {
        setImportStatus('Backup successfully restored! Refreshing data.');
        onReloadAllData();
      } else {
        setImportStatus('Failed to parse backup file. Please check file format.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    onResetDemoData();
    setResetModalOpen(false);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Intro */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-5 w-5 text-emerald-800" />
          <h2 className="text-base font-bold text-neutral-900">
            System & Facility Configuration
          </h2>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Calibrate food waste detection thresholds, serving portion assumptions, financial metrics, and manage system backups.
        </p>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Configuration saved successfully. All calculations and thresholds updated.</span>
        </div>
      )}

      {importStatus && (
        <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-4 text-xs font-semibold text-neutral-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-6 space-y-6 shadow-2xs">
        {/* Section 1: Facility Identity */}
        <div>
          <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 mb-3 flex items-center gap-2">
            <Building className="h-4 w-4 text-emerald-800" />
            <span>1. Canteen Identity & Campus Context</span>
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Facility / Canteen Name
              </label>
              <input
                type="text"
                required
                value={formData.canteenName}
                onChange={(e) => setFormData({ ...formData, canteenName: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Campus Location
              </label>
              <input
                type="text"
                value={formData.campusLocation}
                onChange={(e) => setFormData({ ...formData, campusLocation: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Surplus Classification Thresholds */}
        <div>
          <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 mb-3 flex items-center gap-2">
            <Scale className="h-4 w-4 text-emerald-800" />
            <span>2. Surplus Severity Thresholds (% Leftover vs Cooked)</span>
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Low Surplus Warning (%)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.surplusLowThreshold}
                onChange={(e) => setFormData({ ...formData, surplusLowThreshold: parseFloat(e.target.value) || 10 })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-neutral-400">Triggers standard log notice</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Medium Surplus Warning (%)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={formData.surplusMediumThreshold}
                onChange={(e) => setFormData({ ...formData, surplusMediumThreshold: parseFloat(e.target.value) || 20 })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-neutral-400">Triggers review notification</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                High Surplus Alert (%)
              </label>
              <input
                type="number"
                min="15"
                max="90"
                value={formData.surplusHighThreshold}
                onChange={(e) => setFormData({ ...formData, surplusHighThreshold: parseFloat(e.target.value) || 30 })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-neutral-400">Triggers emergency redistribution</span>
            </div>
          </div>
        </div>

        {/* Section 3: Conversions & Financials */}
        <div>
          <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-800" />
            <span>3. Portions, Impact Ratios & Currency</span>
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Serving Size (kg / portion)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="1.5"
                value={formData.kgPerServingDefault}
                onChange={(e) => setFormData({ ...formData, kgPerServingDefault: parseFloat(e.target.value) || 0.35 })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-neutral-400">Used for Meals Saved count</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Food Cost ($ / kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.costPerKgDefault}
                onChange={(e) => setFormData({ ...formData, costPerKgDefault: parseFloat(e.target.value) || 2.5 })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-neutral-400">Average raw cost</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                CO₂e Factor (kg CO₂ / kg food)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                value={formData.co2FactorKgPerKg}
                onChange={(e) => setFormData({ ...formData, co2FactorKgPerKg: parseFloat(e.target.value) || 2.5 })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-neutral-400">FAO life-cycle benchmark</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Virtual Water (Liters / kg food)
              </label>
              <input
                type="number"
                step="10"
                min="100"
                value={formData.waterFactorLitersPerKg}
                onChange={(e) => setFormData({ ...formData, waterFactorLitersPerKg: parseFloat(e.target.value) || 800 })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-neutral-400">Agricultural footprint</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save Configuration Changes</span>
          </button>
        </div>
      </form>

      {/* Demo Data & Backup Management */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4 shadow-2xs">
        <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2">
          Data Management & Demo Recovery
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-neutral-800">
              Reset Simulated Demonstration Dataset
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              Restores the default suite of 36+ realistic college canteen meal records, active alerts, and redistribution logs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors shrink-0"
          >
            <RotateCcw className="h-4 w-4 text-amber-700" />
            <span>Reset Demo Records</span>
          </button>
        </div>

        <div className="border-t border-neutral-100 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-neutral-800">
              Export / Import Full JSON Snapshot
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              Save your entire database to a local file or load a previously saved session.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>

            <label className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-xl">
            <div className="flex items-center gap-2 text-amber-700 mb-2 font-bold text-sm">
              <AlertTriangle className="h-5 w-5" />
              <span>Confirm Demo Dataset Reset</span>
            </div>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              This will reset the inventory, alert feed, and redistribution records back to the 36 simulated university demonstration batches. Any manually added records will be replaced.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setResetModalOpen(false)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Yes, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
