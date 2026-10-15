import React from 'react';

interface HyliumLogoProps {
  isDark: boolean;
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
}

export const HyliumLogo: React.FC<HyliumLogoProps> = ({ isDark, size = 'md', iconOnly = false }) => {
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-10 h-10';
  const circleRadius = size === 'sm' ? 8 : size === 'lg' ? 10 : 9;
  
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Exact Hylium Rounded Emblem */}
      <div 
        className={`${iconSize} rounded-[13px] flex items-center justify-center shrink-0 shadow-xs transition-transform hover:scale-105`}
        style={{
          background: 'linear-gradient(135deg, #18B7A0 0%, #1289A5 100%)'
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r={circleRadius} stroke="white" strokeWidth="3.5" />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <span 
            className="font-extrabold tracking-tight text-[15px] leading-tight font-sans"
            style={{ color: isDark ? '#ffffff' : '#18242a' }}
          >
            HYLIUM
          </span>
          <span 
            className="text-[9px] font-bold tracking-[0.22em] uppercase"
            style={{ color: isDark ? '#758d9c' : '#7d8e8b' }}
          >
            SYSTEMS
          </span>
        </div>
      )}
    </div>
  );
};
