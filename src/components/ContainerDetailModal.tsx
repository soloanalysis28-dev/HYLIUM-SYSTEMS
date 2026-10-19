import React from 'react';
import { ContainerItem } from '../types/depot';
import { validateIsoContainerNumber } from '../utils/iso6346';
import { calculateRealTimeDwellDays, calculateDemurrage, getDetailedDwellBreakdown } from '../utils/dwell';
import { 
  X, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Thermometer, 
  Scale, 
  Clock, 
  FileText, 
  Truck, 
  Move, 
  Calendar,
  Layers,
  Printer
} from 'lucide-react';

interface ContainerDetailModalProps {
  container: ContainerItem | null;
  onClose: () => void;
  onRequestMove: (container: ContainerItem) => void;
}

export const ContainerDetailModal: React.FC<ContainerDetailModalProps> = ({
  container,
  onClose,
  onRequestMove
}) => {
  if (!container) return null;

  const isoValidation = validateIsoContainerNumber(container.id);
  const realTimeDwellDays = calculateRealTimeDwellDays(container.entryTimestamp, container.exitTimestamp);
  const { isDemurring, overdueDays, demurrageAmountUsd } = calculateDemurrage(
    realTimeDwellDays,
    container.freeDays,
    container.demurrageRatePerDayUsd
  );
  const dwellBreakdown = getDetailedDwellBreakdown(container.entryTimestamp, container.exitTimestamp);

  const handlePrintEir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-mono text-sm">
              ISO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">{container.formattedId}</h3>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isoValidation.isValid ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400'
                }`}>
                  {isoValidation.isValid ? 'ISO 6346 VALID' : 'CHECK DIGIT MISMATCH'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {container.shippingLine} · {container.isoType} ({container.teu} TEU) · Booking: {container.bookingReference}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintEir}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print EIR</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Key Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Yard Slot</span>
              <span className="text-sm font-mono font-bold text-amber-400">
                Z{container.location.zone}-B{String(container.location.bay).padStart(2, '0')}-R{container.location.row}-T{container.location.tier}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Gross Weight</span>
              <span className="text-sm font-mono font-bold text-slate-200 tabular-nums">
                {container.grossWeightKg.toLocaleString()} kg
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Dwell Days</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Live clock sync: =$R$1-H155+1" />
              </div>
              <span className={`text-sm font-mono font-bold ${isDemurring ? 'text-red-400' : 'text-emerald-400'}`}>
                {realTimeDwellDays} {realTimeDwellDays === 1 ? 'day' : 'days'} {isDemurring ? `($${demurrageAmountUsd.toLocaleString()})` : '(Free Time)'}
              </span>
              <span className="text-[10px] font-mono text-teal-400/90 block mt-0.5 truncate" title={`Report formula: ${dwellBreakdown.formulaText}`}>
                =$R$1 - H155 + 1 ({dwellBreakdown.reportDateStr} - {dwellBreakdown.arrivalDateStr} + 1)
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Customs Clearance</span>
              <span className={`text-sm font-semibold ${
                container.customsStatus === 'Cleared' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {container.customsStatus}
              </span>
            </div>
          </div>

          {/* Reefer Telemetry (If Applicable) */}
          {container.reefer && (
            <div className="p-3.5 bg-slate-950 rounded-lg border border-cyan-900/50 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-cyan-900/40 text-cyan-400 font-mono font-bold">
                <span className="flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4" />
                  <span>COLD CHAIN REEFER TELEMETRICS (CARRIER TRANSICOLD PLUG)</span>
                </span>
                <span className="text-emerald-400 font-normal">Compressor {container.reefer.compressorState}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">TARGET SETPOINT</span>
                  <span className="text-white font-bold">{container.reefer.targetTempC.toFixed(1)}°C</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">PROBE SENSOR TEMP</span>
                  <span className="text-cyan-300 font-bold">{container.reefer.actualTempC.toFixed(1)}°C</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">RELATIVE HUMIDITY</span>
                  <span className="text-slate-200">{container.reefer.humidityPercent}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">POWER GRID PLUG</span>
                  <span className="text-emerald-400 font-bold">CONNECTED 460V 3Φ</span>
                </div>
              </div>
            </div>
          )}

          {/* Hazardous HazMat IMO (If Applicable) */}
          {container.hazardousIMO && (
            <div className="p-3.5 bg-amber-950/40 rounded-lg border border-amber-800/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-400 font-mono">
                  IMO HAZARDOUS CARGO: CLASS {container.hazardousIMO}
                </span>
                <span className="text-slate-400 block mt-0.5">
                  Segregation Rule: Must remain in isolated Zone H with 6-meter separation.
                </span>
              </div>
              {container.unNumber && (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-mono font-bold rounded border border-amber-500/30">
                  {container.unNumber}
                </span>
              )}
            </div>
          )}

          {/* Technical Specs & Logistics References */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300 block pb-1 border-b border-slate-800">
                Logistics Documentation
              </span>
              <div className="space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Bill of Lading:</span>
                  <span className="font-mono text-slate-200 font-bold">{container.billOfLading}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bolt Seal #:</span>
                  <span className="font-mono text-slate-200">{container.sealNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Consignee:</span>
                  <span className="text-slate-200 truncate max-w-[180px]">{container.consignee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Destination:</span>
                  <span className="text-slate-200">{container.destinationPort}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cargo:</span>
                  <span className="text-slate-200 truncate max-w-[180px]">{container.cargoDescription}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300 block pb-1 border-b border-slate-800">
                CSC Safety & Weight Specs
              </span>
              <div className="space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Tare Weight:</span>
                  <span className="font-mono text-slate-200">{container.tareWeightKg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Net Payload:</span>
                  <span className="font-mono text-slate-200">{(container.grossWeightKg - container.tareWeightKg).toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Allowable:</span>
                  <span className="font-mono text-slate-200">{container.maxPayloadKg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Turn-In / Arrival Date (H155):</span>
                  <span className="font-mono text-slate-200">{new Date(container.entryTimestamp).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dwell Days (=$R$1-H155+1):</span>
                  <span className="font-mono text-emerald-400 font-bold">{realTimeDwellDays} {realTimeDwellDays === 1 ? 'day' : 'days'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Inspection Condition:</span>
                  <span className="text-emerald-400 font-semibold">{container.lastInspection.condition}</span>
                </div>
                {container.inspectionRemarks && (
                  <div className="flex justify-between">
                    <span>Surveyor Remarks:</span>
                    <span className="text-amber-400 font-mono text-[11px] text-right max-w-[240px] truncate" title={container.inspectionRemarks}>
                      {container.inspectionRemarks}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Inspector ID:</span>
                  <span className="text-slate-300">{container.lastInspection.inspector}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit History & Touch Event Log */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300 block pb-1 border-b border-slate-800">
              Audit Event Trail & Crane Touches
            </span>
            <div className="space-y-2">
              {container.events.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{ev.action}</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5">{ev.details}</p>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Location: {ev.locationText} · Operator: {ev.operator}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onRequestMove(container);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow"
          >
            <Move className="w-3.5 h-3.5" />
            <span>Reposition (Dispatch Crane)</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
