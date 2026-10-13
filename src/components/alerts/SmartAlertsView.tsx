import React, { useState, useMemo } from 'react';
import {
  BellRing,
  AlertTriangle,
  CheckCircle,
  Eye,
  XCircle,
  Download,
  Filter,
  Search,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { SmartAlert, AlertSeverity, AlertStatus } from '../../types';
import { exportAlertsToCsv } from '../../utils/csvExporter';

interface SmartAlertsViewProps {
  alerts: SmartAlert[];
  onUpdateAlert: (alert: SmartAlert) => void;
}

export const SmartAlertsView: React.FC<SmartAlertsViewProps> = ({ alerts, onUpdateAlert }) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dismissModalAlert, setDismissModalAlert] = useState<SmartAlert | null>(null);
  const [dismissReason, setDismissReason] = useState<string>('');

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((a) => {
        const matchesSev = severityFilter === 'all' || a.severity === severityFilter;
        const matchesStat = statusFilter === 'all' || a.status === statusFilter;
        const matchesSearch =
          a.foodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSev && matchesStat && matchesSearch;
      })
      .sort((a, b) => {
        // Active first, then critical/high first
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (b.status === 'active' && a.status !== 'active') return 1;
        const weight: Record<AlertSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        return weight[b.severity] - weight[a.severity];
      });
  }, [alerts, severityFilter, statusFilter, searchQuery]);

  const handleAcknowledge = (alert: SmartAlert) => {
    onUpdateAlert({
      ...alert,
      status: 'acknowledged',
      acknowledgedAt: new Date().toISOString(),
    });
  };

  const handleMarkReviewed = (alert: SmartAlert) => {
    onUpdateAlert({
      ...alert,
      status: 'reviewed',
    });
  };

  const handleConfirmDismiss = () => {
    if (dismissModalAlert) {
      onUpdateAlert({
        ...dismissModalAlert,
        status: 'dismissed',
        dismissReason: dismissReason.trim() || 'Reviewed by supervisor - no action needed',
      });
      setDismissModalAlert(null);
      setDismissReason('');
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            Critical Deadline
          </span>
        );
      case 'high':
        return (
          <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-800">
            High Severity
          </span>
        );
      case 'medium':
        return (
          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
            Medium Warning
          </span>
        );
      case 'low':
        return (
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-700">
            Low Notice
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-emerald-800" />
            <h2 className="text-base font-bold text-neutral-900">
              Smart Alerts & Incident Response Center
            </h2>
          </div>
          <button
            onClick={() => exportAlertsToCsv(filteredAlerts)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Alerts CSV</span>
          </button>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Automated alert engine monitors mass balance anomalies, unexpected attendance drops, excessive batch surpluses, and approaching use-by deadlines.
        </p>
      </div>

      {/* Control Strip */}
      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search alert topic or food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-1.5 text-xs text-neutral-800 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div className="text-xs text-neutral-500 font-medium">
          Showing <span className="text-neutral-900 font-bold tabular-nums">{filteredAlerts.length}</span> alerts
        </div>
      </div>

      {/* Alert Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center text-xs text-neutral-400">
            No alerts matching the selected criteria.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const timeStr = new Date(alert.detectionTime).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-4 transition-all shadow-2xs ${
                  alert.status === 'dismissed'
                    ? 'border-neutral-200 bg-neutral-50/70 opacity-60'
                    : alert.severity === 'critical'
                    ? 'border-red-300 bg-red-50/70'
                    : alert.severity === 'high'
                    ? 'border-red-200 bg-red-50/30'
                    : alert.severity === 'medium'
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-neutral-200 bg-white'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      <h3 className="text-sm font-bold text-neutral-900">{alert.foodName}</h3>
                      <span className="text-xs text-neutral-400 font-mono">({alert.recordId})</span>
                      <span className="text-xs text-neutral-400">·</span>
                      <span className="text-xs text-neutral-500">{timeStr}</span>
                      <span className="text-xs text-neutral-400">·</span>
                      <span
                        className={`text-xs font-semibold ${
                          alert.status === 'active'
                            ? 'text-red-700'
                            : alert.status === 'acknowledged'
                            ? 'text-amber-800'
                            : alert.status === 'reviewed'
                            ? 'text-emerald-800'
                            : 'text-neutral-500'
                        }`}
                      >
                        Status: {alert.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                      {alert.explanation}
                    </p>

                    <div className="rounded-lg bg-white/90 p-2.5 text-xs border border-neutral-200/80 text-emerald-900">
                      <strong className="text-neutral-800">Suggested Action: </strong>
                      {alert.suggestedAction}
                    </div>

                    {alert.dismissReason && (
                      <div className="text-[11px] text-neutral-500 italic">
                        Dismissed reason: "{alert.dismissReason}"
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {alert.status === 'active' && (
                      <button
                        onClick={() => handleAcknowledge(alert)}
                        className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}

                    {alert.status !== 'reviewed' && alert.status !== 'dismissed' && (
                      <button
                        onClick={() => handleMarkReviewed(alert)}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        Mark Reviewed
                      </button>
                    )}

                    {alert.status !== 'dismissed' && (
                      <button
                        onClick={() => setDismissModalAlert(alert)}
                        className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dismiss Modal */}
      {dismissModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">
              Dismiss Alert for {dismissModalAlert.foodName}
            </h3>
            <p className="text-xs text-neutral-500 mb-3">
              Please enter a brief operational reason for dismissing this alert.
            </p>
            <textarea
              rows={3}
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              placeholder="e.g. Leftover was repurposed for dinner tiffin or verified safe."
              className="w-full rounded-lg border border-neutral-300 p-2 text-xs text-neutral-800 focus:border-emerald-600 focus:outline-hidden mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDismissModalAlert(null)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDismiss}
                className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-900"
              >
                Confirm Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
