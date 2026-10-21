/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  INITIAL_CONTAINERS, 
  INITIAL_YARD_ZONES, 
  INITIAL_CRANES, 
  INITIAL_LOGISTICS_PROVIDERS, 
  INITIAL_WEBHOOKS 
} from './data/mockDepotData';
import { 
  ContainerItem, 
  ContainerLocation, 
  OutboundWebhook, 
  YardCrane, 
  ContainerTypeCode, 
  DEFAULT_ENABLED_CONTAINER_TYPES, 
  CONTAINER_TYPOLOGY_SPECS,
  MovementTransaction,
  RepairWorkOrder,
  ConsoleEdition
} from './types/depot';
import { INITIAL_MOVEMENT_TRANSACTIONS, INITIAL_REPAIR_WORK_ORDERS } from './data/operationsData';
import { calculateRealTimeDwellDays } from './utils/dwell';
import { HyliumSidebar, HyliumNavId } from './components/HyliumSidebar';
import { HyliumHeader } from './components/HyliumHeader';
import { HyliumHomeDashboard } from './components/HyliumHomeDashboard';
import { HyliumStockControlView } from './components/HyliumStockControlView';
import { HyliumReportsView } from './components/HyliumReportsView';
import { HyliumSettingsView } from './components/HyliumSettingsView';
import { YardTrackerView } from './components/YardTrackerView';
import { InventoryLogsView } from './components/InventoryLogsView';
import { GateStationView } from './components/GateStationView';
import { MovementLedgerView } from './components/MovementLedgerView';
import { MnrWorkshopView } from './components/MnrWorkshopView';
import { LogisticsApiGateway } from './components/LogisticsApiGateway';
import { ContainerDetailModal } from './components/ContainerDetailModal';
import { QuickMoveModal } from './components/QuickMoveModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { HyliumSplashScreen } from './components/HyliumSplashScreen';
import { WindowsSetupWizardModal } from './components/WindowsSetupWizardModal';

