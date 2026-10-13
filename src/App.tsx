/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavItemKey } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { HomeView } from './components/home/HomeView';
import { DashboardView } from './components/dashboard/DashboardView';
import { InventoryView } from './components/inventory/InventoryView';
import { AddRecordView } from './components/addRecord/AddRecordView';
import { PredictionView } from './components/prediction/PredictionView';
import { SurplusDetectionView } from './components/surplus/SurplusDetectionView';
import { SmartAlertsView } from './components/alerts/SmartAlertsView';
import { RedistributionView } from './components/redistribution/RedistributionView';
import { FreshnessTrackingView } from './components/freshness/FreshnessTrackingView';
import { RecommendationsView } from './components/recommendations/RecommendationsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ReportsView } from './components/reports/ReportsView';
import { HistoricalRecordsView } from './components/historical/HistoricalRecordsView';
import { SustainabilityView } from './components/sustainability/SustainabilityView';
import { TestCenterView } from './components/testCenter/TestCenterView';
import { SettingsView } from './components/settings/SettingsView';
import { AboutView } from './components/about/AboutView';
import { RedistributeModal } from './components/redistribution/RedistributeModal';

import { FoodRecord, SmartAlert, RedistributionRecord, CanteenSettings } from './types';
import { StorageService } from './utils/storage';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Application State
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [redistributions, setRedistributions] = useState<RedistributionRecord[]>([]);
  const [settings, setSettings] = useState<CanteenSettings>(StorageService.getSettings());

  // Quick Redistribution from any view
  const [quickRedistRecord, setQuickRedistRecord] = useState<FoodRecord | null>(null);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    const loadedRecords = StorageService.getRecords();
    const loadedAlerts = StorageService.getAlerts();
    const loadedRedist = StorageService.getRedistributions();
    const loadedSettings = StorageService.getSettings();

    setRecords(loadedRecords);
    setAlerts(loadedAlerts);
    setRedistributions(loadedRedist);
    setSettings(loadedSettings);
  };

  // Record CRUD Handlers
  const handleAddRecord = (newRecord: FoodRecord) => {
    const updated = StorageService.addRecord(newRecord);
    setRecords(updated);
    setAlerts(StorageService.getAlerts());
  };

  const handleUpdateRecord = (updatedRecord: FoodRecord) => {
    const updated = StorageService.updateRecord(updatedRecord);
    setRecords(updated);
    setAlerts(StorageService.getAlerts());
  };

  const handleDeleteRecord = (id: string) => {
    const updated = StorageService.deleteRecord(id);
    setRecords(updated);
    setAlerts(StorageService.getAlerts());
  };

  // Alert Handlers
  const handleUpdateAlert = (updatedAlert: SmartAlert) => {
    const updated = StorageService.updateAlert(updatedAlert);
    setAlerts(updated);
  };

  // Redistribution Handlers
  const handleSaveRedistribution = (newRedist: RedistributionRecord) => {
    const updated = StorageService.addRedistribution(newRedist);
    setRedistributions(updated);
  };

  const handleInitiateRedistribution = (record: FoodRecord) => {
    setQuickRedistRecord(record);
  };

  // Settings Handlers
  const handleUpdateSettings = (newSettings: CanteenSettings) => {
    StorageService.saveSettings(newSettings);
    setSettings(newSettings);
    // Refresh alerts with new thresholds
    const refreshedAlerts = StorageService.refreshAlerts(records);
    setAlerts(refreshedAlerts);
  };

  const handleResetDemoData = () => {
    const resetResult = StorageService.resetToDemoData();
    setRecords(resetResult.records);
    setAlerts(resetResult.alerts);
    setRedistributions(resetResult.redistributions);
    setSettings(StorageService.getSettings());
  };

  const activeAlertsCount = alerts.filter((a) => a.status === 'active').length;
  const activeSurplusCount = records.filter(
    (r) => r.quantityRemainingKg > 0.5 && r.status !== 'Discarded'
  ).length;

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeAlertsCount={activeAlertsCount}
        activeSurplusCount={activeSurplusCount}
        isOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNavigate={setCurrentTab}
          activeAlertsCount={activeAlertsCount}
          canteenName={settings.canteenName}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'home' && (
            <HomeView
              records={records}
              alerts={alerts}
              redistributions={redistributions}
              settings={settings}
              onNavigate={setCurrentTab}
              onAddRecord={handleAddRecord}
              onUpdateRecord={handleUpdateRecord}
              onDeleteRecord={handleDeleteRecord}
              onUpdateAlert={handleUpdateAlert}
              onSaveRedistribution={handleSaveRedistribution}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardView
              records={records}
              alerts={alerts}
              settings={settings}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              records={records}
              onAddRecord={handleAddRecord}
              onUpdateRecord={handleUpdateRecord}
              onDeleteRecord={handleDeleteRecord}
              onInitiateRedistribution={handleInitiateRedistribution}
            />
          )}

          {currentTab === 'add-record' && (
            <AddRecordView
              records={records}
              onAddRecord={handleAddRecord}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'prediction' && (
            <PredictionView records={records} settings={settings} />
          )}

          {currentTab === 'surplus' && (
            <SurplusDetectionView
              records={records}
              settings={settings}
              onInitiateRedistribution={handleInitiateRedistribution}
              onUpdateRecord={handleUpdateRecord}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'alerts' && (
            <SmartAlertsView alerts={alerts} onUpdateAlert={handleUpdateAlert} />
          )}

          {currentTab === 'redistribution' && (
            <RedistributionView
              redistributions={redistributions}
              records={records}
              settings={settings}
              onSaveRedistribution={handleSaveRedistribution}
              onUpdateFoodRecord={handleUpdateRecord}
            />
          )}

          {currentTab === 'freshness' && (
            <FreshnessTrackingView
              records={records}
              onUpdateRecord={handleUpdateRecord}
            />
          )}

          {currentTab === 'recommendations' && (
            <RecommendationsView records={records} settings={settings} />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView records={records} settings={settings} />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              records={records}
              alerts={alerts}
              redistributions={redistributions}
              settings={settings}
            />
          )}

          {currentTab === 'historical' && (
            <HistoricalRecordsView records={records} />
          )}

          {currentTab === 'sustainability' && (
            <SustainabilityView records={records} settings={settings} />
          )}

          {currentTab === 'test-center' && <TestCenterView />}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetDemoData={handleResetDemoData}
              onReloadAllData={loadAllData}
            />
          )}

          {currentTab === 'about' && <AboutView onNavigate={setCurrentTab} />}
        </main>
      </div>

      {/* Global Quick Redistribution Modal */}
      {quickRedistRecord && (
        <RedistributeModal
          isOpen={!!quickRedistRecord}
          onClose={() => setQuickRedistRecord(null)}
          foodRecord={quickRedistRecord}
          onSave={(newRedist) => {
            handleSaveRedistribution(newRedist);
            // Update source food record
            const source = records.find((r) => r.id === newRedist.recordId);
            if (source) {
              handleUpdateRecord({
                ...source,
                quantityRedistributedKg: source.quantityRedistributedKg + newRedist.quantityRedistributedKg,
                status: newRedist.quantityRemainingKg <= 0.1 ? 'Redistributed' : 'Under Review',
                updatedAt: new Date().toISOString(),
              });
            }
            setQuickRedistRecord(null);
          }}
        />
      )}
    </div>
  );
}
