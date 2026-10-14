/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  INITIAL_CONTAINERS, 
  INITIAL_YARD_ZONES, 
  INITIAL_CRANES, 
  INITIAL_LOGISTICS_PROVIDERS, 
  INITIAL_WEBHOOKS 
} from './data/mockDepotData';
import { ContainerItem, ContainerLocation, OutboundWebhook, YardCrane } from './types/depot';
import { HeaderTitleBar } from './components/HeaderTitleBar';
import { CommandNav, ActiveTab } from './components/CommandNav';
import { YardTrackerView } from './components/YardTrackerView';
import { InventoryLogsView } from './components/InventoryLogsView';
import { GateStationView } from './components/GateStationView';
import { LogisticsApiGateway } from './components/LogisticsApiGateway';
import { RustCodebaseView } from './components/RustCodebaseView';
import { ContainerDetailModal } from './components/ContainerDetailModal';
import { QuickMoveModal } from './components/QuickMoveModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';

export default function App() {
  const [containers, setContainers] = useState<ContainerItem[]>(INITIAL_CONTAINERS);
  const [zones] = useState(INITIAL_YARD_ZONES);
  const [cranes, setCranes] = useState<YardCrane[]>(INITIAL_CRANES);
  const [providers] = useState(INITIAL_LOGISTICS_PROVIDERS);
  const [webhooks, setWebhooks] = useState<OutboundWebhook[]>(INITIAL_WEBHOOKS);

  const [activeTab, setActiveTab] = useState<ActiveTab>('yard');
  const [selectedContainer, setSelectedContainer] = useState<ContainerItem | null>(null);
  const [moveTargetContainer, setMoveTargetContainer] = useState<ContainerItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Keyboard shortcut Ctrl+K
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

  // Compute live yard metrics
  const activeYardContainers = containers.filter((c) => c.status === 'In Yard');
  const totalTeuInYard = activeYardContainers.reduce((sum, c) => sum + c.teu, 0);
  const maxCapacityTeu = zones.reduce((sum, z) => sum + z.totalSlots, 0);
  const reefersCount = activeYardContainers.filter((c) => !!c.reefer).length;
  const hazmatCount = activeYardContainers.filter((c) => !!c.hazardousIMO).length;
  const customsHoldCount = activeYardContainers.filter((c) => c.customsStatus.includes('Held')).length;

  // Gate In Handler
  const handleGateInSuccess = (newContainer: ContainerItem) => {
    setContainers((prev) => [newContainer, ...prev]);
    
    // Increment crane moves
    setCranes((prev) =>
      prev.map((cr) =>
        cr.currentZone === newContainer.location.zone
          ? { ...cr, totalMovesToday: cr.totalMovesToday + 1, currentBay: newContainer.location.bay }
          : cr
      )
    );

    // Log outbound webhook
    const newWhk: OutboundWebhook = {
      id: `WHK-${Date.now()}`,
      event: 'container.gate_in',
      targetUrl: 'https://carrier.freight-hub.com/api/v1/gate_events',
      status: 'Delivered (200)',
      timestamp: new Date().toISOString(),
      responseMs: 54,
      payloadSummary: `Gate In event for ${newContainer.formattedId} (${newContainer.shippingLine}) processed. EIR issued.`
    };
    setWebhooks((prev) => [newWhk, ...prev]);

    showNotification(`Container ${newContainer.formattedId} successfully checked into Yard Zone ${newContainer.location.zone}.`);
  };

  // Gate Out Handler
  const handleGateOutSuccess = (containerId: string, truckOut: string) => {
    setContainers((prev) =>
      prev.map((c) => {
        if (c.id === containerId) {
          return {
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
          };
        }
        return c;
      })
    );

    const released = containers.find((c) => c.id === containerId);
    showNotification(`Container ${released?.formattedId || containerId} successfully dispatched and gated out.`);
  };

  // Crane Move Handler
  const handleExecuteMove = (
    containerId: string,
    from: ContainerLocation,
    to: ContainerLocation,
    craneId: string
  ) => {
    setContainers((prev) =>
      prev.map((c) => {
        if (c.id === containerId) {
          return {
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
          };
        }
        return c;
      })
    );

    // Update crane position & lift count
    setCranes((prev) =>
      prev.map((cr) =>
        cr.id === craneId
          ? {
              ...cr,
              currentZone: to.zone,
              currentBay: to.bay,
              totalMovesToday: cr.totalMovesToday + 1
            }
          : cr
      )
    );

    showNotification(`Crane ${craneId} relocated ${containerId} to Z${to.zone}-B${to.bay}-R${to.row}-T${to.tier}.`);
  };

  const handleTriggerWebhook = (whk: OutboundWebhook) => {
    setWebhooks((prev) => [whk, ...prev]);
    showNotification(`Webhook ${whk.event} dispatched with HTTP 200 response.`);
  };

  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate minor reefer temperature sensor fluctuations (±0.1°C)
      setContainers((prev) =>
        prev.map((c) => {
          if (c.reefer) {
            const jitter = (Math.random() - 0.5) * 0.2;
            return {
              ...c,
              reefer: {
                ...c.reefer,
                actualTempC: Number((c.reefer.actualTempC + jitter).toFixed(1)),
                lastReadingTimestamp: new Date().toISOString()
              }
            };
          }
          return c;
        })
      );
      setIsRefreshing(false);
      showNotification('Telematics synced: 100% of reefer sensors & RTG cranes responding.', 'info');
    }, 600);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans ${isMaximized ? 'p-0' : 'p-1 sm:p-2.5'}`}>
      {/* Windows 11 Fluent App Frame */}
      <div className="flex-1 flex flex-col rounded-lg border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        {/* Windows Header Caption Bar */}
        <HeaderTitleBar
          onOpenSearch={() => setIsSearchOpen(true)}
          teuTotal={totalTeuInYard}
          maxTeuCapacity={maxCapacityTeu}
          isMaximized={isMaximized}
          onToggleMaximize={() => setIsMaximized((prev) => !prev)}
          onRefreshData={handleRefreshData}
          isRefreshing={isRefreshing}
        />

        {/* Command Navigation Bar */}
        <CommandNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          totalContainers={activeYardContainers.length}
          reefersCount={reefersCount}
          hazmatCount={hazmatCount}
          customsHoldCount={customsHoldCount}
        />

        {/* Toast Notification Banner */}
        {notification && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs flex items-center justify-between text-amber-300 font-mono">
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="text-amber-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Workspace Body */}
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto">
          {activeTab === 'yard' && (
            <YardTrackerView
              zones={zones}
              containers={containers}
              cranes={cranes}
              onSelectContainer={setSelectedContainer}
              onRequestMove={setMoveTargetContainer}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryLogsView
              containers={containers}
              onSelectContainer={setSelectedContainer}
              onRequestMove={setMoveTargetContainer}
            />
          )}

          {activeTab === 'gate' && (
            <GateStationView
              containers={containers}
              zones={zones}
              onGateInSuccess={handleGateInSuccess}
              onGateOutSuccess={handleGateOutSuccess}
            />
          )}

          {activeTab === 'logistics' && (
            <LogisticsApiGateway
              providers={providers}
              webhooks={webhooks}
              onTriggerWebhook={handleTriggerWebhook}
            />
          )}

          {activeTab === 'rust' && (
            <RustCodebaseView />
          )}
        </main>
      </div>

      {/* Modals */}
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
        containers={activeYardContainers}
        onSelectContainer={setSelectedContainer}
        onRequestMove={setMoveTargetContainer}
      />
    </div>
  );
}
