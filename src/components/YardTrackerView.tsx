import React, { useState } from 'react';
import { 
  YardZone, 
  ContainerItem, 
  YardCrane, 
  ContainerLocation, 
  ShippingLine 
} from '../types/depot';
import { 
  Layers, 
  ArrowUpRight, 
  Move, 
  Eye, 
  Thermometer, 
  AlertTriangle, 
  Cpu, 
  MapPin, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface YardTrackerViewProps {
  zones: YardZone[];
  containers: ContainerItem[];
  cranes: YardCrane[];
  onSelectContainer: (container: ContainerItem) => void;
  onRequestMove: (container: ContainerItem) => void;
  isDark?: boolean;
}

export const YardTrackerView: React.FC<YardTrackerViewProps> = ({
  zones,
  containers,
  cranes,
  onSelectContainer,
  onRequestMove,
  isDark = false
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('A');
  const [selectedBay, setSelectedBay] = useState<number>(1);
  const [hoveredContainer, setHoveredContainer] = useState<ContainerItem | null>(null);

  const currentZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  // Containers in the active zone
  const zoneContainers = containers.filter(
    (c) => c.location.zone === selectedZoneId && c.status === 'In Yard'
  );

  // Containers in the active bay
  const bayContainers = zoneContainers.filter((c) => c.location.bay === selectedBay);

  // Active crane in this zone
  const zoneCrane = cranes.find((cr) => cr.currentZone === selectedZoneId);

  // Theme tokens
  const cardBg = isDark ? '#14232E' : '#FFFFFF';
  const cardBorder = isDark ? '#2A404C' : '#E1EAED';
  const surface2 = isDark ? '#192B36' : '#F0F5F6';
  const textPrimary = isDark ? '#EAF5F5' : '#17324A';
  const textMuted = isDark ? '#91A8B5' : '#7B8C9D';
  const textMuted2 = isDark ? '#718B99' : '#8AA0AE';
  const tealAccent = isDark ? '#53D0BC' : '#18B7A0';

  const getShippingLineColor = (line: ShippingLine) => {
    switch (line) {
      case 'ONE': return 'bg-pink-600/90 border-pink-400 text-white';
      case 'Maersk': return 'bg-sky-600/90 border-sky-400 text-white';
      case 'MSC': return 'bg-yellow-500/90 border-yellow-300 text-slate-950 font-semibold';
      case 'CMA CGM': return 'bg-blue-700/90 border-blue-400 text-white';
      case 'Hapag-Lloyd': return 'bg-orange-600/90 border-orange-400 text-white';
      case 'Evergreen': return 'bg-emerald-700/90 border-emerald-400 text-white';
      case 'COSCO': return 'bg-indigo-700/90 border-indigo-400 text-white';
      default: return 'bg-teal-700 border-teal-500 text-white';
    }
  };

  return (
    <div className="space-y-5 select-none">
      {/* Zone Selector Strip */}
      <div 
        className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl shadow-xs border transition-colors"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {zones.map((zone) => {
            const count = containers.filter((c) => c.location.zone === zone.id && c.status === 'In Yard').length;
            const isSelected = selectedZoneId === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => {
                  setSelectedZoneId(zone.id);
                  setSelectedBay(1);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? isDark 
                      ? 'bg-[#123D3B] text-[#53D0BC] border border-[#18B7A0]' 
                      : 'bg-[#E8F8F5] text-[#128B7B] border border-[#DDEDEA]'
                    : isDark 
                      ? 'text-[#91A8B5] hover:bg-[#192B36]' 
                      : 'text-[#7B8C9D] hover:bg-[#F0F5F6]'
                }`}
              >
                <span>{zone.name}</span>
                <span 
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                  style={{
                    backgroundColor: isSelected ? (isDark ? '#14232E' : '#FFFFFF') : surface2,
                    color: isSelected ? (isDark ? '#53D0BC' : '#128B7B') : textMuted
                  }}
                >
                  {count} / {zone.totalSlots}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: textMuted }}>
          <span>Max Tier: <strong style={{ color: textPrimary }}>{currentZone.maxTier} High</strong></span>
          <span>·</span>
          <span>Bays: <strong style={{ color: textPrimary }}>{currentZone.baysCount}</strong></span>
          <span>·</span>
          <span>Rows: <strong style={{ color: textPrimary }}>{currentZone.rowsCount}</strong></span>
        </div>
      </div>

      {/* Main Stacking Area: Bay Selector & Stacking Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left: Bay Layout Column */}
        <div 
          className="lg:col-span-1 rounded-2xl p-4 space-y-3 shadow-xs border transition-colors"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: cardBorder }}>
            <span className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: textPrimary }}>
              Bays in {currentZone.name}
            </span>
            <span className="text-[11px] font-mono" style={{ color: textMuted }}>
              01 - {String(currentZone.baysCount).padStart(2, '0')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1">
            {Array.from({ length: currentZone.baysCount }, (_, i) => i + 1).map((bayNum) => {
              const inBay = zoneContainers.filter((c) => c.location.bay === bayNum);
              const isSelected = selectedBay === bayNum;
              const hasCrane = zoneCrane?.currentBay === bayNum;

              return (
                <button
                  key={bayNum}
                  type="button"
                  onClick={() => setSelectedBay(bayNum)}
                  className="p-2.5 rounded-xl border text-left transition-all cursor-pointer relative"
                  style={{
                    backgroundColor: isSelected 
                      ? (isDark ? '#123D3B' : '#E8F8F5')
                      : (isDark ? '#192B36' : '#FFFFFF'),
                    borderColor: isSelected 
                      ? (isDark ? '#18B7A0' : '#18B7A0')
                      : cardBorder
                  }}
                >
                  {hasCrane && (
                    <span 
                      className="absolute -top-1.5 -right-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs"
                      style={{
                        backgroundColor: tealAccent,
                        color: isDark ? '#0D1720' : '#FFFFFF'
                      }}
                    >
                      CRANE
                    </span>
                  )}
                  <div className="flex items-center justify-between text-xs font-bold font-mono">
                    <span style={{ color: isSelected ? (isDark ? '#53D0BC' : '#128B7B') : textPrimary }}>
                      BAY {String(bayNum).padStart(2, '0')}
                    </span>
                    <span className="text-[11px]" style={{ color: textMuted }}>
                      {inBay.length} TEU
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <div 
                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: isDark ? '#243743' : '#E6EDF0' }}
                    >
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(100, (inBay.length / (currentZone.rowsCount * currentZone.maxTier)) * 100)}%`,
                          backgroundColor: tealAccent 
                        }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="pt-2 border-t text-[11px] space-y-1.5" style={{ borderColor: cardBorder, color: textMuted }}>
            <span className="font-semibold block mb-1" style={{ color: textPrimary }}>Carrier Color Key</span>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-pink-600" /> ONE (Magenta)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sky-600" /> Maersk (Sky)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-500" /> MSC (Yellow)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-700" /> CMA CGM</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-600" /> Hapag-Lloyd</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-700" /> Evergreen</span>
            </div>
          </div>
        </div>

        {/* Right: Vertical Stacking Cross-Section for Selected Bay */}
        <div 
          className="lg:col-span-3 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs border transition-colors"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="flex flex-wrap items-center justify-between pb-3 border-b gap-2" style={{ borderColor: cardBorder }}>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-semibold" style={{ color: tealAccent }}>
                <MapPin className="w-3.5 h-3.5" />
                <span>ZONE {currentZone.id} · BAY {String(selectedBay).padStart(2, '0')} STACK MATRIX</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                Vertical stack profile. Tier 1 is ground level, Tier 4 is gantry clearance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded-md font-semibold border" style={{ backgroundColor: surface2, borderColor: cardBorder, color: textPrimary }}>
                {bayContainers.length} containers in this bay
              </span>
            </div>
          </div>

          {/* Stacking Grid: Vertical Tiers down to Ground Level */}
          <div className="space-y-2 select-none overflow-x-auto pb-2">
            {Array.from({ length: currentZone.maxTier }, (_, tierIdx) => currentZone.maxTier - tierIdx).map((tierNum) => {
              return (
                <div key={tierNum} className="flex items-center gap-2 min-w-[500px]">
                  {/* Tier Label */}
                  <div className="w-16 shrink-0 text-right pr-2 font-mono text-xs font-semibold" style={{ color: textMuted2 }}>
                    TIER {tierNum}
                  </div>

                  {/* Rows across this tier */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 flex-1">
                    {Array.from({ length: currentZone.rowsCount }, (_, rowIdx) => rowIdx + 1).map((rowNum) => {
                      const container = bayContainers.find(
                        (c) => c.location.row === rowNum && c.location.tier === tierNum
                      );

                      if (container) {
                        return (
                          <div
                            key={rowNum}
                            onMouseEnter={() => setHoveredContainer(container)}
                            onClick={() => onSelectContainer(container)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-transform hover:-translate-y-0.5 shadow-xs relative ${getShippingLineColor(
                              container.shippingLine
                            )}`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold font-mono">
                              <span className="truncate">{container.formattedId}</span>
                              <span className="text-[10px] ml-1 opacity-90">{container.isoType}</span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono mt-1 opacity-80">
                              <span>{(container.grossWeightKg / 1000).toFixed(1)}t</span>
                              <span>R{rowNum}T{tierNum}</span>
                            </div>

                            {/* Badges for hazardous or reefer */}
                            <div className="mt-1.5 flex items-center gap-1">
                              {container.reefer && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-cyan-200 flex items-center gap-0.5">
                                  <Thermometer className="w-2.5 h-2.5" />
                                  {container.reefer.actualTempC.toFixed(1)}°C
                                </span>
                              )}
                              {container.hazardousIMO && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-red-950 text-red-200 font-bold">
                                  IMO {container.hazardousIMO}
                                </span>
                              )}
                              {container.customsStatus.includes('Held') && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-red-900 text-white font-bold">
                                  HOLD
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Empty Slot
                      return (
                        <div
                          key={rowNum}
                          className="p-2.5 rounded-xl border border-dashed flex flex-col items-center justify-center min-h-[64px]"
                          style={{
                            borderColor: isDark ? '#243743' : '#E6EDF0',
                            backgroundColor: isDark ? '#101E28' : '#F8FAFB',
                            color: textMuted2
                          }}
                        >
                          <span className="text-[10px] font-mono">Row {String(rowNum).padStart(2, '0')}</span>
                          <span className="text-[9px] opacity-60">Empty Slot</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Ground Asphalt Markings */}
            <div 
              className="flex items-center gap-2 pt-2 border-t-2 min-w-[500px]"
              style={{ borderColor: isDark ? '#2A404C' : '#E1EAED' }}
            >
              <div 
                className="w-16 shrink-0 text-right pr-2 font-mono text-[11px] font-bold"
                style={{ color: tealAccent }}
              >
                GROUND
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 flex-1 text-center font-mono text-[11px]">
                {Array.from({ length: currentZone.rowsCount }, (_, rowIdx) => rowIdx + 1).map((rowNum) => (
                  <div 
                    key={rowNum} 
                    className="py-1 rounded-lg border font-semibold"
                    style={{
                      backgroundColor: surface2,
                      borderColor: cardBorder,
                      color: textMuted
                    }}
                  >
                    ROW {String(rowNum).padStart(2, '0')}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Inspector Details for Selected/Hovered Container */}
          {hoveredContainer && (
            <div 
              className="mt-4 p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-4 transition-colors"
              style={{
                backgroundColor: surface2,
                borderColor: cardBorder
              }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono" style={{ color: textPrimary }}>
                    {hoveredContainer.formattedId}
                  </span>
                  <span style={{ color: textMuted }}>·</span>
                  <span className="text-xs font-semibold" style={{ color: tealAccent }}>
                    {hoveredContainer.shippingLine}
                  </span>
                  <span style={{ color: textMuted }}>·</span>
                  <span className="text-xs font-mono" style={{ color: textPrimary }}>
                    {hoveredContainer.isoType} ({hoveredContainer.teu} TEU)
                  </span>
                </div>
                <div className="text-xs flex flex-wrap items-center gap-2" style={{ color: textMuted }}>
                  <span>Slot: <strong className="font-mono" style={{ color: textPrimary }}>Z{hoveredContainer.location.zone}-B{hoveredContainer.location.bay}-R{hoveredContainer.location.row}-T{hoveredContainer.location.tier}</strong></span>
                  <span>·</span>
                  <span>Cargo: <strong style={{ color: textPrimary }}>{hoveredContainer.cargoDescription}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRequestMove(hoveredContainer)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isDark ? '#123D3B' : '#E8F8F5',
                    color: isDark ? '#53D0BC' : '#128B7B',
                    border: `1px solid ${isDark ? '#18B7A0' : '#DDEDEA'}`
                  }}
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>Reposition</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectContainer(hoveredContainer)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-colors cursor-pointer border"
                  style={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    color: textPrimary
                  }}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
