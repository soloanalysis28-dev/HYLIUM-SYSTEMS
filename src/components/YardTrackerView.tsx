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
}

export const YardTrackerView: React.FC<YardTrackerViewProps> = ({
  zones,
  containers,
  cranes,
  onSelectContainer,
  onRequestMove
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('A');
  const [selectedBay, setSelectedBay] = useState<number>(1);
  const [hoveredContainer, setHoveredContainer] = useState<ContainerItem | null>(null);

  const currentZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  // Containers in the active zone
  const zoneContainers = containers.filter(
    (c) => c.location.zone === selectedZoneId && c.status === 'In Yard'
  );

  // Containers in the selected bay
  const bayContainers = zoneContainers.filter((c) => c.location.bay === selectedBay);

  // Active crane in this zone
  const zoneCrane = cranes.find((cr) => cr.currentZone === selectedZoneId);

  const getShippingLineColor = (line: ShippingLine) => {
    switch (line) {
      case 'Maersk': return 'bg-sky-600/90 border-sky-400 text-white';
      case 'MSC': return 'bg-yellow-500/90 border-yellow-300 text-slate-950 font-semibold';
      case 'CMA CGM': return 'bg-blue-700/90 border-blue-400 text-white';
      case 'Hapag-Lloyd': return 'bg-orange-600/90 border-orange-400 text-white';
      case 'ONE': return 'bg-pink-600/90 border-pink-400 text-white';
      case 'Evergreen': return 'bg-emerald-700/90 border-emerald-400 text-white';
      case 'COSCO': return 'bg-indigo-700/90 border-indigo-400 text-white';
      default: return 'bg-slate-700 border-slate-500 text-white';
    }
  };

  return (
    <div className="space-y-4">
      {/* Visual Terminal Header Card with Aerial Photograph Scrim */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shadow-md">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src="/src/assets/images/depot_aerial_terminal_1791976566705.jpg" 
            alt="Container Depot Terminal Aerial View"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="relative z-10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono font-medium mb-1">
              <span>GPS YARD TELEMETRICS</span>
              <span>·</span>
              <span>DGPS RTK PRECISION: ±2.5 CM</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Container Yard Digital Twin & Stacking Matrix
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time spatial tracking of ISO shipping containers across bays, rows, and vertical stack tiers with active RTG crane coordination.
            </p>
          </div>

          {/* Quick Zone Crane Telematics */}
          {zoneCrane && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs min-w-[240px]">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-200">{zoneCrane.name}</span>
                <span className="text-[11px] font-mono text-emerald-400">{zoneCrane.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px] text-slate-400">
                <div>
                  <span className="text-slate-500 block">Position</span>
                  <span className="text-white font-medium">Bay {String(zoneCrane.currentBay).padStart(2, '0')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Moves Today</span>
                  <span className="text-white font-medium">{zoneCrane.totalMovesToday} lifts</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Operator</span>
                  <span className="text-slate-300 truncate">{zoneCrane.operatorName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Battery/Fuel</span>
                  <span className="text-emerald-400 font-medium">{zoneCrane.fuelBatteryPercent}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone Selector Strip (Functional Segmented Control) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2 rounded-lg">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {zones.map((zone) => {
            const count = containers.filter((c) => c.location.zone === zone.id && c.status === 'In Yard').length;
            const isSelected = selectedZoneId === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => {
                  setSelectedZoneId(zone.id);
                  setSelectedBay(1);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{zone.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count} / {zone.totalSlots}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Max Tier: <strong className="text-slate-200">{currentZone.maxTier} High</strong></span>
          <span className="text-slate-700">·</span>
          <span>Bays: <strong className="text-slate-200">{currentZone.baysCount}</strong></span>
          <span className="text-slate-700">·</span>
          <span>Rows: <strong className="text-slate-200">{currentZone.rowsCount}</strong></span>
        </div>
      </div>

      {/* Main Stacking Area: Bay Selector & Stacking Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left: Bay Layout Column */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Bays in {currentZone.name}
            </span>
            <span className="text-[11px] font-mono text-slate-500">Bay 01 - {String(currentZone.baysCount).padStart(2, '0')}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
            {Array.from({ length: currentZone.baysCount }, (_, i) => i + 1).map((bayNum) => {
              const inBay = zoneContainers.filter((c) => c.location.bay === bayNum);
              const isSelected = selectedBay === bayNum;
              const hasCrane = zoneCrane?.currentBay === bayNum;

              return (
                <button
                  key={bayNum}
                  onClick={() => setSelectedBay(bayNum)}
                  className={`p-2.5 rounded border text-left transition-colors relative ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  {hasCrane && (
                    <span className="absolute -top-1.5 -right-1 text-[9px] font-mono font-bold bg-emerald-500 text-slate-950 px-1 rounded shadow">
                      CRANE
                    </span>
                  )}
                  <div className="flex items-center justify-between text-xs font-bold font-mono">
                    <span>BAY {String(bayNum).padStart(2, '0')}</span>
                    <span className="text-[11px] text-slate-400">{inBay.length} TEU</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-400 h-full rounded-full" 
                        style={{ width: `${Math.min(100, (inBay.length / (currentZone.rowsCount * currentZone.maxTier)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <span className="font-semibold text-slate-300 block mb-1">Carrier Color Key</span>
            <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-sky-600" /> Maersk (Sky)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-yellow-500" /> MSC (Yellow)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-blue-700" /> CMA CGM (Navy)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-orange-600" /> Hapag-Lloyd</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-pink-600" /> ONE (Magenta)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-700" /> Evergreen</span>
            </div>
          </div>
        </div>

        {/* Right: Vertical Stacking Cross-Section for Selected Bay */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-400 font-mono font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                <span>ACTIVE YARD CROSS-SECTION: ZONE {currentZone.id} — BAY {String(selectedBay).padStart(2, '0')}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Looking down the row axis. Tier 1 is ground level, Tier 4 is highest gantry clearance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">
                {bayContainers.length} containers in this bay
              </span>
            </div>
          </div>

          {/* Stacking Grid: Vertical Tiers (Tier 4 to Tier 1) down to Ground Level */}
          <div className="space-y-2 select-none overflow-x-auto pb-2">
            {Array.from({ length: currentZone.maxTier }, (_, tierIdx) => currentZone.maxTier - tierIdx).map((tierNum) => {
              return (
                <div key={tierNum} className="flex items-center gap-2 min-w-[500px]">
                  {/* Tier Label */}
                  <div className="w-16 shrink-0 text-right pr-2 font-mono text-xs text-slate-500 font-semibold">
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
                            className={`p-2.5 rounded border cursor-pointer transition-transform hover:-translate-y-0.5 shadow relative ${getShippingLineColor(
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
                          className="p-2.5 rounded border border-dashed border-slate-800 bg-slate-950/40 text-slate-600 flex flex-col items-center justify-center min-h-[64px]"
                        >
                          <span className="text-[10px] font-mono">Row {String(rowNum).padStart(2, '0')}</span>
                          <span className="text-[9px] text-slate-700">Empty Slot</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Ground Asphalt Markings */}
            <div className="flex items-center gap-2 pt-2 border-t-2 border-amber-500/60 min-w-[500px]">
              <div className="w-16 shrink-0 text-right pr-2 font-mono text-[11px] text-amber-500 font-bold">
                GROUND
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 flex-1 text-center font-mono text-[11px] text-slate-400">
                {Array.from({ length: currentZone.rowsCount }, (_, rowIdx) => rowIdx + 1).map((rowNum) => (
                  <div key={rowNum} className="py-1 bg-slate-950/70 border border-slate-800 rounded text-slate-400">
                    ROW {String(rowNum).padStart(2, '0')}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Inspector Details for Selected/Hovered Container */}
          {hoveredContainer && (
            <div className="mt-4 p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white font-mono">{hoveredContainer.formattedId}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-xs text-slate-300">{hoveredContainer.shippingLine}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-xs font-mono text-amber-400">{hoveredContainer.isoType} ({hoveredContainer.teu} TEU)</span>
                </div>
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                  <span>Slot: <strong className="text-white font-mono">Zone {hoveredContainer.location.zone} - Bay {hoveredContainer.location.bay} - Row {hoveredContainer.location.row} - Tier {hoveredContainer.location.tier}</strong></span>
                  <span>·</span>
                  <span>Cargo: <strong className="text-slate-300">{hoveredContainer.cargoDescription}</strong></span>
                  <span>·</span>
                  <span>Seal: <strong className="text-slate-300 font-mono">{hoveredContainer.sealNumber}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRequestMove(hoveredContainer)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs transition-colors"
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>Reposition (Crane Move)</span>
                </button>
                <button
                  onClick={() => onSelectContainer(hoveredContainer)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors border border-slate-700"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Full Logs</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
