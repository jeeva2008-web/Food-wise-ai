import React from 'react';
import {
  Home,
  LayoutDashboard,
  UtensilsCrossed,
  PlusCircle,
  BrainCircuit,
  AlertTriangle,
  BellRing,
  Truck,
  Clock,
  BarChart3,
  FileSpreadsheet,
  History,
  Target,
  FlaskConical,
  Settings,
  Info,
  Leaf,
  Sparkles,
} from 'lucide-react';

export type NavItemKey =
  | 'home'
  | 'dashboard'
  | 'inventory'
  | 'add-record'
  | 'prediction'
  | 'surplus'
  | 'alerts'
  | 'redistribution'
  | 'freshness'
  | 'recommendations'
  | 'analytics'
  | 'reports'
  | 'historical'
  | 'sustainability'
  | 'test-center'
  | 'settings'
  | 'about';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  activeAlertsCount: number;
  activeSurplusCount: number;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeAlertsCount,
  activeSurplusCount,
  isOpen,
  onCloseMobile,
}) => {
  const navSections: Array<{
    title: string;
    items: Array<{
      key: NavItemKey;
      label: string;
      icon: React.ElementType;
      badge?: number;
      badgeVariant?: 'red' | 'amber';
    }>;
  }> = [
    {
      title: 'Overview',
      items: [
        { key: 'home', label: 'Home Page', icon: Home },
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Food Management',
      items: [
        { key: 'inventory', label: 'Food Inventory', icon: UtensilsCrossed },
        { key: 'add-record', label: 'Add Food Record', icon: PlusCircle },
        { key: 'prediction', label: 'Demand Prediction', icon: BrainCircuit },
        {
          key: 'surplus',
          label: 'Surplus Alerts',
          icon: AlertTriangle,
          badge: activeSurplusCount > 0 ? activeSurplusCount : undefined,
          badgeVariant: 'amber',
        },
        { key: 'redistribution', label: 'Redistribution', icon: Truck },
        { key: 'freshness', label: 'Freshness Tracking', icon: Clock },
      ],
    },
    {
      title: 'Insights',
      items: [
        { key: 'analytics', label: 'Waste Analytics', icon: BarChart3 },
        { key: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
        { key: 'sustainability', label: 'Campus Goals (SDG)', icon: Target },
        { key: 'historical', label: 'Historical Records', icon: History },
        { key: 'test-center', label: 'Test Centre', icon: FlaskConical },
      ],
    },
    {
      title: 'System',
      items: [
        { key: 'settings', label: 'Settings', icon: Settings },
        { key: 'about', label: 'About FoodWise AI', icon: Info },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Zone - Rathinam Global University */}
        <div className="flex h-20 items-center gap-3 border-b border-neutral-200 px-5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-900 text-white shadow-xs">
            <Leaf className="h-6 w-6 text-emerald-300" />
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
              AI
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-neutral-900 truncate">
                FoodWise AI
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 truncate">
              Rathinam Global University
            </span>
            <span className="text-[10px] text-neutral-400 truncate">
              Smart Campus Food System
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                {section.title}
              </div>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        onSelectTab(item.key);
                        onCloseMobile();
                      }}
                      className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-emerald-900 text-white shadow-xs'
                          : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive
                              ? 'text-emerald-300'
                              : 'text-neutral-500 group-hover:text-neutral-800'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badgeVariant === 'red'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Quick Campus Trust Footer */}
        <div className="border-t border-neutral-200 p-4">
          <div className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-200/60 text-xs">
            <div className="flex items-center justify-between text-neutral-700 mb-1">
              <span className="font-bold text-emerald-950">Campus Sustainability</span>
              <span className="text-[10px] font-bold text-emerald-800">UN SDG 12.3</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Predicting demand, preventing kitchen surplus, and supporting Coimbatore community welfare.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
