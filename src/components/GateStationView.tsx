import React, { useState } from 'react';
import { ContainerItem, ShippingLine, IsoContainerType, YardZone } from '../types/depot';
import { validateIsoContainerNumber, calculateIsoCheckDigit } from '../utils/iso6346';
import { 
  Truck, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  FileText, 
  Scale, 
  ShieldCheck, 
  Layers,
  ThermometerSnowflake
} from 'lucide-react';

interface GateStationViewProps {
  containers: ContainerItem[];
  zones: YardZone[];
  onGateInSuccess: (newContainer: ContainerItem) => void;
  onGateOutSuccess: (containerId: string, truckOut: string) => void;
}

export const GateStationView: React.FC<GateStationViewProps> = ({
  containers,
  zones,
  onGateInSuccess,
  onGateOutSuccess
}) => {
  const [activeLane, setActiveLane] = useState<'IN' | 'OUT'>('IN');

  // Gate In Form State
  const [inPrefix, setInPrefix] = useState('MSKU');
  const [inSerial, setInSerial] = useState('948201');
  const [inCarrier, setInCarrier] = useState<ShippingLine>('Maersk');
  const [inType, setInType] = useState<IsoContainerType>('40HC');
  const [inTareKg, setInTareKg] = useState<number>(3850);
  const [inGrossKg, setInGrossKg] = useState<number>(24200);
  const [inSeal, setInSeal] = useState('SL-884920');
  const [inTruckPlate, setInTruckPlate] = useState('NJ-7821-XX');
  const [inDriverName, setInDriverName] = useState('Carlos Mendez');
  const [inCargo, setInCargo] = useState('Electronic Component Sub-assemblies');
  const [inConsignee, setInConsignee] = useState('Apex Technologies Logistics');
  const [inIsReefer, setInIsReefer] = useState(false);
  const [inReeferTemp, setInReeferTemp] = useState<number>(-20);
  const [inIsHazmat, setInIsHazmat] = useState(false);
  const [inImoClass, setInImoClass] = useState<number>(3);
  const [inUnNumber, setInUnNumber] = useState('UN1993');

  // Gate In Check Digit
  const inExpectedCheck = calculateIsoCheckDigit(`${inPrefix}${inSerial}`);
  const inFullId = `${inPrefix}${inSerial}${inExpectedCheck >= 0 ? inExpectedCheck : 0}`;

  // Smart Slot Recommendation
  const recommendedZone = inIsHazmat ? 'H' : inIsReefer ? 'R' : inType === '20TK' ? 'H' : 'A';
  const targetZoneObj = zones.find((z) => z.id === recommendedZone) || zones[0];

  // Gate Out State
  const [selectedOutContainerId, setSelectedOutContainerId] = useState<string>('');
  const [outTruckPlate, setOutTruckPlate] = useState('TX-1092-AA');
  const [outDriverName, setOutDriverName] = useState('Arthur Pendelton');
  const [outPaidDemurrage, setOutPaidDemurrage] = useState(true);

  const selectedOutContainer = containers.find((c) => c.id === selectedOutContainerId);
  const outDwellOverdue = selectedOutContainer ? selectedOutContainer.dwellDays > selectedOutContainer.freeDays : false;
  const outDemurrageAmount = selectedOutContainer && outDwellOverdue
    ? (selectedOutContainer.dwellDays - selectedOutContainer.freeDays) * selectedOutContainer.demurrageRatePerDayUsd
    : 0;

  // Gate In Submit
  const handleGateInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inExpectedCheck < 0) return;

    // Find first available slot in target zone
    const existingInZone = containers.filter(
      (c) => c.location.zone === recommendedZone && c.status === 'In Yard'
    );
    let targetBay = 1;
    let targetRow = 1;
    let targetTier = 1;

    // simple slot finder
    outer: for (let b = 1; b <= targetZoneObj.baysCount; b++) {
      for (let r = 1; r <= targetZoneObj.rowsCount; r++) {
        for (let t = 1; t <= targetZoneObj.maxTier; t++) {
          const occupied = existingInZone.some(
            (c) => c.location.bay === b && c.location.row === r && c.location.tier === t
          );
          if (!occupied) {
            targetBay = b;
            targetRow = r;
            targetTier = t;
            break outer;
          }
        }
      }
    }

    const newContainer: ContainerItem = {
      id: inFullId,
      prefix: inPrefix,
      serial: inSerial,
      checkDigit: inExpectedCheck,
      formattedId: `${inPrefix} ${inSerial}-${inExpectedCheck}`,
      isoType: inType,
      teu: inType.startsWith('40') ? 2 : 1,
      shippingLine: inCarrier,
      status: 'In Yard',
      location: {
        zone: recommendedZone,
        bay: targetBay,
        row: targetRow,
        tier: targetTier
      },
      tareWeightKg: inTareKg,
      grossWeightKg: inGrossKg,
      maxPayloadKg: 30480 - inTareKg,
      sealNumber: inSeal,
      bookingReference: `BK-${inCarrier.slice(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
      billOfLading: `BL-${inCarrier.slice(0, 3).toUpperCase()}${Math.floor(200000 + Math.random() * 800000)}`,
      cargoDescription: inCargo,
      consignee: inConsignee,
      destinationPort: 'Rotterdam (NLRTM)',
      hazardousIMO: inIsHazmat ? inImoClass : undefined,
      unNumber: inIsHazmat ? inUnNumber : undefined,
      reefer: inIsReefer ? {
        targetTempC: inReeferTemp,
        actualTempC: inReeferTemp + 0.3,
        humidityPercent: 85,
        powerConnected: true,
        compressorState: 'Running',
        ventilationCmh: 0,
        lastReadingTimestamp: new Date().toISOString()
      } : undefined,
      dwellDays: 0,
      freeDays: 5,
      demurrageRatePerDayUsd: 115,
      customsStatus: 'Cleared',
      entryTimestamp: new Date().toISOString(),
      truckPlateIn: inTruckPlate,
      events: [
        {
          id: `EV-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Gate In Check',
          locationText: 'Depot Gate Lane 01',
          operator: `Gate Officer (${inDriverName} driving ${inTruckPlate})`,
          details: `EIR issued. Tare ${inTareKg}kg, Gross ${inGrossKg}kg verified. Seal ${inSeal} intact.`
        }
      ],
      lastInspection: {
        date: new Date().toISOString().slice(0, 10),
        inspector: 'Gate In OCR & Visual Inspector',
        condition: 'Sound / CSC Valid'
      }
    };

    onGateInSuccess(newContainer);
    // Reset serial for next
    setInSerial(String(Math.floor(100000 + Math.random() * 900000)));
    setInSeal(`SL-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleGateOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutContainerId) return;
    onGateOutSuccess(selectedOutContainerId, outTruckPlate);
    setSelectedOutContainerId('');
  };

  return (
    <div className="space-y-4">
      {/* Station Navigation Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <span>Gate In / Gate Out Interchange Station</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Process truck entries, verify seals & weights, generate Equipment Interchange Receipts (EIR), and manage gate-out dispatch.
          </p>
        </div>

        {/* Lane Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveLane('IN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeLane === 'IN'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Gate In (Inbound Intake)</span>
          </button>
          <button
            onClick={() => setActiveLane('OUT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeLane === 'OUT'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpFromLine className="w-3.5 h-3.5" />
            <span>Gate Out (Dispatch Release)</span>
          </button>
        </div>
      </div>

      {/* LANE 1: GATE IN FORM */}
      {activeLane === 'IN' && (
        <form onSubmit={handleGateInSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Column 1 & 2: Container Data & OCR */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                1. Container & Equipment Verification
              </span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> OCR Cameras Ready
              </span>
            </div>

            {/* Container ID with ISO Check Digit Display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Owner Prefix (4 Letters)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={inPrefix}
                  onChange={(e) => setInPrefix(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-950 border border-slate-700 rounded text-amber-400 focus:outline-none focus:border-amber-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Serial (6 Digits)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={inSerial}
                  onChange={(e) => setInSerial(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">ISO 6346 Check Digit</label>
                <div className="px-3 py-1.5 text-xs font-mono font-bold bg-slate-950 border border-slate-800 rounded text-emerald-400 flex items-center justify-between">
                  <span>Digit: {inExpectedCheck}</span>
                  <span className="text-[10px] text-slate-500">Auto-Calculated</span>
                </div>
              </div>
            </div>

            {/* Carrier Line & Equipment Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Shipping Line / Carrier</label>
                <select
                  value={inCarrier}
                  onChange={(e) => setInCarrier(e.target.value as ShippingLine)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Maersk">Maersk Line</option>
                  <option value="MSC">MSC (Mediterranean Shipping Co)</option>
                  <option value="CMA CGM">CMA CGM</option>
                  <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                  <option value="ONE">Ocean Network Express (ONE)</option>
                  <option value="Evergreen">Evergreen Marine</option>
                  <option value="COSCO">COSCO Shipping</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">ISO Equipment Type</label>
                <select
                  value={inType}
                  onChange={(e) => {
                    const val = e.target.value as IsoContainerType;
                    setInType(val);
                    if (val.includes('RF')) setInIsReefer(true);
                    if (val.startsWith('40')) setInTareKg(3850);
                    else setInTareKg(2250);
                  }}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="20GP">20GP - 20ft General Purpose (1 TEU)</option>
                  <option value="40GP">40GP - 40ft General Purpose (2 TEU)</option>
                  <option value="40HC">40HC - 40ft High Cube (2 TEU, 9ft 6in)</option>
                  <option value="20RF">20RF - 20ft Reefer Cold Chain</option>
                  <option value="40RF">40RF - 40ft Reefer Cold Chain</option>
                  <option value="40FR">40FR - 40ft Flat Rack (OOG)</option>
                  <option value="20TK">20TK - 20ft ISO Tank Container</option>
                </select>
              </div>
            </div>

            {/* Weighbridge Scales & Seal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Weighbridge Gross (kg)</label>
                <input
                  type="number"
                  value={inGrossKg}
                  onChange={(e) => setInGrossKg(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Tare Weight (kg)</label>
                <input
                  type="number"
                  value={inTareKg}
                  onChange={(e) => setInTareKg(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Net Cargo Weight</label>
                <div className="px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-950 border border-slate-800 rounded text-amber-400 font-bold">
                  {(inGrossKg - inTareKg).toLocaleString()} kg
                </div>
              </div>
            </div>

            {/* Seal & Truck Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Bolt Seal Number</label>
                <input
                  type="text"
                  value={inSeal}
                  onChange={(e) => setInSeal(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Truck License Plate</label>
                <input
                  type="text"
                  value={inTruckPlate}
                  onChange={(e) => setInTruckPlate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Driver CDL / Name</label>
                <input
                  type="text"
                  value={inDriverName}
                  onChange={(e) => setInDriverName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {/* Cargo & Consignee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Cargo Description</label>
                <input
                  type="text"
                  value={inCargo}
                  onChange={(e) => setInCargo(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Consignee / Importer</label>
                <input
                  type="text"
                  value={inConsignee}
                  onChange={(e) => setInConsignee(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {/* Special Cargo Options: Reefer & HazMat */}
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-300 block mb-1">Special Handling Conditions</span>
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inIsReefer}
                    onChange={(e) => setInIsReefer(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span className="text-slate-300">Reefer Plug Required</span>
                </label>

                {inIsReefer && (
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400">Target Temp:</span>
                    <input
                      type="number"
                      step={0.5}
                      value={inReeferTemp}
                      onChange={(e) => setInReeferTemp(Number(e.target.value))}
                      className="w-20 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-xs"
                    />
                    <span className="text-slate-400">°C</span>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inIsHazmat}
                    onChange={(e) => setInIsHazmat(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span className="text-slate-300">Hazardous Cargo (IMO)</span>
                </label>

                {inIsHazmat && (
                  <div className="flex items-center gap-3 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Class:</span>
                      <input
                        type="number"
                        min={1}
                        max={9}
                        value={inImoClass}
                        onChange={(e) => setInImoClass(Number(e.target.value))}
                        className="w-14 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-amber-400 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">UN:</span>
                      <input
                        type="text"
                        value={inUnNumber}
                        onChange={(e) => setInUnNumber(e.target.value)}
                        className="w-24 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Automated Yard Slot & EIR Issuance */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  2. Yard Slot Allocation & Dispatch
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Assigned Zone:</span>
                  <span className="font-bold text-white font-mono">{targetZoneObj.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cargo Routing:</span>
                  <span className="font-mono text-amber-400 font-semibold">
                    {inIsHazmat ? 'HAZMAT SEPARATION ZONE H' : inIsReefer ? 'REEFER PLUG ROW ZONE R' : 'GENERAL STACK A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Free Demurrage Days:</span>
                  <span className="font-mono text-slate-200">5 Free Days Allowed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tariff After Free:</span>
                  <span className="font-mono text-slate-200">$115.00 / day</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <span className="text-slate-300 font-bold block mb-1">EIR Summary</span>
                <div>EQUIPMENT: {inFullId}</div>
                <div>CARRIER: {inCarrier.toUpperCase()}</div>
                <div>TRUCK: {inTruckPlate} ({inDriverName})</div>
                <div>SEAL: {inSeal}</div>
                <div>STATUS: CSC INSPECTED - SOUND</div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow"
            >
              <FileText className="w-4 h-4" />
              <span>Issue EIR & Gate In Container</span>
            </button>
          </div>
        </form>
      )}

      {/* LANE 2: GATE OUT FORM */}
      {activeLane === 'OUT' && (
        <form onSubmit={handleGateOutSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Container Selection & Pickup Release
              </span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">Select Container to Gate Out</label>
              <select
                value={selectedOutContainerId}
                onChange={(e) => setSelectedOutContainerId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
                required
              >
                <option value="">-- Choose container from active yard inventory --</option>
                {containers
                  .filter((c) => c.status === 'In Yard')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.formattedId} — {c.shippingLine} — {c.isoType} — Dwell: {c.dwellDays}d — Slot: Z{c.location.zone}B{c.location.bay}R{c.location.row}T{c.location.tier}
                    </option>
                  ))}
              </select>
            </div>

            {selectedOutContainer && (
              <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">CARRIER</span>
                    <span className="text-slate-200 font-bold">{selectedOutContainer.shippingLine}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">TYPE</span>
                    <span className="text-slate-200 font-bold">{selectedOutContainer.isoType} ({selectedOutContainer.teu} TEU)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">SEAL NUMBER</span>
                    <span className="text-slate-200 font-bold">{selectedOutContainer.sealNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CUSTOMS</span>
                    <span className={`font-bold ${selectedOutContainer.customsStatus === 'Cleared' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedOutContainer.customsStatus}
                    </span>
                  </div>
                </div>

                {selectedOutContainer.customsStatus.includes('Held') && (
                  <div className="p-2 bg-red-950/60 border border-red-800 rounded text-red-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span><strong>CRITICAL WARNING:</strong> This container has an active Customs Hold and cannot exit without official release clearance.</span>
                  </div>
                )}
              </div>
            )}

            {/* Outbound Hauler Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Outbound Truck Plate</label>
                <input
                  type="text"
                  value={outTruckPlate}
                  onChange={(e) => setOutTruckPlate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Hauler / Driver Name</label>
                <input
                  type="text"
                  value={outDriverName}
                  onChange={(e) => setOutDriverName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Demurrage Invoice & Gate Pass */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Demurrage Settlement & Gate Pass
                </span>
              </div>

              {selectedOutContainer ? (
                <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Dwell Time:</span>
                    <span className="font-mono font-bold text-white">{selectedOutContainer.dwellDays} Days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Carrier Free Days:</span>
                    <span className="font-mono text-slate-300">{selectedOutContainer.freeDays} Days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Overdue Days:</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {Math.max(0, selectedOutContainer.dwellDays - selectedOutContainer.freeDays)} Days
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300 font-semibold">Demurrage Due:</span>
                    <span className={`font-mono font-bold text-sm ${outDemurrageAmount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      ${outDemurrageAmount.toLocaleString()}.00
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500 text-xs">
                  Select a container to compute demurrage fees.
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedOutContainerId || (selectedOutContainer?.customsStatus.includes('Held'))}
              className="w-full py-2.5 px-4 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Print Outbound EIR & Authorize Gate Out</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
