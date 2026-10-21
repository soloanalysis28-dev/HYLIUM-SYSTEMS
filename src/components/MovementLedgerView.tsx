import React, { useState, useMemo } from 'react';
import { MovementTransaction } from '../types/depot';
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Search, 
  FileText, 
  Printer, 
  Download, 
  Building2, 
  Truck, 
  Train, 
  Layers, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  Filter, 
  X,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Hash,
  Scale
} from 'lucide-react';

interface MovementLedgerViewProps {
  transactions: MovementTransaction[];
  isDark?: boolean;
  onNavigateToReceive: () => void;
  onNavigateToDispatch: () => void;
}

type TabType = 'ALL' | 'RECEIPTS' | 'DISPATCHES';

export const MovementLedgerView: React.FC<MovementLedgerViewProps> = ({
  transactions,
  isDark = false,
  onNavigateToReceive,
  onNavigateToDispatch
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  const [selectedDepot, setSelectedDepot] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'container'>('newest');
  const [selectedEirTrx, setSelectedEirTrx] = useState<MovementTransaction | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Theme tokens
  const bgCard = isDark ? '#101E28' : '#FFFFFF';
  const borderCol = isDark ? '#243743' : '#E6EDF0';
  const textMuted = isDark ? '#91A8B5' : '#7B8C9D';
  const textDark = isDark ? '#EAF5F5' : '#17324A';
  const inputBg = isDark ? '#0D1720' : '#F8FAFB';

  // Extract available months from transactions
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.monthKey) set.add(t.monthKey);
      else {
        const d = new Date(t.timestamp);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        set.add(`${y}-${m}`);
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const monthLabels: Record<string, string> = {
    '2026-10': 'October 2026',
    '2026-09': 'September 2026',
    '2026-08': 'August 2026',
    '2026-07': 'July 2026'
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Tab filter
      if (activeTab === 'RECEIPTS' && t.type !== 'GATE_IN') return false;
      if (activeTab === 'DISPATCHES' && t.type !== 'GATE_OUT') return false;

      // Month filter
      if (selectedMonth !== 'ALL') {
        const tMonth = t.monthKey || t.timestamp.substring(0, 7);
        if (tMonth !== selectedMonth) return false;
      }

      // Shipping line filter
      if (selectedLine !== 'ALL' && t.shippingLine !== selectedLine) return false;

      // Depot filter
      if (selectedDepot !== 'ALL' && t.depotCode !== selectedDepot) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          t.containerId.toLowerCase().includes(q) ||
          t.formattedId.toLowerCase().includes(q) ||
          t.eirNumber.toLowerCase().includes(q) ||
          t.receiptOrBookingRef.toLowerCase().includes(q) ||
          t.vehiclePlate.toLowerCase().includes(q) ||
          t.driverName.toLowerCase().includes(q) ||
          t.driverId.toLowerCase().includes(q) ||
          t.transporterCompany.toLowerCase().includes(q) ||
          (t.sealNumber && t.sealNumber.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      return a.containerId.localeCompare(b.containerId);
    });
  }, [transactions, activeTab, selectedMonth, selectedLine, selectedDepot, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const relevant = selectedMonth === 'ALL' 
      ? transactions 
      : transactions.filter((t) => (t.monthKey || t.timestamp.substring(0, 7)) === selectedMonth);
    
    const gateIns = relevant.filter((t) => t.type === 'GATE_IN');
    const gateOuts = relevant.filter((t) => t.type === 'GATE_OUT');
    const totalTeu = relevant.reduce((sum, t) => sum + (t.containerSize === '20ft' ? 1 : 2), 0);
    const netFlow = gateIns.length - gateOuts.length;

    return {
      total: relevant.length,
      gateInsCount: gateIns.length,
      gateOutsCount: gateOuts.length,
      totalTeu,
      netFlow
    };
  }, [transactions, selectedMonth]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = () => {
    const headers = [
      'Transaction ID',
      'Movement Type',
      'Timestamp',
      'EIR Number',
      'Receipt / Booking Ref',
      'Container Number',
      'Shipping Line',
      'Size / Type',
      'Status',
      'Depot Code',
      'Transport Mode',
      'Plate / Wagon',
      'Driver Name',
      'Driver ID',
      'Transporter',
      'Tare Weight (kg)',
      'Gross Weight (kg)',
      'Seal Number',
      'Yard Location',
      'Operator'
    ];

    const rows = filteredTransactions.map((t) => [
      t.id,
      t.type === 'GATE_IN' ? 'RECEIPT (GATE IN)' : 'DISPATCH (GATE OUT)',
      new Date(t.timestamp).toLocaleString('en-GB'),
      t.eirNumber,
      t.receiptOrBookingRef,
      t.containerId,
      t.shippingLine,
      `${t.containerSize} ${t.isoType}`,
      t.loadStatus,
      t.depotCode,
      t.transportMode,
      t.vehiclePlate,
      t.driverName,
      t.driverId,
      t.transporterCompany,
      t.tareWeightKg,
      t.grossWeightKg || '',
      t.sealNumber || '',
      t.yardLocation || '',
      t.operator
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `movement_ledger_${selectedMonth.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintLedger = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* View Title & Navigation Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: isDark ? '#123D3B' : '#E8F8F5',
                borderColor: isDark ? '#18B7A0' : '#CBE9E3',
                color: isDark ? '#53D0BC' : '#128B7B'
              }}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: textDark }}>
                  Movement Ledger & Audit Trail
                </h1>
                <span 
                  className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider border"
                  style={{
                    backgroundColor: isDark ? '#172B38' : '#EEF4F6',
                    borderColor: borderCol,
                    color: textMuted
                  }}
                >
                  LIVE JOURNAL
                </span>
              </div>
              <p className="text-xs" style={{ color: textMuted }}>
                Comprehensive operational registry of all gate-in receipts, gate-out dispatches, and intermodal movements
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onNavigateToReceive}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs border text-white bg-emerald-600 hover:bg-emerald-500"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            Receive (Gate In)
          </button>
          <button
            type="button"
            onClick={onNavigateToDispatch}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs border text-white bg-sky-600 hover:bg-sky-500"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5" />
            Dispatch (Gate Out)
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border"
            style={{
              backgroundColor: bgCard,
              borderColor: borderCol,
              color: textDark
            }}
            title="Download CSV export"
          >
            <Download className="w-3.5 h-3.5 text-teal-500" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handlePrintLedger}
            className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border"
            style={{
              backgroundColor: bgCard,
              borderColor: borderCol,
              color: textDark
            }}
            title="Print report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            Print
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div 
          className="p-4 rounded-2xl border shadow-xs"
          style={{ backgroundColor: bgCard, borderColor: borderCol }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: textMuted }}>
            <span>Total Receipts (Gate In)</span>
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono mt-1 text-emerald-500">
            {stats.gateInsCount}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: textMuted }}>
            Turn-ins & Inbound receipts
          </div>
        </div>

        <div 
          className="p-4 rounded-2xl border shadow-xs"
          style={{ backgroundColor: bgCard, borderColor: borderCol }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: textMuted }}>
            <span>Total Dispatches (Gate Out)</span>
            <div className="p-1 rounded-md bg-sky-500/10 text-sky-500">
              <ArrowUpFromLine className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono mt-1 text-sky-500">
            {stats.gateOutsCount}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: textMuted }}>
            Releases & Delivery orders
          </div>
        </div>

        <div 
          className="p-4 rounded-2xl border shadow-xs"
          style={{ backgroundColor: bgCard, borderColor: borderCol }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: textMuted }}>
            <span>Net Yard Balance Delta</span>
            <div className="p-1 rounded-md bg-teal-500/10 text-teal-500">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono mt-1 ${stats.netFlow >= 0 ? 'text-teal-400' : 'text-amber-400'}`}>
            {stats.netFlow > 0 ? `+${stats.netFlow}` : stats.netFlow}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: textMuted }}>
            Inflow vs Outflow balance
          </div>
        </div>

        <div 
          className="p-4 rounded-2xl border shadow-xs"
          style={{ backgroundColor: bgCard, borderColor: borderCol }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: textMuted }}>
            <span>Total Handled Volume</span>
            <div className="p-1 rounded-md bg-purple-500/10 text-purple-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono mt-1" style={{ color: textDark }}>
            {stats.totalTeu} <span className="text-sm font-normal text-muted-foreground">TEU</span>
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: textMuted }}>
            {stats.total} total movement records
          </div>
        </div>
      </div>

      {/* Main Container with Tabs & Filters */}
      <div 
        className="rounded-2xl border shadow-xs overflow-hidden"
        style={{ backgroundColor: bgCard, borderColor: borderCol }}
      >
        {/* Navigation Tabs Header */}
        <div 
          className="px-5 pt-4 pb-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{ borderColor: borderCol }}
        >
          {/* Movement Tabs (All, Receipts, Dispatches) */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-black/5 dark:bg-black/20 w-fit" style={{ borderColor: borderCol }}>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ALL'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              All Movements
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20">
                {transactions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('RECEIPTS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'RECEIPTS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'
              }`}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Receipts (Gate In)
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20">
                {transactions.filter((t) => t.type === 'GATE_IN').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('DISPATCHES')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'DISPATCHES'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-sky-500'
              }`}
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              Dispatches (Gate Out)
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20">
                {transactions.filter((t) => t.type === 'GATE_OUT').length}
              </span>
            </button>
          </div>

          {/* Month Filter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: textMuted }}>
              <Calendar className="w-3.5 h-3.5 text-teal-500" />
              Period:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border font-semibold outline-hidden cursor-pointer"
              style={{
                backgroundColor: inputBg,
                borderColor: borderCol,
                color: textDark
              }}
            >
              <option value="ALL">All Recorded Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {monthLabels[m] || m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div 
          className="p-4 border-b flex flex-wrap items-center gap-3"
          style={{ borderColor: borderCol, backgroundColor: isDark ? '#0D1720' : '#FAFDFD' }}
        >
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search container, EIR #, receipt/booking ref, truck, driver..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs border outline-hidden transition-all focus:ring-1 focus:ring-teal-500"
              style={{
                backgroundColor: bgCard,
                borderColor: borderCol,
                color: textDark
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Shipping Line Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span style={{ color: textMuted }}>Carrier:</span>
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border font-medium outline-hidden cursor-pointer"
              style={{
                backgroundColor: bgCard,
                borderColor: borderCol,
                color: textDark
              }}
            >
              <option value="ALL">All Lines</option>
              <option value="ONE">ONE</option>
              <option value="Maersk">Maersk</option>
              <option value="CMA CGM">CMA CGM</option>
              <option value="PIL">PIL</option>
              <option value="MSC">MSC</option>
              <option value="Hapag-Lloyd">Hapag-Lloyd</option>
              <option value="Evergreen">Evergreen</option>
            </select>
          </div>

          {/* Depot Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span style={{ color: textMuted }}>Depot:</span>
            <select
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border font-medium outline-hidden cursor-pointer font-mono"
              style={{
                backgroundColor: bgCard,
                borderColor: borderCol,
                color: textDark
              }}
            >
              <option value="ALL">All Depots</option>
              <option value="BAKHRE30">BAKHRE30 (BAK Logistics)</option>
              <option value="ALRHRE31">ALRHRE31 (ALRO Depot)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs ml-auto">
            <span style={{ color: textMuted }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-xl border font-medium outline-hidden cursor-pointer"
              style={{
                backgroundColor: bgCard,
                borderColor: borderCol,
                color: textDark
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="container">Container ID (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr 
                className="border-b uppercase tracking-wider text-[11px] font-semibold select-none font-mono"
                style={{
                  backgroundColor: isDark ? '#14232F' : '#F4F7F8',
                  borderColor: borderCol,
                  color: textMuted
                }}
              >
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">EIR / Ref #</th>
                <th className="py-3 px-4">Container ID</th>
                <th className="py-3 px-3">Line</th>
                <th className="py-3 px-3">Type & Status</th>
                <th className="py-3 px-3">Depot</th>
                <th className="py-3 px-4">Transport & Driver</th>
                <th className="py-3 px-3">Tare / Gross</th>
                <th className="py-3 px-4 text-right">EIR Document</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: borderCol }}>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center" style={{ color: textMuted }}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 opacity-40 text-teal-500" />
                      <p className="font-semibold text-sm">No movement records match the current filters</p>
                      <p className="text-xs">Adjust your date, shipping line, depot, or search keyword</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const isGateIn = trx.type === 'GATE_IN';
                  const dateObj = new Date(trx.timestamp);
                  const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                  // Line badge style
                  let lineBadgeBg = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                  if (trx.shippingLine === 'ONE') lineBadgeBg = 'bg-pink-500/10 text-pink-500 border-pink-500/30';
                  else if (trx.shippingLine === 'Maersk') lineBadgeBg = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
                  else if (trx.shippingLine === 'CMA CGM') lineBadgeBg = 'bg-blue-600/10 text-blue-500 border-blue-600/30';
                  else if (trx.shippingLine === 'PIL') lineBadgeBg = 'bg-red-500/10 text-red-400 border-red-500/30';
                  else if (trx.shippingLine === 'MSC') lineBadgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                  else if (trx.shippingLine === 'Hapag-Lloyd') lineBadgeBg = 'bg-orange-500/10 text-orange-400 border-orange-500/30';

                  return (
                    <tr 
                      key={trx.id}
                      className="transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium font-mono" style={{ color: textDark }}>
                          {dateStr}
                        </div>
                        <div className="text-[10px] font-mono flex items-center gap-1" style={{ color: textMuted }}>
                          <Clock className="w-2.5 h-2.5" />
                          {timeStr}
                        </div>
                      </td>

                      {/* Movement Type */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span 
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isGateIn 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                              : 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                          }`}
                        >
                          {isGateIn ? (
                            <>
                              <ArrowDownToLine className="w-3 h-3" />
                              GATE IN
                            </>
                          ) : (
                            <>
                              <ArrowUpFromLine className="w-3 h-3" />
                              GATE OUT
                            </>
                          )}
                        </span>
                      </td>

                      {/* EIR & Ref # */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-teal-400">
                          {trx.eirNumber}
                        </div>
                        <div className="text-[10px] font-mono" style={{ color: textMuted }}>
                          Ref: <span className="text-slate-300 font-semibold">{trx.receiptOrBookingRef}</span>
                        </div>
                      </td>

                      {/* Container ID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold tracking-wide" style={{ color: textDark }}>
                            {trx.formattedId || trx.containerId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(trx.containerId, trx.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                            title="Copy Container Number"
                          >
                            {copiedId === trx.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px]" style={{ color: textMuted }}>
                          {trx.surveyCondition}
                        </div>
                      </td>

                      {/* Line */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${lineBadgeBg}`}>
                          {trx.shippingLine}
                        </span>
                      </td>

                      {/* Type & Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold" style={{ color: textDark }}>
                          {trx.containerSize} {trx.isoType}
                        </div>
                        <span 
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                            trx.loadStatus === 'Full' 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {trx.loadStatus}
                        </span>
                      </td>

                      {/* Depot */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded border bg-black/5 dark:bg-black/20" style={{ borderColor: borderCol, color: textDark }}>
                          {trx.depotCode}
                        </span>
                      </td>

                      {/* Transport & Driver */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium whitespace-nowrap" style={{ color: textDark }}>
                          {trx.transportMode === 'Truck' ? (
                            <Truck className="w-3 h-3 text-teal-400" />
                          ) : (
                            <Train className="w-3 h-3 text-indigo-400" />
                          )}
                          <span className="font-mono font-semibold">{trx.vehiclePlate}</span>
                        </div>
                        <div className="text-[10px] truncate max-w-[170px]" style={{ color: textMuted }} title={`${trx.driverName} (${trx.driverId})`}>
                          {trx.driverName} • {trx.driverId}
                        </div>
                      </td>

                      {/* Weights */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                        <div>Tare: <span className="font-semibold" style={{ color: textDark }}>{trx.tareWeightKg.toLocaleString()} kg</span></div>
                        {trx.grossWeightKg && trx.grossWeightKg > trx.tareWeightKg && (
                          <div className="text-[10px]" style={{ color: textMuted }}>
                            Gross: {trx.grossWeightKg.toLocaleString()} kg
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedEirTrx(trx)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ml-auto hover:border-teal-500 text-teal-400 bg-teal-500/10"
                        >
                          <FileText className="w-3 h-3" />
                          View EIR
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div 
          className="p-3 border-t flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono"
          style={{ borderColor: borderCol, color: textMuted }}
        >
          <div>
            Showing <span className="font-bold text-teal-400">{filteredTransactions.length}</span> of {transactions.length} total operational movements
          </div>
          <div>
            ISO 6346 / EDIFACT CODECO compliance standard
          </div>
        </div>
      </div>

      {/* EIR Document Viewer Modal */}
      {selectedEirTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ backgroundColor: bgCard, borderColor: borderCol }}
          >
            {/* Modal Header */}
            <div 
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: borderCol }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: textDark }}>
                    Electronic Interchange Receipt (EIR)
                  </h3>
                  <p className="text-xs font-mono text-teal-400">
                    Official Slip #{selectedEirTrx.eirNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  style={{ borderColor: borderCol, color: textDark }}
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  Print EIR
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEirTrx(null)}
                  className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal EIR Slip Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Slip Official Top Banner */}
              <div 
                className="p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-black/5 dark:bg-black/20"
                style={{ borderColor: borderCol }}
              >
                <div>
                  <div className="font-bold text-sm tracking-wide" style={{ color: textDark }}>
                    HYLIUM INTERMODAL CONTAINER TERMINAL
                  </div>
                  <div className="text-[11px] font-mono text-teal-400">
                    DEPOT STATION: {selectedEirTrx.depotCode === 'BAKHRE30' ? 'BAKHRE30 (BAK LOGISTICS HARARE)' : 'ALRHRE31 (ALRO CONTAINER DEPOT)'}
                  </div>
                  <div className="text-[10px]" style={{ color: textMuted }}>
                    International Maritime Organization (IMO) CSC Convention Compliance
                  </div>
                </div>

                <div className="text-right sm:text-right">
                  <span 
                    className={`px-3 py-1 rounded-full text-xs font-bold inline-block border ${
                      selectedEirTrx.type === 'GATE_IN'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                    }`}
                  >
                    {selectedEirTrx.type === 'GATE_IN' ? 'GATE IN RECEIPT' : 'GATE OUT DISPATCH'}
                  </span>
                  <div className="text-[11px] font-mono mt-1" style={{ color: textMuted }}>
                    {new Date(selectedEirTrx.timestamp).toLocaleString('en-GB')}
                  </div>
                </div>
              </div>

              {/* Container & Carrier Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border bg-black/5 dark:bg-black/10" style={{ borderColor: borderCol }}>
                  <div className="text-[10px] uppercase font-mono" style={{ color: textMuted }}>Container Number</div>
                  <div className="text-base font-bold font-mono text-teal-400 mt-0.5">
                    {selectedEirTrx.formattedId}
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-black/5 dark:bg-black/10" style={{ borderColor: borderCol }}>
                  <div className="text-[10px] uppercase font-mono" style={{ color: textMuted }}>Shipping Carrier</div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: textDark }}>
                    {selectedEirTrx.shippingLine}
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-black/5 dark:bg-black/10" style={{ borderColor: borderCol }}>
                  <div className="text-[10px] uppercase font-mono" style={{ color: textMuted }}>Reference Number</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                    {selectedEirTrx.receiptOrBookingRef}
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-black/5 dark:bg-black/10" style={{ borderColor: borderCol }}>
                  <div className="text-[10px] uppercase font-mono" style={{ color: textMuted }}>Typology / ISO</div>
                  <div className="text-sm font-semibold mt-0.5" style={{ color: textDark }}>
                    {selectedEirTrx.containerSize} {selectedEirTrx.isoType} ({selectedEirTrx.loadStatus})
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-black/5 dark:bg-black/10" style={{ borderColor: borderCol }}>
                  <div className="text-[10px] uppercase font-mono" style={{ color: textMuted }}>Tare / Gross Weight</div>
                  <div className="text-sm font-mono mt-0.5" style={{ color: textDark }}>
                    {selectedEirTrx.tareWeightKg.toLocaleString()} kg / {selectedEirTrx.grossWeightKg ? `${selectedEirTrx.grossWeightKg.toLocaleString()} kg` : 'N/A'}
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-black/5 dark:bg-black/10" style={{ borderColor: borderCol }}>
                  <div className="text-[10px] uppercase font-mono" style={{ color: textMuted }}>Carrier Seal #</div>
                  <div className="text-sm font-mono mt-0.5 text-purple-400">
                    {selectedEirTrx.sealNumber || 'N/A (Empty)'}
                  </div>
                </div>
              </div>

              {/* Haulier & Driver Block */}
              <div className="p-4 rounded-xl border space-y-2 bg-black/5 dark:bg-black/10" style={{ borderColor: borderCol }}>
                <div className="text-xs font-bold uppercase tracking-wider font-mono text-teal-400">
                  Transporter & Driver Interchange
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px]" style={{ color: textMuted }}>Haulage Carrier:</span>
                    <div className="font-semibold mt-0.5" style={{ color: textDark }}>{selectedEirTrx.transporterCompany}</div>
                  </div>
                  <div>
                    <span className="text-[10px]" style={{ color: textMuted }}>Vehicle / Wagon Plate:</span>
                    <div className="font-mono font-semibold mt-0.5 text-teal-300">{selectedEirTrx.vehiclePlate} ({selectedEirTrx.transportMode})</div>
                  </div>
                  <div>
                    <span className="text-[10px]" style={{ color: textMuted }}>Driver Name & ID:</span>
                    <div className="font-semibold mt-0.5" style={{ color: textDark }}>{selectedEirTrx.driverName}</div>
                    <div className="text-[10px] font-mono" style={{ color: textMuted }}>{selectedEirTrx.driverId}</div>
                  </div>
                </div>
              </div>

              {/* Condition & Notes */}
              <div className="p-4 rounded-xl border space-y-2" style={{ borderColor: borderCol }}>
                <div className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: textDark }}>
                  Gate Inspection Remarks & Yard Slot
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: textMuted }}>Survey Condition:</span>
                  <span className="font-bold text-teal-400">{selectedEirTrx.surveyCondition}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: textMuted }}>Yard Slot Assigned:</span>
                  <span className="font-mono font-bold" style={{ color: textDark }}>{selectedEirTrx.yardLocation || 'Staging Lane'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: textMuted }}>Authorized Gate Officer:</span>
                  <span className="font-mono" style={{ color: textDark }}>{selectedEirTrx.operator}</span>
                </div>
                {selectedEirTrx.notes && (
                  <div className="pt-2 border-t text-[11px]" style={{ borderColor: borderCol, color: textMuted }}>
                    <span className="font-semibold text-slate-300">Notes: </span>
                    {selectedEirTrx.notes}
                  </div>
                )}
              </div>

              {/* Legal Signatures block */}
              <div className="pt-4 border-t grid grid-cols-2 gap-6 text-[10px]" style={{ borderColor: borderCol, color: textMuted }}>
                <div>
                  <div className="border-b pb-8 font-mono" style={{ borderColor: borderCol }}>
                    Driver Signature / Acceptance:
                  </div>
                  <div className="mt-1">I confirm equipment received/dispatched in stated condition</div>
                </div>
                <div>
                  <div className="border-b pb-8 font-mono" style={{ borderColor: borderCol }}>
                    Depot Gate Officer Signature:
                  </div>
                  <div className="mt-1">Verified against Booking/EIR manifest</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div 
              className="px-6 py-3 border-t flex items-center justify-between bg-black/5 dark:bg-black/20"
              style={{ borderColor: borderCol }}
            >
              <span className="text-[11px] font-mono" style={{ color: textMuted }}>
                System Generated Ref: {selectedEirTrx.id}
              </span>
              <button
                type="button"
                onClick={() => setSelectedEirTrx(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: borderCol, color: textDark }}
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
