import React from 'react';
import { Search, Sun, Moon, Bell } from 'lucide-react';

interface HyliumHeaderProps {
  title: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenCommandPalette?: () => void;
  currentRealTime?: Date;
}

export const HyliumHeader: React.FC<HyliumHeaderProps> = ({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  isDark,
  onToggleTheme,
  onOpenCommandPalette,
  currentRealTime
}) => {
  // Theme tokens matching Hylium design
  const textPrimary = isDark ? '#EAF5F5' : '#17324A';
  const textMuted = isDark ? '#91A8B5' : '#7B8C9D';
  const textMuted2 = isDark ? '#718B99' : '#8AA0AE';
  const surfaceBg = isDark ? '#14232E' : '#FFFFFF';
  const surfaceBorder = isDark ? '#2A404C' : '#E1EAED';
  const inputBg = isDark ? '#14232E' : '#FFFFFF';
  const tealAccent = isDark ? '#53D0BC' : '#18B7A0';

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 select-none pb-1">
      {/* Clean Single Title Area */}
      <div className="flex items-center gap-3">
        <h1 
          className="text-xl sm:text-2xl font-bold tracking-tight"
          style={{ 
            color: textPrimary,
            fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif" 
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <span 
            className="hidden md:inline-block text-xs pl-3 border-l"
            style={{ color: textMuted, borderColor: surfaceBorder }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {/* Right Controls: Real-Time Clock, Search, Notifications, Theme Toggle, User Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Live Real-Time Clock Badge */}
        {currentRealTime && (
          <div 
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono border shadow-xs"
            style={{
              backgroundColor: surfaceBg,
              borderColor: surfaceBorder,
              color: textPrimary
            }}
            title="Live terminal reference date ($R$1) actively computing container dwell via formula =$R$1-H155+1"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">LIVE</span>
            <span className="text-slate-400">·</span>
            <span className="text-xs">
              {currentRealTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-xs font-bold font-mono text-teal-400">
              {currentRealTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        )}
        {/* Global Search Bar */}
        <div className="relative min-w-[200px] sm:min-w-[280px]">
          <Search 
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" 
            style={{ color: textMuted }}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search anything"
            className="w-full pl-10 pr-12 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors focus:outline-none"
            style={{
              backgroundColor: inputBg,
              color: textPrimary,
              border: `1px solid ${surfaceBorder}`
            }}
          />
          <kbd 
            onClick={onOpenCommandPalette}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer hidden sm:inline-block border"
            style={{
              backgroundColor: isDark ? '#192B36' : '#F0F5F6',
              borderColor: surfaceBorder,
              color: textMuted2
            }}
          >
            ⌘ K
          </kbd>
        </div>

        {/* Notifications Button with subtle indicator dot */}
        <button
          type="button"
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer border shadow-xs"
          style={{
            backgroundColor: surfaceBg,
            borderColor: surfaceBorder,
            color: textMuted
          }}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span 
            className="absolute top-2 right-2 w-2 h-2 rounded-full"
            style={{ backgroundColor: tealAccent }}
          />
        </button>

        {/* Theme Toggle (Light / Dark Mode) */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer border shadow-xs"
          style={{
            backgroundColor: surfaceBg,
            borderColor: surfaceBorder,
            color: textMuted
          }}
          aria-label="Toggle theme"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* User Avatar with Initials */}
        <div 
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs cursor-pointer select-none"
          style={{
            background: 'linear-gradient(135deg, #18B7A0 0%, #1289A5 100%)'
          }}
          title="Solo Analysis (Depot Manager)"
        >
          AM
        </div>
      </div>
    </header>
  );
};
