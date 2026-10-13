import { FoodRecord, SmartAlert, RedistributionRecord } from '../types';

function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportFoodRecordsToCsv(records: FoodRecord[]): void {
  const headers = [
    'Record ID',
    'Food Name',
    'Category',
    'Prepared (kg)',
    'Served (kg)',
    'Remaining (kg)',
    'Expected Servings',
    'Actual Servings',
    'Student Attendance',
    'Preparation Date',
    'Use-By Date',
    'Storage Condition',
    'Reused (kg)',
    'Redistributed (kg)',
    'Discarded (kg)',
    'Status',
    'Notes',
    'Simulated',
  ];

  const rows = records.map((r) => [
    escapeCsvField(r.id),
    escapeCsvField(r.foodName),
    escapeCsvField(r.category),
    escapeCsvField(r.quantityPreparedKg),
    escapeCsvField(r.quantityServedKg),
    escapeCsvField(r.quantityRemainingKg),
    escapeCsvField(r.expectedDemandServings),
    escapeCsvField(r.actualServingsServed),
    escapeCsvField(r.studentAttendance),
    escapeCsvField(r.preparationDateTime),
    escapeCsvField(r.useByDateTime),
    escapeCsvField(r.storageCondition),
    escapeCsvField(r.quantityReusedKg),
    escapeCsvField(r.quantityRedistributedKg),
    escapeCsvField(r.quantityDiscardedKg),
    escapeCsvField(r.status),
    escapeCsvField(r.notes || ''),
    escapeCsvField(r.isSimulated ? 'Yes' : 'No'),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`foodwise_inventory_${dateStr}.csv`, csv);
}

export function exportRedistributionsToCsv(redistributions: RedistributionRecord[]): void {
  const headers = [
    'Redistribution ID',
    'Source Record ID',
    'Food Item',
    'Category',
    'Available (kg)',
    'Approved (kg)',
    'Redistributed (kg)',
    'Remaining (kg)',
    'Recipient Organization',
    'Recipient Contact',
    'Status',
    'Approved By',
    'Temp Verified',
    'Sensory Passed',
    'Hygienic Package',
    'Action Notes',
    'Date Logged',
  ];

  const rows = redistributions.map((r) => [
    escapeCsvField(r.id),
    escapeCsvField(r.recordId),
    escapeCsvField(r.foodName),
    escapeCsvField(r.category),
    escapeCsvField(r.quantityAvailableKg),
    escapeCsvField(r.quantityApprovedKg),
    escapeCsvField(r.quantityRedistributedKg),
    escapeCsvField(r.quantityRemainingKg),
    escapeCsvField(r.proposedRecipient),
    escapeCsvField(r.recipientContact || ''),
    escapeCsvField(r.reviewStatus),
    escapeCsvField(r.approvedBy || ''),
    escapeCsvField(r.safetyChecklist.tempVerified ? 'YES' : 'NO'),
    escapeCsvField(r.safetyChecklist.sensoryTestPassed ? 'YES' : 'NO'),
    escapeCsvField(r.safetyChecklist.packagedHygiene ? 'YES' : 'NO'),
    escapeCsvField(r.actionNotes || ''),
    escapeCsvField(r.createdAt),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`foodwise_redistributions_${dateStr}.csv`, csv);
}

export function exportAlertsToCsv(alerts: SmartAlert[]): void {
  const headers = [
    'Alert ID',
    'Record ID',
    'Food Name',
    'Category',
    'Type',
    'Severity',
    'Quantity Involved (kg)',
    'Surplus %',
    'Status',
    'Detection Time',
    'Explanation',
    'Suggested Action',
    'Dismiss Reason',
  ];

  const rows = alerts.map((a) => [
    escapeCsvField(a.id),
    escapeCsvField(a.recordId),
    escapeCsvField(a.foodName),
    escapeCsvField(a.category),
    escapeCsvField(a.type),
    escapeCsvField(a.severity),
    escapeCsvField(a.quantityInvolvedKg),
    escapeCsvField(a.surplusPercentage ?? ''),
    escapeCsvField(a.status),
    escapeCsvField(a.detectionTime),
    escapeCsvField(a.explanation),
    escapeCsvField(a.suggestedAction),
    escapeCsvField(a.dismissReason || ''),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`foodwise_alerts_${dateStr}.csv`, csv);
}
