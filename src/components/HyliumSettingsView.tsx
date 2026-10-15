import React, { useState } from 'react';
import { 
  Sliders, 
  Warehouse, 
  Boxes, 
  Clock, 
  Code2, 
  Check, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  Info, 
  Layers,
  ThermometerSnowflake,
  ShieldAlert,
  Percent,
  Sparkles
} from 'lucide-react';
import { ContainerItem, ContainerTypeCode, CONTAINER_TYPOLOGY_SPECS, DEFAULT_ENABLED_CONTAINER_TYPES } from '../types/depot';
import { RustCodebaseView } from './RustCodebaseView';

interface HyliumSettingsViewProps {
  isDark: boolean;
  depotCapacityTeu: number;
  onUpdateDepotCapacity: (newCapacity: number) => void;
  containers: ContainerItem[];
  enabledContainerTypes: ContainerTypeCode[];
  onToggleContainerType: (code: ContainerTypeCode) => void;
  onResetContainerTypes: (toAll?: boolean) => void;
  onShowToast: (message: string) => void;
  onReplaySplash?: () => void;
}

export const HyliumSettingsView: React.FC<HyliumSettingsViewProps> = ({
  isDark,
  depotCapacityTeu,
  onUpdateDepotCapacity,
  containers,
  enabledContainerTypes,
  onToggleContainerType,
  onResetContainerTypes,
  onShowToast,
  onReplaySplash
}) => {
  const [activeTab, setActiveTab] = useState<'capacity' | 'typologies' | 'operations' | 'rust'>('typologies');
  const [capacityInput, setCapacityInput] = useState<number>(depotCapacityTeu);
  const [freeDaysInput, setFreeDaysInput] = useState<number>(5);
  const [demurrageRateInput, setDemurrageRateInput] = useState<number>(115);
  const [isEnforced, setIsEnforced] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Calculate current TEU from stock
  const currentTotalTeu = containers
    .filter((c) => c.status === 'In Yard')
    .reduce((sum, c) => {
      if (c.isoType === '40HC' || c.isoType === '40GP' || c.isoType === '40RF' || c.isoType === '40FR' || c.isoType === '40OT') return sum + 2;
      if (c.isoType === '45HC') return sum + 2.25;
      return sum + 1; // 20GP, 20ST, 20RF, 20OT, 20FR, 20TK
    }, 0);

  // Live utilisation calculation preview
  const previewUtilisation = capacityInput > 0 ? Math.min(100, Math.round((currentTotalTeu / capacityInput) * 100)) : 0;

  // Colors aligned with Hylium mockups
  const cardBg = isDark ? '#14232E' : '#FFFFFF';
  const cardBorder = isDark ? '#2A404C' : '#E1EAED';
  const textPrimary = isDark ? '#EAF5F5' : '#17324A';
  const textMuted = isDark ? '#91A8B5' : '#7B8C9D';
  const textMuted2 = isDark ? '#718B99' : '#8AA0AE';
  const surface2 = isDark ? '#192B36' : '#F0F5F6';
  const tealAccent = isDark ? '#53D0BC' : '#18B7A0';

  const handleSaveCapacity = () => {
    if (capacityInput < 50) {
      onShowToast('Depot capacity must be at least 50 TEU.');
      return;
    }
    onUpdateDepotCapacity(capacityInput);
    setSavedSuccess(true);
    onShowToast(`Depot capacity updated to ${capacityInput} TEU. Stock utilisation recalibrated.`);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefault = () => {
    setCapacityInput(275);
    onUpdateDepotCapacity(275);
    onShowToast('Depot capacity reset to nominal standard of 275 TEU.');
  };

  return (
    <div className="space-y-6 select-none">
      {/* Subnav Tabs & Replay Intro Control */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div 
          className="flex items-center gap-1.5 p-1 rounded-2xl border w-fit"
          style={{ backgroundColor: surface2, borderColor: cardBorder }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('capacity')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === 'capacity' ? (isDark ? '#14232E' : '#FFFFFF') : 'transparent',
              color: activeTab === 'capacity' ? tealAccent : textMuted,
              boxShadow: activeTab === 'capacity' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>Depot Capacity & Utilisation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('typologies')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === 'typologies' ? (isDark ? '#14232E' : '#FFFFFF') : 'transparent',
              color: activeTab === 'typologies' ? tealAccent : textMuted,
              boxShadow: activeTab === 'typologies' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Container Typologies</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('operations')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === 'operations' ? (isDark ? '#14232E' : '#FFFFFF') : 'transparent',
              color: activeTab === 'operations' ? tealAccent : textMuted,
              boxShadow: activeTab === 'operations' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Dwell & Demurrage Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rust')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === 'rust' ? (isDark ? '#14232E' : '#FFFFFF') : 'transparent',
              color: activeTab === 'rust' ? tealAccent : textMuted,
              boxShadow: activeTab === 'rust' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Rust Core Architecture</span>
          </button>
        </div>

        {onReplaySplash && (
          <button
            type="button"
            onClick={onReplaySplash}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            style={{
              backgroundColor: isDark ? '#123D3B' : '#E8F8F5',
              color: tealAccent,
              borderColor: isDark ? '#18B7A0' : '#DDEDEA'
            }}
            title="Replay Hylium Systems floating balloon splash screen"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Replay Intro Animation</span>
          </button>
        )}
      </div>

      {/* Tab 1: Depot Capacity & Utilisation Settings */}
      {activeTab === 'capacity' && (
        <div className="space-y-6">
          <div 
            className="p-6 rounded-2xl shadow-xs border space-y-6"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
          >
            <div>
              <h2 
                className="text-lg font-bold tracking-tight"
                style={{ 
                  color: textPrimary,
                  fontFamily: "'Space Grotesk', sans-serif" 
                }}
              >
                Depot Capacity & Utilisation Settings
              </h2>
              <p className="text-xs sm:text-[13px] mt-0.5" style={{ color: textMuted }}>
                Define the master TEU capacity of the terminal yard. The stock utilisation rate is dynamically derived from this value.
              </p>
            </div>

            {/* Input & Quick Presets */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider font-mono" style={{ color: textMuted }}>
                  Total Depot TEU Storage Capacity
                </label>
                
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={50}
                      max={5000}
                      step={5}
                      value={capacityInput}
                      onChange={(e) => setCapacityInput(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl font-mono text-base font-bold transition-colors focus:outline-none"
                      style={{
                        backgroundColor: surface2,
                        color: textPrimary,
                        border: `1px solid ${cardBorder}`
                      }}
                    />
                    <span 
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold font-mono"
                      style={{ color: textMuted }}
                    >
                      TEU
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCapacity}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                    style={{
                      backgroundColor: isDark ? '#123D3B' : '#E8F8F5',
                      color: isDark ? '#53D0BC' : '#128B7B',
                      border: `1px solid ${isDark ? '#18B7A0' : '#DDEDEA'}`
                    }}
                  >
                    {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
                    <span>{savedSuccess ? 'Capacity Saved' : 'Save Capacity'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDefault}
                    title="Reset to 275 TEU"
                    className="p-2.5 rounded-xl border transition-colors cursor-pointer"
                    style={{
                      backgroundColor: surface2,
                      borderColor: cardBorder,
                      color: textMuted
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-mono mr-1" style={{ color: textMuted2 }}>Presets:</span>
                  {[200, 250, 275, 300, 350, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCapacityInput(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer border ${
                        capacityInput === preset
                          ? isDark ? 'bg-[#18B7A0]/20 text-[#53D0BC] border-[#18B7A0]' : 'bg-[#E8F8F5] text-[#128B7B] border-[#DDEDEA]'
                          : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      style={{ color: capacityInput === preset ? tealAccent : textMuted }}
                    >
                      {preset} TEU
                    </button>
                  ))}
                </div>

                {/* Capacity Enforcement Toggle */}
                <div 
                  className="p-3.5 rounded-xl border flex items-center justify-between"
                  style={{ backgroundColor: surface2, borderColor: cardBorder }}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block" style={{ color: textPrimary }}>
                      Enforce Depot Capacity Ceilings
                    </span>
                    <span className="text-[11px]" style={{ color: textMuted }}>
                      Alert gate stations and yard planning officers when utilization surpasses 85%.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isEnforced}
                    onChange={(e) => setIsEnforced(e.target.checked)}
                    className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Right Side: Live Calculation Display */}
              <div 
                className="lg:col-span-5 p-5 rounded-2xl border space-y-4"
                style={{
                  backgroundColor: surface2,
                  borderColor: cardBorder
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: textMuted }}>
                    Live Utilisation Recalculation
                  </span>
                  <Percent className="w-4 h-4" style={{ color: tealAccent }} />
                </div>

                <div className="flex items-baseline gap-3">
                  <span 
                    className="text-4xl font-extrabold tracking-tight"
                    style={{ 
                      color: previewUtilisation > 90 ? '#F1B84B' : textPrimary,
                      fontFamily: "'Space Grotesk', sans-serif" 
                    }}
                  >
                    {previewUtilisation}%
                  </span>
                  <span className="text-xs font-semibold" style={{ color: textMuted }}>
                    Depot Yard Utilisation
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${previewUtilisation}%`,
                      backgroundColor: previewUtilisation > 90 ? '#F1B84B' : '#18B7A0'
                    }}
                  />
                </div>

                <div className="space-y-1.5 text-xs font-mono pt-1" style={{ color: textMuted }}>
                  <div className="flex justify-between">
                    <span>Active In-Yard Stock:</span>
                    <strong style={{ color: textPrimary }}>{containers.filter(c => c.status === 'In Yard').length} Containers</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Calculated TEU:</span>
                    <strong style={{ color: tealAccent }}>{currentTotalTeu} TEU</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Configured Capacity:</span>
                    <strong style={{ color: textPrimary }}>{capacityInput} TEU</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Yard Headroom:</span>
                    <strong style={{ color: textPrimary }}>{Math.max(0, capacityInput - currentTotalTeu)} TEU</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zone-by-Zone TEU Allocation Table */}
          <div 
            className="p-6 rounded-2xl shadow-xs border space-y-4"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
          >
            <h3 
              className="text-base font-bold tracking-tight"
              style={{ 
                color: textPrimary,
                fontFamily: "'Space Grotesk', sans-serif" 
              }}
            >
              Yard Zone Slot & TEU Allocations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'A', name: 'Zone A - Primary Dry Stacking (40HC / 20ST)', maxTeu: 60, currentTeu: 48, role: 'High Velocity Turn-In' },
                { id: 'B', name: 'Zone B - High-Density Dry Storage', maxTeu: 60, currentTeu: 52, role: 'Longer Dwell Storage' },
                { id: 'C', name: 'Zone C - Buffer & Outbound Staging', maxTeu: 60, currentTeu: 46, role: 'Rail & Vessel Release' },
                { id: 'D', name: 'Zone D - Cold Chain Reefer Infrastructure', maxTeu: 40, currentTeu: 0, role: 'Integral 460V Plugs' },
                { id: 'E', name: 'Zone E - Empty Storage & Survey Maintenance', maxTeu: 55, currentTeu: 85, role: 'CSC Survey & Empty Pool' }
              ].map((zone) => {
                const pct = Math.min(100, Math.round((zone.currentTeu / zone.maxTeu) * 100));
                return (
                  <div 
                    key={zone.id}
                    className="p-4 rounded-xl border space-y-2.5"
                    style={{ backgroundColor: surface2, borderColor: cardBorder }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs" style={{ color: textPrimary }}>{zone.name}</span>
                      <span className="text-[11px] font-mono font-bold" style={{ color: tealAccent }}>{pct}%</span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: pct > 85 ? '#F1B84B' : '#18B7A0' }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: textMuted }}>
                      <span>Role: {zone.role}</span>
                      <span>{zone.currentTeu} / {zone.maxTeu} TEU</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Container Typologies Configuration & Fleet Revamp */}
      {activeTab === 'typologies' && (
        <div 
          className="p-5 sm:p-6 rounded-2xl shadow-xs border space-y-6"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          {/* Header & Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: cardBorder }}>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 
                  className="text-lg font-bold tracking-tight"
                  style={{ 
                    color: textPrimary,
                    fontFamily: "'Space Grotesk', sans-serif" 
                  }}
                >
                  Depot Container Fleet Typologies
                </h2>
                <span 
                  className="text-xs font-mono px-2.5 py-0.5 rounded-full font-bold border"
                  style={{
                    backgroundColor: isDark ? '#123D3B' : '#E8F8F5',
                    color: tealAccent,
                    borderColor: isDark ? '#18B7A0' : '#DDEDEA'
                  }}
                >
                  {enabledContainerTypes.length} of {CONTAINER_TYPOLOGY_SPECS.length} Enabled
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: textMuted }}>
                By default, the fleet is streamlined to <strong>40HC, GP (40GP), and 20S</strong> dry equipment. Toggle additional extended ISO typologies on/off to adapt depot operations.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onResetContainerTypes(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer"
                style={{
                  backgroundColor: surface2,
                  borderColor: cardBorder,
                  color: textPrimary
                }}
                title="Reset to default fleet: 40HC, GP, and 20S only"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset to Core Defaults (40HC, GP, 20S)</span>
              </button>

              <button
                type="button"
                onClick={() => onResetContainerTypes(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer"
                style={{
                  backgroundColor: isDark ? '#123D3B' : '#E8F8F5',
                  borderColor: isDark ? '#18B7A0' : '#DDEDEA',
                  color: tealAccent
                }}
                title="Enable all extended container typologies"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Enable All Typologies</span>
              </button>
            </div>
          </div>

          {/* Core Typologies Section (40HC, GP, 20S) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider" style={{ color: textPrimary }}>
                  Core Standard Fleet (Default Active)
                </h3>
                <p className="text-xs" style={{ color: textMuted }}>
                  Primary high-velocity dry cargo equipment for standard yard operations.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-500 font-semibold">
                Core Defaults
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CONTAINER_TYPOLOGY_SPECS.filter((s) => s.isCoreDefault).map((item) => {
                const isEnabled = enabledContainerTypes.includes(item.code);
                const inStockCount = containers.filter(
                  (c) => item.isoMatches.includes(c.isoType) && c.status === 'In Yard'
                ).length;

                return (
                  <div 
                    key={item.code}
                    className="p-4 rounded-xl border space-y-3 transition-all shadow-xs relative"
                    style={{
                      backgroundColor: isEnabled ? (isDark ? '#162834' : '#FFFFFF') : surface2,
                      borderColor: isEnabled ? tealAccent : cardBorder,
                      opacity: isEnabled ? 1 : 0.65
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: isDark ? '#123D3B' : '#E8F8F5',
                            color: tealAccent
                          }}
                        >
                          {item.shortLabel}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Core Default
                        </span>
                      </div>

                      {/* Custom Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => onToggleContainerType(item.code)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                          isEnabled ? 'bg-[#18B7A0]' : isDark ? 'bg-slate-700' : 'bg-slate-300'
                        }`}
                        title={`Click to ${isEnabled ? 'disable' : 'enable'} ${item.name}`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs" style={{ color: textPrimary }}>{item.name}</h4>
                      <p className="text-[11px] mt-0.5" style={{ color: textMuted }}>{item.dimensions}</p>
                    </div>

                    <p className="text-[11px]" style={{ color: textMuted }}>
                      {item.description}
                    </p>

                    <div className="pt-2 border-t text-[11px] font-mono space-y-1" style={{ borderColor: cardBorder, color: textMuted }}>
                      <div className="flex justify-between">
                        <span>TEU Multiplier:</span>
                        <strong style={{ color: textPrimary }}>{item.teuFactor} TEU</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Tare Weight:</span>
                        <strong style={{ color: textPrimary }}>{item.tareWeightKg.toLocaleString()} kg</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Depot In-Stock:</span>
                        <strong style={{ color: inStockCount > 0 ? tealAccent : textMuted }}>
                          {inStockCount} Units ({inStockCount * item.teuFactor} TEU)
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Extended Typologies Section (Toggleable) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider" style={{ color: textPrimary }}>
                  Extended & Specialized Typologies (Toggleable)
                </h3>
                <p className="text-xs" style={{ color: textMuted }}>
                  Reefer cold-chain plugs, open top tarpaulins, flat racks, 45ft high-cubes, and bulk ISO tanks.
                </p>
              </div>
              <span className="text-xs font-mono" style={{ color: textMuted }}>
                {enabledContainerTypes.filter((c) => !DEFAULT_ENABLED_CONTAINER_TYPES.includes(c)).length} Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {CONTAINER_TYPOLOGY_SPECS.filter((s) => !s.isCoreDefault).map((item) => {
                const isEnabled = enabledContainerTypes.includes(item.code);
                const inStockCount = containers.filter(
                  (c) => item.isoMatches.includes(c.isoType) && c.status === 'In Yard'
                ).length;

                return (
                  <div 
                    key={item.code}
                    className="p-4 rounded-xl border space-y-3 transition-all shadow-xs"
                    style={{
                      backgroundColor: isEnabled ? (isDark ? '#162834' : '#FFFFFF') : surface2,
                      borderColor: isEnabled ? tealAccent : cardBorder,
                      opacity: isEnabled ? 1 : 0.6
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: isEnabled 
                              ? (isDark ? '#123D3B' : '#E8F8F5') 
                              : (isDark ? '#243743' : '#E6EDF0'),
                            color: isEnabled ? tealAccent : textMuted
                          }}
                        >
                          {item.shortLabel}
                        </span>
                        <span className="text-[10px] font-mono opacity-80" style={{ color: textMuted2 }}>
                          {item.category}
                        </span>
                      </div>

                      {/* Custom Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => onToggleContainerType(item.code)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                          isEnabled ? 'bg-[#18B7A0]' : isDark ? 'bg-slate-700' : 'bg-slate-300'
                        }`}
                        title={`Click to toggle ${item.name}`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs" style={{ color: textPrimary }}>{item.name}</h4>
                      <p className="text-[11px] mt-0.5" style={{ color: textMuted }}>{item.dimensions}</p>
                    </div>

                    <div className="pt-2 border-t text-[11px] font-mono space-y-1" style={{ borderColor: cardBorder, color: textMuted }}>
                      <div className="flex justify-between">
                        <span>TEU Multiplier:</span>
                        <strong style={{ color: textPrimary }}>{item.teuFactor} TEU</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <strong style={{ color: isEnabled ? '#10B981' : textMuted }}>
                          {isEnabled ? 'Active in Fleet' : 'Disabled (Hidden)'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Depot In-Stock:</span>
                        <strong style={{ color: inStockCount > 0 ? tealAccent : textMuted }}>
                          {inStockCount} Units
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Dwell & Demurrage Rules */}
      {activeTab === 'operations' && (
        <div 
          className="p-6 rounded-2xl shadow-xs border space-y-5"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div>
            <h2 
              className="text-lg font-bold tracking-tight"
              style={{ 
                color: textPrimary,
                fontFamily: "'Space Grotesk', sans-serif" 
              }}
            >
              Operational Free Dwell & Demurrage Tariff Rules
            </h2>
            <p className="text-xs sm:text-[13px] mt-0.5" style={{ color: textMuted }}>
              Billing parameters applied to inbound turn-ins and outbound gate releases.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: textMuted }}>
                Standard Carrier Free Dwell Time (Days)
              </label>
              <input
                type="number"
                value={freeDaysInput}
                onChange={(e) => setFreeDaysInput(parseInt(e.target.value, 10) || 0)}
                className="w-full px-4 py-2.5 rounded-xl font-mono text-sm font-bold transition-colors focus:outline-none"
                style={{
                  backgroundColor: surface2,
                  color: textPrimary,
                  border: `1px solid ${cardBorder}`
                }}
              />
              <span className="text-[11px]" style={{ color: textMuted2 }}>
                Grace period before daily demurrage begins accruing.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: textMuted }}>
                Dry Container Demurrage Rate (USD / Day)
              </label>
              <input
                type="number"
                value={demurrageRateInput}
                onChange={(e) => setDemurrageRateInput(parseInt(e.target.value, 10) || 0)}
                className="w-full px-4 py-2.5 rounded-xl font-mono text-sm font-bold transition-colors focus:outline-none"
                style={{
                  backgroundColor: surface2,
                  color: textPrimary,
                  border: `1px solid ${cardBorder}`
                }}
              />
              <span className="text-[11px]" style={{ color: textMuted2 }}>
                Applies to standard 20ST, 40GP, and 40HC dry equipment.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onShowToast('Billing and demurrage rules saved successfully.')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            style={{
              backgroundColor: isDark ? '#123D3B' : '#E8F8F5',
              color: isDark ? '#53D0BC' : '#128B7B',
              border: `1px solid ${isDark ? '#18B7A0' : '#DDEDEA'}`
            }}
          >
            <Save className="w-4 h-4" />
            <span>Save Billing Rules</span>
          </button>
        </div>
      )}

      {/* Tab 4: Rust Core Architecture */}
      {activeTab === 'rust' && (
        <RustCodebaseView />
      )}
    </div>
  );
};
