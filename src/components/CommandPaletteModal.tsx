import React, { useState, useEffect, useMemo } from 'react';
import { ContainerItem } from '../types/depot';
import { Search, X, Layers, Move, Eye, Thermometer, ShieldAlert } from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  containers: ContainerItem[];
  onSelectContainer: (container: ContainerItem) => void;
  onRequestMove: (container: ContainerItem) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  containers,
  onSelectContainer,
  onRequestMove
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return containers.slice(0, 8);
    const q = query.toLowerCase();
    return containers.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.formattedId.toLowerCase().includes(q) ||
        c.sealNumber.toLowerCase().includes(q) ||
        c.bookingReference.toLowerCase().includes(q) ||
        c.shippingLine.toLowerCase().includes(q) ||
        c.consignee.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [containers, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden text-xs">
        {/* Search Bar Input */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-2.5 bg-slate-950">
          <Search className="w-4 h-4 text-amber-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type container ID (MSKU...), seal, carrier, or booking reference..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-xs focus:outline-none font-mono"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
          {results.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No matching containers in yard registry.
            </div>
          ) : (
            results.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  onSelectContainer(c);
                  onClose();
                }}
                className="p-3 hover:bg-slate-800/60 cursor-pointer flex items-center justify-between gap-3 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">{c.formattedId}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300 font-medium">{c.shippingLine}</span>
                    <span className="text-slate-500">·</span>
                    <span className="font-mono text-amber-400 text-[11px]">{c.isoType}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Slot: Z{c.location.zone}-B{String(c.location.bay).padStart(2, '0')}-R{c.location.row}-T{c.location.tier} · Seal: {c.sealNumber}
                  </div>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      onRequestMove(c);
                      onClose();
                    }}
                    className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
                    title="Move"
                  >
                    <Move className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      onSelectContainer(c);
                      onClose();
                    }}
                    className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Inspect"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
