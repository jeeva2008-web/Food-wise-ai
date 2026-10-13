export type FoodCategory =
  | 'Main Course'
  | 'Rice & Breads'
  | 'Curries & Dal'
  | 'Breakfast & Tiffin'
  | 'Snacks & Beverages'
  | 'Sweets & Desserts'
  | 'Accompaniments';

export type RecordStatus =
  | 'Recorded'
  | 'Surplus Active'
  | 'Redistributed'
  | 'Discarded'
  | 'Reused'
  | 'Under Review';

export type StorageCondition =
  | 'Hot Holding (>=65°C)'
  | 'Chilled Storage (<=4°C)'
  | 'Frozen Storage (<=-18°C)'
  | 'Ambient / Room Temperature (20-25°C)'
  | 'Dry Pantry Storage';

export interface FoodRecord {
  id: string;
  foodName: string;
  category: FoodCategory;
  quantityPreparedKg: number;
  quantityServedKg: number;
  quantityRemainingKg: number; // Derived: prepared - served
  expectedDemandServings: number;
  actualServingsServed: number;
  studentAttendance: number;
  preparationDateTime: string; // ISO string
  useByDateTime: string; // ISO string
  storageCondition: StorageCondition;
  storageNotes?: string;
  quantityReusedKg: number;
  quantityRedistributedKg: number;
  quantityDiscardedKg: number;
  status: RecordStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isSimulated?: boolean;
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertType =
  | 'surplus_low'
  | 'surplus_medium'
  | 'surplus_high'
  | 'high_leftover'
  | 'attendance_drop'
  | 'mass_balance_mismatch'
  | 'missing_use_by'
  | 'near_expiry';

export type AlertStatus = 'active' | 'acknowledged' | 'reviewed' | 'dismissed';

export interface SmartAlert {
  id: string;
  recordId: string;
  foodName: string;
  category: FoodCategory;
  type: AlertType;
  severity: AlertSeverity;
  quantityInvolvedKg: number;
  surplusPercentage?: number;
  detectionTime: string;
  explanation: string;
  suggestedAction: string;
  status: AlertStatus;
  dismissReason?: string;
  acknowledgedAt?: string;
}

export type RedistributionStatus =
  | 'Available'
  | 'Under Review'
  | 'Approved'
  | 'Redistributed'
  | 'Cancelled';

export interface RedistributionRecord {
  id: string;
  recordId: string;
  foodName: string;
  category: FoodCategory;
  quantityAvailableKg: number;
  preparationDateTime: string;
  useByDateTime: string;
  storageCondition: StorageCondition;
  proposedRecipient: string;
  recipientContact?: string;
  reviewStatus: RedistributionStatus;
  approvedBy?: string;
  safetyChecklist: {
    tempVerified: boolean;
    sensoryTestPassed: boolean;
    packagedHygiene: boolean;
    withinTimeWindow: boolean;
  };
  quantityApprovedKg: number;
  quantityRedistributedKg: number;
  quantityRemainingKg: number;
  actionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PredictionInput {
  foodName: string;
  category: FoodCategory;
  dayOfWeek: string;
  studentAttendance: number;
  expectedServings: number;
  testQuantityPreparedKg: number;
}

export interface PredictionResult {
  estimatedDemandServings: number;
  estimatedDemandKg: number;
  testQuantityPreparedKg: number;
  potentialSurplusKg: number;
  surplusPercentage: number;
  surplusSeverity: 'Low' | 'Medium' | 'High';
  confidence: 'High' | 'Medium' | 'Baseline Fallback';
  historicalRecordsCount: number;
  averageHistoricalServingKg: number;
  reasoningSteps: string[];
  recommendedAction: string;
  recommendedPrepKg: number;
  aiExplanation?: string;
}

export interface CanteenSettings {
  canteenName: string;
  campusLocation: string;
  surplusLowThreshold: number; // e.g. 10 (%)
  surplusMediumThreshold: number; // e.g. 20 (%)
  surplusHighThreshold: number; // e.g. 30 (%)
  kgPerServingDefault: number; // e.g. 0.35 kg
  costPerKgDefault: number; // e.g. 2.50 ($ or currency unit)
  co2FactorKgPerKg: number; // e.g. 2.5 kg CO2e per kg food saved
  waterFactorLitersPerKg: number; // e.g. 800 L per kg food saved
  defaultDashboardDays: number; // 7, 14, 30, or 90
  currencySymbol: string;
}

export interface TestScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  inputData: Record<string, any>;
  expectedResult: string;
  runTest: () => {
    passed: boolean;
    actualResult: string;
    details: string;
  };
}

export interface WasteRecommendation {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'high_impact';
  triggerRule: string;
  triggerData: string;
  recommendedAction: string;
  potentialSavingsKg: number;
  category: FoodCategory | 'General';
}
