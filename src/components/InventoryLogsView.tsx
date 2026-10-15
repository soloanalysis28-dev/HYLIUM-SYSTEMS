import React, { useState, useMemo } from 'react';
import { ContainerItem } from '../types/depot';
import {
  Search,
  Thermometer,
  Clock,
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
  onSelectContainer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return containers.filter((c) => {
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

      if (carrierFilter !== 'ALL' && c.shippingLine !== carrierFilter) return false;
      if (typeFilter === 'REEFER' && !c.reefer) return false;
      if (typeFilter === 'HAZMAT' && !c.hazardousIMO) return false;
      if (typeFilter === '20FT' && c.teu !== 1) return false;
      if (typeFilter === '40FT' && c.teu !== 2) return false;
      if (statusFilter === 'CUSTOMS_HOLD' && !c.customsStatus.includes('Held')) return false;
      if (statusFilter === 'IN_YARD' && c.status !== 'In Yard') return false;

      return true;
    });
  }, [containers, searchQuery, carrierFilter, typeFilter, statusFilter]);

  const hasFilters = searchQuery || carrierFilter !== 'ALL' || typeFilter !== 'ALL' || statusFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setCarrierFilter('ALL');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <div className="space-y-4">
      <section className="bg-slate-900 border border-slate-800 rounded-lg p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Container Inventory</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-normal">
                {filtered.length} of {containers.length} units
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Locate and review containers currently registered in the depot.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dwell and demurrage are managed in Reports</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search container, seal, booking, or consignee..."
              className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
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

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">All Equipment Types</option>
            <option value="20FT">20ft Equipment (1 TEU)</option>
            <option value="40FT">40ft Equipment (2 TEU)</option>
            <option value="REEFER">Cold Chain Reefers</option>
            <option value="HAZMAT">Hazardous IMO Stacks</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_YARD">In Yard Only</option>
            <option value="CUSTOMS_HOLD">Customs Hold</option>
          </select>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="text-cyan-400 hover:text-cyan-300 text-xs px-2 py-1 underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[900px]">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-mono text-[11px] tracking-wide">
                <th className="py-3 px-4 font-semibold whitespace-nowrap">CONTAINER ID</th>
                <th className="py-3 px-4 font-semibold">CARRIER</th>
                <th className="py-3 px-4 font-semibold">TYPE</th>
                <th className="py-3 px-4 font-semibold">YARD LOCATION</th>
                <th className="py-3 px-4 font-semibold">SEAL</th>
                <th className="py-3 px-4 font-semibold">DWELL</th>
                <th className="py-3 px-4 font-semibold">CUSTOMS STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <p className="font-medium text-slate-400 text-sm">No container records found</p>
                    <p className="text-xs text-slate-500 mt-1">Try clearing filters or search terms</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isOverFreeDays = c.dwellDays > c.freeDays;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-800/60 transition-colors cursor-pointer"
                      onClick={() => onSelectContainer(c)}
                      title="Open container details"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300 whitespace-nowrap">
                        {c.formattedId}
                      </td>
                      <td className="py-3 px-4 text-slate-200 font-medium whitespace-nowrap">
                        {c.shippingLine}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{c.isoType}</span>
                          {c.reefer && (
                            <span className="text-[10px] text-cyan-300 flex items-center gap-0.5" title="Reefer container">
                              <Thermometer className="w-3 h-3" />
                              {c.reefer.actualTempC.toFixed(0)}°C
                            </span>
                          )}
                          {c.hazardousIMO && (
                            <span className="text-[10px] text-amber-300 font-bold" title={`Hazardous IMO class ${c.hazardousIMO}`}>
                              IMO{c.hazardousIMO}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-300 font-medium whitespace-nowrap">
                        Z{c.location.zone}-B{String(c.location.bay).padStart(2, '0')}-R{c.location.row}-T{c.location.tier}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {c.sealNumber}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                        <span className={isOverFreeDays ? 'text-amber-300 font-bold' : 'text-slate-200'}>
                          {c.dwellDays} days
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {isOverFreeDays ? 'Review in Reports' : `${c.freeDays - c.dwellDays} days free`}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                          c.customsStatus === 'Cleared' ? 'text-emerald-300' : 'text-red-300 font-semibold'
                        }`}>
                          {c.customsStatus === 'Cleared' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                          {c.customsStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500">
          Select a container row to open full history, inspection details, and relocation options.
        </div>
      </section>
    </div>
  );
};
