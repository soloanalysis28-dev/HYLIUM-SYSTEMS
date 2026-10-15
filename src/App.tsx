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
import { ContainerItem, ContainerLocation, OutboundWebhook, YardCrane } from './types/depot';
import { HyliumSidebar, HyliumNavId } from './components/HyliumSidebar';
import { HyliumHeader } from './components/HyliumHeader';
import { HyliumHomeDashboard } from './components/HyliumHomeDashboard';
import { HyliumStockControlView } from './components/HyliumStockControlView';
import { HyliumReportsView } from './components/HyliumReportsView';
import { HyliumSettingsView } from './components/HyliumSettingsView';
import { YardTrackerView } from './components/YardTrackerView';
import { InventoryLogsView } from './components/InventoryLogsView';
import { GateStationView } from './components/GateStationView';
import { LogisticsApiGateway } from './components/LogisticsApiGateway';
import { ContainerDetailModal } from './components/ContainerDetailModal';
import { QuickMoveModal } from './components/QuickMoveModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';

export default function App() {
  // Theme state: defaults to false (Light mode as in mockup 1) or true (Dark mode as in mockup 2)
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<HyliumNavId>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Core Data State - pre-populated with real extracted ONE containers
  const [containers, setContainers] = useState<ContainerItem[]>(INITIAL_CONTAINERS);
  const [zones] = useState(INITIAL_YARD_ZONES);
  const [cranes, setCranes] = useState<YardCrane[]>(INITIAL_CRANES);
  const [providers] = useState(INITIAL_LOGISTICS_PROVIDERS);
  const [webhooks, setWebhooks] = useState<OutboundWebhook[]>(INITIAL_WEBHOOKS);

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
    showToast(`Container ${newContainer.formattedId} registered via Gate In.`);
  };

  const handleGateOutSuccess = (containerId: string, truckOut: string) => {
    setContainers((prev) =>
      prev.map((c) =>
        c.id === containerId
          ? {
              ...c,
              status: 'Gate Out',
              truckPlateOut: truckOut,
              events: [
                ...c.events,
                {
                  id: `EV-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  action: 'Gate Out Release',
                  locationText: 'Depot Gate Lane 03 (Outbound)',
                  operator: `Gate Officer (Hauler: ${truckOut})`,
                  details: 'Demurrage settled. Outbound EIR signed. Container dispatched.'
                }
              ]
            }
          : c
      )
    );
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
      case 'dispatch':
        return { title: 'Dispatch' };
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
              onNavigateToOperations={() => setCurrentTab('operations')}
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
              onSelectContainer={setSelectedContainer}
              onRequestMove={setMoveTargetContainer}
            />
          )}

          {currentTab === 'dispatch' && (
            <GateStationView
              containers={containers}
              zones={zones}
              onGateInSuccess={handleGateInSuccess}
              onGateOutSuccess={handleGateOutSuccess}
            />
          )}

          {currentTab === 'stock-control' && (
            <HyliumStockControlView
              isDark={isDark}
              containers={containers}
              zones={zones}
              depotCapacityTeu={depotCapacityTeu}
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
              onShowToast={showToast}
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
    </div>
  );
}
