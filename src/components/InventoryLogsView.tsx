import React, { useState, useMemo } from 'react';
import { ContainerItem, ShippingLine, IsoContainerType } from '../types/depot';
import { validateIsoContainerNumber, calculateIsoCheckDigit } from '../utils/iso6346';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Move, 
  FileCheck, 
  AlertCircle, 
  Thermometer, 
  Clock, 
  DollarSign,
  Calculator,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface InventoryLogsViewProps {
  containers: ContainerItem[];
  onSelectContainer: (container: ContainerItem) => void;
  onRequestMove: (container: ContainerItem) => void;
}

export const InventoryLogsView: React.FC<InventoryLogsViewProps> = ({
  containers,
  onSelectContainer,
  onRequestMove
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showIsoTool, setShowIsoTool] = useState(false);

  // ISO Tool State
  const [isoInput, setIsoInput] = useState('MSKU719284');
  const isoToolResult = useMemo(() => {
    if (isoInput.length >= 10) {
      const calc = calculateIsoCheckDigit(isoInput.slice(0, 10));
      return {
        prefix: isoInput.slice(0, 4).toUpperCase(),
        serial: isoInput.slice(4, 10),
        calculatedDigit: calc,
        fullValidId: `${isoInput.slice(0, 4).toUpperCase()}${isoInput.slice(4, 10)}${calc}`
      };
    }
    return null;
  }, [isoInput]);

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
          c.cargoDescription.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Carrier
      if (carrierFilter !== 'ALL' && c.shippingLine !== carrierFilter) {
        return false;
      }

      // Type
      if (typeFilter === 'REEFER' && !c.reefer) return false;
      if (typeFilter === 'HAZMAT' && !c.hazardousIMO) return false;
      if (typeFilter === '20FT' && c.teu !== 1) return false;
      if (typeFilter === '40FT' && c.teu !== 2) return false;

      // Status
      if (statusFilter === 'CUSTOMS_HOLD' && !c.customsStatus.includes('Held')) return false;
      if (statusFilter === 'DEMURRAGE' && c.dwellDays <= c.freeDays) return false;
      if (statusFilter === 'IN_YARD' && c.status !== 'In Yard') return false;

      return true;
    });
  }, [containers, searchQuery, carrierFilter, typeFilter, statusFilter]);

  const handleExportCsv = () => {
    const headers = [
      'Container ID',
      'Shipping Line',
      'ISO Type',
      'TEU',
      'Location (Zone-Bay-Row-Tier)',
      'Gross Weight (kg)',
      'Seal Number',
      'Booking Reference',
      'Bill of Lading',
      'Consignee',
      'Dwell Days',
      'Demurrage Due ($)',
      'Customs Status'
    ];

    const rows = filtered.map((c) => {
      const demurrage = c.dwellDays > c.freeDays ? (c.dwellDays - c.freeDays) * c.demurrageRatePerDayUsd : 0;
      return [
        c.formattedId,
        c.shippingLine,
        c.isoType,
        c.teu,
        `${c.location.zone}-${c.location.bay}-${c.location.row}-${c.location.tier}`,
        c.grossWeightKg,
        c.sealNumber,
        c.bookingReference,
        c.billOfLading,
        `"${c.consignee}"`,
        c.dwellDays,
        demurrage,
        c.customsStatus
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `depot_container_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Ledger Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Container Inventory Ledger & ISO Logs</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                {filtered.length} matching of {containers.length} total
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Certified ISO 6346 inventory registry with dwell calculations, demurrage tariffs, and equipment history.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIsoTool(!showIsoTool)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span>{showIsoTool ? 'Hide ISO Calculator' : 'ISO 6346 Check Digit Tool'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Collapsible ISO 6346 Tool */}
        {showIsoTool && (
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 font-mono">
                ISO 6346 CHECK DIGIT CALCULATOR (MODULO 11 WEIGHTED SUM)
              </span>
              <span className="text-[11px] text-slate-400">
                Formula: Check Digit = (Σ char_value × 2^i) mod 11
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-medium">Input Prefix + 6-digit Serial:</label>
                <input
                  type="text"
                  maxLength={10}
                  value={isoInput}
                  onChange={(e) => setIsoInput(e.target.value.toUpperCase())}
                  placeholder="e.g. MSKU719284"
                  className="px-2.5 py-1 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500 w-36 uppercase tracking-wider"
                />
              </div>

              {isoToolResult && (
                <div className="flex items-center gap-3 text-xs font-mono bg-slate-900 px-3 py-1 rounded border border-slate-800">
                  <span className="text-slate-400">Calculated Digit:</span>
                  <span className="text-amber-400 font-bold text-sm bg-amber-400/10 px-1.5 py-0.5 rounded">
                    {isoToolResult.calculatedDigit}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">Standard Marking:</span>
                  <span className="text-emerald-400 font-bold">
                    {isoToolResult.prefix} {isoToolResult.serial}-{isoToolResult.calculatedDigit}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by container ID, seal, booking ref, consignee..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Carrier Selector */}
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="ALL">All Shipping Lines</option>
            <option value="Maersk">Maersk</option>
            <option value="MSC">MSC</option>
            <option value="CMA CGM">CMA CGM</option>
            <option value="Hapag-Lloyd">Hapag-Lloyd</option>
            <option value="ONE">ONE</option>
            <option value="Evergreen">Evergreen</option>
            <option value="COSCO">COSCO</option>
          </select>

          {/* Type Selector */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="ALL">All Equipment Types</option>
            <option value="20FT">20ft Equipment (1 TEU)</option>
            <option value="40FT">40ft Equipment (2 TEU)</option>
            <option value="REEFER">Cold Chain Reefers</option>
            <option value="HAZMAT">Hazardous IMO Stacks</option>
          </select>

          {/* Status Selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_YARD">In Yard Only</option>
            <option value="CUSTOMS_HOLD">Customs Hold</option>
            <option value="DEMURRAGE">Demurrage Accruing (&gt; 5 Days)</option>
          </select>

          {(searchQuery || carrierFilter !== 'ALL' || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCarrierFilter('ALL');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-amber-400 hover:text-amber-300 text-xs px-2 py-1 underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* High-Density Data Grid Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3 font-semibold">CONTAINER ID</th>
                <th className="py-2.5 px-3 font-semibold">CARRIER</th>
                <th className="py-2.5 px-3 font-semibold">TYPE</th>
                <th className="py-2.5 px-3 font-semibold">LOCATION</th>
                <th className="py-2.5 px-3 font-semibold text-right">GROSS (KG)</th>
                <th className="py-2.5 px-3 font-semibold">SEAL #</th>
                <th className="py-2.5 px-3 font-semibold">DWELL</th>
                <th className="py-2.5 px-3 font-semibold text-right">DEMURRAGE</th>
                <th className="py-2.5 px-3 font-semibold">CUSTOMS</th>
                <th className="py-2.5 px-3 font-semibold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <p className="font-medium text-slate-400 text-sm">No container records found</p>
                    <p className="text-xs text-slate-500 mt-1">Try clearing filters or search terms</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const checkDigitVal = validateIsoContainerNumber(c.id);
                  const isDemurring = c.dwellDays > c.freeDays;
                  const demurrageAmount = isDemurring
                    ? (c.dwellDays - c.freeDays) * c.demurrageRatePerDayUsd
                    : 0;

                  return (
                    <tr 
                      key={c.id}
                      className="hover:bg-slate-800/60 transition-colors group cursor-pointer"
                      onClick={() => onSelectContainer(c)}
                    >
                      {/* Container ID & ISO Check */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{c.formattedId}</span>
                          {checkDigitVal.isValid ? (
                            <span title="Valid ISO 6346" className="text-emerald-400 text-[10px]">✓</span>
                          ) : (
                            <span title="Invalid Check Digit" className="text-red-400 text-[10px]">⚠</span>
                          )}
                        </div>
                      </td>

                      {/* Carrier */}
                      <td className="py-2.5 px-3 text-slate-300 font-medium">
                        {c.shippingLine}
                      </td>

                      {/* Type */}
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{c.isoType}</span>
                          {c.reefer && (
                            <span className="text-[10px] text-cyan-300 font-mono flex items-center">
                              <Thermometer className="w-2.5 h-2.5 mr-0.5" />
                              {c.reefer.actualTempC.toFixed(0)}°C
                            </span>
                          )}
                          {c.hazardousIMO && (
                            <span className="text-[10px] text-amber-400 font-bold font-mono">
                              IMO{c.hazardousIMO}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-2.5 px-3 font-mono text-amber-300 font-medium">
                        Z{c.location.zone}-B{String(c.location.bay).padStart(2, '0')}-R{c.location.row}-T{c.location.tier}
                      </td>

                      {/* Gross Weight */}
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-200">
                        {c.grossWeightKg.toLocaleString()}
                      </td>

                      {/* Seal */}
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {c.sealNumber}
                      </td>

                      {/* Dwell Days */}
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-300">
                        <span className={isDemurring ? 'text-amber-400 font-bold' : ''}>
                          {c.dwellDays}d {isDemurring ? '(Overdue)' : `(${c.freeDays - c.dwellDays}d free)`}
                        </span>
                      </td>

                      {/* Demurrage */}
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                        {demurrageAmount > 0 ? (
                          <span className="text-red-400 font-bold">${demurrageAmount.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-500">$0.00</span>
                        )}
                      </td>

                      {/* Customs Status */}
                      <td className="py-2.5 px-3">
                        <span className={`text-[11px] font-medium ${
                          c.customsStatus === 'Cleared' 
                            ? 'text-emerald-400' 
                            : 'text-red-400 font-semibold'
                        }`}>
                          {c.customsStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onRequestMove(c)}
                            title="Reposition with Crane"
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
                          >
                            <Move className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectContainer(c)}
                            title="View Full History & Logs"
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
