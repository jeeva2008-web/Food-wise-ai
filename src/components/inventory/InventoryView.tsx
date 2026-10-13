import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { FoodRecord, FoodCategory, RecordStatus } from '../../types';
import { RecordFormModal } from './RecordFormModal';
import { RecordDetailModal } from './RecordDetailModal';
import { exportFoodRecordsToCsv } from '../../utils/csvExporter';

interface InventoryViewProps {
  records: FoodRecord[];
  onAddRecord: (record: FoodRecord) => void;
  onUpdateRecord: (record: FoodRecord) => void;
  onDeleteRecord: (id: string) => void;
  onInitiateRedistribution: (record: FoodRecord) => void;
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

const STATUSES: RecordStatus[] = [
  'Recorded',
  'Surplus Active',
  'Under Review',
  'Redistributed',
  'Reused',
  'Discarded',
];

type SortField = 'date' | 'name' | 'prepared' | 'served' | 'remaining' | 'surplusPct';

export const InventoryView: React.FC<InventoryViewProps> = ({
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onInitiateRedistribution,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FoodRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<FoodRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter & Sort
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        const matchesSearch =
          r.foodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.notes?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
        const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'date') {
          diff = new Date(a.preparationDateTime).getTime() - new Date(b.preparationDateTime).getTime();
        } else if (sortField === 'name') {
          diff = a.foodName.localeCompare(b.foodName);
        } else if (sortField === 'prepared') {
          diff = a.quantityPreparedKg - b.quantityPreparedKg;
        } else if (sortField === 'served') {
          diff = a.quantityServedKg - b.quantityServedKg;
        } else if (sortField === 'remaining') {
          diff = a.quantityRemainingKg - b.quantityRemainingKg;
        } else if (sortField === 'surplusPct') {
          const pctA = a.quantityPreparedKg > 0 ? a.quantityRemainingKg / a.quantityPreparedKg : 0;
          const pctB = b.quantityPreparedKg > 0 ? b.quantityRemainingKg / b.quantityPreparedKg : 0;
          diff = pctA - pctB;
        }
        return sortAsc ? diff : -diff;
      });
  }, [records, searchTerm, selectedCategory, selectedStatus, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getStatusBadge = (status: RecordStatus) => {
    switch (status) {
      case 'Recorded':
        return <span className="text-neutral-700 font-medium">Recorded</span>;
      case 'Surplus Active':
        return <span className="text-amber-800 font-bold">Surplus Active</span>;
      case 'Under Review':
        return <span className="text-indigo-800 font-bold">Under Review</span>;
      case 'Redistributed':
        return <span className="text-emerald-800 font-bold">Redistributed</span>;
      case 'Reused':
        return <span className="text-teal-800 font-bold">Reused</span>;
      case 'Discarded':
        return <span className="text-red-700 font-bold">Discarded</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Strip */}
      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search food item or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportFoodRecordsToCsv(filteredRecords)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingRecord(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              <tr>
                <th
                  onClick={() => handleSort('date')}
                  className="cursor-pointer px-4 py-3 hover:text-neutral-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Date & Time</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="cursor-pointer px-4 py-3 hover:text-neutral-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Food Item</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-3 py-3">Category</th>
                <th
                  onClick={() => handleSort('prepared')}
                  className="cursor-pointer px-3 py-3 text-right hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Prep (kg)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('served')}
                  className="cursor-pointer px-3 py-3 text-right hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Served (kg)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('remaining')}
                  className="cursor-pointer px-3 py-3 text-right hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Leftover (kg)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('surplusPct')}
                  className="cursor-pointer px-3 py-3 text-right hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Surplus %</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-3 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-xs text-neutral-400">
                    No matching food records found. Try adjusting your search query or filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const surplusPct =
                    record.quantityPreparedKg > 0
                      ? (record.quantityRemainingKg / record.quantityPreparedKg) * 100
                      : 0;
                  const dateStr = new Date(record.preparationDateTime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                  const timeStr = new Date(record.preparationDateTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-neutral-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-neutral-900">{dateStr}</div>
                        <div className="text-[10px] text-neutral-400">{timeStr}</div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-neutral-900">
                        <div className="flex items-center gap-1.5">
                          <span>{record.foodName}</span>
                          {record.isSimulated && (
                            <span className="text-[9px] text-neutral-400 font-normal">
                              [demo]
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">{record.id}</div>
                      </td>

                      <td className="px-3 py-3 text-neutral-600 whitespace-nowrap">
                        {record.category}
                      </td>

                      <td className="px-3 py-3 text-right font-medium text-neutral-800 tabular-nums">
                        {record.quantityPreparedKg.toFixed(1)}
                      </td>

                      <td className="px-3 py-3 text-right font-medium text-emerald-800 tabular-nums">
                        {record.quantityServedKg.toFixed(1)}
                      </td>

                      <td className="px-3 py-3 text-right font-bold tabular-nums">
                        <span
                          className={
                            record.quantityRemainingKg > 5
                              ? 'text-amber-700'
                              : record.quantityRemainingKg > 0
                              ? 'text-neutral-700'
                              : 'text-neutral-400'
                          }
                        >
                          {record.quantityRemainingKg.toFixed(1)}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-right font-medium tabular-nums">
                        <span
                          className={
                            surplusPct >= 30
                              ? 'text-red-600 font-bold'
                              : surplusPct >= 20
                              ? 'text-amber-700 font-semibold'
                              : 'text-neutral-500'
                          }
                        >
                          {surplusPct.toFixed(1)}%
                        </span>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-xs">
                        {getStatusBadge(record.status)}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {record.quantityRemainingKg > 0 &&
                            record.status !== 'Redistributed' && (
                              <button
                                onClick={() => onInitiateRedistribution(record)}
                                title="Redistribute Surplus"
                                className="rounded p-1 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900"
                              >
                                <Share2 className="h-4 w-4" />
                              </button>
                            )}

                          <button
                            onClick={() => setViewingRecord(record)}
                            title="View Full Details"
                            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingRecord(record);
                              setIsFormOpen(true);
                            }}
                            title="Edit Record"
                            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(record.id)}
                            title="Delete Record"
                            className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-xl">
            <div className="flex items-center gap-2 text-red-700 mb-2 font-bold text-sm">
              <AlertCircle className="h-5 w-5" />
              <span>Confirm Record Deletion</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              Are you sure you want to permanently delete record{' '}
              <strong className="text-neutral-900 font-mono">{deleteConfirmId}</strong>? All mass balance calculations and related alerts will be refreshed.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteRecord(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <RecordFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRecord(null);
        }}
        onSave={(rec) => {
          if (editingRecord) {
            onUpdateRecord(rec);
          } else {
            onAddRecord(rec);
          }
        }}
        existingRecord={editingRecord}
        existingRecords={records}
      />

      <RecordDetailModal
        record={viewingRecord}
        isOpen={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        onEdit={(rec) => {
          setViewingRecord(null);
          setEditingRecord(rec);
          setIsFormOpen(true);
        }}
        onRedistribute={(rec) => {
          setViewingRecord(null);
          onInitiateRedistribution(rec);
        }}
      />
    </div>
  );
};
