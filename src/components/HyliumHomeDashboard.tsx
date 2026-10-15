import React, { useState } from 'react';
import { 
  Plus, 
  ArrowRight, 
  Activity, 
  FileText, 
  Calendar,
  ChevronDown
} from 'lucide-react';

interface HyliumHomeDashboardProps {
  isDark: boolean;
  onNavigateToOperations: () => void;
  onNavigateToDispatch: () => void;
  onNavigateToInventory: () => void;
  onNavigateToReports: () => void;
  totalStock?: number;
  oneContainersCount?: number;
  utilisationPercent?: number;
  depotCapacityTeu?: number;
}

export const HyliumHomeDashboard: React.FC<HyliumHomeDashboardProps> = ({
  isDark,
  onNavigateToOperations,
  onNavigateToDispatch,
  onNavigateToInventory,
  onNavigateToReports,
  totalStock = 154,
  oneContainersCount = 154,
  utilisationPercent = 84,
  depotCapacityTeu = 275
}) => {
  const [timeFilter, setTimeFilter] = useState<'This week' | 'Last 7 days' | 'This month'>('This week');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; value: number; x: number; y: number } | null>(null);

  // 7-day data points matching the SVG curve from Hylium mockup
  const curvePoints = [
    { day: 'Mon', value: 52, x: 45, y: 150 },
    { day: 'Tue', value: 76, x: 125, y: 130 },
    { day: 'Wed', value: 92, x: 205, y: 110 },
    { day: 'Thu', value: 118, x: 285, y: 88 },
    { day: 'Fri', value: 134, x: 365, y: 68 },
    { day: 'Sat', value: 148, x: 445, y: 50 },
    { day: 'Sun', value: 168, x: 525, y: 25 }
  ];

  // Colors aligned with Hylium SVG design
  const cardBg = isDark ? '#14232E' : '#FFFFFF';
  const cardBorder = isDark ? '#2A404C' : '#E1EAED';
  const textPrimary = isDark ? '#EAF5F5' : '#17324A';
  const textMuted = isDark ? '#91A8B5' : '#7B8C9D';
  const textMuted2 = isDark ? '#718B99' : '#8AA0AE';
  const surface2 = isDark ? '#192B36' : '#F0F5F6';

  // KPI Colors
  // Teal
  const tealIconBg = isDark ? '#123D3B' : '#E8F8F5';
  const tealColor = isDark ? '#53D0BC' : '#18B7A0';
  // Blue
  const blueIconBg = isDark ? '#162E4B' : '#EDF3FC';
  const blueColor = isDark ? '#5B9BFF' : '#2D79D8';
  // Amber
  const amberIconBg = isDark ? '#493818' : '#FFF5DE';
  const amberColor = isDark ? '#F1B84B' : '#E49A24';
  // Purple
  const purpleIconBg = isDark ? '#30254A' : '#F0EBFA';
  const purpleColor = isDark ? '#AD8BFF' : '#7757B5';

  // Donut chart math: radius = 64
  const r = 64;
  const circ = 2 * Math.PI * r;
  const completedOffset = 0;
  const completedLength = circ * 0.68;
  const processingOffset = -completedLength;
  const processingLength = circ * 0.21;
  const needsAttentionOffset = -(completedLength + processingLength);
  const needsAttentionLength = circ * 0.11;

  return (
    <div className="space-y-6 select-none">
      {/* 1. Clean Summary Bar & Time Filter */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span 
            className="text-sm sm:text-base font-bold tracking-tight"
            style={{ 
              color: textPrimary,
              fontFamily: "'Space Grotesk', sans-serif" 
            }}
          >
            Today at a glance
          </span>
          <span className="text-xs opacity-40">•</span>
          <span className="text-xs font-mono font-semibold" style={{ color: tealColor }}>
            {oneContainersCount} ONE Active Units
          </span>
        </div>

        {/* Time Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTimeDropdown(!showTimeDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs border"
            style={{
              backgroundColor: surface2,
              borderColor: cardBorder,
              color: textPrimary
            }}
          >
            <Calendar className="w-3.5 h-3.5 text-teal-500" />
            <span>{timeFilter}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {showTimeDropdown && (
            <div 
              className="absolute right-0 mt-1.5 w-36 py-1.5 rounded-xl shadow-lg border z-40"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              {(['This week', 'Last 7 days', 'This month'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setTimeFilter(filter);
                    setShowTimeDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: textPrimary }}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Four Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: RECEIVE */}
        <div 
          onClick={onNavigateToOperations}
          className="p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-xs border group"
          style={{ 
            backgroundColor: cardBg, 
            borderColor: cardBorder 
          }}
        >
          <div className="flex items-center justify-between">
            <span 
              className="text-[11px] font-bold tracking-[0.12em] uppercase font-mono"
              style={{ color: textMuted }}
            >
              RECEIVE
            </span>
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ 
                backgroundColor: tealIconBg,
                color: tealColor
              }}
            >
              <Plus className="w-4 h-4" />
            </div>
          </div>

          <div 
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3"
            style={{ 
              color: textPrimary,
              fontFamily: "'Space Grotesk', sans-serif" 
            }}
          >
            128
          </div>

          <div className="flex items-center justify-between mt-3 text-xs sm:text-[13px]">
            <span style={{ color: textMuted }}>incoming orders</span>
            <span className="font-bold font-mono text-xs" style={{ color: tealColor }}>
              +8.4%
            </span>
          </div>
        </div>

        {/* Card 2: DISPATCH */}
        <div 
          onClick={onNavigateToDispatch}
          className="p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-xs border group"
          style={{ 
            backgroundColor: cardBg, 
            borderColor: cardBorder 
          }}
        >
          <div className="flex items-center justify-between">
            <span 
              className="text-[11px] font-bold tracking-[0.12em] uppercase font-mono"
              style={{ color: textMuted }}
            >
              DISPATCH
            </span>
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ 
                backgroundColor: blueIconBg,
                color: blueColor
              }}
            >
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          <div 
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3"
            style={{ 
              color: textPrimary,
              fontFamily: "'Space Grotesk', sans-serif" 
            }}
          >
            96
          </div>

          <div className="flex items-center justify-between mt-3 text-xs sm:text-[13px]">
            <span style={{ color: textMuted }}>orders shipped</span>
            <span className="font-bold font-mono text-xs" style={{ color: blueColor }}>
              +5.2%
            </span>
          </div>
        </div>

        {/* Card 3: STOCKS */}
        <div 
          onClick={onNavigateToInventory}
          className="p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-xs border group"
          style={{ 
            backgroundColor: cardBg, 
            borderColor: cardBorder 
          }}
        >
          <div className="flex items-center justify-between">
            <span 
              className="text-[11px] font-bold tracking-[0.12em] uppercase font-mono"
              style={{ color: textMuted }}
            >
              STOCKS
            </span>
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ 
                backgroundColor: amberIconBg,
                color: amberColor
              }}
            >
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div 
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3"
            style={{ 
              color: textPrimary,
              fontFamily: "'Space Grotesk', sans-serif" 
            }}
          >
            {utilisationPercent}%
          </div>

          <div className="flex items-center justify-between mt-3 text-xs sm:text-[13px]">
            <span style={{ color: textMuted }}>capacity in use ({depotCapacityTeu} TEU)</span>
            <span className="font-bold font-mono text-xs" style={{ color: amberColor }}>
              Monitor
            </span>
          </div>
        </div>

        {/* Card 4: REPORTS */}
        <div 
          onClick={onNavigateToReports}
          className="p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-xs border group"
          style={{ 
            backgroundColor: cardBg, 
            borderColor: cardBorder 
          }}
        >
          <div className="flex items-center justify-between">
            <span 
              className="text-[11px] font-bold tracking-[0.12em] uppercase font-mono"
              style={{ color: textMuted }}
            >
              REPORTS
            </span>
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ 
                backgroundColor: purpleIconBg,
                color: purpleColor
              }}
            >
              <FileText className="w-4 h-4" />
            </div>
          </div>

          <div 
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3"
            style={{ 
              color: textPrimary,
              fontFamily: "'Space Grotesk', sans-serif" 
            }}
          >
            24
          </div>

          <div className="flex items-center justify-between mt-3 text-xs sm:text-[13px]">
            <span style={{ color: textMuted }}>ready to review</span>
            <span className="font-bold font-mono text-xs" style={{ color: purpleColor }}>
              View all
            </span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Operational activity Chart & Order distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Operational activity line chart */}
        <div 
          className="lg:col-span-7 p-6 rounded-2xl shadow-xs border flex flex-col justify-between"
          style={{ 
            backgroundColor: cardBg, 
            borderColor: cardBorder 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 
                className="text-base sm:text-lg font-bold tracking-tight"
                style={{ 
                  color: textPrimary,
                  fontFamily: "'Space Grotesk', sans-serif" 
                }}
              >
                Operational activity
              </h3>
              <p className="text-xs sm:text-[13px] mt-0.5" style={{ color: textMuted }}>
                Orders processed across the last 7 days
              </p>
            </div>

            <span 
              className="px-2.5 py-1 rounded-lg text-xs font-medium border"
              style={{
                backgroundColor: surface2,
                borderColor: cardBorder,
                color: textMuted
              }}
            >
              Last 7 days
            </span>
          </div>

          {/* SVG Line Chart */}
          <div className="relative mt-6 pt-2 pb-1">
            <svg 
              viewBox="0 0 570 180" 
              className="w-full h-44 overflow-visible"
            >
              <defs>
                <linearGradient id="opLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#18B7A0" />
                  <stop offset="100%" stopColor="#2D79D8" />
                </linearGradient>
                <linearGradient id="opAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#18B7A0" stopOpacity={isDark ? "0.3" : "0.15"} />
                  <stop offset="100%" stopColor="#18B7A0" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              <line x1="30" y1="20" x2="560" y2="20" stroke={isDark ? '#20333F' : '#EAF0F2'} strokeWidth="1" strokeDasharray="3 3" />
              <line x1="30" y1="60" x2="560" y2="60" stroke={isDark ? '#20333F' : '#EAF0F2'} strokeWidth="1" strokeDasharray="3 3" />
              <line x1="30" y1="100" x2="560" y2="100" stroke={isDark ? '#20333F' : '#EAF0F2'} strokeWidth="1" strokeDasharray="3 3" />
              <line x1="30" y1="140" x2="560" y2="140" stroke={isDark ? '#20333F' : '#EAF0F2'} strokeWidth="1" />

              {/* Y-axis Labels */}
              <text x="12" y="24" fill={textMuted2} fontSize="10" fontFamily="'Space Grotesk', sans-serif">160</text>
              <text x="12" y="64" fill={textMuted2} fontSize="10" fontFamily="'Space Grotesk', sans-serif">120</text>
              <text x="12" y="104" fill={textMuted2} fontSize="10" fontFamily="'Space Grotesk', sans-serif">80</text>
              <text x="12" y="144" fill={textMuted2} fontSize="10" fontFamily="'Space Grotesk', sans-serif">40</text>

              {/* Smooth Area Path */}
              <path
                d="M 45 150 C 80 140, 100 135, 125 130 C 160 122, 180 115, 205 110 C 240 102, 260 92, 285 88 C 320 80, 340 72, 365 68 C 400 60, 420 54, 445 50 C 480 40, 500 32, 525 25 L 525 140 L 45 140 Z"
                fill="url(#opAreaGradient)"
              />

              {/* Smooth Line Path */}
              <path
                d="M 45 150 C 80 140, 100 135, 125 130 C 160 122, 180 115, 205 110 C 240 102, 260 92, 285 88 C 320 80, 340 72, 365 68 C 400 60, 420 54, 445 50 C 480 40, 500 32, 525 25"
                fill="none"
                stroke="url(#opLineGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Interactive Dots */}
              {curvePoints.map((pt) => (
                <g key={pt.day}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill={cardBg}
                    stroke={tealColor}
                    strokeWidth="2.5"
                    className="cursor-pointer transition-all hover:r-6"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  <text
                    x={pt.x}
                    y="162"
                    textAnchor="middle"
                    fill={textMuted2}
                    fontSize="11"
                    fontFamily="'Space Grotesk', sans-serif"
                  >
                    {pt.day}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div 
                className="absolute pointer-events-none px-2.5 py-1 rounded-lg text-xs font-mono font-bold shadow-md z-30 -translate-x-1/2 -translate-y-8"
                style={{
                  left: `${(hoveredPoint.x / 570) * 100}%`,
                  top: `${(hoveredPoint.y / 180) * 100}%`,
                  backgroundColor: isDark ? '#192B36' : '#17324A',
                  color: isDark ? '#53D0BC' : '#FFFFFF'
                }}
              >
                {hoveredPoint.day}: {hoveredPoint.value} orders
              </div>
            )}
          </div>
        </div>

        {/* Right: Order distribution Donut Chart */}
        <div 
          className="lg:col-span-5 p-6 rounded-2xl shadow-xs border flex flex-col justify-between"
          style={{ 
            backgroundColor: cardBg, 
            borderColor: cardBorder 
          }}
        >
          <div>
            <h3 
              className="text-base sm:text-lg font-bold tracking-tight"
              style={{ 
                color: textPrimary,
                fontFamily: "'Space Grotesk', sans-serif" 
              }}
            >
              Order distribution
            </h3>
            <p className="text-xs sm:text-[13px] mt-0.5" style={{ color: textMuted }}>
              Current workflow status
            </p>
          </div>

          {/* SVG Donut */}
          <div className="relative flex items-center justify-center my-3">
            <svg width="170" height="170" viewBox="0 0 170 170">
              <g transform="rotate(-90 85 85)">
                {/* Completed 68% */}
                <circle
                  cx="85"
                  cy="85"
                  r={r}
                  fill="transparent"
                  stroke={tealColor}
                  strokeWidth="18"
                  strokeDasharray={`${completedLength} ${circ - completedLength}`}
                  strokeDashoffset={completedOffset}
                  strokeLinecap="round"
                />

                {/* Processing 21% */}
                <circle
                  cx="85"
                  cy="85"
                  r={r}
                  fill="transparent"
                  stroke={blueColor}
                  strokeWidth="18"
                  strokeDasharray={`${processingLength} ${circ - processingLength}`}
                  strokeDashoffset={processingOffset}
                  strokeLinecap="round"
                />

                {/* Needs attention 11% */}
                <circle
                  cx="85"
                  cy="85"
                  r={r}
                  fill="transparent"
                  stroke={amberColor}
                  strokeWidth="18"
                  strokeDasharray={`${needsAttentionLength} ${circ - needsAttentionLength}`}
                  strokeDashoffset={needsAttentionOffset}
                  strokeLinecap="round"
                />
              </g>
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span 
                className="text-2xl font-extrabold tracking-tight"
                style={{ 
                  color: textPrimary,
                  fontFamily: "'Space Grotesk', sans-serif" 
                }}
              >
                68%
              </span>
              <span className="text-[11px] font-medium" style={{ color: textMuted }}>
                on track
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="space-y-2 text-xs sm:text-[13px] pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tealColor }} />
                <span style={{ color: textMuted }}>Completed</span>
              </div>
              <span className="font-bold font-mono" style={{ color: textPrimary }}>
                68%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: blueColor }} />
                <span style={{ color: textMuted }}>Processing</span>
              </div>
              <span className="font-bold font-mono" style={{ color: textPrimary }}>
                21%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: amberColor }} />
                <span style={{ color: textMuted }}>Needs attention</span>
              </div>
              <span className="font-bold font-mono" style={{ color: textPrimary }}>
                11%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Recent activity Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 
            className="text-base sm:text-lg font-bold tracking-tight"
            style={{ 
              color: textPrimary,
              fontFamily: "'Space Grotesk', sans-serif" 
            }}
          >
            Recent activity
          </h2>
          <button 
            type="button"
            onClick={onNavigateToDispatch}
            className="text-xs sm:text-sm font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            style={{ color: tealColor }}
          >
            <span>View queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Activity Row Card */}
        <div 
          className="p-4 sm:p-5 rounded-2xl shadow-xs border flex flex-wrap items-center justify-between gap-4"
          style={{ 
            backgroundColor: cardBg, 
            borderColor: cardBorder 
          }}
        >
          <div className="flex items-center gap-3.5">
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ 
                backgroundColor: tealIconBg,
                color: tealColor
              }}
            >
              <Plus className="w-4 h-4" />
            </div>

            <div>
              <div 
                className="font-bold text-sm sm:text-base"
                style={{ 
                  color: textPrimary,
                  fontFamily: "'Space Grotesk', sans-serif" 
                }}
              >
                Inbound shipment received
              </div>
              <div className="text-xs sm:text-[13px] mt-0.5" style={{ color: textMuted }}>
                PO-10428 · Dock 03 · 12 minutes ago
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[11px] block font-medium" style={{ color: textMuted2 }}>
                Owner
              </span>
              <span className="font-bold text-xs sm:text-sm" style={{ color: textPrimary }}>
                A. Mensah
              </span>
            </div>

            <span
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold"
              style={{
                backgroundColor: tealIconBg,
                color: tealColor
              }}
            >
              Complete
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
