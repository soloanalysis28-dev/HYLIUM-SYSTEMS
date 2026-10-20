import React, { useState } from 'react';
import { HyliumLogo } from './HyliumLogo';
import { 
  CheckCircle2, 
  Layers, 
  Package, 
  SlidersHorizontal, 
  Activity, 
  FileText, 
  Settings, 
  ChevronDown,
  ChevronRight,
  PanelLeftClose
} from 'lucide-react';

export type HyliumNavId = 
  | 'home' 
  | 'operations' 
  | 'inventory' 
  | 'receive'
  | 'dispatch' 
  | 'stock-control' 
  | 'insights' 
  | 'reports' 
  | 'settings';

interface HyliumSidebarProps {
  currentTab: HyliumNavId;
  onSelectTab: (tab: HyliumNavId) => void;
  isDark: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const HyliumSidebar: React.FC<HyliumSidebarProps> = ({
  currentTab,
  onSelectTab,
  isDark,
  isCollapsed,
  onToggleCollapse
}) => {
  const [operationsExpanded, setOperationsExpanded] = useState<boolean>(true);

  // Theme-aware tokens matching the Hylium mockups
  const sidebarBg = isDark ? '#101E28' : '#FFFFFF';
  const sidebarBorder = isDark ? '#243743' : '#E6EDF0';
  const textMuted = isDark ? '#91A8B5' : '#7B8C9D';
  const textMuted2 = isDark ? '#718B99' : '#8AA0AE';
  const hoverBg = isDark ? '#182C37' : '#F0F5F6';
  
  // Active pill style
  const activeBg = isDark ? '#123D3B' : '#E8F8F5';
  const activeText = isDark ? '#53D0BC' : '#128B7B';
  const activeBorder = '#18B7A0';

  const navItems = [
    {
      id: 'home' as HyliumNavId,
      label: 'Home',
      icon: CheckCircle2,
      hasSubmenu: false
    },
    {
      id: 'operations' as HyliumNavId,
      label: 'Operations',
      icon: Layers,
      hasSubmenu: true,
      subItems: [
        { id: 'operations' as HyliumNavId, label: 'Yard Stacking' },
        { id: 'receive' as HyliumNavId, label: 'Receive (Gate In)' },
        { id: 'stock-control' as HyliumNavId, label: 'Stock Buffer' }
      ]
    },
    {
      id: 'inventory' as HyliumNavId,
      label: 'Inventory',
      icon: Package,
      hasSubmenu: false
    },
    {
      id: 'stock-control' as HyliumNavId,
      label: 'Stock Control',
      icon: SlidersHorizontal,
      hasSubmenu: false
    },
    {
      id: 'insights' as HyliumNavId,
      label: 'Insights',
      icon: Activity,
      hasSubmenu: false
    },
    {
      id: 'reports' as HyliumNavId,
      label: 'Reports',
      icon: FileText,
      hasSubmenu: false
    }
  ];

  return (
    <aside 
      className={`h-full shrink-0 select-none flex flex-col justify-between border-r transition-all duration-200 ease-in-out z-30 ${
        isCollapsed ? 'w-[72px]' : 'w-[256px]'
      }`}
      style={{
        backgroundColor: sidebarBg,
        borderColor: sidebarBorder
      }}
    >
      {/* Upper Navigation Area */}
      <div className={`flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'p-2' : 'p-3.5 sm:p-4'}`}>
        {/* Brand Row / Header */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between pb-6 pt-1 px-1">
            <div 
              onClick={() => onSelectTab('home')}
              className="cursor-pointer"
            >
              <HyliumLogo isDark={isDark} size="md" />
            </div>

            {/* Dock / Collapse Button */}
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Dock sidebar menu"
              aria-label="Dock sidebar"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              style={{
                backgroundColor: isDark ? '#192B36' : '#F0F5F6',
                color: isDark ? '#91A8B5' : '#527083',
                border: `1px solid ${isDark ? '#2A404C' : '#E1EAED'}`
              }}
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* DOCKED STATE: ONLY THE LOGO IS LEFT AS REQUESTED */
          <div className="flex flex-col items-center justify-center pb-5 pt-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="relative p-1 rounded-2xl transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer group flex items-center justify-center"
              title="Hylium Systems (Click to expand sidebar)"
              aria-label="Expand sidebar"
            >
              <HyliumLogo isDark={isDark} size="md" iconOnly />

              {/* Floating Tooltip */}
              <div 
                className="absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md border"
                style={{
                  backgroundColor: isDark ? '#192B36' : '#FFFFFF',
                  color: isDark ? '#EAF5F5' : '#17324A',
                  borderColor: isDark ? '#2A404C' : '#E1EAED'
                }}
              >
                Expand sidebar
              </div>
            </button>
          </div>
        )}

        {/* Workspace Label - only shown when expanded */}
        {!isCollapsed && (
          <div 
            className="text-[11px] font-bold tracking-[0.14em] uppercase px-3 pb-2 pt-1 font-mono"
            style={{ color: textMuted2 }}
          >
            WORKSPACE
          </div>
        )}

        {/* Navigation Items List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            if (isCollapsed) {
              // Docked item: Icon only with floating hover tooltip
              return (
                <div key={item.id} className="relative group flex justify-center">
                  <button
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    aria-label={item.label}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer relative"
                    style={{
                      backgroundColor: isActive ? activeBg : 'transparent',
                      color: isActive ? activeText : textMuted
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    {isActive && (
                      <span 
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-md"
                        style={{ backgroundColor: activeBorder }}
                      />
                    )}
                  </button>

                  {/* Tooltip on hover when docked */}
                  <div 
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md border"
                    style={{
                      backgroundColor: isDark ? '#192B36' : '#FFFFFF',
                      color: isDark ? '#EAF5F5' : '#17324A',
                      borderColor: isDark ? '#2A404C' : '#E1EAED'
                    }}
                  >
                    {item.label}
                  </div>
                </div>
              );
            }

            // Expanded mode item
            return (
              <div key={item.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (item.hasSubmenu) {
                      setOperationsExpanded(!operationsExpanded);
                      onSelectTab(item.id);
                    } else {
                      onSelectTab(item.id);
                    }
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer"
                  style={{
                    backgroundColor: isActive ? activeBg : 'transparent',
                    color: isActive ? activeText : textMuted
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? activeText : textMuted }} />
                    <span 
                      className={`truncate text-[13px] ${isActive ? 'font-bold' : 'font-medium'}`}
                      style={{ color: isActive ? activeText : (isDark ? '#EAF5F5' : '#17324A') }}
                    >
                      {item.label}
                    </span>
                  </div>

                  {item.hasSubmenu && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOperationsExpanded(!operationsExpanded);
                      }}
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      {operationsExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </div>
                  )}
                </button>

                {/* Submenu for Operations */}
                {item.hasSubmenu && operationsExpanded && item.subItems && (
                  <div 
                    className="ml-7 pl-3 my-1 space-y-1 border-l"
                    style={{ borderColor: isDark ? '#243743' : '#E6EDF0' }}
                  >
                    {item.subItems.map((sub) => {
                      const isSubActive = currentTab === sub.id;
                      return (
                        <button
                          key={sub.label}
                          type="button"
                          onClick={() => onSelectTab(sub.id)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            color: isSubActive ? activeText : textMuted,
                            backgroundColor: isSubActive ? (isDark ? '#142E32' : '#EFF9F7') : 'transparent'
                          }}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer / Settings Section */}
      <div 
        className={`${isCollapsed ? 'p-2' : 'p-3'} border-t shrink-0`}
        style={{ borderColor: sidebarBorder }}
      >
        <div className="relative group flex justify-center">
          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            aria-label="Settings"
            className={`flex items-center rounded-xl font-medium text-xs transition-colors cursor-pointer ${
              isCollapsed ? 'w-11 h-11 justify-center' : 'w-full px-3 py-2.5 gap-3'
            }`}
            style={{
              backgroundColor: currentTab === 'settings' ? activeBg : 'transparent',
              color: currentTab === 'settings' ? activeText : textMuted
            }}
            onMouseEnter={(e) => {
              if (currentTab !== 'settings') e.currentTarget.style.backgroundColor = hoverBg;
            }}
            onMouseLeave={(e) => {
              if (currentTab !== 'settings') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!isCollapsed && (
              <span style={{ color: currentTab === 'settings' ? activeText : (isDark ? '#EAF5F5' : '#17324A') }}>
                Settings
              </span>
            )}
          </button>

          {/* Settings Tooltip when docked */}
          {isCollapsed && (
            <div 
              className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md border"
              style={{
                backgroundColor: isDark ? '#192B36' : '#FFFFFF',
                color: isDark ? '#EAF5F5' : '#17324A',
                borderColor: isDark ? '#2A404C' : '#E1EAED'
              }}
            >
              Settings
            </div>
          )}
        </div>

        {/* Version string - only in expanded mode */}
        {!isCollapsed && (
          <div 
            className="text-[11px] font-mono px-3 pt-3 flex items-center justify-between"
            style={{ color: textMuted2 }}
          >
            <span>Hylium Systems</span>
            <span className="font-semibold">v0.1</span>
          </div>
        )}
      </div>
    </aside>
  );
};
