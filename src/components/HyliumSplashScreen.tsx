import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

interface HyliumSplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const HyliumSplashScreen: React.FC<HyliumSplashScreenProps> = ({
  onComplete,
  durationMs = 2800
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress bar animation
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / (durationMs - 400)) * 100));
      setProgress(pct);
      if (elapsed >= durationMs - 400) {
        clearInterval(interval);
      }
    }, 30);

    // Fade out and finish timer
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, durationMs - 500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [durationMs]);

  const handleSkip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 200);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer transition-opacity duration-500 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 45%, #102431 0%, #0c1822 55%, #070e14 100%)'
      }}
      title="Click anywhere to enter depot"
    >
      {/* Background Soft Ambient Glow */}
      <div 
        className="absolute w-[450px] h-[450px] rounded-full pointer-events-none animate-glow-pulse blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(24, 183, 160, 0.22) 0%, rgba(18, 137, 165, 0.08) 60%, transparent 80%)'
        }}
      />

      {/* Floating Ambient Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[25%] w-1.5 h-1.5 rounded-full bg-teal-400/30 animate-pulse" />
        <div className="absolute top-[35%] right-[28%] w-2 h-2 rounded-full bg-teal-300/20 animate-pulse delay-300" />
        <div className="absolute top-[60%] left-[32%] w-1.5 h-1.5 rounded-full bg-emerald-400/25 animate-pulse delay-700" />
        <div className="absolute top-[75%] right-[35%] w-2 h-2 rounded-full bg-teal-400/20 animate-pulse delay-500" />
      </div>

      {/* Main Content Center Column */}
      <div className="relative flex flex-col items-center justify-center z-10 -mt-6">
        
        {/* Floating Green Balloon Logo */}
        <div className="animate-balloon-rise flex flex-col items-center">
          <div className="animate-balloon-bob flex flex-col items-center">
            
            {/* Balloon Body: Iconic Hylium Green Emblem with Glossy Balloon Highlight */}
            <div 
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] sm:rounded-[32px] flex items-center justify-center transition-all"
              style={{
                background: 'linear-gradient(135deg, #26dec3 0%, #18B7A0 42%, #118496 100%)',
                boxShadow: '0 24px 48px -8px rgba(24, 183, 160, 0.45), 0 0 35px rgba(24, 183, 160, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.45)'
              }}
            >
              {/* Balloon Specular Highlight Reflection */}
              <div 
                className="absolute top-2 left-2.5 w-10 h-6 rounded-full pointer-events-none opacity-60"
                style={{
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 100%)',
                  transform: 'rotate(-25deg)'
                }}
              />
              
              {/* Secondary Soft Rim Reflection */}
              <div 
                className="absolute bottom-2 right-2.5 w-6 h-6 rounded-full pointer-events-none opacity-20"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 80%)'
                }}
              />

              {/* Hylium Inner Circle Symbol */}
              <svg 
                className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-sm" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle 
                  cx="12" 
                  cy="12" 
                  r="9" 
                  stroke="white" 
                  strokeWidth="3.2" 
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Balloon Knot */}
            <div className="flex flex-col items-center -mt-0.5">
              <div 
                className="w-3.5 h-2 rounded-b-[4px] shadow-sm"
                style={{
                  background: 'linear-gradient(180deg, #137e8c 0%, #0d5f6a 100%)'
                }}
              />
              
              {/* Balloon Dangling String with Swaying Physics */}
              <div className="animate-string-sway -mt-0.5">
                <svg width="20" height="42" viewBox="0 0 20 42" fill="none" className="overflow-visible opacity-70">
                  <path 
                    d="M 10 0 Q 6 12, 13 22 T 9 42" 
                    stroke="#53D0BC" 
                    strokeWidth="1.5" 
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

          </div>
        </div>

        {/* Brand Words Fading In: "HYLIUM SYSTEMS" */}
        <div className="animate-text-fade-in flex flex-col items-center mt-3 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans drop-shadow-md">
            HYLIUM
          </h1>
          <span className="text-xs sm:text-sm font-bold tracking-[0.32em] text-[#53D0BC] uppercase mt-1">
            SYSTEMS
          </span>
        </div>

        {/* Terminal Subtitle & Loading Line */}
        <div className="animate-sub-fade-in flex flex-col items-center mt-6 w-56 sm:w-64">
          <div className="flex items-center justify-between w-full text-[10px] tracking-wider uppercase font-mono text-[#7ea0b3] mb-2 px-1">
            <span>Yard Matrix</span>
            <span className="text-[#53D0BC] font-semibold">{progress}%</span>
          </div>

          {/* Sleek Progress Bar */}
          <div className="w-full h-1 bg-[#162734] rounded-full overflow-hidden border border-[#203646]">
            <div 
              className="h-full rounded-full transition-all duration-100 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #1289A5 0%, #18B7A0 100%)',
                boxShadow: '0 0 8px rgba(24, 183, 160, 0.7)'
              }}
            />
          </div>

          <span className="text-[10px] text-[#5f7a8c] font-mono mt-2 tracking-wide">
            {progress < 40 ? 'Connecting digital twin stack...' : progress < 85 ? 'Synchronizing ISO registry...' : 'Depot system ready'}
          </span>
        </div>

      </div>

      {/* Skip Button (Top Right) */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-6 right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#7ea0b3] hover:text-white bg-[#14232e]/70 hover:bg-[#1a2d3b] border border-[#243a49] transition-all cursor-pointer backdrop-blur-xs"
      >
        <span>Skip</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Subtle Hint on Bottom */}
      <div className="absolute bottom-6 text-[11px] text-[#476070] font-sans">
        Click anywhere to continue
      </div>
    </div>
  );
};
