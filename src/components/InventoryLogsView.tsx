import React, { useState, useMemo, useEffect } from 'react';
import { ContainerItem } from '../types/depot';
import { Search, FileSpreadsheet, Calendar } from 'lucide-react';

interface InventoryLogsViewProps {
  containers: ContainerItem[];
  onSelectContainer: (container: ContainerItem) => void;
  onRequestMove: (container: ContainerItem) => void;
  isDark?: boolean;
  externalSearchQuery?: string;
}

export const InventoryLogsView: React.FC<InventoryLogsViewProps> = ({
  containers,
  onSelectContainer,
  isDark = false,
  externalSearchQuery = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  useEffect(() => {
    if (externalSearchQuery) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  // Filtered containers
  const filtered = useMemo(() => {
    return containers.filter((c) => {
      // Search
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
          c.entryTimestamp.toLowerCase().includes(q) ||
          (c.inspectionRemarks && c.inspectionRemarks.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Carrier
      if (carrierFilter !== 'ALL' && c.shippingLine !== carrierFilter) {
        return false;
      }

      // Type Filter
      if (typeFilter !== 'ALL') {
        if (typeFilter === '40HC' && c.isoType !== '40HC') return false;
        if (typeFilter === '20ST' && c.isoType !== '20GP' && c.isoType !== '20ST') return false;
        if (typeFilter === '40GP' && c.isoType !== '40GP') return false;
        if (typeFilter === '45HC' && c.isoType !== '45HC') return false;
        if (typeFilter === 'REEFER' && !c.isoType.includes('RF')) return false;
        if (typeFilter === 'SPECIAL' && !['20OT', '40OT', '20FR', '40FR', '20TK'].includes(c.isoType)) return false;
      }

      // Status
      if (statusFilter !== 'ALL' && c.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [containers, searchQuery, carrierFilter, typeFilter, statusFilter]);

  const cardBg = isDark ? '#13212b' : '#ffffff';
  const cardBorder = isDark ? '#1c2d3a' : '#edf2f0';
  const textPrimary = isDark ? '#ffffff' : '#18242a';
  const textMuted = isDark ? '#728997' : '#7f908e';
  const innerBg = isDark ? '#0c161d' : '#f8faf9';

  return (
    <div className="space-y-4">
      {/* Top Ledger Toolbar */}
      <div 
        className="rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs border transition-colors"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2" style={{ color: textPrimary }}>
              <span>Stock Registry</span>
              <span 
                className="text-xs font-mono px-2.5 py-0.5 rounded-full font-bold border"
                style={{
                  backgroundColor: isDark ? '#143834' : '#e6f7f4',
                  color: isDark ? '#23cca8' : '#108e7d',
                  borderColor: isDark ? '#1a544e' : '#bfece2'
                }}
              >
                {filtered.length} of {containers.length} Units
              </span>
            </h2>
            <p className="text-xs mt-1" style={{ color: textMuted }}>
              Locate and review containers registered in the depot. Dwell and demurrage are managed in Reports.
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div 
          className="flex flex-wrap items-center gap-2.5 pt-3 border-t text-xs"
          style={{ borderColor: cardBorder }}
        >
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: textMuted }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search container, seal, booking, or remark..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none border transition-colors"
              style={{
                backgroundColor: innerBg,
                borderColor: cardBorder,
                color: textPrimary
              }}
            />
          </div>

          {/* Carrier Selector */}
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs focus:outline-none border font-mono"
            style={{
              backgroundColor: innerBg,
              borderColor: cardBorder,
              color: textPrimary
            }}
          >
            <option value="ALL">All Shipping Lines</option>
            <option value="ONE">ONE (Ocean Network Express)</option>
          </select>

          {/* Type Selector */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs focus:outline-none border font-mono"
            style={{
              backgroundColor: innerBg,
              borderColor: cardBorder,
              color: textPrimary
            }}
          >
            <option value="ALL">All Container Types</option>
            <option value="40HC">40' High Cube Dry (40HC)</option>
            <option value="20ST">20' Standard Dry (20ST / 20GP)</option>
            <option value="40GP">40' General Purpose Dry (40GP)</option>
            <option value="45HC">45' High Cube (45HC)</option>
            <option value="REEFER">Reefer Containers (20RF / 40RF)</option>
            <option value="SPECIAL">Special (Open Top / Flat Rack / Tank)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs focus:outline-none border font-mono"
            style={{
              backgroundColor: innerBg,
              borderColor: cardBorder,
              color: textPrimary
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="In Yard">In Yard (Active)</option>
            <option value="Under Inspection">Under Inspection</option>
            <option value="Customs Hold">Customs Hold</option>
            <option value="Gate Out">Dispatched / Gate Out</option>
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
                <th className="py-3.5 px-4 whitespace-nowrap">Turn-in Date</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Dwell</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 min-w-[220px]">Condition / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: cardBorder }}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center" style={{ color: textMuted }}>
                    <div className="max-w-sm mx-auto space-y-2">
                      <FileSpreadsheet className="w-8 h-8 mx-auto opacity-40" />
                      <p className="font-semibold text-sm">No containers found matching filter criteria</p>
                      <p className="text-xs">Adjust your search term or upload a new turn-in report.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
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

                      {/* Dwell Days */}
                      <td className="py-3 px-4 font-mono">
                        <span className={`font-bold ${c.dwellDays > 300 ? 'text-purple-400' : c.dwellDays > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {c.dwellDays} days
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          {c.status}
                        </span>
                      </td>

                      {/* Inspection Remarks */}
                      <td className="py-3 px-4 max-w-[220px] truncate" style={{ color: textMuted }} title={c.inspectionRemarks || c.lastInspection.condition}>
                        <span className="text-[11px] font-mono">
                          {c.inspectionRemarks || c.lastInspection.condition}
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
