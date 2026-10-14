import React, { useState } from 'react';
import { ContainerItem, YardZone, YardCrane, ContainerLocation } from '../types/depot';
import { 
  X, 
  Move, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin,
  Cpu
} from 'lucide-react';

interface QuickMoveModalProps {
  container: ContainerItem | null;
  zones: YardZone[];
  cranes: YardCrane[];
  allContainers: ContainerItem[];
  onClose: () => void;
  onExecuteMove: (
    containerId: string, 
    from: ContainerLocation, 
    to: ContainerLocation, 
    craneId: string
  ) => void;
}

export const QuickMoveModal: React.FC<QuickMoveModalProps> = ({
  container,
  zones,
  cranes,
  allContainers,
  onClose,
  onExecuteMove
}) => {
  if (!container) return null;

  const [targetZone, setTargetZone] = useState<string>(container.location.zone);
  const [targetBay, setTargetBay] = useState<number>(container.location.bay);
  const [targetRow, setTargetRow] = useState<number>(container.location.row);
  const [targetTier, setTargetTier] = useState<number>(1);
  const [selectedCraneId, setSelectedCraneId] = useState<string>(cranes[0]?.id || 'RTG-01');

  const zoneObj = zones.find((z) => z.id === targetZone) || zones[0];

  // Validation Checks:
  // 1. Is target slot occupied by another container?
  const isOccupied = allContainers.some(
    (c) =>
      c.id !== container.id &&
      c.status === 'In Yard' &&
      c.location.zone === targetZone &&
      c.location.bay === targetBay &&
      c.location.row === targetRow &&
      c.location.tier === targetTier
  );

  // 2. Is tier > 1 supported by a container in tier - 1?
  const hasSupportBelow =
    targetTier === 1 ||
    allContainers.some(
      (c) =>
        c.id !== container.id &&
        c.status === 'In Yard' &&
        c.location.zone === targetZone &&
        c.location.bay === targetBay &&
        c.location.row === targetRow &&
        c.location.tier === targetTier - 1
    );

  const isSameLocation =
    container.location.zone === targetZone &&
    container.location.bay === targetBay &&
    container.location.row === targetRow &&
    container.location.tier === targetTier;

  const isValid = !isOccupied && hasSupportBelow && !isSameLocation;

  const handleConfirmMove = () => {
    if (!isValid) return;
    onExecuteMove(
      container.id,
      container.location,
      {
        zone: targetZone,
        bay: targetBay,
        row: targetRow,
        tier: targetTier
      },
      selectedCraneId
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Move className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              Crane Move Dispatch: {container.formattedId}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs flex items-center justify-between">
            <span className="text-slate-400">Current Position:</span>
            <span className="text-amber-400 font-bold">
              Zone {container.location.zone} — Bay {String(container.location.bay).padStart(2, '0')} — Row {container.location.row} — Tier {container.location.tier}
            </span>
          </div>

          {/* Target Coordinates */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Target Zone</label>
              <select
                value={targetZone}
                onChange={(e) => setTargetZone(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono focus:outline-none focus:border-amber-500"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>Zone {z.id} ({z.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Bay (1-{zoneObj.baysCount})</label>
              <select
                value={targetBay}
                onChange={(e) => setTargetBay(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono focus:outline-none focus:border-amber-500"
              >
                {Array.from({ length: zoneObj.baysCount }, (_, i) => i + 1).map((b) => (
                  <option key={b} value={b}>Bay {String(b).padStart(2, '0')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Row (1-{zoneObj.rowsCount})</label>
              <select
                value={targetRow}
                onChange={(e) => setTargetRow(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono focus:outline-none focus:border-amber-500"
              >
                {Array.from({ length: zoneObj.rowsCount }, (_, i) => i + 1).map((r) => (
                  <option key={r} value={r}>Row {r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Tier (1-{zoneObj.maxTier})</label>
              <select
                value={targetTier}
                onChange={(e) => setTargetTier(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono focus:outline-none focus:border-amber-500"
              >
                {Array.from({ length: zoneObj.maxTier }, (_, i) => i + 1).map((t) => (
                  <option key={t} value={t}>Tier {t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Crane Unit Assigned */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Assign Gantry Crane / Reach Stacker</label>
            <select
              value={selectedCraneId}
              onChange={(e) => setSelectedCraneId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono focus:outline-none focus:border-amber-500"
            >
              {cranes.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  {cr.name} · {cr.status} (Positioned Bay {cr.currentBay})
                </option>
              ))}
            </select>
          </div>

          {/* Validation Feedback */}
          {isOccupied && (
            <div className="p-2.5 bg-red-950/60 border border-red-800 rounded text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Target slot is already occupied by another container.</span>
            </div>
          )}

          {!hasSupportBelow && !isOccupied && (
            <div className="p-2.5 bg-amber-950/60 border border-amber-800 rounded text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Gravity Stacking Rule: Tier {targetTier} requires an existing container directly below in Tier {targetTier - 1}.</span>
            </div>
          )}

          {isSameLocation && (
            <div className="p-2.5 bg-slate-800 rounded text-slate-400 text-center">
              Target location is identical to current position.
            </div>
          )}

          {isValid && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 rounded text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Clear slot with sound stacking foundation. Crane ready for transit.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmMove}
            disabled={!isValid}
            className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold transition-colors shadow flex items-center gap-1.5"
          >
            <Move className="w-3.5 h-3.5" />
            <span>Confirm & Execute Move</span>
          </button>
        </div>
      </div>
    </div>
  );
};
