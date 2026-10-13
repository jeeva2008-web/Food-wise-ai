import { FoodRecord, SmartAlert, RedistributionRecord, CanteenSettings } from '../types';
import { generateSampleRecords, generateSampleRedistributions, DEFAULT_SETTINGS } from './sampleData';
import { generateSmartAlerts } from './alertEngine';

const STORAGE_KEYS = {
  RECORDS: 'foodwise_records_v1',
  ALERTS: 'foodwise_alerts_v1',
  REDISTRIBUTIONS: 'foodwise_redistributions_v1',
  SETTINGS: 'foodwise_settings_v1',
};

export class StorageService {
  // Get Settings
  static getSettings(): CanteenSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('Error loading settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: CanteenSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings to localStorage', e);
    }
  }

  // Get Food Records
  static getRecords(): FoodRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading records from localStorage', e);
    }

    // Initialize with sample demo data on first launch
    const samples = generateSampleRecords();
    this.saveRecords(samples);
    return samples;
  }

  static saveRecords(records: FoodRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving records to localStorage', e);
    }
  }

  static addRecord(newRecord: FoodRecord): FoodRecord[] {
    const current = this.getRecords();
    const updated = [newRecord, ...current];
    this.saveRecords(updated);
    this.refreshAlerts(updated);
    return updated;
  }

  static updateRecord(updatedRecord: FoodRecord): FoodRecord[] {
    const current = this.getRecords();
    const updated = current.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));
    this.saveRecords(updated);
    this.refreshAlerts(updated);
    return updated;
  }

  static deleteRecord(id: string): FoodRecord[] {
    const current = this.getRecords();
    const updated = current.filter((r) => r.id !== id);
    this.saveRecords(updated);
    this.refreshAlerts(updated);
    return updated;
  }

  // Alerts
  static getAlerts(): SmartAlert[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading alerts', e);
    }

    // Generate initial alerts from records
    const records = this.getRecords();
    const settings = this.getSettings();
    const generated = generateSmartAlerts(records, [], settings);
    this.saveAlerts(generated);
    return generated;
  }

  static saveAlerts(alerts: SmartAlert[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    } catch (e) {
      console.error('Error saving alerts', e);
    }
  }

  static updateAlert(updatedAlert: SmartAlert): SmartAlert[] {
    const current = this.getAlerts();
    const updated = current.map((a) => (a.id === updatedAlert.id ? updatedAlert : a));
    this.saveAlerts(updated);
    return updated;
  }

  static refreshAlerts(records: FoodRecord[]): SmartAlert[] {
    const existing = this.getAlerts();
    const settings = this.getSettings();
    const alerts = generateSmartAlerts(records, existing, settings);
    this.saveAlerts(alerts);
    return alerts;
  }

  // Redistribution
  static getRedistributions(): RedistributionRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REDISTRIBUTIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading redistributions', e);
    }

    const records = this.getRecords();
    const sampleRedist = generateSampleRedistributions(records);
    this.saveRedistributions(sampleRedist);
    return sampleRedist;
  }

  static saveRedistributions(items: RedistributionRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REDISTRIBUTIONS, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving redistributions', e);
    }
  }

  static addRedistribution(item: RedistributionRecord): RedistributionRecord[] {
    const current = this.getRedistributions();
    const updated = [item, ...current];
    this.saveRedistributions(updated);
    return updated;
  }

  static updateRedistribution(item: RedistributionRecord): RedistributionRecord[] {
    const current = this.getRedistributions();
    const updated = current.map((r) => (r.id === item.id ? item : r));
    this.saveRedistributions(updated);
    return updated;
  }

  // Reset to simulated demo data
  static resetToDemoData(): { records: FoodRecord[]; alerts: SmartAlert[]; redistributions: RedistributionRecord[] } {
    const samples = generateSampleRecords();
    const settings = DEFAULT_SETTINGS;
    this.saveRecords(samples);
    this.saveSettings(settings);

    const generatedAlerts = generateSmartAlerts(samples, [], settings);
    this.saveAlerts(generatedAlerts);

    const sampleRedist = generateSampleRedistributions(samples);
    this.saveRedistributions(sampleRedist);

    return {
      records: samples,
      alerts: generatedAlerts,
      redistributions: sampleRedist,
    };
  }

  // Backup & Restore
  static exportFullBackup(): string {
    const bundle = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      records: this.getRecords(),
      alerts: this.getAlerts(),
      redistributions: this.getRedistributions(),
    };
    return JSON.stringify(bundle, null, 2);
  }

  static importFullBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.records && Array.isArray(data.records)) {
        this.saveRecords(data.records);
        if (data.settings) this.saveSettings(data.settings);
        if (data.alerts && Array.isArray(data.alerts)) this.saveAlerts(data.alerts);
        if (data.redistributions && Array.isArray(data.redistributions)) this.saveRedistributions(data.redistributions);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import backup', e);
      return false;
    }
  }
}
