import React from 'react';
import { 
  Grid, 
  Boxes, 
  Truck, 
  Globe, 
  Code2, 
  SlidersHorizontal,
  Layers,
  ThermometerSnowflake,
  ShieldAlert
} from 'lucide-react';

export type ActiveTab = 'yard' | 'inventory' | 'gate' | 'logistics' | 'rust';

interface CommandNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  totalContainers: number;
  reefersCount: number;
  hazmatCount: number;
  customsHoldCount: number;
}

export const CommandNav: React.FC<CommandNavProps> = ({
  activeTab,
  onSelectTab,
  totalContainers,
  reefersCount,
  hazmatCount,
  customsHoldCount
}) => {
  const tabs = [
    {
      id: 'yard' as ActiveTab,
      label: 'Real-Time Yard Tracker',
      icon: Grid,
      badge: `${totalContainers} Stacks`
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'Inventory Ledger & ISO Logs',
      icon: Boxes,
      badge: `${totalContainers} Records`
    },
    {
      id: 'gate' as ActiveTab,
      label: 'Gate In / Gate Out Station',
      icon: Truck,
      badge: 'EIR Ready'
    },
    {
      id: 'logistics' as ActiveTab,
      label: 'Logistics APIs & EDI Gateway',
      icon: Globe,
      badge: '4 Providers'
    },
    {
      id: 'rust' as ActiveTab,
      label: 'Rust Core & Windows Build',
      icon: Code2,
      badge: 'x86_64 Cargo'
    }
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Primary Tab Bar */}
      <div className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium text-xs transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-slate-800 text-amber-400 border border-slate-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                isActive ? 'bg-amber-400/10 text-amber-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Status Bar / High Priority Indicators (Clean Unboxed Text with Separators) */}
      <div className="hidden xl:flex items-center gap-2 text-slate-400 text-xs py-1">
        <span className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Active Yard:</span>
          <span className="font-mono tabular-nums text-white font-semibold">{totalContainers}</span>
        </span>
        <span className="text-slate-700" aria-hidden="true">·</span>
        <span className="flex items-center gap-1.5 text-cyan-300">
          <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cold Chain Reefers:</span>
          <span className="font-mono tabular-nums font-semibold">{reefersCount}</span>
        </span>
        <span className="text-slate-700" aria-hidden="true">·</span>
        <span className="flex items-center gap-1.5 text-amber-300">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>HazMat (IMO):</span>
          <span className="font-mono tabular-nums font-semibold">{hazmatCount}</span>
        </span>
        <span className="text-slate-700" aria-hidden="true">·</span>
        <span className="flex items-center gap-1.5 text-red-300">
          <span>Customs Hold:</span>
          <span className="font-mono tabular-nums font-semibold text-red-400">{customsHoldCount}</span>
        </span>
      </div>
    </div>
  );
};
