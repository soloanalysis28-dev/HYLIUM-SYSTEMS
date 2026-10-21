import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Sun, 
  Moon, 
  Bell, 
  ShieldCheck, 
  Monitor, 
  LogOut, 
  Terminal, 
  ChevronDown, 
  Info,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { ConsoleEdition } from '../types/depot';

interface HyliumHeaderProps {
  title: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenCommandPalette?: () => void;
  currentRealTime?: Date;
  consoleEdition?: ConsoleEdition;
  onOpenSetupWizard?: () => void;
}

export const HyliumHeader: React.FC<HyliumHeaderProps> = ({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  isDark,
  onToggleTheme,
  onOpenCommandPalette,
  currentRealTime,
  consoleEdition = 'admin',
  onOpenSetupWizard
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [signOutNotice, setSignOutNotice] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme tokens matching Hylium design
  const textPrimary = isDark ? '#EAF5F5' : '#17324A';
  const textMuted = isDark ? '#91A8B5' : '#7B8C9D';
  const textMuted2 = isDark ? '#718B99' : '#8AA0AE';
  const surfaceBg = isDark ? '#14232E' : '#FFFFFF';
  const surfaceBorder = isDark ? '#2A404C' : '#E1EAED';
  const inputBg = isDark ? '#14232E' : '#FFFFFF';
  const tealAccent = isDark ? '#53D0BC' : '#18B7A0';

  const handleSignOutClick = () => {
    setSignOutNotice('Sign out will be implemented later');
    setTimeout(() => {
      setSignOutNotice(null);
    }, 3500);
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 select-none pb-1 relative z-30">
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

      {/* Right Controls: Real-Time Clock, Search, Notifications, Theme Toggle, User Avatar with Label Underneath */}
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
            title="Live terminal clock actively computing real-time container dwell"
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

        {/* User Profile Container: Avatar + Admin Console Label Appearing Directly Underneath */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            className="flex flex-col items-center justify-center group cursor-pointer focus:outline-none transition-transform active:scale-95"
            title="User Profile & Account Clearance - Click to view controls"
          >
            {/* User Avatar with Initials "AM" matching attached image */}
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs select-none transition-all group-hover:ring-2 group-hover:ring-teal-400"
              style={{
                background: 'linear-gradient(135deg, #18B7A0 0%, #1289A5 100%)'
              }}
            >
              AM
            </div>

            {/* Admin Console Label directly under user profile avatar */}
            <span 
              className="text-[10px] font-semibold tracking-tight leading-none mt-1 whitespace-nowrap select-none transition-colors"
              style={{ 
                color: isDark ? '#53D0BC' : '#128B7B'
              }}
            >
              {consoleEdition === 'admin' ? 'Admin Console' : 'Client Console'}
            </span>
          </button>

          {/* User Option Dropdown: Tells Account Clearance and Houses User-Centric Controls */}
          {isProfileOpen && (
            <div 
              className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-2xl shadow-2xl border p-4.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              style={{
                backgroundColor: isDark ? '#0D1720' : '#FFFFFF',
                borderColor: isDark ? '#2A404C' : '#E1EAED',
                boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)'
              }}
            >
              {/* Profile Card Header */}
              <div className="flex items-center gap-3 pb-3.5 border-b" style={{ borderColor: surfaceBorder }}>
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs"
                  style={{
                    background: 'linear-gradient(135deg, #18B7A0 0%, #1289A5 100%)'
                  }}
                >
                  AM
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm truncate" style={{ color: textPrimary }}>
                      Solo Analysis
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-500 border border-teal-500/20">
                      ONLINE
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: textMuted }}>
                    soloanalysis28@gmail.com
                  </p>
                  <p className="text-[11px] font-mono mt-0.5 truncate" style={{ color: textMuted2 }}>
                    Terminal Director · Badge #AM-9842
                  </p>
                </div>
              </div>

              {/* Account Clearance Display - Specifically housed here */}
              <div 
                className="my-3.5 p-3 rounded-xl border space-y-1.5"
                style={{
                  backgroundColor: consoleEdition === 'admin' 
                    ? (isDark ? '#112D2B' : '#E8F7F4') 
                    : (isDark ? '#2D2312' : '#FEF6E9'),
                  borderColor: consoleEdition === 'admin' 
                    ? (isDark ? '#1C5B56' : '#C1EAE2') 
                    : (isDark ? '#614B20' : '#FCE5B8')
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Account Clearance Level
                  </span>
                  <span 
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      consoleEdition === 'admin'
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : 'bg-amber-500/20 text-amber-500'
                    }`}
                  >
                    {consoleEdition === 'admin' ? 'LEVEL 5' : 'LEVEL 2'}
                  </span>
                </div>

                <div 
                  className="font-bold text-xs flex items-center gap-1.5"
                  style={{
                    color: consoleEdition === 'admin' 
                      ? (isDark ? '#53D0BC' : '#128B7B') 
                      : (isDark ? '#F59E0B' : '#B45309')
                  }}
                >
                  {consoleEdition === 'admin' ? (
                    <>
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>Level 5 - Master Administrator Clearance</span>
                    </>
                  ) : (
                    <>
                      <Monitor className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>Level 2 - Field Operator Clearance</span>
                    </>
                  )}
                </div>

                <p className="text-[11px] leading-relaxed" style={{ color: textMuted }}>
                  {consoleEdition === 'admin'
                    ? 'Your account has full root clearance: physical depot capacity tuning, container typologies, IICL standard repair tariffs, carrier tax invoicing, API keys & webhooks, and audit logs.'
                    : 'Your account has field operator clearance: Gate In/Out processing, EIR issuance, yard crane stack repositioning, and equipment damage surveys.'}
                </p>
              </div>

              {/* User Centric Controls */}
              <div className="space-y-1 text-xs pt-1 border-t" style={{ borderColor: surfaceBorder }}>
                {/* Workstation Console Setup Fork Switcher */}
                {onOpenSetupWizard && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenSetupWizard();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left group hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    style={{ color: textPrimary }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Terminal className="w-4 h-4 text-teal-400" />
                      <span>Workstation Setup (setup.exe)</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-teal-400">
                      Switch Fork →
                    </span>
                  </button>
                )}

                {/* Theme Quick Switcher */}
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  style={{ color: textPrimary }}
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                    <span>Appearance</span>
                  </div>
                  <span className="text-[11px] font-mono" style={{ color: textMuted }}>
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </button>

                {/* Terminal Node Information */}
                <div 
                  className="px-3 py-2 rounded-xl text-[11px] font-mono space-y-0.5 border"
                  style={{ 
                    backgroundColor: isDark ? '#14232E' : '#F9FBFC',
                    borderColor: surfaceBorder,
                    color: textMuted 
                  }}
                >
                  <div className="flex justify-between">
                    <span>Terminal Station:</span>
                    <span className="font-semibold" style={{ color: textPrimary }}>USNWK-DP01</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Workstation Host:</span>
                    <span>127.0.0.1:3000</span>
                  </div>
                </div>
              </div>

              {/* Sign Out Button - Centric User Control */}
              <div className="pt-2.5 mt-2.5 border-t" style={{ borderColor: surfaceBorder }}>
                <button
                  type="button"
                  onClick={handleSignOutClick}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>

                {signOutNotice && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] text-center font-medium animate-in fade-in duration-200">
                    {signOutNotice}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
