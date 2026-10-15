import React, { useState, useMemo } from 'react';
import { 
  ContainerItem, 
  YardZone, 
  IsoContainerType,
  ContainerTypeCode,
  DEFAULT_ENABLED_CONTAINER_TYPES,
  CONTAINER_TYPOLOGY_SPECS
} from '../types/depot';
import { 
  Boxes, 
  Layers, 
  Search, 
  Eye, 
  Move, 
  Clock, 
  SlidersHorizontal, 
  ArrowUpRight, 
  ThermometerSnowflake, 
  ShieldAlert, 
  Warehouse,
  Percent,
  Settings as SettingsIcon,
  Filter
} from 'lucide-react';

interface HyliumStockControlViewProps {
  isDark: boolean;
  containers: ContainerItem[];
  zones: YardZone[];
  depotCapacityTeu: number;
  enabledContainerTypes?: ContainerTypeCode[];
  onSelectContainer: (container: ContainerItem) => void;
  onRequestMove: (container: ContainerItem) => void;
  onNavigateToSettings: () => void;
}

export const HyliumStockControlView: React.FC<HyliumStockControlViewProps> = ({
  isDark,
  containers,
  zones,
  depotCapacityTeu,
  enabledContainerTypes = DEFAULT_ENABLED_CONTAINER_TYPES,
  onSelectContainer,
  onRequestMove,
  onNavigateToSettings
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');

  // In-yard containers
  const yardContainers = useMemo(() => {
    return containers.filter((c) => c.status === 'In Yard');
  }, [containers]);

  // Compute total TEU of current stock
  const currentTotalTeu = useMemo(() => {
    return yardContainers.reduce((sum, c) => {
      if (c.isoType === '40HC' || c.isoType === '40GP' || c.isoType === '40RF' || c.isoType === '40FR' || c.isoType === '40OT') return sum + 2;
      if (c.isoType === '45HC') return sum + 2.25;
      return sum + 1; // 20GP, 20ST, 20RF, 20OT, 20FR, 20TK
    }, 0);
  }, [yardContainers]);

  // Dynamic utilisation percentage based on configured capacity
  const utilisationPercent = depotCapacityTeu > 0 
    ? Math.min(100, Math.round((currentTotalTeu / depotCapacityTeu) * 100))
    : 0;

  // Breakdown by container type
  const count40HC = useMemo(() => yardContainers.filter((c) => c.isoType === '40HC').length, [yardContainers]);
  const count20ST = useMemo(() => yardContainers.filter((c) => c.isoType === '20GP' || c.isoType === '20ST').length, [yardContainers]);
  const count40GP = useMemo(() => yardContainers.filter((c) => c.isoType === '40GP').length, [yardContainers]);
  
  // Counts of extended types (if enabled in settings)
  const count45HC = useMemo(() => yardContainers.filter((c) => c.isoType === '45HC').length, [yardContainers]);
  const countReefer = useMemo(() => yardContainers.filter((c) => c.isoType === '20RF' || c.isoType === '40RF').length, [yardContainers]);
  const countOpenTop = useMemo(() => yardContainers.filter((c) => c.isoType === '20OT' || c.isoType === '40OT').length, [yardContainers]);
  const countFlatRack = useMemo(() => yardContainers.filter((c) => c.isoType === '20FR' || c.isoType === '40FR').length, [yardContainers]);
  const countTank = useMemo(() => yardContainers.filter((c) => c.isoType === '20TK').length, [yardContainers]);

  // Dwell Aging
  const freshCount = useMemo(() => yardContainers.filter((c) => c.dwellDays <= 7).length, [yardContainers]);
  const mediumCount = useMemo(() => yardContainers.filter((c) => c.dwellDays > 7 && c.dwellDays <= 30).length, [yardContainers]);
  const longCount = useMemo(() => yardContainers.filter((c) => c.dwellDays > 30).length, [yardContainers]);

  // Check if any extended types are active in settings
  const hasExtendedTypesEnabled = useMemo(() => {
    return enabledContainerTypes.some((t) => !DEFAULT_ENABLED_CONTAINER_TYPES.includes(t));
  }, [enabledContainerTypes]);

  // Filtered containers
  const filtered = useMemo(() => {
    return yardContainers.filter((c) => {
      // Type Filter
      if (selectedTypeFilter !== 'ALL') {
        if (selectedTypeFilter === '40HC' && c.isoType !== '40HC') return false;
        if ((selectedTypeFilter === '20S' || selectedTypeFilter === '20ST') && c.isoType !== '20GP' && c.isoType !== '20ST') return false;
        if (selectedTypeFilter === '40GP' && c.isoType !== '40GP') return false;
        if (selectedTypeFilter === '45HC' && c.isoType !== '45HC') return false;
        if (selectedTypeFilter === '20RF' && c.isoType !== '20RF') return false;
        if (selectedTypeFilter === '40RF' && c.isoType !== '40RF') return false;
        if (selectedTypeFilter === '20OT' && c.isoType !== '20OT') return false;
        if (selectedTypeFilter === '40OT' && c.isoType !== '40OT') return false;
        if (selectedTypeFilter === '20FR' && c.isoType !== '20FR') return false;
        if (selectedTypeFilter === '40FR' && c.isoType !== '40FR') return false;
        if (selectedTypeFilter === '20TK' && c.isoType !== '20TK') return false;
      }

      // Zone Filter
      if (selectedZoneFilter !== 'ALL' && c.location.zone !== selectedZoneFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = c.id.toLowerCase().includes(q) || c.formattedId.toLowerCase().includes(q);
        const matchSerial = c.serial.toLowerCase().includes(q);
        const matchBooking = c.bookingReference?.toLowerCase().includes(q);
        const matchLine = c.shippingLine.toLowerCase().includes(q);
        if (!matchId && !matchSerial && !matchBooking && !matchLine) return false;
      }

      return true;
    });
  }, [yardContainers, selectedTypeFilter, selectedZoneFilter, searchQuery]);

  // Theme tokens
  const cardBg = isDark ? '#14232E' : '#FFFFFF';
  const cardBorder = isDark ? '#2A404C' : '#E1EAED';
  const textPrimary = isDark ? '#EAF5F5' : '#17324A';
  const textMuted = isDark ? '#91A8B5' : '#7B8C9D';
  const textMuted2 = isDark ? '#718B99' : '#8AA0AE';
  const surface2 = isDark ? '#192B36' : '#F0F5F6';
  const tealAccent = isDark ? '#53D0BC' : '#18B7A0';

  return (
    <div className="space-y-6 select-none">
      {/* 1. Master Utilization & Stock Capacity Ribbon */}
      <div 
        className="p-5 sm:p-6 rounded-2xl shadow-xs border transition-colors"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
          {/* Stat 1: Total Available Stock */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider block" style={{ color: textMuted }}>
              Total Stock Available
            </span>
            <div className="flex items-baseline gap-2">
              <span 
                className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                style={{ 
                  color: textPrimary,
                  fontFamily: "'Space Grotesk', sans-serif" 
                }}
              >
                {yardContainers.length}
              </span>
              <span className="text-xs font-mono font-bold" style={{ color: tealAccent }}>
                Units ({currentTotalTeu} TEU)
              </span>
            </div>
            <p className="text-xs" style={{ color: textMuted }}>
              ONE container single-line equipment pool
            </p>
          </div>

          {/* Stat 2: Yard Utilisation Rate */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold font-mono uppercase tracking-wider" style={{ color: textMuted }}>
                Depot Utilisation
              </span>
              <button
                type="button"
                onClick={onNavigateToSettings}
                title="Configure depot capacity in Settings"
                className="text-[11px] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                style={{ color: tealAccent }}
              >
                <span>Settings</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <span 
                className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                style={{ 
                  color: utilisationPercent > 85 ? '#F1B84B' : textPrimary,
                  fontFamily: "'Space Grotesk', sans-serif" 
                }}
              >
                {utilisationPercent}%
              </span>
              <span className="text-xs font-mono" style={{ color: textMuted }}>
                of {depotCapacityTeu} TEU Capacity
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${utilisationPercent}%`,
                  backgroundColor: utilisationPercent > 85 ? '#F1B84B' : '#18B7A0' 
                }}
              />
            </div>
          </div>

          {/* Stat 3: Core Equipment Fleet Mix */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider block" style={{ color: textMuted }}>
              Core Fleet Equipment Mix
            </span>
            <div className="flex items-baseline gap-2">
              <span 
                className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                style={{ 
                  color: textPrimary,
                  fontFamily: "'Space Grotesk', sans-serif" 
                }}
              >
                {count40HC + count40GP + count20ST}
              </span>
              <span className="text-xs font-mono font-semibold" style={{ color: tealAccent }}>
                Standard Dry Units
              </span>
            </div>
            <p className="text-xs font-mono" style={{ color: textMuted }}>
              40HC: {count40HC} · GP: {count40GP} · 20S: {count20ST}
            </p>
          </div>

          {/* Stat 4: Dwell Profile */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider block" style={{ color: textMuted }}>
              Dwell Aging Status
            </span>
            <div className="flex items-baseline gap-2">
              <span 
                className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                style={{ 
                  color: textPrimary,
                  fontFamily: "'Space Grotesk', sans-serif" 
                }}
              >
                {freshCount}
              </span>
              <span className="text-xs font-mono font-semibold" style={{ color: tealAccent }}>
                ≤7d Free Turn-Ins
              </span>
            </div>
            <p className="text-xs" style={{ color: textMuted }}>
              {mediumCount} intermediate · {longCount} demurrage active
            </p>
          </div>
        </div>
      </div>

      {/* 2. Container Typology Distribution Cards */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <div>
            <h3 
              className="text-base sm:text-lg font-bold tracking-tight"
              style={{ 
                color: textPrimary,
                fontFamily: "'Space Grotesk', sans-serif" 
              }}
            >
              Stock Distribution by Container Typology
            </h3>
            <p className="text-xs mt-0.5" style={{ color: textMuted }}>
              Current stock breakdown for 40' HC, 40' GP, and 20' ST dry equipment, with reserved slots for extended ISO typologies.
            </p>
          </div>

          {selectedTypeFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('ALL')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer"
              style={{ backgroundColor: surface2, borderColor: cardBorder, color: tealAccent }}
            >
              Reset Type Filter (Showing All)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Card 1: 40HC */}
          <div 
            onClick={() => setSelectedTypeFilter(selectedTypeFilter === '40HC' ? 'ALL' : '40HC')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 ${
              selectedTypeFilter === '40HC' ? 'ring-2 ring-[#18B7A0]' : ''
            }`}
            style={{ 
              backgroundColor: cardBg, 
              borderColor: selectedTypeFilter === '40HC' ? tealAccent : cardBorder 
            }}
          >
            <div className="flex items-center justify-between">
              <span 
                className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: isDark ? '#123D3B' : '#E8F8F5',
                  color: isDark ? '#53D0BC' : '#128B7B'
                }}
              >
                40HC
              </span>
              <span className="text-[11px] font-mono font-semibold" style={{ color: textMuted }}>
                2 TEU · 9'6" Height
              </span>
            </div>

            <div className="mt-3">
              <span 
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ 
                  color: textPrimary,
                  fontFamily: "'Space Grotesk', sans-serif" 
                }}
              >
                {count40HC}
              </span>
              <span className="text-xs ml-1 font-semibold" style={{ color: textMuted }}>
                Units in Stock ({count40HC * 2} TEU)
              </span>
            </div>

            <p className="text-xs font-medium mt-1" style={{ color: textPrimary }}>
              40' High Cube Dry Van
            </p>

            <div className="mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-mono" style={{ borderColor: cardBorder, color: textMuted }}>
              <span>Tare: 3,850 kg</span>
              <span style={{ color: selectedTypeFilter === '40HC' ? tealAccent : textMuted }}>
                {selectedTypeFilter === '40HC' ? '● Active Filter' : 'Click to filter'}
              </span>
            </div>
          </div>

          {/* Card 2: GP / 40GP */}
          <div 
            onClick={() => setSelectedTypeFilter(selectedTypeFilter === '40GP' ? 'ALL' : '40GP')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 ${
              selectedTypeFilter === '40GP' ? 'ring-2 ring-[#18B7A0]' : ''
            }`}
            style={{ 
              backgroundColor: cardBg, 
              borderColor: selectedTypeFilter === '40GP' ? tealAccent : cardBorder 
            }}
          >
            <div className="flex items-center justify-between">
              <span 
                className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: isDark ? '#493818' : '#FFF5DE',
                  color: isDark ? '#F1B84B' : '#E49A24'
                }}
              >
                GP (40GP)
              </span>
              <span className="text-[11px] font-mono font-semibold" style={{ color: textMuted }}>
                2 TEU · 8'6" Height
              </span>
            </div>

            <div className="mt-3">
              <span 
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ 
                  color: textPrimary,
                  fontFamily: "'Space Grotesk', sans-serif" 
                }}
              >
                {count40GP}
              </span>
              <span className="text-xs ml-1 font-semibold" style={{ color: textMuted }}>
                Units in Stock ({count40GP * 2} TEU)
              </span>
            </div>

            <p className="text-xs font-medium mt-1" style={{ color: textPrimary }}>
              40' General Purpose Dry Van (GP)
            </p>

            <div className="mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-mono" style={{ borderColor: cardBorder, color: textMuted }}>
              <span>Tare: 3,700 kg</span>
              <span style={{ color: selectedTypeFilter === '40GP' ? tealAccent : textMuted }}>
                {selectedTypeFilter === '40GP' ? '● Active Filter' : 'Click to filter'}
              </span>
            </div>
          </div>

          {/* Card 3: 20S / 20ST */}
          <div 
            onClick={() => setSelectedTypeFilter(selectedTypeFilter === '20S' || selectedTypeFilter === '20ST' ? 'ALL' : '20S')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 ${
              selectedTypeFilter === '20S' || selectedTypeFilter === '20ST' ? 'ring-2 ring-[#18B7A0]' : ''
            }`}
            style={{ 
              backgroundColor: cardBg, 
              borderColor: selectedTypeFilter === '20S' || selectedTypeFilter === '20ST' ? tealAccent : cardBorder 
            }}
          >
            <div className="flex items-center justify-between">
              <span 
                className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: isDark ? '#162E4B' : '#EDF3FC',
                  color: isDark ? '#5B9BFF' : '#2D79D8'
                }}
              >
                20S (20ST/GP)
              </span>
              <span className="text-[11px] font-mono font-semibold" style={{ color: textMuted }}>
                1 TEU · 8'6" Height
              </span>
            </div>

            <div className="mt-3">
              <span 
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ 
                  color: textPrimary,
                  fontFamily: "'Space Grotesk', sans-serif" 
                }}
              >
                {count20ST}
              </span>
              <span className="text-xs ml-1 font-semibold" style={{ color: textMuted }}>
                Units in Stock ({count20ST} TEU)
              </span>
            </div>

            <p className="text-xs font-medium mt-1" style={{ color: textPrimary }}>
              20' Standard Dry Container (20S)
            </p>

            <div className="mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-mono" style={{ borderColor: cardBorder, color: textMuted }}>
              <span>Tare: 2,150 kg</span>
              <span style={{ color: selectedTypeFilter === '20S' || selectedTypeFilter === '20ST' ? tealAccent : textMuted }}>
                {selectedTypeFilter === '20S' || selectedTypeFilter === '20ST' ? '● Active Filter' : 'Click to filter'}
              </span>
            </div>
          </div>

          {/* Card 4: Extended Typologies (Configurable in Settings) */}
          {hasExtendedTypesEnabled ? (
            <div 
              className="p-4 sm:p-5 rounded-2xl border space-y-2 shadow-xs"
              style={{ 
                backgroundColor: surface2, 
                borderColor: cardBorder 
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10" style={{ color: textMuted }}>
                  Extended Fleet
                </span>
                <span className="text-[10px] font-mono font-semibold text-emerald-500">
                  Active in Settings
                </span>
              </div>

              <div className="pt-1 space-y-1.5 text-xs font-mono" style={{ color: textMuted }}>
                {enabledContainerTypes.includes('45HC') && (
                  <div className="flex items-center justify-between">
                    <span>45' High Cube (45HC):</span>
                    <strong style={{ color: textPrimary }}>{count45HC} in stock</strong>
                  </div>
                )}
                {(enabledContainerTypes.includes('20RF') || enabledContainerTypes.includes('40RF')) && (
                  <div className="flex items-center justify-between">
                    <span>Reefer (RF):</span>
                    <strong style={{ color: textPrimary }}>{countReefer} in stock</strong>
                  </div>
                )}
                {(enabledContainerTypes.includes('20OT') || enabledContainerTypes.includes('40OT') || enabledContainerTypes.includes('20FR') || enabledContainerTypes.includes('40FR') || enabledContainerTypes.includes('20TK')) && (
                  <div className="flex items-center justify-between">
                    <span>Special (OT/FR/TK):</span>
                    <strong style={{ color: textPrimary }}>{countOpenTop + countFlatRack + countTank} in stock</strong>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t flex items-center justify-between text-[11px]" style={{ borderColor: cardBorder }}>
                <span style={{ color: textMuted2 }}>Additional types active</span>
                <button
                  type="button"
                  onClick={onNavigateToSettings}
                  className="font-semibold text-teal-500 hover:underline cursor-pointer"
                >
                  Settings
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={onNavigateToSettings}
              className="p-4 sm:p-5 rounded-2xl border space-y-2.5 shadow-xs transition-all cursor-pointer hover:border-teal-500/50"
              style={{ 
                backgroundColor: surface2, 
                borderColor: cardBorder 
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10" style={{ color: textMuted }}>
                  Extended Fleet
                </span>
                <span className="text-[10px] font-mono font-semibold" style={{ color: textMuted }}>
                  Inactive (Default)
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold" style={{ color: textPrimary }}>
                  Streamlined to 40HC, GP & 20S
                </h4>
                <p className="text-[11px] mt-0.5" style={{ color: textMuted }}>
                  45HC, Reefer, Open Top, Flat Rack, and Tank typologies are inactive by default. Toggle them in Settings when needed.
                </p>
              </div>

              <div className="pt-2 border-t flex items-center justify-between text-[11px] font-semibold" style={{ borderColor: cardBorder, color: tealAccent }}>
                <span>Toggle in Settings</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Live Available Stock Table with Filter Controls */}
      <div 
        className="rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs border transition-colors"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        {/* Table Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 
              className="text-base font-bold tracking-tight"
              style={{ 
                color: textPrimary,
                fontFamily: "'Space Grotesk', sans-serif" 
              }}
            >
              Available Container Stock Roster
            </h3>
            <span 
              className="text-xs font-mono px-2.5 py-0.5 rounded-full font-bold border"
              style={{
                backgroundColor: isDark ? '#123D3B' : '#E8F8F5',
                color: isDark ? '#53D0BC' : '#128B7B',
                borderColor: isDark ? '#18B7A0' : '#DDEDEA'
              }}
            >
              {filtered.length} of {yardContainers.length} Units Available
            </span>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[220px] sm:min-w-[280px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by container ID, serial..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-medium focus:outline-none transition-colors border"
              style={{
                backgroundColor: surface2,
                borderColor: cardBorder,
                color: textPrimary
              }}
            />
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t" style={{ borderColor: cardBorder }}>
          <span className="text-[11px] font-mono mr-1" style={{ color: textMuted }}>Type:</span>
          {/* Dynamic Typology Filter Pills */}
          {[
            { id: 'ALL', label: `All Types (${yardContainers.length})` },
            ...(enabledContainerTypes.includes('40HC') ? [{ id: '40HC', label: `40' High Cube (${count40HC})` }] : []),
            ...(enabledContainerTypes.includes('40GP') ? [{ id: '40GP', label: `GP / 40GP (${count40GP})` }] : []),
            ...(enabledContainerTypes.includes('20S') ? [{ id: '20S', label: `20S Dry (${count20ST})` }] : []),
            ...(enabledContainerTypes.includes('45HC') ? [{ id: '45HC', label: `45' HC (${count45HC})` }] : []),
            ...(enabledContainerTypes.includes('20RF') || enabledContainerTypes.includes('40RF') ? [{ id: 'REEFER', label: `Reefer (${countReefer})` }] : []),
            ...(enabledContainerTypes.some(t => ['20OT', '40OT', '20FR', '40FR', '20TK'].includes(t)) ? [{ id: 'SPECIAL', label: `Special (${countOpenTop + countFlatRack + countTank})` }] : [])
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setSelectedTypeFilter(pill.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                selectedTypeFilter === pill.id
                  ? isDark ? 'bg-[#123D3B] text-[#53D0BC] border-[#18B7A0]' : 'bg-[#E8F8F5] text-[#128B7B] border-[#DDEDEA]'
                  : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{ color: selectedTypeFilter === pill.id ? tealAccent : textMuted }}
            >
              {pill.label}
            </button>
          ))}

          <span className="text-[11px] font-mono ml-auto mr-1" style={{ color: textMuted }}>Zone:</span>
          <select
            value={selectedZoneFilter}
            onChange={(e) => setSelectedZoneFilter(e.target.value)}
            className="px-2 py-1 rounded-lg text-xs font-mono font-semibold border cursor-pointer focus:outline-none"
            style={{
              backgroundColor: surface2,
              borderColor: cardBorder,
              color: textPrimary
            }}
          >
            <option value="ALL">All Zones (A-E)</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                Zone {z.id} ({z.name})
              </option>
            ))}
          </select>
        </div>

        {/* Informative Sub-bar */}
        <div className="flex items-center justify-between text-[11px] font-mono opacity-70 px-0.5">
          <span>Click any container row to inspect individual CSC survey condition, inspector notes, and remarks.</span>
          <span>Showing {filtered.slice(0, 50).length} of {filtered.length} matching units</span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: cardBorder }}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr 
                className="border-b font-mono text-[11px] uppercase tracking-wider"
                style={{ 
                  backgroundColor: surface2, 
                  borderColor: cardBorder,
                  color: textMuted 
                }}
              >
                <th className="py-2.5 px-3">Container ID</th>
                <th className="py-2.5 px-3">Type & Size</th>
                <th className="py-2.5 px-3">TEU</th>
                <th className="py-2.5 px-3">Yard Slot</th>
                <th className="py-2.5 px-3">Turn-In Date</th>
                <th className="py-2.5 px-3">Dwell Days</th>
                <th className="py-2.5 px-3">Tare / Gross Wt</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono" style={{ borderColor: cardBorder }}>
              {filtered.slice(0, 50).map((c) => {
                return (
                  <tr 
                    key={c.id} 
                    className="transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    onClick={() => onSelectContainer(c)}
                  >
                    {/* Container ID */}
                    <td className="py-2.5 px-3 font-bold">
                      <span style={{ color: textPrimary }}>{c.formattedId}</span>
                    </td>

                    {/* Type & Size */}
                    <td className="py-2.5 px-3">
                      <span 
                        className="px-2 py-0.5 rounded text-[11px] font-bold"
                        style={{
                          backgroundColor: c.isoType === '40HC' 
                            ? (isDark ? '#123D3B' : '#E8F8F5') 
                            : c.isoType === '20GP' || c.isoType === '20ST'
                              ? (isDark ? '#162E4B' : '#EDF3FC')
                              : (isDark ? '#493818' : '#FFF5DE'),
                          color: c.isoType === '40HC' 
                            ? (isDark ? '#53D0BC' : '#128B7B')
                            : c.isoType === '20GP' || c.isoType === '20ST'
                              ? (isDark ? '#5B9BFF' : '#2D79D8')
                              : (isDark ? '#F1B84B' : '#E49A24')
                        }}
                      >
                        {c.isoType === '20GP' || c.isoType === '20ST' ? '20S' : c.isoType === '40GP' ? 'GP' : c.isoType}
                      </span>
                      <span className="text-[10px] ml-1.5 opacity-70">
                        {c.isoType === '40HC' ? "40' 9'6\" HC" : c.isoType === '40GP' ? "40' 8'6\" GP" : "20' 8'6\" ST"}
                      </span>
                    </td>

                    {/* TEU */}
                    <td className="py-2.5 px-3 font-bold" style={{ color: textPrimary }}>
                      {c.teu} TEU
                    </td>

                    {/* Location */}
                    <td className="py-2.5 px-3 font-semibold" style={{ color: tealAccent }}>
                      Z{c.location.zone}-B{String(c.location.bay).padStart(2, '0')}-R{c.location.row}-T{c.location.tier}
                    </td>

                    {/* Turn-in Date */}
                    <td className="py-2.5 px-3" style={{ color: textMuted }}>
                      {c.entryTimestamp.slice(0, 10)}
                    </td>

                    {/* Dwell Days */}
                    <td className="py-2.5 px-3 font-bold">
                      <span style={{ color: c.dwellDays > 30 ? '#F1B84B' : textPrimary }}>
                        {c.dwellDays}d
                      </span>
                    </td>

                    {/* Tare / Gross Wt */}
                    <td className="py-2.5 px-3" style={{ color: textMuted }}>
                      {c.tareWeightKg.toLocaleString()} / {(c.grossWeightKg / 1000).toFixed(1)}t
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onRequestMove(c)}
                          title="Reposition container"
                          className="p-1 rounded-md border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          style={{ borderColor: cardBorder, color: textMuted }}
                        >
                          <Move className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectContainer(c)}
                          title="Inspect container"
                          className="p-1 rounded-md border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          style={{ borderColor: cardBorder, color: tealAccent }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 50 && (
          <div className="text-center text-xs pt-1 font-mono" style={{ color: textMuted }}>
            Showing top 50 of {filtered.length} matching available units. Use filters or search to narrow down.
          </div>
        )}
      </div>
    </div>
  );
};
