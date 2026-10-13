import React, { useState, useMemo } from 'react';
import {
  History,
  Calendar,
  Search,
  Filter,
  Download,
  Scale,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { FoodRecord } from '../../types';
import { RecordDetailModal } from '../inventory/RecordDetailModal';
import { exportFoodRecordsToCsv } from '../../utils/csvExporter';

interface HistoricalRecordsViewProps {
  records: FoodRecord[];
}

export const HistoricalRecordsView: React.FC<HistoricalRecordsViewProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<FoodRecord | null>(null);

  // Group months available
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      const monthStr = r.preparationDateTime.slice(0, 7); // 'YYYY-MM'
      set.add(monthStr);
    });
    return Array.from(set).sort().reverse();
  }, [records]);

  const filtered = useMemo(() => {
    return records
      .filter((r) => {
        const matchesSearch =
          r.foodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMonth = selectedMonth === 'all' || r.preparationDateTime.startsWith(selectedMonth);
        return matchesSearch && matchesMonth;
      })
      .sort((a, b) => new Date(b.preparationDateTime).getTime() - new Date(a.preparationDateTime).getTime());
  }, [records, searchTerm, selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-5">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-800" />
            <h2 className="text-base font-bold text-neutral-900">
              Historical Food Batch Ledger
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Permanent audit trail of all recorded canteen batch weights, attendances, and surplus allocations.
          </p>
        </div>

        <button
          onClick={() => exportFoodRecordsToCsv(filtered)}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search historical records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="all">All Available Months</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {new Date(m + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-neutral-500 font-medium">
          Showing <strong className="text-neutral-900 tabular-nums">{filtered.length}</strong> archived batches
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Batch ID & Food</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3 text-right">Prepared (kg)</th>
                <th className="px-3 py-3 text-right">Consumed (kg)</th>
                <th className="px-3 py-3 text-right">Leftover (kg)</th>
                <th className="px-3 py-3 text-right">Attendance</th>
                <th className="px-3 py-3">Outcome</th>
                <th className="px-4 py-3 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.map((r) => {
                const dateStr = new Date(r.preparationDateTime).toLocaleDateString();
                const timeStr = new Date(r.preparationDateTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-neutral-900">{dateStr}</div>
                      <div className="text-[10px] text-neutral-400">{timeStr}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-900">
                      <div>{r.foodName}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{r.id}</div>
                    </td>
                    <td className="px-3 py-3 text-neutral-600 whitespace-nowrap">{r.category}</td>
                    <td className="px-3 py-3 text-right font-medium text-neutral-900 tabular-nums">
                      {r.quantityPreparedKg.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-emerald-800 tabular-nums">
                      {r.quantityServedKg.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">
                      <span className={r.quantityRemainingKg > 3 ? 'text-amber-700' : 'text-neutral-600'}>
                        {r.quantityRemainingKg.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-neutral-700">
                      {r.studentAttendance}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-medium text-neutral-800">{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                        title="View Full Audit"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <RecordDetailModal
        record={selectedRecord}
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onEdit={() => {}}
      />
    </div>
  );
};
