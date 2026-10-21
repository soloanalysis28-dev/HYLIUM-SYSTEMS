import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Monitor, 
  Server, 
  Check, 
  X, 
  Minus, 
  Square, 
  FolderCheck, 
  FileCode2, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Sliders, 
  FileText, 
  Wrench, 
  RefreshCw,
  Terminal,
  Cpu,
  Layers,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';
import { ConsoleEdition, ClearanceLevelNumber } from '../types/depot';
import { CONSOLE_EDITIONS, CLEARANCE_PERMISSIONS_MATRIX, CLEARANCE_LEVELS_HIERARCHY } from '../data/clearanceData';

interface WindowsSetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEdition: ConsoleEdition;
  onSelectEdition: (edition: ConsoleEdition) => void;
  isDark: boolean;
  onShowToast: (message: string) => void;
}

export const WindowsSetupWizardModal: React.FC<WindowsSetupWizardModalProps> = ({
  isOpen,
  onClose,
  currentEdition,
  onSelectEdition,
  isDark,
  onShowToast
}) => {
  const [selectedFork, setSelectedFork] = useState<ConsoleEdition>(currentEdition);
  const [activeStep, setActiveStep] = useState<'select' | 'clearance-matrix' | 'installing' | 'finished'>('select');
  const [installProgress, setInstallProgress] = useState<number>(0);
  const [installStepLog, setInstallStepLog] = useState<string>('Initializing setup engine...');
  const [showMatrixFilter, setShowMatrixFilter] = useState<string>('All');

  useEffect(() => {
    if (isOpen) {
      setSelectedFork(currentEdition);
      setActiveStep('select');
      setInstallProgress(0);
    }
  }, [isOpen, currentEdition]);

  if (!isOpen) return null;

  const handleStartInstallation = () => {
    setActiveStep('installing');
    setInstallProgress(5);
    setInstallStepLog('Validating Windows architecture: x86_64-pc-windows-msvc...');

    setTimeout(() => {
      setInstallProgress(25);
      setInstallStepLog(
        selectedFork === 'admin' 
          ? 'Allocating C:\\Program Files\\DepotMaster\\AdminConsole...' 
          : 'Allocating C:\\Users\\Default\\AppData\\Local\\DepotMaster\\ClientConsole...'
      );
    }, 450);

    setTimeout(() => {
      setInstallProgress(55);
      setInstallStepLog(
        selectedFork === 'admin'
          ? 'Configuring Level 5 Master Clearance & writing depot_profile.json...'
          : 'Configuring Level 2 Field Operator Clearance & writing depot_profile.json...'
      );
    }, 900);

    setTimeout(() => {
      setInstallProgress(80);
      setInstallStepLog(
        selectedFork === 'admin'
          ? 'Registering HKLM\\SOFTWARE\\DepotMaster and Desktop shortcut (Run as Admin)...'
          : 'Registering HKCU\\SOFTWARE\\DepotMaster and Desktop shortcut...'
      );
    }, 1350);

    setTimeout(() => {
      setInstallProgress(100);
      setInstallStepLog('Installation completed successfully. Launching workstation...');
      setTimeout(() => {
        onSelectEdition(selectedFork);
        setActiveStep('finished');
        onShowToast(
          selectedFork === 'admin'
            ? 'Installed DepotMaster Admin Console (Elevated Level 5 Clearance).'
            : 'Installed DepotMaster Client Console (Level 2 Field Clearance).'
        );
      }, 400);
    }, 1800);
  };

  const handleFinish = () => {
    onClose();
  };

  const adminConfig = CONSOLE_EDITIONS.admin;
  const clientConfig = CONSOLE_EDITIONS.client;

  const filteredMatrix = showMatrixFilter === 'All' 
    ? CLEARANCE_PERMISSIONS_MATRIX 
    : CLEARANCE_PERMISSIONS_MATRIX.filter((m) => m.category === showMatrixFilter);

  const categories = ['All', 'Operations', 'Yard & Inventory', 'Maintenance & Repairs', 'Finance & Invoicing', 'Administration & Security'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl rounded-xl shadow-2xl border overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
        style={{
          backgroundColor: isDark ? '#0D1720' : '#14232E',
          borderColor: isDark ? '#2A404C' : '#334D5C',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Windows Caption Titlebar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950/90 border-b border-slate-800 text-xs select-none">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[9px] font-bold text-amber-400">
              ⚡
            </div>
            <span className="font-semibold text-slate-200">
              DepotMaster Setup Wizard (setup.exe)
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[11px]">
              Windows x86_64 Installation Engine
            </span>
          </div>

          <div className="flex items-center gap-1 -mr-1">
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Minimize"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="w-7 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Maximize"
            >
              <Square className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 rounded transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Wizard Header Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Dual Fork Installer
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Active Console: <strong className={currentEdition === 'admin' ? 'text-emerald-400' : 'text-amber-400'}>{currentEdition === 'admin' ? 'Admin (L5)' : 'Client (L2)'}</strong>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Select Workstation Fork & Clearance Clearance
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Configure this Windows endpoint by selecting between the elevated Administrator Console or the restricted Client Workstation.
            </p>
          </div>

          {/* Step Nav Pills */}
          {activeStep !== 'installing' && activeStep !== 'finished' && (
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setActiveStep('select')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  activeStep === 'select'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                1. Select Fork
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('clearance-matrix')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  activeStep === 'clearance-matrix'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                2. Clearance Matrix
              </button>
            </div>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeStep === 'select' && (
            <div className="space-y-6">
              <div className="text-xs text-slate-300">
                Please select the console edition you want to install on this machine. You can re-run <code className="font-mono text-amber-400">setup.exe</code> or change this setting at any time:
              </div>

              {/* Two Fork Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FORK 1: ADMIN CONSOLE */}
                <div
                  onClick={() => setSelectedFork('admin')}
                  className={`p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    selectedFork === 'admin'
                      ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/40'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {selectedFork === 'admin' && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow">
                      ✓
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-white">
                            Admin Console
                          </h3>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            LEVEL 5
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Master Root Authority & Terminal Management
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {adminConfig.description}
                    </p>

                    <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Included Clearance Capabilities:
                      </span>
                      <ul className="space-y-1 text-slate-300 text-xs">
                        <li className="flex items-center gap-1.5 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Full Gate In/Out, EIR & Yard Relocations</span>
                        </li>
                        <li className="flex items-center gap-1.5 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Depot Stacking Capacity (TEU) & Typologies Tuning</span>
                        </li>
                        <li className="flex items-center gap-1.5 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>IICL M&R Standard Tariffs & Tax Invoicing</span>
                        </li>
                        <li className="flex items-center gap-1.5 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Outbound Webhooks & Cryptographic API Keys</span>
                        </li>
                        <li className="flex items-center gap-1.5 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>System Audit Log Reset & Master Data Purge</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 font-mono text-[10px] text-slate-400 space-y-0.5">
                    <div>Path: <span className="text-slate-300">C:\Program Files\DepotMaster\AdminConsole</span></div>
                    <div>Registry: <span className="text-slate-300">HKLM\SOFTWARE\DepotMaster</span></div>
                  </div>
                </div>

                {/* FORK 2: CLIENT CONSOLE */}
                <div
                  onClick={() => setSelectedFork('client')}
                  className={`p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                    selectedFork === 'client'
                      ? 'border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-950/40'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {selectedFork === 'client' && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow">
                      ✓
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Monitor className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-white">
                            Client Console
                          </h3>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            LEVEL 2
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Field Operator, Gate Booth & Crane Tally
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {clientConfig.description}
                    </p>

                    <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Included Clearance Capabilities:
                      </span>
                      <ul className="space-y-1 text-slate-300 text-xs">
                        <li className="flex items-center gap-1.5 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Fast Gate-In Check-in & Sequence Generation</span>
                        </li>
                        <li className="flex items-center gap-1.5 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Gate-Out Delivery Order Verification & Seal Checks</span>
                        </li>
                        <li className="flex items-center gap-1.5 text-emerald-300">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Yard 2D Stacking & Crane Relocations</span>
                        </li>
                        <li className="flex items-center gap-1.5 text-amber-300/80">
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span>Read-only protection on Tariffs & Invoices</span>
                        </li>
                        <li className="flex items-center gap-1.5 text-amber-300/80">
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span>Capacity & Webhook configuration locked</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 font-mono text-[10px] text-slate-400 space-y-0.5">
                    <div>Path: <span className="text-slate-300">C:\Users\AppData\Local\DepotMaster\ClientConsole</span></div>
                    <div>Registry: <span className="text-slate-300">HKCU\SOFTWARE\DepotMaster</span></div>
                  </div>
                </div>
              </div>

              {/* Target Role Guidance */}
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-100">Which fork should you select?</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Select <strong>Admin Console</strong> if this PC is located in the central dispatch management office, billing department, or operated by depot administrators. Select <strong>Client Console</strong> if deployed on gate tally booths, inspection tablets, or crane cabins to prevent unauthorized alteration of contracted pricing and capacity metrics.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'clearance-matrix' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Clearance Level Permission Comparison
                  </h4>
                  <p className="text-xs text-slate-400">
                    Comparing Level 5 (Admin Console) vs Level 2 (Client Console) capabilities
                  </p>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setShowMatrixFilter(cat)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        showMatrixFilter === cat
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-[11px] font-mono text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Feature & Description</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Admin Console (L5)</th>
                      <th className="py-2.5 px-3 text-center">Client Console (L2)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-sans">
                    {filteredMatrix.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 max-w-sm">
                          <div className="font-semibold text-slate-100">{item.featureName}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{item.description}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {item.category}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                            <span>Level {item.adminMinLevel}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.clientAllowed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <Check className="w-3 h-3" />
                              <span>Level {item.clientMinLevel}</span>
                            </span>
                          ) : (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30"
                              title={item.restrictionReason}
                            >
                              <Lock className="w-3 h-3" />
                              <span>Locked</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 5-Level Clearance Overview */}
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Full 5-Tier Clearance Hierarchy:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
                  {CLEARANCE_LEVELS_HIERARCHY.map((tier) => (
                    <div 
                      key={tier.level}
                      className={`p-2 rounded border ${
                        tier.level === 5
                          ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                          : tier.level === 2
                          ? 'border-amber-500/40 bg-amber-950/20 text-amber-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <div className="font-bold text-[11px]">Level {tier.level}</div>
                      <div className="text-[10px] truncate">{tier.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeStep === 'installing' && (
            <div className="py-8 px-4 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-amber-500/20 border border-amber-500/40 text-amber-400 animate-pulse">
                <Cpu className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">
                  Configuring {selectedFork === 'admin' ? 'Admin Console' : 'Client Console'}...
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {installStepLog}
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${installProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Target: {selectedFork.toUpperCase()}</span>
                  <span>{installProgress}% Complete</span>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'finished' && (
            <div className="py-8 px-4 text-center space-y-5">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">
                  Setup Complete: {selectedFork === 'admin' ? 'Admin Console' : 'Client Console'} Active
                </h3>
                <p className="text-xs text-slate-300 max-w-lg mx-auto">
                  {selectedFork === 'admin'
                    ? 'Elevated Level 5 Clearance granted. All administrative, capacity, webhook, and billing capabilities are active.'
                    : 'Level 2 Field Clearance granted. Gate-In, Gate-Out, and Yard operations are enabled with administrative safeguards applied.'}
                </p>
              </div>

              <div className="inline-block p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 text-left">
                <div>Registry Key: <span className="text-amber-400">{selectedFork === 'admin' ? 'HKLM' : 'HKCU'}\SOFTWARE\DepotMaster</span></div>
                <div>Clearance Level: <span className="text-emerald-400">{selectedFork === 'admin' ? 'Level 5 (Admin)' : 'Level 2 (Client)'}</span></div>
                <div>Shortcut: <span className="text-slate-200">Desktop\DepotMaster {selectedFork === 'admin' ? 'Admin' : 'Client'} Console.lnk</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Rust setup.exe runtime v2.4.0</span>
          </div>

          <div className="flex items-center gap-2">
            {activeStep === 'select' && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartInstallation}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow flex items-center gap-1.5"
                >
                  <span>Install / Apply Fork</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {activeStep === 'clearance-matrix' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveStep('select')}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium transition-colors"
                >
                  Back to Fork Selection
                </button>
                <button
                  type="button"
                  onClick={handleStartInstallation}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow flex items-center gap-1.5"
                >
                  <span>Apply Selected ({selectedFork.toUpperCase()})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {activeStep === 'finished' && (
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors shadow"
              >
                Launch Workstation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
