import React, { useState, useEffect } from 'react';
import { 
  Minus, 
  Square, 
  X, 
  Search, 
  Terminal, 
  Cpu, 
  RefreshCw,
  Maximize2
} from 'lucide-react';

interface HeaderTitleBarProps {
  onOpenSearch: () => void;
  teuTotal: number;
  maxTeuCapacity: number;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
}

export const HeaderTitleBar: React.FC<HeaderTitleBarProps> = ({
  onOpenSearch,
  teuTotal,
  maxTeuCapacity,
  isMaximized,
  onToggleMaximize,
  onRefreshData,
  isRefreshing
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const utilization = Math.round((teuTotal / maxTeuCapacity) * 100);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-300 text-xs select-none">
      {/* Top Windows 11 Caption Row */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold text-amber-400">
            DM
          </div>
          <span className="font-medium text-slate-200 tracking-tight text-xs">
            DepotMaster
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline text-[11px] font-mono">
            Windows Container Depot & Logistics Workstation [Rust x86_64-pc-windows-msvc]
          </span>
        </div>

        {/* System Telemetry & Clock */}
        <div className="flex items-center gap-4 text-[11px]">
          <div className="hidden lg:flex items-center gap-2 text-slate-400 font-mono">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tokio Runtime: 8 Workers Active</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-slate-400 font-mono">
            <span className="text-slate-500">Depot Utilization:</span>
            <span className="text-slate-200 tabular-nums font-semibold">{utilization}%</span>
            <span className="text-slate-500">({teuTotal}/{maxTeuCapacity} TEU)</span>
          </div>

          <div className="font-mono text-slate-300 tabular-nums px-2 py-0.5 bg-slate-900 rounded border border-slate-800">
            {timeStr || '12:00:00 UTC'}
          </div>

          {/* Windows Caption Controls */}
          <div className="flex items-center -mr-1">
            <button 
              onClick={() => {}} 
              title="Minimize to Windows Taskbar"
              className="w-8 h-6 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button 
              onClick={onToggleMaximize}
              title={isMaximized ? "Restore Window" : "Maximize Window"}
              className="w-8 h-6 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isMaximized ? <Maximize2 className="w-3 h-3" /> : <Square className="w-2.5 h-2.5" />}
            </button>
            <button 
              onClick={() => {}} 
              title="Close DepotMaster"
              className="w-9 h-6 flex items-center justify-center hover:bg-red-600 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Ribbon Search & Quick Action Sub-bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 text-xs transition-colors min-w-[280px]"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 text-left flex-1 truncate">Quick Search Container, Seal, Plate, BOL...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-slate-900 border border-slate-700 rounded text-slate-400 font-mono">
              Ctrl+K
            </kbd>
          </button>

          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs transition-colors disabled:opacity-50"
            title="Refresh Yard Sensors & Telematics"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline font-medium">Sync Telematics</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="hidden lg:inline text-slate-400">Terminal: Newark Maritime Depot (USNWK-DP01)</span>
          <span className="text-slate-600 hidden lg:inline">·</span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>EDIFACT & DCSA v2.2 Gateway Online</span>
          </span>
        </div>
      </div>
    </header>
  );
};