export default function App() {
  // Splash Screen State: Displays on app startup
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Theme state: defaults to false (Light mode as in mockup 1) or true (Dark mode as in mockup 2)
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<HyliumNavId>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Console Edition Setup Fork: 'admin' (Level 5) vs 'client' (Level 2)
  const [consoleEdition, setConsoleEdition] = useState<ConsoleEdition>(() => {
    try {
      const saved = localStorage.getItem('hylium_console_edition');
      return saved === 'client' ? 'client' : 'admin';
    } catch {
      return 'admin';
    }
  });
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState<boolean>(false);

  const handleSelectConsoleEdition = (edition: ConsoleEdition) => {
    setConsoleEdition(edition);
    try {
      localStorage.setItem('hylium_console_edition', edition);
    } catch {
      // fallback
    }
  };

  // Depot Capacity Configured in Settings (TEU)
  const [depotCapacityTeu, setDepotCapacityTeu] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hylium_depot_capacity_teu');
      return saved ? parseInt(saved, 10) : 275;
    } catch {
      return 275;
    }
  });

  const handleUpdateDepotCapacity = (newCap: number) => {
    setDepotCapacityTeu(newCap);
    try {
      localStorage.setItem('hylium_depot_capacity_teu', String(newCap));
    } catch {
      // fallback
    }
  };

  // Container Typologies Configured in Settings (Defaults strictly to 40HC, 40GP/GP, and 20S)
  const [enabledContainerTypes, setEnabledContainerTypes] = useState<ContainerTypeCode[]>(() => {
    try {
      const saved = localStorage.getItem('hylium_enabled_container_types');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_ENABLED_CONTAINER_TYPES;
    } catch {
      return DEFAULT_ENABLED_CONTAINER_TYPES;
    }
  });

  const handleToggleContainerType = (code: ContainerTypeCode) => {
    setEnabledContainerTypes((prev) => {
      let updated: ContainerTypeCode[];
      if (prev.includes(code)) {
        if (prev.length <= 1) {
          showToast('At least one container typology must remain active.');
          return prev;
        }
        updated = prev.filter((t) => t !== code);
      } else {
        updated = [...prev, code];
      }
      try {
        localStorage.setItem('hylium_enabled_container_types', JSON.stringify(updated));
      } catch {
        // fallback
      }
      return updated;
    });
  };

  const handleResetContainerTypes = (toAll: boolean = false) => {
    const target = toAll ? CONTAINER_TYPOLOGY_SPECS.map((s) => s.code) : DEFAULT_ENABLED_CONTAINER_TYPES;
    setEnabledContainerTypes(target);
    try {
      localStorage.setItem('hylium_enabled_container_types', JSON.stringify(target));
    } catch {
      // fallback
    }
    showToast(toAll ? 'All 11 ISO container typologies enabled.' : 'Reset to core default fleet (40HC, GP, and 20S).');
  };

  // Live Real-Time Clock state (drives live dwell computation across the depot)
  const [currentRealTime, setCurrentRealTime] = useState<Date>(() => new Date());

  // Core Data State - pre-populated with real extracted ONE containers with real-time computed dwell
  const [containers, setContainers] = useState<ContainerItem[]>(() => {
    const nowMs = Date.now();
    return INITIAL_CONTAINERS.map((c) => ({
      ...c,
      dwellDays: calculateRealTimeDwellDays(c.entryTimestamp, c.exitTimestamp, nowMs)
    }));
  });

  // Real-time synchronization ticker: updates live system clock and recalculates dwell days
  useEffect(() => {
    const ticker = setInterval(() => {
      const now = new Date();
      setCurrentRealTime(now);
      const currentTimeMs = now.getTime();

      setContainers((prev) => {
        let changed = false;
        const updated = prev.map((c) => {
          const freshDwell = calculateRealTimeDwellDays(c.entryTimestamp, c.exitTimestamp, currentTimeMs);
          if (c.dwellDays !== freshDwell) {
            changed = true;
            return { ...c, dwellDays: freshDwell };
          }
          return c;
        });
        return changed ? updated : prev;
      });
    }, 1000); // One-second ticker keeps the live clock visibly current

    // Immediate sync on window focus or tab visibility change
    const handleSync = () => {
      const now = new Date();
      setCurrentRealTime(now);
      const currentTimeMs = now.getTime();
      setContainers((prev) =>
        prev.map((c) => {
          const freshDwell = calculateRealTimeDwellDays(c.entryTimestamp, c.exitTimestamp, currentTimeMs);
          return c.dwellDays === freshDwell ? c : { ...c, dwellDays: freshDwell };
        })
      );
    };

    window.addEventListener('focus', handleSync);
    window.addEventListener('visibilitychange', handleSync);

    return () => {
      clearInterval(ticker);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('visibilitychange', handleSync);
    };
  }, []);

  const [zones] = useState(INITIAL_YARD_ZONES);
  const [cranes, setCranes] = useState<YardCrane[]>(INITIAL_CRANES);
  const [providers] = useState(INITIAL_LOGISTICS_PROVIDERS);
  const [webhooks, setWebhooks] = useState<OutboundWebhook[]>(INITIAL_WEBHOOKS);

  // Operations: Movement Transactions Ledger & M&R Work Orders
  const [movementTransactions, setMovementTransactions] = useState<MovementTransaction[]>(INITIAL_MOVEMENT_TRANSACTIONS);
  const [repairWorkOrders, setRepairWorkOrders] = useState<RepairWorkOrder[]>(INITIAL_REPAIR_WORK_ORDERS);

  // Compute total yard TEU and dynamic utilisation percentage
  const currentTotalTeu = useMemo(() => {
    return containers
      .filter((c) => c.status === 'In Yard')
      .reduce((sum, c) => {
        if (c.isoType === '40HC' || c.isoType === '40GP' || c.isoType === '40RF' || c.isoType === '40FR' || c.isoType === '40OT') return sum + 2;
        if (c.isoType === '45HC') return sum + 2.25;
        return sum + 1; // 20GP, 20ST, 20RF, 20OT, 20FR, 20TK
      }, 0);
  }, [containers]);

  const utilisationPercent = useMemo(() => {
    return depotCapacityTeu > 0 
      ? Math.min(100, Math.round((currentTotalTeu / depotCapacityTeu) * 100))
      : 0;
  }, [currentTotalTeu, depotCapacityTeu]);

  // Modals
  const [selectedContainer, setSelectedContainer] = useState<ContainerItem | null>(null);
  const [moveTargetContainer, setMoveTargetContainer] = useState<ContainerItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for Gate & Yard actions
  const handleGateInSuccess = (newContainer: ContainerItem) => {
    setContainers((prev) => [newContainer, ...prev]);
    setCranes((prev) =>
      prev.map((cr) =>
        cr.currentZone === newContainer.location.zone
          ? { ...cr, totalMovesToday: cr.totalMovesToday + 1, currentBay: newContainer.location.bay }
          : cr
      )
    );

    // Record into Live Movement Ledger
    const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const newTrx: MovementTransaction = {
      id: `TRX-${Date.now()}`,
      type: 'GATE_IN',
      timestamp: new Date().toISOString(),
      monthKey,
      receiptOrBookingRef: newContainer.bookingReference || `OCT${Math.floor(1000 + Math.random() * 9000)}`,
      eirNumber: `EIR-IN-${Date.now().toString().slice(-6)}`,
      containerId: newContainer.id,
      formattedId: newContainer.formattedId,
      shippingLine: newContainer.shippingLine,
      isoType: newContainer.isoType,
      containerSize: newContainer.isoType.startsWith('20') ? '20ft' : '40ft',
      loadStatus: (newContainer.loadType === 'Full' || newContainer.status === 'In Yard') ? 'Full' : 'Empty',
      depotCode: newContainer.depotCode || 'BAKHRE30',
      transportMode: 'Truck',
      vehiclePlate: newContainer.truckPlateIn || 'ABG-8821',
      driverName: 'Driver Recorded at Gate',
      driverId: 'ZW-ID-VERIFIED',
      transporterCompany: 'Commercial Carrier Haulage',
      tareWeightKg: newContainer.tareWeightKg,
      grossWeightKg: newContainer.grossWeightKg,
      sealNumber: newContainer.sealNumber,
      surveyCondition: newContainer.lastInspection.condition,
      yardLocation: `Zone ${newContainer.location.zone} Bay ${newContainer.location.bay}`,
      operator: 'Depot Gate Officer',
      notes: 'Live gate-in receipt processed.'
    };
    setMovementTransactions((prev) => [newTrx, ...prev]);

    showToast(`Container ${newContainer.formattedId} registered via Gate In.`);
  };

  const handleGateOutSuccess = (
    containerId: string,
    truckOut: string,
    releaseDetails?: { dispatchReference: string; driverName: string; driverId: string }
  ) => {
    const exitTimestamp = new Date().toISOString();
    const target = containers.find((c) => c.id === containerId);

    setContainers((prev) =>
      prev.map((c) =>
        c.id === containerId
          ? {
              ...c,
              status: 'Gate Out',
              truckPlateOut: truckOut,
              exitTimestamp,
              dwellDays: calculateRealTimeDwellDays(c.entryTimestamp, exitTimestamp),
              events: [
                ...c.events,
                {
                  id: `EV-${Date.now()}`,
                  timestamp: exitTimestamp,
                  action: 'Gate Out Release',
                  locationText: 'Depot Gate Lane 03 (Outbound)',
                  operator: `Gate Officer (Hauler: ${truckOut})`,
                  details: `Dispatch ${releaseDetails?.dispatchReference ?? 'release'} completed. Driver: ${releaseDetails?.driverName ?? 'Not recorded'} (${releaseDetails?.driverId ?? 'No ID'}). Demurrage settled. Outbound EIR signed. Container dispatched.`
                }
              ]
            }
          : c
      )
    );

    // Record into Live Movement Ledger
    if (target) {
      const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const newOutTrx: MovementTransaction = {
        id: `TRX-${Date.now()}`,
        type: 'GATE_OUT',
        timestamp: exitTimestamp,
        monthKey,
        receiptOrBookingRef: releaseDetails?.dispatchReference || 'DO-RELEASE',
        eirNumber: `EIR-OUT-${Date.now().toString().slice(-6)}`,
        containerId: target.id,
        formattedId: target.formattedId,
        shippingLine: target.shippingLine,
        isoType: target.isoType,
        containerSize: target.isoType.startsWith('20') ? '20ft' : '40ft',
        loadStatus: 'Full',
        depotCode: target.depotCode || 'BAKHRE30',
        transportMode: 'Truck',
        vehiclePlate: truckOut,
        driverName: releaseDetails?.driverName || 'Dispatch Driver',
        driverId: releaseDetails?.driverId || 'ZW-ID-DISPATCH',
        transporterCompany: 'Swift Logistics Southern Africa',
        tareWeightKg: target.tareWeightKg,
        grossWeightKg: target.grossWeightKg,
        sealNumber: target.sealNumber,
        surveyCondition: 'Outbound Gate Release Verified',
        yardLocation: `Zone ${target.location.zone} Bay ${target.location.bay}`,
        operator: 'Outbound Gate Officer',
        notes: `Container release reference: ${releaseDetails?.dispatchReference || 'N/A'}`
      };
      setMovementTransactions((prev) => [newOutTrx, ...prev]);
    }

    showToast(`Container ${containerId} successfully dispatched and gated out.`);
  };

  const handleExecuteMove = (
    containerId: string,
    from: ContainerLocation,
    to: ContainerLocation,
    craneId: string
  ) => {
    setContainers((prev) =>
      prev.map((c) =>
        c.id === containerId
          ? {
              ...c,
              location: to,
              events: [
                ...c.events,
                {
                  id: `EV-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  action: 'Crane Stack Relocation',
                  locationText: `Zone ${to.zone} Bay ${String(to.bay).padStart(2, '0')}`,
                  operator: `Crane ${craneId}`,
                  details: `Shifted from Z${from.zone}-B${from.bay}-R${from.row}-T${from.tier} to Z${to.zone}-B${to.bay}-R${to.row}-T${to.tier}.`
                }
              ]
            }
          : c
      )
    );

    setCranes((prev) =>
      prev.map((cr) =>
        cr.id === craneId
          ? { ...cr, currentZone: to.zone, currentBay: to.bay, totalMovesToday: cr.totalMovesToday + 1 }
          : cr
      )
    );

    showToast(`Crane ${craneId} relocated ${containerId} to Z${to.zone}-B${to.bay}-R${to.row}-T${to.tier}.`);
  };

  const handleTriggerWebhook = (whk: OutboundWebhook) => {
    setWebhooks((prev) => [whk, ...prev]);
    showToast(`Webhook ${whk.event} dispatched with HTTP 200 response.`);
  };

  // Header Titles based on active tab
  const getHeaderInfo = () => {
    switch (currentTab) {
      case 'home':
        return { title: 'Home' };
      case 'operations':
        return { title: 'Operations' };
      case 'inventory':
        return { title: 'Inventory' };
      case 'receive':
        return { title: 'Receive (Gate In)' };
      case 'dispatch':
        return { title: 'Dispatch (Gate Out)' };
      case 'transactions':
        return { title: 'Movement Ledger & Audit' };
      case 'mnr':
        return { title: 'MNR Workshop & Repair Billing' };
      case 'stock-control':
        return { title: 'Stock Control' };
      case 'insights':
        return { title: 'Insights' };
      case 'reports':
        return { title: 'Reports' };
      case 'settings':
        return { title: 'Settings' };
      default:
        return { title: 'Home' };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div 
      className="h-screen w-screen overflow-hidden flex transition-colors duration-200 font-sans"
      style={{
        backgroundColor: isDark ? '#0D1720' : '#F4F7F8',
        color: isDark ? '#EAF5F5' : '#17324A'
      }}
    >
      {/* 1. Hylium Sidebar - Fixed height and stays pinned when main content scrolls */}
      <HyliumSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isDark={isDark}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* 2. Main Scrollable Viewport - Scrolling here does not move the sidebar */}
      <div className="flex-1 h-full overflow-y-auto overflow-x-hidden flex flex-col min-w-0">
        <main className="flex-1 p-5 sm:p-7 md:p-8 space-y-6 max-w-7xl w-full mx-auto pb-16">
          {/* Header Bar - Clean single title and controls */}
          <HyliumHeader
            title={headerInfo.title}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isDark={isDark}
            onToggleTheme={() => setIsDark(!isDark)}
            onOpenCommandPalette={() => setIsSearchOpen(true)}
            currentRealTime={currentRealTime}
            consoleEdition={consoleEdition}
            onOpenSetupWizard={() => setIsSetupWizardOpen(true)}
          />

          {/* Toast Notification */}
          {toastMessage && (
            <div 
              className="px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs transition-all border"
              style={{
                backgroundColor: isDark ? '#123D3B' : '#E8F8F5',
                color: isDark ? '#53D0BC' : '#128B7B',
                borderColor: isDark ? '#18B7A0' : '#DDEDEA'
              }}
            >
              <span>{toastMessage}</span>
              <button 
                type="button"
                onClick={() => setToastMessage(null)}
                className="opacity-70 hover:opacity-100 font-bold ml-3 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Tab Content */}
          {currentTab === 'home' && (
            <HyliumHomeDashboard
              isDark={isDark}
              onNavigateToReceive={() => setCurrentTab('receive')}
              onNavigateToDispatch={() => setCurrentTab('dispatch')}
              onNavigateToInventory={() => setCurrentTab('inventory')}
              onNavigateToReports={() => setCurrentTab('reports')}
              totalStock={containers.length}
              oneContainersCount={containers.length}
              utilisationPercent={utilisationPercent}
              depotCapacityTeu={depotCapacityTeu}
            />
          )}

          {currentTab === 'operations' && (
            <YardTrackerView
              zones={zones}
              containers={containers}
              cranes={cranes}
              onSelectContainer={setSelectedContainer}
              onRequestMove={setMoveTargetContainer}
              isDark={isDark}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryLogsView
              isDark={isDark}
              externalSearchQuery={searchQuery}
              containers={containers}
              enabledContainerTypes={enabledContainerTypes}
              onSelectContainer={setSelectedContainer}
              onRequestMove={setMoveTargetContainer}
            />
          )}

          {(currentTab === 'receive' || currentTab === 'dispatch') && (
            <GateStationView
              key={currentTab}
              containers={containers}
              zones={zones}
              isDark={isDark}
              initialLane={currentTab === 'dispatch' ? 'OUT' : 'IN'}
              onGateInSuccess={handleGateInSuccess}
              onGateOutSuccess={handleGateOutSuccess}
              onNavigateToInventory={() => setCurrentTab('inventory')}
            />
          )}

          {currentTab === 'transactions' && (
            <MovementLedgerView
              transactions={movementTransactions}
              isDark={isDark}
              onNavigateToReceive={() => setCurrentTab('receive')}
              onNavigateToDispatch={() => setCurrentTab('dispatch')}
            />
          )}

          {currentTab === 'mnr' && (
            <MnrWorkshopView
              workOrders={repairWorkOrders}
              containers={containers}
              isDark={isDark}
              onUpdateWorkOrders={setRepairWorkOrders}
              onShowToast={showToast}
            />
          )}

          {currentTab === 'stock-control' && (
            <HyliumStockControlView
              isDark={isDark}
              containers={containers}
              zones={zones}
              depotCapacityTeu={depotCapacityTeu}
              enabledContainerTypes={enabledContainerTypes}
              onSelectContainer={setSelectedContainer}
              onRequestMove={setMoveTargetContainer}
              onNavigateToSettings={() => setCurrentTab('settings')}
            />
          )}

          {currentTab === 'insights' && (
            <LogisticsApiGateway
              providers={providers}
              webhooks={webhooks}
              onTriggerWebhook={handleTriggerWebhook}
            />
          )}

          {currentTab === 'reports' && (
            <HyliumReportsView isDark={isDark} />
          )}

          {currentTab === 'settings' && (
            <HyliumSettingsView 
              isDark={isDark}
              depotCapacityTeu={depotCapacityTeu}
              onUpdateDepotCapacity={handleUpdateDepotCapacity}
              containers={containers}
              enabledContainerTypes={enabledContainerTypes}
              onToggleContainerType={handleToggleContainerType}
              onResetContainerTypes={handleResetContainerTypes}
              onShowToast={showToast}
              onReplaySplash={() => setShowSplash(true)}
            />
          )}
        </main>
      </div>

      {/* Interactive Modals */}
      <ContainerDetailModal
        container={selectedContainer}
        onClose={() => setSelectedContainer(null)}
        onRequestMove={(c) => {
          setSelectedContainer(null);
          setMoveTargetContainer(c);
        }}
      />

      <QuickMoveModal
        container={moveTargetContainer}
        zones={zones}
        cranes={cranes}
        allContainers={containers}
        onClose={() => setMoveTargetContainer(null)}
        onExecuteMove={handleExecuteMove}
      />

      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        containers={containers.filter((c) => c.status === 'In Yard')}
        onSelectContainer={setSelectedContainer}
        onRequestMove={setMoveTargetContainer}
      />

      {/* Windows Native setup.exe Dual Fork Installer Wizard Modal */}
      <WindowsSetupWizardModal
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        currentEdition={consoleEdition}
        onSelectEdition={handleSelectConsoleEdition}
        isDark={isDark}
        onShowToast={showToast}
      />

      {/* Hylium Systems Animated Splash Screen */}
      {showSplash && (
        <HyliumSplashScreen
          onComplete={() => setShowSplash(false)}
        />
      )}
    </div>
  );
}
