import React from 'react';
import {
  Menu,
  Plus,
  Bell,
  Calendar,
  Building2,
  BrainCircuit,
  AlertTriangle,
  BarChart3,
  Home,
} from 'lucide-react';
import { NavItemKey } from './Sidebar';

interface HeaderProps {
  currentTab: NavItemKey;
  onOpenMobileMenu: () => void;
  onNavigate: (tab: NavItemKey) => void;
  activeAlertsCount: number;
  canteenName: string;
}

const TAB_TITLES: Record<NavItemKey, { title: string; subtitle: string }> = {
  home: {
    title: 'Rathinam Global University',
    subtitle: 'Smart Campus Food Waste Management System',
  },
  dashboard: {
    title: 'Operations Dashboard',
    subtitle: 'Live food preparation, consumption, and surplus metrics',
  },
  inventory: {
    title: 'Food Inventory Management',
    subtitle: 'Track batch weights, mass balance, and storage states',
  },
  'add-record': {
    title: 'Add Food Record',
    subtitle: 'Log a new kitchen batch with instant mass balance validation',
  },
  prediction: {
    title: 'AI Demand Prediction Engine',
    subtitle: 'Heuristic & ML-calibrated attendance-demand forecasting',
  },
  surplus: {
    title: 'Smart Surplus Detection',
    subtitle: 'Automated threshold monitoring and leftover audits',
  },
  alerts: {
    title: 'Smart Alert Center',
    subtitle: 'Prioritized notifications for surplus, anomalies, and deadlines',
  },
  redistribution: {
    title: 'Food Redistribution Workflow',
    subtitle: 'Safe surplus transfer to student pantries and community partners',
  },
  freshness: {
    title: 'Expiry & Freshness Tracking',
    subtitle: 'Strict holding duration verification & safety inspection queue',
  },
  recommendations: {
    title: 'Waste Reduction Recommendations',
    subtitle: 'Data-driven culinary interventions to minimize prep excess',
  },
  analytics: {
    title: 'Waste Analytics & Trends',
    subtitle: 'Visual time-series, category breakdowns, and model performance',
  },
  reports: {
    title: 'Reports & Export Center',
    subtitle: 'Generate printable summaries and download compliant CSV logs',
  },
  historical: {
    title: 'Historical Batch Ledger',
    subtitle: 'Audit trail of past food preparation and disposal outcomes',
  },
  sustainability: {
    title: 'Goals & Sustainability Impact',
    subtitle: 'UN SDG 12.3 progress, meals saved, and carbon footprint reduction',
  },
  'test-center': {
    title: 'System Test Centre',
    subtitle: 'Run 12 automated verification scenarios against core algorithms',
  },
  settings: {
    title: 'Canteen System Settings',
    subtitle: 'Adjust thresholds, serving ratios, and manage demo datasets',
  },
  about: {
    title: 'About FoodWise AI & Demo Guide',
    subtitle: 'Rathinam Global University Hackathon project architecture & walkthrough',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onNavigate,
  activeAlertsCount,
  canteenName,
}) => {
  const currentInfo = TAB_TITLES[currentTab] || {
    title: 'FoodWise AI',
    subtitle: 'Rathinam Global University',
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
      {/* Left zone: Mobile toggle + Breadcrumb Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 lg:hidden shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-neutral-900 sm:text-base truncate">
              {currentInfo.title}
            </h1>
            {currentTab !== 'home' && (
              <span className="hidden md:inline text-xs font-semibold text-emerald-800">
                · Rathinam Campus
              </span>
            )}
          </div>
          <p className="hidden text-[11px] text-neutral-500 sm:block truncate">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right zone: Quick Action Strip, Campus badge & Alert bell */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick action buttons (Desktop) */}
        <div className="hidden xl:flex items-center gap-1.5 border-r border-neutral-200 pr-3">
          <button
            onClick={() => onNavigate('add-record')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              currentTab === 'add-record'
                ? 'bg-emerald-900 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Plus className="h-3.5 w-3.5 text-emerald-600" />
            <span>Add Record</span>
          </button>

          <button
            onClick={() => onNavigate('prediction')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              currentTab === 'prediction'
                ? 'bg-emerald-900 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <BrainCircuit className="h-3.5 w-3.5 text-emerald-600" />
            <span>Predict Demand</span>
          </button>

          <button
            onClick={() => onNavigate('surplus')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              currentTab === 'surplus'
                ? 'bg-emerald-900 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span>Review Surplus</span>
          </button>

          <button
            onClick={() => onNavigate('analytics')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              currentTab === 'analytics'
                ? 'bg-emerald-900 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Analytics</span>
          </button>
        </div>

        {/* Date */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-neutral-500">
          <Calendar className="h-3.5 w-3.5" />
          <span>{todayStr}</span>
        </div>

        {/* Alert Bell Shortcut */}
        <button
          onClick={() => onNavigate('alerts')}
          className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          title="View Smart Alerts"
        >
          <Bell className="h-4.5 w-4.5" />
          {activeAlertsCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* Quick Primary Button */}
        {currentTab === 'home' ? (
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
          >
            <span>Open Dashboard</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('add-record')}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Record</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>
    </header>
  );
};
