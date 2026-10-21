import React, { useState, useMemo } from 'react';
import { RepairWorkOrder, RepairDamageItem, StandardRepairTariff, ContainerItem } from '../types/depot';
import { STANDARD_REPAIR_TARIFFS } from '../data/operationsData';
import { 
  Wrench, 
  FileText, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  Printer, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  User, 
  PhoneCall, 
  DollarSign, 
  Check, 
  X, 
  Calendar, 
  Layers,
  ArrowRight,
  ShieldCheck,
  Hammer,
  BadgeAlert,
  Download
} from 'lucide-react';

interface MnrWorkshopViewProps {
  workOrders: RepairWorkOrder[];
  containers: ContainerItem[];
  isDark?: boolean;
  onUpdateWorkOrders: (updated: RepairWorkOrder[]) => void;
  onShowToast?: (msg: string) => void;
}

type MnrTab = 'ALL' | 'PENDING_APPROVAL' | 'IN_WORKSHOP' | 'QC_READY' | 'BILLING' | 'TARIFFS';

export const MnrWorkshopView: React.FC<MnrWorkshopViewProps> = ({
  workOrders,
  containers,
  isDark = false,
  onUpdateWorkOrders,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<MnrTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  const [selectedDepot, setSelectedDepot] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<RepairWorkOrder | null>(null);

  // Modals
  const [isNewTicketOpen, setIsNewTicketOpen] = useState<boolean>(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState<boolean>(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState<boolean>(false);
  const [isInvoiceViewerOpen, setIsInvoiceViewerOpen] = useState<boolean>(false);

  // Follow-up form state
  const [followUpAction, setFollowUpAction] = useState<string>('Surveyor Reminder Call');
  const [followUpNotes, setFollowUpNotes] = useState<string>('');
  const [followUpUser, setFollowUpUser] = useState<string>('M&R Depot Lead');

  // Billing invoice generator form state
  const [billingPayerType, setBillingPayerType] = useState<'Shipping Line' | 'Cargo Owner' | 'Haulier / Transporter'>('Shipping Line');
  const [billingPayerName, setBillingPayerName] = useState<string>('');
  const [billingTaxPercent, setBillingTaxPercent] = useState<number>(15);

  // New ticket form state
  const [newContainerId, setNewContainerId] = useState<string>('');
  const [newLine, setNewLine] = useState<string>('ONE');
  const [newDepot, setNewDepot] = useState<string>('BAKHRE30');
  const [newPriority, setNewPriority] = useState<'Routine' | 'Urgent / Vessel Export' | 'Safety Critical'>('Routine');
  const [newDamageTariffId, setNewDamageTariffId] = useState<string>('TRF-01');
  const [newDamageRemarks, setNewDamageRemarks] = useState<string>('');

  // Theme tokens
  const bgCard = isDark ? '#101E28' : '#FFFFFF';
  const borderCol = isDark ? '#243743' : '#E6EDF0';
  const textMuted = isDark ? '#91A8B5' : '#7B8C9D';
  const textDark = isDark ? '#EAF5F5' : '#17324A';
  const inputBg = isDark ? '#0D1720' : '#F8FAFB';

  // Statistics
  const stats = useMemo(() => {
    const total = workOrders.length;
    const pendingApproval = workOrders.filter((w) => w.status === 'Estimate Pending Line Approval');
    const inWorkshop = workOrders.filter((w) => w.status === 'In Repair / Workshop' || w.status === 'Approved by Line');
    const qcReady = workOrders.filter((w) => w.status === 'Repaired & QC Passed');
    const invoiced = workOrders.filter((w) => w.billing.billingStatus === 'Invoiced' || w.billing.billingStatus === 'Paid');

    const pendingApprovalTotalUsd = pendingApproval.reduce((sum, w) => sum + w.totalEstimateCost, 0);
    const totalBilledUsd = invoiced.reduce((sum, w) => sum + w.billing.totalBilledAmount, 0);

    return {
      total,
      pendingApprovalCount: pendingApproval.length,
      pendingApprovalTotalUsd,
      inWorkshopCount: inWorkshop.length,
      qcReadyCount: qcReady.length,
      invoicedCount: invoiced.length,
      totalBilledUsd
    };
  }, [workOrders]);

  // Filtered tickets
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((w) => {
      // Tab filter
      if (activeTab === 'PENDING_APPROVAL' && w.status !== 'Estimate Pending Line Approval') return false;
      if (activeTab === 'IN_WORKSHOP' && w.status !== 'In Repair / Workshop' && w.status !== 'Approved by Line') return false;
      if (activeTab === 'QC_READY' && w.status !== 'Repaired & QC Passed') return false;
      if (activeTab === 'BILLING' && w.billing.billingStatus === 'Unbilled' && w.status !== 'Repaired & QC Passed') return false;

      // Line filter
      if (selectedLine !== 'ALL' && w.shippingLine !== selectedLine) return false;

      // Depot filter
      if (selectedDepot !== 'ALL' && w.depotCode !== selectedDepot) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          w.id.toLowerCase().includes(q) ||
          w.containerId.toLowerCase().includes(q) ||
          w.formattedId.toLowerCase().includes(q) ||
          (w.lineApprovalRef && w.lineApprovalRef.toLowerCase().includes(q)) ||
          (w.billing.invoiceNumber && w.billing.invoiceNumber.toLowerCase().includes(q)) ||
          (w.technicianAssigned && w.technicianAssigned.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [workOrders, activeTab, selectedLine, selectedDepot, searchQuery]);

  // Handle Log Follow-Up
  const handleAddFollowUp = () => {
    if (!selectedTicket || !followUpNotes.trim()) return;

    const newHistory = {
      id: `FLW-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: followUpAction,
      user: followUpUser,
      notes: followUpNotes.trim()
    };

    const updated = workOrders.map((w) =>
      w.id === selectedTicket.id
        ? {
            ...w,
            followUpHistory: [newHistory, ...w.followUpHistory]
          }
        : w
    );

    onUpdateWorkOrders(updated);
    setSelectedTicket({
      ...selectedTicket,
      followUpHistory: [newHistory, ...selectedTicket.followUpHistory]
    });
    setFollowUpNotes('');
    setIsFollowUpModalOpen(false);
    onShowToast?.(`Follow-up record logged for ticket ${selectedTicket.id}`);
  };

  // Handle Carrier Approval
  const handleCarrierApproval = (ticket: RepairWorkOrder) => {
    const authRef = prompt('Enter Carrier Approval Reference Number (e.g. ONE-AUTH-2026-9901):', `${ticket.shippingLine}-AUTH-${Date.now().toString().slice(-4)}`);
    if (!authRef) return;

    const newHistory = {
      id: `FLW-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Carrier Sign-Off Authorized',
      user: 'Carrier Line Surveyor',
      notes: `Approval ref ${authRef} authorized. Work cleared for repair stall.`
    };

    const updated = workOrders.map((w) =>
      w.id === ticket.id
        ? {
            ...w,
            status: 'Approved by Line' as const,
            lineApprovalRef: authRef,
            lineApprovedDate: new Date().toISOString(),
            followUpHistory: [newHistory, ...w.followUpHistory]
          }
        : w
    );

    onUpdateWorkOrders(updated);
    if (selectedTicket?.id === ticket.id) {
      setSelectedTicket({
        ...ticket,
        status: 'Approved by Line',
        lineApprovalRef: authRef,
        lineApprovedDate: new Date().toISOString(),
        followUpHistory: [newHistory, ...ticket.followUpHistory]
      });
    }
    onShowToast?.(`Ticket ${ticket.id} approved by ${ticket.shippingLine} under ref ${authRef}.`);
  };

  // Handle Move to Workshop
  const handleMoveToWorkshop = (ticket: RepairWorkOrder) => {
    const technician = prompt('Assign Technician Name:', ticket.technicianAssigned || 'T. Ndlovu (Lead Welder)');
    const bay = prompt('Assign Repair Bay Stall:', ticket.repairBay || 'Bay 02 - Welding Stall');
    if (!technician) return;

    const newHistory = {
      id: `FLW-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Container Dispatched to Workshop',
      user: 'M&R Yard Dispatcher',
      notes: `Work commenced in ${bay || 'Repair Stall'} by technician ${technician}.`
    };

    const updated = workOrders.map((w) =>
      w.id === ticket.id
        ? {
            ...w,
            status: 'In Repair / Workshop' as const,
            technicianAssigned: technician,
            repairBay: bay || 'Bay 01',
            followUpHistory: [newHistory, ...w.followUpHistory]
          }
        : w
    );

    onUpdateWorkOrders(updated);
    if (selectedTicket?.id === ticket.id) {
      setSelectedTicket({
        ...ticket,
        status: 'In Repair / Workshop',
        technicianAssigned: technician,
        repairBay: bay || 'Bay 01',
        followUpHistory: [newHistory, ...ticket.followUpHistory]
      });
    }
    onShowToast?.(`Container ${ticket.formattedId} placed in active repair in ${bay}.`);
  };

  // Handle QC Passed
  const handleQCPassed = (ticket: RepairWorkOrder) => {
    const inspector = prompt('Enter QC Inspector Name & Certification:', 'K. Phiri (Certified IICL)');
    if (!inspector) return;

    const newHistory = {
      id: `FLW-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'QC Inspection Passed & Soundness Certified',
      user: inspector,
      notes: 'Structural integrity, weather tightness & weld quality verified. Ready for billing.'
    };

    const updated = workOrders.map((w) =>
      w.id === ticket.id
        ? {
            ...w,
            status: 'Repaired & QC Passed' as const,
            completedDate: new Date().toISOString(),
            qcInspector: inspector,
            followUpHistory: [newHistory, ...w.followUpHistory]
          }
        : w
    );

    onUpdateWorkOrders(updated);
    if (selectedTicket?.id === ticket.id) {
      setSelectedTicket({
        ...ticket,
        status: 'Repaired & QC Passed',
        completedDate: new Date().toISOString(),
        qcInspector: inspector,
        followUpHistory: [newHistory, ...ticket.followUpHistory]
      });
    }
    onShowToast?.(`Repair QC passed for ${ticket.formattedId}. Ready for invoicing.`);
  };

  // Handle Open Billing Modal
  const handleOpenBillingModal = (ticket: RepairWorkOrder) => {
    setSelectedTicket(ticket);
    setBillingPayerName(
      ticket.billing.payerName || 
      (ticket.shippingLine === 'ONE' ? 'Ocean Network Express (Pty) Ltd' : `${ticket.shippingLine} Shipping Agencies Ltd`)
    );
    setBillingPayerType(ticket.billing.billTo || 'Shipping Line');
    setBillingTaxPercent(ticket.billing.taxPercent || 15);
    setIsBillingModalOpen(true);
  };

  // Handle Commit Invoice Generation
  const handleCommitInvoice = () => {
    if (!selectedTicket) return;

    const monthCode = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][new Date().getMonth()];
    const invoiceNumber = `MNR-INV-${new Date().getFullYear()}${monthCode}-${Math.floor(100 + Math.random() * 900)}`;
    const subtotal = selectedTicket.totalEstimateCost;
    const taxAmount = Number(((subtotal * billingTaxPercent) / 100).toFixed(2));
    const totalBilledAmount = Number((subtotal + taxAmount).toFixed(2));
    const todayStr = new Date().toISOString().split('T')[0];

    const newHistory = {
      id: `FLW-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Official Debit Note / Repair Invoice Generated',
      user: 'Finance & Billing Officer',
      notes: `Invoice #${invoiceNumber} issued to ${billingPayerName} for $${totalBilledAmount.toFixed(2)} USD.`
    };

    const updated = workOrders.map((w) =>
      w.id === selectedTicket.id
        ? {
            ...w,
            billing: {
              ...w.billing,
              billingStatus: 'Invoiced' as const,
              invoiceNumber,
              invoiceDate: todayStr,
              dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
              billTo: billingPayerType,
              payerName: billingPayerName,
              taxPercent: billingTaxPercent,
              subtotal,
              taxAmount,
              totalBilledAmount
            },
            followUpHistory: [newHistory, ...w.followUpHistory]
          }
        : w
    );

    onUpdateWorkOrders(updated);
    const updatedTicket = updated.find((w) => w.id === selectedTicket.id);
    if (updatedTicket) setSelectedTicket(updatedTicket);
    setIsBillingModalOpen(false);
    onShowToast?.(`Repair invoice ${invoiceNumber} successfully created.`);
  };

  // Handle Mark Invoice Paid
  const handleMarkInvoicePaid = (ticket: RepairWorkOrder) => {
    const paymentRef = prompt('Enter EFT / Remittance Reference Number:', `EFT-${Date.now().toString().slice(-6)}`);
    if (!paymentRef) return;

    const newHistory = {
      id: `FLW-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Payment Reconciled & Closed',
      user: 'Accounts Department',
      notes: `Full payment of $${ticket.billing.totalBilledAmount.toFixed(2)} settled via ${paymentRef}.`
    };

    const updated = workOrders.map((w) =>
      w.id === ticket.id
        ? {
            ...w,
            status: 'Invoiced & Closed' as const,
            billing: {
              ...w.billing,
              billingStatus: 'Paid' as const,
              paidDate: new Date().toISOString().split('T')[0],
              paymentRef
            },
            followUpHistory: [newHistory, ...w.followUpHistory]
          }
        : w
    );

    onUpdateWorkOrders(updated);
    if (selectedTicket?.id === ticket.id) {
      setSelectedTicket({
        ...ticket,
        status: 'Invoiced & Closed',
        billing: {
          ...ticket.billing,
          billingStatus: 'Paid',
          paidDate: new Date().toISOString().split('T')[0],
          paymentRef
        },
        followUpHistory: [newHistory, ...ticket.followUpHistory]
      });
    }
    onShowToast?.(`Invoice marked paid under ref ${paymentRef}.`);
  };

  // Handle Create New Repair Ticket
  const handleCreateNewTicket = () => {
    if (!newContainerId.trim()) {
      alert('Please select or specify a container number.');
      return;
    }

    const tariff = STANDARD_REPAIR_TARIFFS.find((t) => t.id === newDamageTariffId) || STANDARD_REPAIR_TARIFFS[0];
    const ticketId = `MNR-2026-OCT-0${Math.floor(110 + Math.random() * 890)}`;
    const cleanId = newContainerId.trim().toUpperCase().replace(/\s+/g, '');
    const formatted = `${cleanId.slice(0, 4)} ${cleanId.slice(4, 10)}${cleanId.length > 10 ? '-' + cleanId.slice(10) : ''}`;

    const damageItem: RepairDamageItem = {
      id: `DMG-${Date.now()}`,
      component: tariff.component,
      damageType: tariff.damageDescription,
      locationCode: 'SEC-01',
      repairMethod: `Standard IICL repair method for ${tariff.component}`,
      laborHours: tariff.standardHours,
      laborRatePerHour: tariff.standardLaborRateUsd,
      materialCost: tariff.standardMaterialUsd,
      totalCost: tariff.totalStandardUsd
    };

    const subtotal = tariff.totalStandardUsd;
    const taxAmount = Number(((subtotal * 15) / 100).toFixed(2));
    const totalBilledAmount = Number((subtotal + taxAmount).toFixed(2));

    const newTicket: RepairWorkOrder = {
      id: ticketId,
      containerId: cleanId,
      formattedId: formatted,
      shippingLine: newLine,
      isoType: '40HC',
      containerSize: '40ft',
      depotCode: newDepot,
      reportedDate: new Date().toISOString(),
      reportedBy: 'Terminal Surveyor & Gate Inspector',
      status: 'Estimate Pending Line Approval',
      priority: newPriority,
      damageItems: [damageItem],
      totalLaborHours: tariff.standardHours,
      totalLaborCost: tariff.standardHours * tariff.standardLaborRateUsd,
      totalMaterialCost: tariff.standardMaterialUsd,
      totalEstimateCost: tariff.totalStandardUsd,
      agingDays: 1,
      followUpHistory: [
        {
          id: `FLW-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Initial Damage Survey Registered',
          user: 'Survey Gate Inspector',
          notes: newDamageRemarks.trim() || 'Container surveyed upon depot arrival. Estimate queued for carrier sign-off.'
        }
      ],
      billing: {
        billingStatus: 'Estimate Sent',
        billTo: 'Shipping Line',
        payerName: `${newLine} Shipping Agencies Ltd`,
        taxPercent: 15,
        subtotal,
        taxAmount,
        totalBilledAmount,
        currency: 'USD'
      },
      technicianAssigned: 'T. Ndlovu',
      repairBay: 'Bay 01 - Inspection Stall'
    };

    const updated = [newTicket, ...workOrders];
    onUpdateWorkOrders(updated);
    setIsNewTicketOpen(false);
    setNewContainerId('');
    setNewDamageRemarks('');
    setSelectedTicket(newTicket);
    onShowToast?.(`New M&R repair ticket ${ticketId} created for container ${cleanId}.`);
  };

  return (
    <div className="space-y-6">
      {/* View Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: isDark ? '#1C312E' : '#E8F8F5',
                borderColor: isDark ? '#2E6961' : '#C4E7E1',
                color: isDark ? '#53D0BC' : '#128B7B'
              }}
            >
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: textDark }}>
                  M&R Workshop & Repair Billing
                </h1>
                <span 
                  className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider border"
                  style={{
                    backgroundColor: isDark ? '#172B38' : '#EEF4F6',
                    borderColor: borderCol,
                    color: textMuted
                  }}
                >
                  IICL STANDARD
                </span>
              </div>
              <p className="text-xs" style={{ color: textMuted }}>
                Container maintenance follow-ups, shipping line approvals, workshop workflow & official repair billing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsNewTicketOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs border text-white bg-teal-600 hover:bg-teal-500"
          >
            <Plus className="w-3.5 h-3.5" />
            New Repair Ticket
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TARIFFS')}
            className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border"
            style={{
              backgroundColor: bgCard,
              borderColor: borderCol,
              color: textDark
            }}
          >
            <Receipt className="w-3.5 h-3.5 text-teal-400" />
            Billing Rates Matrix
          </button>
        </div>
      </div>

      {/* KPI Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div 
          className="p-4 rounded-2xl border shadow-xs"
          style={{ backgroundColor: bgCard, borderColor: borderCol }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: textMuted }}>
            <span>Active M&R Units</span>
            <div className="p-1 rounded-md bg-amber-500/10 text-amber-400">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono mt-1 text-amber-400">
            {stats.total}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: textMuted }}>
            Containers in repair queue
          </div>
        </div>

        <div 
          className="p-4 rounded-2xl border shadow-xs"
          style={{ backgroundColor: bgCard, borderColor: borderCol }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: textMuted }}>
            <span>Pending Line Approval</span>
            <div className="p-1 rounded-md bg-rose-500/10 text-rose-400">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono mt-1 text-rose-400">
            {stats.pendingApprovalCount} <span className="text-xs font-normal text-muted-foreground">(${stats.pendingApprovalTotalUsd.toFixed(0)} USD)</span>
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: textMuted }}>
            Requires carrier sign-off
          </div>
        </div>

        <div 
          className="p-4 rounded-2xl border shadow-xs"
          style={{ backgroundColor: bgCard, borderColor: borderCol }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: textMuted }}>
            <span>In Workshop / Stalls</span>
            <div className="p-1 rounded-md bg-blue-500/10 text-blue-400">
              <Hammer className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono mt-1 text-blue-400">
            {stats.inWorkshopCount}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: textMuted }}>
            Under active fabrication
          </div>
        </div>

        <div 
          className="p-4 rounded-2xl border shadow-xs"
          style={{ backgroundColor: bgCard, borderColor: borderCol }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: textMuted }}>
            <span>Billed & Invoiced</span>
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono mt-1 text-emerald-400">
            ${stats.totalBilledUsd.toFixed(0)} <span className="text-xs font-normal text-muted-foreground">USD</span>
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: textMuted }}>
            {stats.invoicedCount} invoices processed
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className="rounded-2xl border shadow-xs overflow-hidden"
        style={{ backgroundColor: bgCard, borderColor: borderCol }}
      >
        {/* Navigation Tabs Header */}
        <div 
          className="px-5 pt-4 pb-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{ borderColor: borderCol }}
        >
          <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-black/5 dark:bg-black/20 w-fit flex-wrap" style={{ borderColor: borderCol }}>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ALL'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All Tickets ({workOrders.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PENDING_APPROVAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'PENDING_APPROVAL'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-rose-400'
              }`}
            >
              <PhoneCall className="w-3 h-3" />
              Pending Line Approval ({stats.pendingApprovalCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('IN_WORKSHOP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'IN_WORKSHOP'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-blue-400'
              }`}
            >
              <Hammer className="w-3 h-3" />
              In Workshop ({stats.inWorkshopCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('QC_READY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'QC_READY'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-400'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              QC Passed ({stats.qcReadyCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BILLING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'BILLING'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-purple-400'
              }`}
            >
              <Receipt className="w-3 h-3" />
              Invoices & Billing ({stats.invoicedCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TARIFFS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'TARIFFS'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-200'
              }`}
            >
              Tariff Matrix
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-3">
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border font-medium outline-hidden cursor-pointer"
              style={{
                backgroundColor: inputBg,
                borderColor: borderCol,
                color: textDark
              }}
            >
              <option value="ALL">All Carriers</option>
              <option value="ONE">ONE</option>
              <option value="Maersk">Maersk</option>
              <option value="CMA CGM">CMA CGM</option>
              <option value="PIL">PIL</option>
              <option value="MSC">MSC</option>
              <option value="Hapag-Lloyd">Hapag-Lloyd</option>
            </select>

            <select
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border font-mono font-medium outline-hidden cursor-pointer"
              style={{
                backgroundColor: inputBg,
                borderColor: borderCol,
                color: textDark
              }}
            >
              <option value="ALL">All Depots</option>
              <option value="BAKHRE30">BAKHRE30</option>
              <option value="ALRHRE31">ALRHRE31</option>
            </select>
          </div>
        </div>

        {/* Tab Content: Tariffs or Tickets */}
        {activeTab === 'TARIFFS' ? (
          /* Standard Repair Tariffs Matrix View */
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm" style={{ color: textDark }}>
                  Agreed Depot Repair Tariff Matrix (IICL-6 Standard Rates)
                </h3>
                <p className="text-xs" style={{ color: textMuted }}>
                  Fixed pre-agreed labor and material tariffs for ONE, Maersk, CMA CGM, and partner ocean carriers.
                </p>
              </div>
              <div className="px-3 py-1 rounded-xl text-xs font-mono font-bold border bg-teal-500/10 text-teal-400 border-teal-500/20">
                Hourly Labor Rate: $45.00 / hr
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden" style={{ borderColor: borderCol }}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr 
                    className="border-b uppercase tracking-wider text-[11px] font-semibold font-mono"
                    style={{ backgroundColor: isDark ? '#14232F' : '#F4F7F8', borderColor: borderCol, color: textMuted }}
                  >
                    <th className="py-3 px-4">Tariff ID</th>
                    <th className="py-3 px-4">Component</th>
                    <th className="py-3 px-4">Repair Method & Description</th>
                    <th className="py-3 px-3">Std Hours</th>
                    <th className="py-3 px-3">Material (USD)</th>
                    <th className="py-3 px-4 text-right">Agreed Rate (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: borderCol }}>
                  {STANDARD_REPAIR_TARIFFS.map((t) => (
                    <tr key={t.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-teal-400">{t.id}</td>
                      <td className="py-3 px-4 font-semibold" style={{ color: textDark }}>{t.component}</td>
                      <td className="py-3 px-4" style={{ color: textMuted }}>{t.damageDescription}</td>
                      <td className="py-3 px-3 font-mono">{t.standardHours} hrs</td>
                      <td className="py-3 px-3 font-mono">${t.standardMaterialUsd.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                        ${t.totalStandardUsd.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Work Orders List & Detail Split */
          <div className="p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, container number, auth ref, invoice #, technician..."
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tickets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWorkOrders.length === 0 ? (
                <div className="col-span-2 py-12 text-center" style={{ color: textMuted }}>
                  <Wrench className="w-8 h-8 opacity-40 mx-auto mb-2 text-teal-500" />
                  <p className="font-semibold text-sm">No M&R repair tickets match this view</p>
                  <p className="text-xs">Create a new ticket or clear filter criteria</p>
                </div>
              ) : (
                filteredWorkOrders.map((ticket) => {
                  const isPending = ticket.status === 'Estimate Pending Line Approval';
                  const isApproved = ticket.status === 'Approved by Line';
                  const isInShop = ticket.status === 'In Repair / Workshop';
                  const isQcPassed = ticket.status === 'Repaired & QC Passed';
                  const isClosed = ticket.status === 'Invoiced & Closed';

                  let statusBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                  if (isPending) statusBadgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                  else if (isApproved) statusBadgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
                  else if (isInShop) statusBadgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
                  else if (isQcPassed) statusBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                  else if (isClosed) statusBadgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/30';

                  return (
                    <div
                      key={ticket.id}
                      className="p-5 rounded-xl border transition-all hover:border-teal-500/50 flex flex-col justify-between space-y-4"
                      style={{
                        backgroundColor: isDark ? '#0D1720' : '#FAFDFD',
                        borderColor: borderCol
                      }}
                    >
                      {/* Ticket Header */}
                      <div>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-teal-400">
                              {ticket.id}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border bg-black/10" style={{ borderColor: borderCol, color: textMuted }}>
                              {ticket.depotCode}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-pink-500/10 text-pink-400 border border-pink-500/20">
                              {ticket.shippingLine}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeColor}`}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>

                        {/* Container Big ID */}
                        <div className="mt-2 flex items-center justify-between">
                          <div>
                            <div className="text-base font-bold font-mono tracking-wide" style={{ color: textDark }}>
                              {ticket.formattedId}
                            </div>
                            <div className="text-[11px]" style={{ color: textMuted }}>
                              {ticket.containerSize} {ticket.isoType} • In shop {ticket.agingDays} days • Priority: <span className="font-semibold text-slate-300">{ticket.priority}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs uppercase font-mono" style={{ color: textMuted }}>Estimate</div>
                            <div className="text-base font-mono font-bold text-emerald-400">
                              ${ticket.totalEstimateCost.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Damage items summary */}
                        <div className="mt-3 space-y-1.5 border-t pt-2.5" style={{ borderColor: borderCol }}>
                          <div className="text-[10px] uppercase font-mono font-semibold" style={{ color: textMuted }}>
                            Damage Breakdown:
                          </div>
                          {ticket.damageItems.map((dmg) => (
                            <div key={dmg.id} className="text-xs flex items-center justify-between bg-black/5 dark:bg-black/10 px-2.5 py-1 rounded-lg">
                              <span className="font-medium" style={{ color: textDark }}>
                                • {dmg.component} ({dmg.locationCode}): <span className="font-normal text-muted-foreground">{dmg.damageType}</span>
                              </span>
                              <span className="font-mono text-teal-400 font-semibold shrink-0 ml-2">
                                ${dmg.totalCost.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Line auth or technician */}
                        <div className="mt-3 flex items-center justify-between text-xs font-mono pt-2 border-t" style={{ borderColor: borderCol, color: textMuted }}>
                          <div>
                            {ticket.lineApprovalRef ? (
                              <span className="text-cyan-400 font-semibold">
                                ✓ Line Ref: {ticket.lineApprovalRef}
                              </span>
                            ) : (
                              <span className="text-rose-400">
                                ⏳ Pending Line Sign-off
                              </span>
                            )}
                          </div>
                          <div>
                            Stall: <span className="font-bold text-slate-300">{ticket.repairBay || 'Pending'}</span> ({ticket.technicianAssigned || 'Unassigned'})
                          </div>
                        </div>

                        {/* Follow up log preview */}
                        {ticket.followUpHistory.length > 0 && (
                          <div className="mt-2.5 p-2 rounded-lg bg-black/5 dark:bg-black/20 text-[11px]" style={{ color: textMuted }}>
                            <div className="flex items-center gap-1 font-semibold text-teal-400 mb-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              Latest Follow-Up: {ticket.followUpHistory[0].action}
                            </div>
                            <p className="line-clamp-1 italic">
                              "{ticket.followUpHistory[0].notes}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Ticket Action Buttons (Workflow & Billing) */}
                      <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2" style={{ borderColor: borderCol }}>
                        {/* Left action: Follow-up */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsFollowUpModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-slate-300"
                          style={{ borderColor: borderCol }}
                        >
                          <PhoneCall className="w-3 h-3 text-teal-400" />
                          Log Follow-Up
                        </button>

                        {/* Right contextual action buttons based on stage */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleCarrierApproval(ticket)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-white bg-cyan-600 hover:bg-cyan-500 cursor-pointer shadow-xs"
                            >
                              <Check className="w-3 h-3" />
                              Carrier Sign-Off
                            </button>
                          )}

                          {(isApproved || isInShop) && (
                            <>
                              {isApproved && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveToWorkshop(ticket)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-white bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-xs"
                                >
                                  <Hammer className="w-3 h-3" />
                                  Start Workshop
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleQCPassed(ticket)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-xs"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                QC Passed
                              </button>
                            </>
                          )}

                          {isQcPassed && ticket.billing.billingStatus !== 'Invoiced' && ticket.billing.billingStatus !== 'Paid' && (
                            <button
                              type="button"
                              onClick={() => handleOpenBillingModal(ticket)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-white bg-purple-600 hover:bg-purple-500 cursor-pointer shadow-xs"
                            >
                              <Receipt className="w-3 h-3" />
                              Generate Invoice
                            </button>
                          )}

                          {ticket.billing.invoiceNumber && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setIsInvoiceViewerOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-purple-500/40 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              View Invoice #{ticket.billing.invoiceNumber}
                            </button>
                          )}

                          {ticket.billing.billingStatus === 'Invoiced' && (
                            <button
                              type="button"
                              onClick={() => handleMarkInvoicePaid(ticket)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-xs"
                            >
                              <DollarSign className="w-3 h-3" />
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Follow-Up History & New Follow-Up Entry */}
      {isFollowUpModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            style={{ backgroundColor: bgCard, borderColor: borderCol }}
          >
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: borderCol }}>
              <div>
                <h3 className="font-bold text-sm" style={{ color: textDark }}>
                  Carrier Follow-Up Tracker
                </h3>
                <p className="text-xs font-mono text-teal-400">
                  Ticket #{selectedTicket.id} • Container {selectedTicket.formattedId} ({selectedTicket.shippingLine})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFollowUpModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Existing History */}
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider mb-2 text-teal-400">
                  Follow-Up Timeline & Notes
                </div>
                <div className="space-y-2">
                  {selectedTicket.followUpHistory.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl border bg-black/5 dark:bg-black/20" style={{ borderColor: borderCol }}>
                      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground mb-1">
                        <span className="font-bold text-teal-400">{item.action}</span>
                        <span>{new Date(item.timestamp).toLocaleString('en-GB')}</span>
                      </div>
                      <div className="text-xs mb-1" style={{ color: textDark }}>
                        {item.notes}
                      </div>
                      <div className="text-[10px] font-mono" style={{ color: textMuted }}>
                        Logged by: {item.user}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Entry Form */}
              <div className="border-t pt-4 space-y-3" style={{ borderColor: borderCol }}>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400">
                  Record New Carrier Action / Note
                </div>

                <div>
                  <label className="block text-[10px] font-mono mb-1" style={{ color: textMuted }}>
                    Action Type:
                  </label>
                  <select
                    value={followUpAction}
                    onChange={(e) => setFollowUpAction(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border outline-hidden"
                    style={{ backgroundColor: inputBg, borderColor: borderCol, color: textDark }}
                  >
                    <option value="Surveyor Reminder Call">Surveyor Reminder Call</option>
                    <option value="Dispatched High-Res Photos">Dispatched High-Res Photos</option>
                    <option value="Joint Survey on Yard">Joint Survey on Yard</option>
                    <option value="Carrier Portal Estimate Submission">Carrier Portal Estimate Submission</option>
                    <option value="Line Requested Revised Estimate">Line Requested Revised Estimate</option>
                    <option value="Authorization Confirmed verbally">Authorization Confirmed verbally</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono mb-1" style={{ color: textMuted }}>
                    Follow-Up Notes / Carrier Response:
                  </label>
                  <textarea
                    rows={3}
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="e.g. Spoke to Captain Weber. Agreed to $275.00 repair tariff for floorboard. Awaiting official EDI authorization..."
                    className="w-full text-xs p-2.5 rounded-xl border outline-hidden resize-none"
                    style={{ backgroundColor: inputBg, borderColor: borderCol, color: textDark }}
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t flex justify-end gap-2 bg-black/5 dark:bg-black/20" style={{ borderColor: borderCol }}>
              <button
                type="button"
                onClick={() => setIsFollowUpModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer hover:bg-black/5"
                style={{ borderColor: borderCol, color: textDark }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddFollowUp}
                disabled={!followUpNotes.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 cursor-pointer disabled:opacity-50"
              >
                Save Follow-Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Billing Invoice Dialog */}
      {isBillingModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            style={{ backgroundColor: bgCard, borderColor: borderCol }}
          >
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: borderCol }}>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm" style={{ color: textDark }}>
                  Generate Official Repair Invoice / Debit Note
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBillingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 rounded-xl border bg-black/5 dark:bg-black/20 font-mono" style={{ borderColor: borderCol }}>
                <div className="flex justify-between text-muted-foreground">
                  <span>Container Number:</span>
                  <span className="font-bold text-teal-400">{selectedTicket.formattedId}</span>
                </div>
                <div className="flex justify-between text-muted-foreground mt-1">
                  <span>Shipping Line:</span>
                  <span className="font-bold" style={{ color: textDark }}>{selectedTicket.shippingLine}</span>
                </div>
                <div className="flex justify-between text-muted-foreground mt-1">
                  <span>Depot Station:</span>
                  <span className="font-bold" style={{ color: textDark }}>{selectedTicket.depotCode}</span>
                </div>
                <div className="flex justify-between text-muted-foreground mt-1">
                  <span>Carrier Approval Ref:</span>
                  <span className="font-bold text-cyan-400">{selectedTicket.lineApprovalRef || 'Carrier Direct Debit'}</span>
                </div>
              </div>

              {/* Form Options */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono mb-1" style={{ color: textMuted }}>
                    Bill To Entity / Liable Party:
                  </label>
                  <select
                    value={billingPayerType}
                    onChange={(e) => setBillingPayerType(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-xl border outline-hidden"
                    style={{ backgroundColor: inputBg, borderColor: borderCol, color: textDark }}
                  >
                    <option value="Shipping Line">Shipping Line / Carrier Account</option>
                    <option value="Cargo Owner">Cargo Owner / Consignee</option>
                    <option value="Haulier / Transporter">Haulier / Transporter Liable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono mb-1" style={{ color: textMuted }}>
                    Payer Business Name:
                  </label>
                  <input
                    type="text"
                    value={billingPayerName}
                    onChange={(e) => setBillingPayerName(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border outline-hidden font-medium"
                    style={{ backgroundColor: inputBg, borderColor: borderCol, color: textDark }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono mb-1" style={{ color: textMuted }}>
                    Value Added Tax (VAT %):
                  </label>
                  <input
                    type="number"
                    value={billingTaxPercent}
                    onChange={(e) => setBillingTaxPercent(Number(e.target.value))}
                    className="w-32 text-xs p-2 rounded-xl border outline-hidden font-mono"
                    style={{ backgroundColor: inputBg, borderColor: borderCol, color: textDark }}
                  />
                </div>

                {/* Calculation breakdown */}
                <div className="p-3 rounded-xl border bg-black/5 dark:bg-black/10 space-y-1 font-mono text-xs" style={{ borderColor: borderCol }}>
                  <div className="flex justify-between">
                    <span style={{ color: textMuted }}>Repair Subtotal:</span>
                    <span className="font-bold" style={{ color: textDark }}>${selectedTicket.totalEstimateCost.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: textMuted }}>VAT ({billingTaxPercent}%):</span>
                    <span className="font-bold" style={{ color: textDark }}>
                      ${((selectedTicket.totalEstimateCost * billingTaxPercent) / 100).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-bold text-sm text-emerald-400" style={{ borderColor: borderCol }}>
                    <span>Total Invoice Due:</span>
                    <span>
                      ${(selectedTicket.totalEstimateCost * (1 + billingTaxPercent / 100)).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t flex justify-end gap-2 bg-black/5 dark:bg-black/20" style={{ borderColor: borderCol }}>
              <button
                type="button"
                onClick={() => setIsBillingModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer hover:bg-black/5"
                style={{ borderColor: borderCol, color: textDark }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitInvoice}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 cursor-pointer shadow-xs"
              >
                Issue Debit Note & Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Official Printable Invoice Viewer */}
      {isInvoiceViewerOpen && selectedTicket && selectedTicket.billing.invoiceNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ backgroundColor: bgCard, borderColor: borderCol }}
          >
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: borderCol }}>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-bold text-base" style={{ color: textDark }}>
                    Official M&R Repair Invoice
                  </h3>
                  <p className="text-xs font-mono text-purple-400">
                    Invoice #{selectedTicket.billing.invoiceNumber}
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
                  Print Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setIsInvoiceViewerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-black/5 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Header Company and Bill To */}
              <div className="flex justify-between items-start gap-4 border-b pb-4" style={{ borderColor: borderCol }}>
                <div>
                  <div className="font-bold text-base tracking-wide" style={{ color: textDark }}>
                    HYLIUM DEPOT TERMINALS & LOGISTICS
                  </div>
                  <div className="text-[11px] font-mono text-teal-400 mt-0.5">
                    Depot Station Code: {selectedTicket.depotCode}
                  </div>
                  <div className="text-[10px]" style={{ color: textMuted }}>
                    VAT Reg: 10098412-ZW • Intermodal Container Maintenance Division
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-purple-400">
                    INVOICE: {selectedTicket.billing.invoiceNumber}
                  </div>
                  <div className="text-[11px]" style={{ color: textMuted }}>
                    Date: {selectedTicket.billing.invoiceDate || '2026-10-21'}
                  </div>
                  <div className="text-[11px]" style={{ color: textMuted }}>
                    Terms: Net 30 Days (Due: {selectedTicket.billing.dueDate || '2026-11-20'})
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${
                    selectedTicket.billing.billingStatus === 'Paid'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {selectedTicket.billing.billingStatus === 'Paid' ? 'PAID / SETTLED' : 'PAYMENT PENDING'}
                  </span>
                </div>
              </div>

              {/* Bill To Block */}
              <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-black/10 grid grid-cols-2 gap-4" style={{ borderColor: borderCol }}>
                <div>
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">Bill To:</div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: textDark }}>
                    {selectedTicket.billing.payerName}
                  </div>
                  <div className="text-[11px]" style={{ color: textMuted }}>
                    Liable Party: {selectedTicket.billing.billTo}
                  </div>
                </div>

                <div className="font-mono text-[11px]">
                  <div>Equipment: <span className="font-bold text-teal-400">{selectedTicket.formattedId}</span></div>
                  <div>Carrier: <span className="font-bold" style={{ color: textDark }}>{selectedTicket.shippingLine}</span></div>
                  <div>Line Auth Ref: <span className="font-bold text-cyan-400">{selectedTicket.lineApprovalRef || 'Direct Contract'}</span></div>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border rounded-xl overflow-hidden" style={{ borderColor: borderCol }}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr 
                      className="border-b uppercase text-[10px] font-mono font-bold"
                      style={{ backgroundColor: isDark ? '#14232F' : '#F4F7F8', borderColor: borderCol, color: textMuted }}
                    >
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Labor (Hrs)</th>
                      <th className="py-2.5 px-3">Parts & Materials</th>
                      <th className="py-2.5 px-3 text-right">Amount (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: borderCol }}>
                    {selectedTicket.damageItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold" style={{ color: textDark }}>{item.component} ({item.locationCode})</div>
                          <div className="text-[10px]" style={{ color: textMuted }}>{item.repairMethod}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {item.laborHours} hrs @ $45.00
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          ${item.materialCost.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: textDark }}>
                          ${item.totalCost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between" style={{ color: textMuted }}>
                    <span>Subtotal:</span>
                    <span className="font-semibold" style={{ color: textDark }}>${selectedTicket.billing.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: textMuted }}>
                    <span>VAT ({selectedTicket.billing.taxPercent}%):</span>
                    <span className="font-semibold" style={{ color: textDark }}>${selectedTicket.billing.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 font-bold text-sm text-emerald-400" style={{ borderColor: borderCol }}>
                    <span>Total Due:</span>
                    <span>${selectedTicket.billing.totalBilledAmount.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>

              {/* Bank Details & Signature */}
              <div className="pt-4 border-t grid grid-cols-2 gap-6 text-[10px]" style={{ borderColor: borderCol, color: textMuted }}>
                <div>
                  <div className="font-bold text-slate-300 mb-1">Payment Wire Details:</div>
                  <div>Bank: Stanbic Bank Zimbabwe</div>
                  <div>Account: 9140003891002 (USD Swift: SBICZWHA)</div>
                  <div>Ref: {selectedTicket.billing.invoiceNumber}</div>
                </div>
                <div>
                  <div className="border-b pb-6 font-mono" style={{ borderColor: borderCol }}>
                    Authorized Depot Auditor:
                  </div>
                  <div className="mt-1">IICL Certified Workshop Superintendent</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Create New M&R Repair Ticket */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            style={{ backgroundColor: bgCard, borderColor: borderCol }}
          >
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: borderCol }}>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-teal-400" />
                <h3 className="font-bold text-sm" style={{ color: textDark }}>
                  Create New M&R Repair Job
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono mb-1" style={{ color: textMuted }}>
                  Select Yard Container (or type container code):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newContainerId}
                    onChange={(e) => setNewContainerId(e.target.value.toUpperCase())}
                    placeholder="e.g. ONEY1224883"
                    className="flex-1 text-xs p-2.5 rounded-xl border outline-hidden font-mono font-bold"
                    style={{ backgroundColor: inputBg, borderColor: borderCol, color: textDark }}
                  />
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setNewContainerId(e.target.value);
                        const c = containers.find((cnt) => cnt.id === e.target.value);
                        if (c) {
                          setNewLine(c.shippingLine);
                          if (c.depotCode) setNewDepot(c.depotCode);
                        }
                      }
                    }}
                    className="text-xs p-2 rounded-xl border outline-hidden"
                    style={{ backgroundColor: inputBg, borderColor: borderCol, color: textDark }}
                  >
                    <option value="">Choose Yard Unit...</option>
                    {containers.slice(0, 15).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.formattedId} ({c.shippingLine})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono mb-1" style={{ color: textMuted }}>
                    Shipping Line:
                  </label>
                  <select
                    value={newLine}
                    onChange={(e) => setNewLine(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border outline-hidden"
                    style={{ backgroundColor: inputBg, borderColor: borderCol, color: textDark }}
                  >
                    <option value="ONE">ONE</option>
                    <option value="Maersk">Maersk</option>
                    <option value="CMA CGM">CMA CGM</option>
                    <option value="PIL">PIL</option>
                    <option value="MSC">MSC</option>
                    <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono mb-1" style={{ color: textMuted }}>
                    Depot Station Code:
                  </label>
                  <select
                    value={newDepot}
                    onChange={(e) => setNewDepot(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border outline-hidden font-mono"
                    style={{ backgroundColor: inputBg, borderColor: borderCol, color: textDark }}
                  >
                    <option value="BAKHRE30">BAKHRE30 (BAK Logistics)</option>
                    <option value="ALRHRE31">ALRHRE31 (ALRO Depot)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono mb-1" style={{ color: textMuted }}>
                  Damage Category & Standard Tariff:
                </label>
                <select
                  value={newDamageTariffId}
                  onChange={(e) => setNewDamageTariffId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border outline-hidden font-medium"
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: textDark }}
                >
                  {STANDARD_REPAIR_TARIFFS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.component} — ${t.totalStandardUsd.toFixed(2)} USD ({t.standardHours} hrs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono mb-1" style={{ color: textMuted }}>
                  Priority Level:
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-xl border outline-hidden"
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: textDark }}
                >
                  <option value="Routine">Routine Depot Maintenance</option>
                  <option value="Urgent / Vessel Export">Urgent / Required for Vessel Export Loading</option>
                  <option value="Safety Critical">Safety Critical (Do Not Move)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono mb-1" style={{ color: textMuted }}>
                  Survey Inspector Remarks:
                </label>
                <textarea
                  rows={2}
                  value={newDamageRemarks}
                  onChange={(e) => setNewDamageRemarks(e.target.value)}
                  placeholder="Detail damage location, dent measurement or hole dimensions..."
                  className="w-full text-xs p-2.5 rounded-xl border outline-hidden resize-none"
                  style={{ backgroundColor: inputBg, borderColor: borderCol, color: textDark }}
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t flex justify-end gap-2 bg-black/5 dark:bg-black/20" style={{ borderColor: borderCol }}>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer hover:bg-black/5"
                style={{ borderColor: borderCol, color: textDark }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewTicket}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 cursor-pointer shadow-xs"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
