import React, { useState, useMemo, useEffect } from 'react';
import { 
  ContainerItem, 
  ContainerTypeCode, 
  DEFAULT_ENABLED_CONTAINER_TYPES, 
  CONTAINER_TYPOLOGY_SPECS, 
  isContainerTypeEnabled, 
  getContainerTypeCode 
} from '../types/depot';
import { calculateRealTimeDwellDays } from '../utils/dwell';
import { Search, FileSpreadsheet, Calendar, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';

interface InventoryLogsViewProps {
  containers: ContainerItem[];
  onSelectContainer: (container: ContainerItem) => void;
  onRequestMove: (container: ContainerItem) => void;
  isDark?: boolean;
  externalSearchQuery?: string;
  enabledContainerTypes?: ContainerTypeCode[];
}

export const InventoryLogsView: React.FC<InventoryLogsViewProps> = ({
  containers,
  onSelectContainer,
  isDark = false,
  externalSearchQuery = '',
  enabledContainerTypes = DEFAULT_ENABLED_CONTAINER_TYPES
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'arrival' | 'dwell'>('arrival');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    if (externalSearchQuery) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  const activeTypes = useMemo(() => {
    return enabledContainerTypes && Array.isArray(enabledContainerTypes) && enabledContainerTypes.length > 0
      ? enabledContainerTypes
      : DEFAULT_ENABLED_CONTAINER_TYPES;
  }, [enabledContainerTypes]);

  // Dynamically extract all available shipping lines from containers + major lines
  const shippingLineOptions = useMemo(() => {
    const defaultLines = ['ONE', 'Maersk', 'MSC', 'CMA CGM', 'Hapag-Lloyd', 'PIL', 'Evergreen', 'COSCO'];
    const linesFromStock = containers.map((c) => c.shippingLine).filter(Boolean);
    const combined = Array.from(new Set([...defaultLines, ...linesFromStock]));
    return combined;
  }, [containers]);

  // Filtered containers
  const filtered = useMemo(() => {
    return containers.filter((c) => {
      // 1. Only show containers matching enabled container types from Settings
      if (!isContainerTypeEnabled(c.isoType, activeTypes)) return false;

      // 2. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          c.id.toLowerCase().includes(q) ||
          c.formattedId.toLowerCase().includes(q) ||
          c.sealNumber.toLowerCase().includes(q) ||
          c.bookingReference.toLowerCase().includes(q) ||
          c.billOfLading.toLowerCase().includes(q) ||
          c.consignee.toLowerCase().includes(q) ||
          c.destinationPort.toLowerCase().includes(q) ||
          c.entryTimestamp.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 3. Carrier
      if (carrierFilter !== 'ALL' && c.shippingLine !== carrierFilter) {
        return false;
      }

      // 4. Type filter is limited to the types enabled in Settings.
      if (typeFilter !== 'ALL') {
        const cCode = getContainerTypeCode(c.isoType);
        if (cCode !== typeFilter && c.isoType !== typeFilter) return false;
      }

      // 5. Status
      if (statusFilter !== 'ALL' && c.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [containers, activeTypes, searchQuery, carrierFilter, typeFilter, statusFilter]);

  // Sort containers by Date of Arrival or Real-Time Dwell Days (=$R$1 - H155 + 1)
  const sortedContainers = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'dwell') {
        const dwellA = calculateRealTimeDwellDays(a.entryTimestamp, a.exitTimestamp);
        const dwellB = calculateRealTimeDwellDays(b.entryTimestamp, b.exitTimestamp);
        return sortDirection === 'desc' ? dwellB - dwellA : dwellA - dwellB;
      }
      // Default: Sort stock by Date of Arrival (entryTimestamp)
      const timeA = new Date(a.entryTimestamp).getTime() || 0;
      const timeB = new Date(b.entryTimestamp).getTime() || 0;
      return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [filtered, sortBy, sortDirection]);

  const cardBg = isDark ? '#13212b' : '#ffffff';
  const cardBorder = isDark ? '#1c2d3a' : '#edf2f0';
  const textPrimary = isDark ? '#ffffff' : '#18242a';
  const textMuted = isDark ? '#728997' : '#7f908e';
  const innerBg = isDark ? '#0c161d' : '#f8faf9';

  return (
    <div className="space-y-4">
      {/* Search, Shipping Lines, Con Types, Statuses, and Sort in ONE Single Line */}
      <div 
        className="rounded-xl p-3 sm:p-3.5 shadow-xs border transition-colors"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 text-xs">
          {/* 1. Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: textMuted }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search container, seal, booking..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none border transition-colors font-mono"
              style={{
                backgroundColor: innerBg,
                borderColor: cardBorder,
                color: textPrimary
              }}
            />
          </div>

          {/* 2. Shipping Lines */}
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs focus:outline-none border font-mono shrink-0 cursor-pointer"
            style={{
              backgroundColor: innerBg,
              borderColor: cardBorder,
              color: textPrimary
            }}
            title="Filter by Shipping Line"
          >
            <option value="ALL">All Shipping Lines</option>
            {shippingLineOptions.map((line) => (
              <option key={line} value={line}>{line}</option>
            ))}
          </select>

          {/* 3. Con Types */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs focus:outline-none border font-mono shrink-0 cursor-pointer"
            style={{
              backgroundColor: innerBg,
              borderColor: cardBorder,
              color: textPrimary
            }}
            title="Filter by Container Type"
          >
            <option value="ALL">All Con Types ({activeTypes.length})</option>
            {CONTAINER_TYPOLOGY_SPECS.filter((spec) => activeTypes.includes(spec.code)).map((spec) => (
              <option key={spec.code} value={spec.code}>
                {spec.shortLabel}
              </option>
            ))}
          </select>

          {/* 4. Statuses */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs focus:outline-none border font-mono shrink-0 cursor-pointer"
            style={{
              backgroundColor: innerBg,
              borderColor: cardBorder,
              color: textPrimary
            }}
            title="Filter by Container Status"
          >
            <option value="ALL">All Statuses</option>
            <option value="In Yard">In Yard</option>
            <option value="Under Inspection">Inspection</option>
            <option value="Customs Hold">Customs Hold</option>
            <option value="Gate Out">Gate Out</option>
          </select>

          {/* 5. Sort */}
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => {
              const [newSortBy, newDir] = e.target.value.split('-') as ['arrival' | 'dwell', 'desc' | 'asc'];
              setSortBy(newSortBy);
              setSortDirection(newDir);
            }}
            className="px-3 py-2 rounded-lg text-xs focus:outline-none border font-mono font-semibold shrink-0 cursor-pointer"
            style={{
              backgroundColor: innerBg,
              borderColor: isDark ? '#1a544e' : '#bfece2',
              color: isDark ? '#23cca8' : '#108e7d'
            }}
            title="Sort stock by Date of Arrival or Real-Time Dwell Days"
          >
            <option value="arrival-desc">Sort: Arrival (Newest ↓)</option>
            <option value="arrival-asc">Sort: Arrival (Oldest ↑)</option>
            <option value="dwell-desc">Sort: Dwell (Highest ↓)</option>
            <option value="dwell-asc">Sort: Dwell (Lowest ↑)</option>
          </select>
        </div>
      </div>

      {/* Main High-Density Table */}
      <div 
        className="rounded-2xl shadow-xs overflow-hidden border transition-colors"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs border-collapse">
            <thead>
              <tr 
                className="border-b font-mono text-[11px] uppercase tracking-wider font-semibold"
                style={{ 
                  backgroundColor: innerBg, 
                  borderColor: cardBorder,
                  color: textMuted 
                }}
              >
                <th className="py-3.5 px-4 whitespace-nowrap">Container ID</th>
                <th className="py-3.5 px-4">Carrier</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Yard Location</th>
                {/* Arrival Date Column Header - Clickable Sort Header */}
                <th 
                  onClick={() => {
                    if (sortBy === 'arrival') {
                      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                    } else {
                      setSortBy('arrival');
                      setSortDirection('desc');
                    }
                  }}
                  className="py-3.5 px-4 whitespace-nowrap cursor-pointer select-none group transition-colors"
                  title="Click to sort by Date of Arrival (Newest / Oldest)"
                >
                  <div className="flex items-center gap-1.5" style={{ color: sortBy === 'arrival' ? (isDark ? '#23cca8' : '#108e7d') : textMuted }}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span className={`font-bold ${sortBy === 'arrival' ? 'underline decoration-dotted underline-offset-4' : 'group-hover:text-teal-400'}`}>
                      Date of Arrival
                    </span>
                    {sortBy === 'arrival' ? (
                      sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                {/* Dwell Days Column Header - Clickable Sort Header */}
                <th 
                  onClick={() => {
                    if (sortBy === 'dwell') {
                      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                    } else {
                      setSortBy('dwell');
                      setSortDirection('desc');
                    }
                  }}
                  className="py-3.5 px-4 whitespace-nowrap cursor-pointer select-none group transition-colors"
                  title="Click to sort by Real-Time Dwell Days"
                >
                  <div className="flex items-center gap-1.5" style={{ color: sortBy === 'dwell' ? (isDark ? '#23cca8' : '#108e7d') : textMuted }}>
                    <span className={`font-bold ${sortBy === 'dwell' ? 'underline decoration-dotted underline-offset-4' : 'group-hover:text-teal-400'}`}>
                      Dwell (=$R$1-H155+1)
                    </span>
                    {sortBy === 'dwell' ? (
                      sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: cardBorder }}>
              {sortedContainers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center" style={{ color: textMuted }}>
                    <div className="max-w-sm mx-auto space-y-2">
                      <FileSpreadsheet className="w-8 h-8 mx-auto opacity-40" />
                      <p className="font-semibold text-sm">No containers found matching filter criteria</p>
                      <p className="text-xs">Adjust your search term or upload a new turn-in report.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedContainers.map((c) => {
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectContainer(c)}
                      className="cursor-pointer transition-colors group"
                      style={{
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? '#172733' : '#f0f5f4';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Container ID & Check Digit Status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs" style={{ color: isDark ? '#23cba7' : '#149987' }}>
                            {c.formattedId}
                          </span>
                        </div>
                      </td>

                      {/* Line */}
                      <td className="py-3 px-4">
                        <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-pink-500/15 text-pink-500 border border-pink-500/20">
                          {c.shippingLine}
                        </span>
                      </td>

                      {/* ISO Type */}
                      <td className="py-3 px-4 font-mono font-medium" style={{ color: textPrimary }}>
                        <span className="px-1.5 py-0.5 rounded bg-slate-500/10 text-[11px]">
                          {c.isoType} ({c.teu} TEU)
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 font-mono text-xs">
                        <span className="px-1.5 py-0.5 rounded font-bold bg-amber-500/15 text-amber-500">
                          Z{c.location.zone}-B{String(c.location.bay).padStart(2, '0')}-R{c.location.row}-T{c.location.tier}
                        </span>
                      </td>

                      {/* Turn-in Date */}
                      <td className="py-3 px-4 font-mono text-xs" style={{ color: textPrimary }}>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{new Date(c.entryTimestamp).toLocaleDateString('en-GB')}</span>
                        </div>
                      </td>

                      {/* Dwell Days (=$R$1 - H155 + 1) */}
                      <td className="py-3 px-4 font-mono">
                        {(() => {
                          const liveDwell = calculateRealTimeDwellDays(c.entryTimestamp, c.exitTimestamp);
                          return (
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold ${liveDwell > 300 ? 'text-purple-400' : liveDwell > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {liveDwell} {liveDwell === 1 ? 'day' : 'days'}
                              </span>
                              {liveDwell > 5 && (
                                <span 
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/20 font-semibold"
                                  title={`Demurrage: $${((liveDwell - 5) * 115).toLocaleString()} (${liveDwell - 5} days overdue)`}
                                >
                                  +${((liveDwell - 5) * 115).toLocaleString()}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          {c.status}
                        </span>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
