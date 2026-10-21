import React, { useState, useEffect, useMemo } from 'react';
import { ContainerItem, ShippingLine, IsoContainerType, YardZone } from '../types/depot';
import { calculateIsoCheckDigit } from '../utils/iso6346';
import { 
  Truck, 
  Train, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  FileText, 
  Scale, 
  ShieldCheck, 
  Layers,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Hash,
  User,
  Building,
  CheckCircle,
  ExternalLink,
  PackageCheck,
  X
} from 'lucide-react';

interface GateStationViewProps {
  containers: ContainerItem[];
  zones: YardZone[];
  isDark?: boolean;
  initialLane?: 'IN' | 'OUT';
  onGateInSuccess: (newContainer: ContainerItem) => void;
  onGateOutSuccess: (containerId: string, truckOut: string, releaseDetails?: { dispatchReference: string; driverName: string; driverId: string }) => void;
  onNavigateToInventory?: () => void;
}

interface ShippingLinePreset {
  line: ShippingLine;
  label: string;
  codePrefix: string;
  defaultOwnerPrefix: string;
  defaultSampleNum: string;
}

const SHIPPING_LINE_PRESETS: ShippingLinePreset[] = [
  { line: 'ONE', label: 'ONE (Ocean Network Express)', codePrefix: 'ONE', defaultOwnerPrefix: 'ONEU', defaultSampleNum: '1224' },
  { line: 'Maersk', label: 'Maersk Line', codePrefix: 'MSK', defaultOwnerPrefix: 'MSKU', defaultSampleNum: '1289' },
  { line: 'CMA CGM', label: 'CMA CGM', codePrefix: 'CMA', defaultOwnerPrefix: 'CMAU', defaultSampleNum: '1198' },
  { line: 'PIL' as ShippingLine, label: 'PIL (Pacific International Lines)', codePrefix: 'PIL', defaultOwnerPrefix: 'PCIU', defaultSampleNum: '1343' },
  { line: 'MSC', label: 'MSC (Mediterranean Shipping Co)', codePrefix: 'MSC', defaultOwnerPrefix: 'MSCU', defaultSampleNum: '2041' },
  { line: 'Hapag-Lloyd', label: 'Hapag-Lloyd', codePrefix: 'HAP', defaultOwnerPrefix: 'HLXU', defaultSampleNum: '5512' },
  { line: 'Evergreen', label: 'Evergreen Marine', codePrefix: 'EMC', defaultOwnerPrefix: 'EGLV', defaultSampleNum: '8834' },
  { line: 'COSCO', label: 'COSCO Shipping', codePrefix: 'COS', defaultOwnerPrefix: 'COSU', defaultSampleNum: '7719' },
];

const MONTH_CODES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const DEPOT_OPTIONS = [
  { code: 'BAKHRE30', label: 'BAKHRE30 — BAK LOGISTICS' },
  { code: 'ALRHRE31', label: 'ALRHRE31 — ALRO CONTAINER DEPOT' }
] as const;

// Helper to get cumulative receipt number (e.g., OCT0001, OCT0002...)
function getCumulativeReceiptNumber(): { receiptNumber: string; monthCode: string; count: number } {
  const currentMonthCode = MONTH_CODES[new Date().getMonth()];
  const storageKey = `hylium_receipt_seq_${currentMonthCode}`;
  let count = 1;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      count = parseInt(saved, 10);
      if (isNaN(count) || count < 1) count = 1;
    }
  } catch {
    count = 1;
  }
  const receiptNumber = `${currentMonthCode}${String(count).padStart(4, '0')}`;
  return { receiptNumber, monthCode: currentMonthCode, count };
}

function incrementReceiptSequence(monthCode: string, currentCount: number) {
  const storageKey = `hylium_receipt_seq_${monthCode}`;
  try {
    localStorage.setItem(storageKey, String(currentCount + 1));
  } catch {
    // ignore
  }
}

export const GateStationView: React.FC<GateStationViewProps> = ({
  containers,
  zones,
  isDark = false,
  initialLane = 'IN',
  onGateInSuccess,
  onGateOutSuccess,
  onNavigateToInventory
}) => {
  // Mode: Receive (Inbound Intake) vs Gate Out (Dispatch)
  const [activeLane, setActiveLane] = useState<'IN' | 'OUT'>(initialLane);

  // Multi-step Wizard: 1: Details (Shipping Line & Receipt Number), 2: Container & Equipment, 3: Driver & Transport
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // STEP 1 STATE: DETAILS SECTION (Shipping line & Cumulative Receipt Number)
  const [receiptMeta, setReceiptMeta] = useState(() => getCumulativeReceiptNumber());
  const [depotCode, setDepotCode] = useState<string>('BAKHRE30');
  const [selectedLine, setSelectedLine] = useState<ShippingLine>('ONE');
  const [shippingLineCode, setShippingLineCode] = useState<string>('ONE1224');
  const [bookingRef, setBookingRef] = useState<string>('BK-ONE-84920');
  const [deliveryOrder, setDeliveryOrder] = useState<string>('DO-77291');
  const [consignee, setConsignee] = useState<string>('Ocean Network Express (ONE) Equipment Pool');
  const [receiptDateStr] = useState<string>(() => new Date().toLocaleDateString('en-GB'));
  const [receiptTimeStr] = useState<string>(() => new Date().toLocaleTimeString('en-US', { hour12: false }));

  // When shipping line changes, auto-populate the system code (e.g. ONE1224, MSK1289, CMA1198, PIL1343)
  const handleSelectLine = (line: ShippingLine) => {
    setSelectedLine(line);
    const preset = SHIPPING_LINE_PRESETS.find((p) => p.line === line);
    if (preset) {
      const randomFour = Math.floor(1000 + Math.random() * 9000);
      setShippingLineCode(`${preset.codePrefix}${preset.defaultSampleNum || randomFour}`);
      setInPrefix(preset.defaultOwnerPrefix);
      setBookingRef(`BK-${preset.codePrefix}-${Math.floor(10000 + Math.random() * 90000)}`);
      setConsignee(`${preset.label} Equipment Logistics`);
    }
  };

  const handleRegenerateCode = () => {
    const preset = SHIPPING_LINE_PRESETS.find((p) => p.line === selectedLine) || SHIPPING_LINE_PRESETS[0];
    const randomFour = Math.floor(1000 + Math.random() * 9000);
    setShippingLineCode(`${preset.codePrefix}${randomFour}`);
  };

  // STEP 2 STATE: CONTAINER SIZE, FULL/EMPTY, TARE WEIGHT, DOM, RELEVANT EQUIPMENT DETAILS
  const [inPrefix, setInPrefix] = useState('ONEU');
  const [inSerial, setInSerial] = useState('265293');
  const [containerSize, setContainerSize] = useState<'20ft' | '40ft' | '45ft'>('40ft');
  const [isFullOrEmpty, setIsFullOrEmpty] = useState<'FULL' | 'EMPTY'>('EMPTY');
  const [inType, setInType] = useState<IsoContainerType>('40HC');
  const [tareWeightKg, setTareWeightKg] = useState<number>(3920);
  const [grossWeightKg, setGrossWeightKg] = useState<number>(3920);
  const [containerDom, setContainerDom] = useState<string>('2019-06'); // Container DOM (Date of Manufacture)
  const [conditionGrade, setConditionGrade] = useState<'Sound / CSC Valid' | 'Minor Dent' | 'Floor Scraping' | 'Requires Wash'>('Sound / CSC Valid');
  const [inspectionRemarks, setInspectionRemarks] = useState<string>('Clean interior, minor exterior paint scuff, CSC data plate verified');
  const [sealNumber, setSealNumber] = useState<string>('');
  const [cargoDescription, setCargoDescription] = useState<string>('EMPTY RETURN / RE-POSITIONING');
  const [moveType, setMoveType] = useState<'Empty' | 'Full' | 'Cabotage' | 'Relocation'>('Empty');

  // Live ISO Check Digit
  const inExpectedCheck = useMemo(() => {
    return calculateIsoCheckDigit(`${inPrefix}${inSerial}`);
  }, [inPrefix, inSerial]);
  const inFullId = `${inPrefix}${inSerial}${inExpectedCheck >= 0 ? inExpectedCheck : 0}`;

  // When container size or typology changes, update default tare weight
  const handleSizeChange = (size: '20ft' | '40ft' | '45ft') => {
    setContainerSize(size);
    if (size === '20ft') {
      setInType('20GP');
      setTareWeightKg(2150);
      if (isFullOrEmpty === 'EMPTY') setGrossWeightKg(2150);
    } else if (size === '40ft') {
      setInType('40HC');
      setTareWeightKg(3920);
      if (isFullOrEmpty === 'EMPTY') setGrossWeightKg(3920);
    } else {
      setInType('45HC');
      setTareWeightKg(4850);
      if (isFullOrEmpty === 'EMPTY') setGrossWeightKg(4850);
    }
  };

  const handleFullEmptyToggle = (status: 'FULL' | 'EMPTY') => {
    setIsFullOrEmpty(status);
    if (status === 'EMPTY') {
      setGrossWeightKg(tareWeightKg);
      setCargoDescription('EMPTY RETURN / RE-POSITIONING');
      setSealNumber('');
    } else {
      setGrossWeightKg(tareWeightKg + 18500);
      setCargoDescription('General Freight / Manufactured Goods');
      setSealNumber(`SL-${selectedLine.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  };

  // STEP 3 STATE: DRIVER DETAILS & TRANSPORT DETAILS (TRUCK / TRAIN, DRIVER NAME, ID)
  const [transportMode, setTransportMode] = useState<'TRUCK' | 'TRAIN'>('TRUCK');
  // Truck fields
  const [truckPlate, setTruckPlate] = useState<string>('TX-8821-XX');
  const [chassisNumber, setChassisNumber] = useState<string>('CHAS-9042');
  const [haulageCompany, setHaulageCompany] = useState<string>('Apex Logistics Haulage');
  // Train fields
  const [trainConsistId, setTrainConsistId] = useState<string>('TRAIN-RN-4401');
  const [railWagonNumber, setRailWagonNumber] = useState<string>('WAGON-W08');
  const [railOperator, setRailOperator] = useState<string>('TransNet Rail Freight');
  // Driver / Operator fields
  const [driverName, setDriverName] = useState<string>('Carlos Mendez');
  const [driverId, setDriverId] = useState<string>('ID-88492019');
  const [driverPhone, setDriverPhone] = useState<string>('+1 (555) 234-8901');

  // Automated Yard Slot Recommendation
  const recommendedZone = useMemo(() => {
    if (isFullOrEmpty === 'EMPTY') return 'E';
    if (inType.includes('RF')) return 'R';
    if (inType === '20TK') return 'H';
    return 'A';
  }, [isFullOrEmpty, inType]);

  const targetZoneObj = useMemo(() => {
    return zones.find((z) => z.id === recommendedZone) || zones[0];
  }, [zones, recommendedZone]);

  // EIR View Modal state
  const [committedContainer, setCommittedContainer] = useState<ContainerItem | null>(null);
  const [committedEirMeta, setCommittedEirMeta] = useState<{
    receiptNumber: string;
    depotCode: string;
    shippingLineCode: string;
    transportMode: 'TRUCK' | 'TRAIN';
    vehicleId: string;
    driverName: string;
    driverId: string;
    containerDom: string;
    isFullOrEmpty: 'FULL' | 'EMPTY';
    moveType: 'Empty' | 'Full' | 'Cabotage' | 'Relocation';
    slotText: string;
  } | null>(null);
  const [showEirModal, setShowEirModal] = useState<boolean>(false);
  const [copiedEir, setCopiedEir] = useState<boolean>(false);

  // GATE OUT STATE (Preserved)
  const [selectedOutContainerId, setSelectedOutContainerId] = useState<string>('');
  const [outTruckPlate, setOutTruckPlate] = useState('TX-1092-AA');
  const [outDriverName, setOutDriverName] = useState('Arthur Pendelton');
  const [outDriverId, setOutDriverId] = useState('ID-55192083');
  const [dispatchReference, setDispatchReference] = useState(() => `DSP-${Date.now().toString().slice(-6)}`);

  useEffect(() => {
    setActiveLane(initialLane);
    setCurrentStep(1);
  }, [initialLane]);

  const selectedOutContainer = containers.find((c) => c.id === selectedOutContainerId);

  // STEP 3 COMMIT HANDLER
  const handleCommitReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (inExpectedCheck < 0) return;

    // Find first available slot in target zone
    const existingInZone = containers.filter(
      (c) => c.location.zone === recommendedZone && c.status === 'In Yard'
    );
    let targetBay = 1;
    let targetRow = 1;
    let targetTier = 1;

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

    const currentReceiptNum = receiptMeta.receiptNumber;
    const vehicleIdentifier = transportMode === 'TRUCK' 
      ? `Truck ${truckPlate} (Chassis ${chassisNumber})` 
      : `Train ${trainConsistId} (Wagon ${railWagonNumber})`;

    const newContainer: ContainerItem = {
      id: inFullId,
      prefix: inPrefix,
      serial: inSerial,
      checkDigit: inExpectedCheck,
      formattedId: `${inPrefix} ${inSerial}-${inExpectedCheck}`,
      depotCode,
      isoType: inType,
      teu: inType.startsWith('40') ? 2 : inType.startsWith('45') ? 2.25 : 1,
      shippingLine: selectedLine,
      status: 'In Yard',
      location: {
        zone: recommendedZone,
        bay: targetBay,
        row: targetRow,
        tier: targetTier
      },
      tareWeightKg: tareWeightKg,
      grossWeightKg: grossWeightKg,
      maxPayloadKg: 30480 - tareWeightKg,
      sealNumber: isFullOrEmpty === 'FULL' ? sealNumber || `SL-${selectedLine.slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}` : 'N/A (EMPTY)',
      bookingReference: bookingRef,
      billOfLading: `BL-${shippingLineCode}-${Math.floor(200000 + Math.random() * 800000)}`,
      cargoDescription: cargoDescription,
      loadType: moveType,
      consignee: consignee,
      destinationPort: 'Rotterdam (NLRTM)',
      dwellDays: 1, // Formula =$R$1 - H155 + 1: Day of arrival is Day 1
      freeDays: 5,
      demurrageRatePerDayUsd: 115,
      customsStatus: 'Cleared',
      entryTimestamp: new Date().toISOString(),
      truckPlateIn: transportMode === 'TRUCK' ? truckPlate : trainConsistId,
      events: [
        {
          id: `EV-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: `Inbound Receipt (${currentReceiptNum})`,
          locationText: `Depot Gate Lane 01 (${targetZoneObj.name})`,
          operator: `Gate Officer (${driverName} / ${driverId} via ${transportMode})`,
          details: `EIR ${currentReceiptNum} issued. Code: ${shippingLineCode}. Mode: ${transportMode}. Status: ${isFullOrEmpty}. Move type: ${moveType}. Tare: ${tareWeightKg}kg, Gross: ${grossWeightKg}kg. DOM: ${containerDom}.`
        }
      ],
      lastInspection: {
        date: new Date().toISOString().slice(0, 10),
        inspector: `Gate Inspector (#${driverId.slice(-4)})`,
        condition: conditionGrade
      },
      inspectionRemarks: inspectionRemarks
    };

    // Save committed container & EIR metadata for print/view
    setCommittedContainer(newContainer);
    setCommittedEirMeta({
      receiptNumber: currentReceiptNum,
      depotCode,
      shippingLineCode,
      transportMode,
      vehicleId: transportMode === 'TRUCK' ? truckPlate : trainConsistId,
      driverName,
      driverId,
      containerDom,
      isFullOrEmpty,
      moveType,
      slotText: `Zone ${recommendedZone} Bay ${String(targetBay).padStart(2, '0')} Row ${targetRow} Tier ${targetTier}`
    });

    // Notify parent
    onGateInSuccess(newContainer);

    // Increment receipt sequence for next receipt (cumulative)
    incrementReceiptSequence(receiptMeta.monthCode, receiptMeta.count);

    // Open EIR Modal with Confirm & Print options
    setShowEirModal(true);
  };

  // Start a fresh receipt after finishing
  const handleStartNextReceipt = () => {
    const nextSeq = getCumulativeReceiptNumber();
    setReceiptMeta(nextSeq);
    setCurrentStep(1);
    setShowEirModal(false);
    setCommittedContainer(null);
    setCommittedEirMeta(null);

    // Refresh serial and codes
    setInSerial(String(Math.floor(100000 + Math.random() * 900000)));
    handleRegenerateCode();
  };

  // Gate Out Release
  const handleGateOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutContainerId) return;
    onGateOutSuccess(selectedOutContainerId, outTruckPlate, { dispatchReference, driverName: outDriverName, driverId: outDriverId });
    setSelectedOutContainerId('');
    setCurrentStep(1);
    setDispatchReference(`DSP-${Date.now().toString().slice(-6)}`);
  };

  // Printing trigger
  const handlePrintEir = () => {
    window.print();
  };

  // Copy EIR
  const handleCopyEirSummary = () => {
    if (!committedContainer || !committedEirMeta) return;
    const text = `
=== EQUIPMENT INTERCHANGE RECEIPT (EIR) ===
RECEIPT NO: ${committedEirMeta.receiptNumber}
DEPOT CODE: ${committedEirMeta.depotCode}
DATE / TIME: ${receiptDateStr} ${receiptTimeStr}
SHIPPING LINE: ${committedContainer.shippingLine} (${committedEirMeta.shippingLineCode})
CONTAINER NO: ${committedContainer.formattedId}
SIZE & TYPE: ${containerSize} (${committedContainer.isoType})
STATUS: ${committedEirMeta.isFullOrEmpty}
MOVE TYPE: ${committedEirMeta.moveType}
TARE WEIGHT: ${committedContainer.tareWeightKg} KG | GROSS: ${committedContainer.grossWeightKg} KG
CONTAINER DOM: ${committedEirMeta.containerDom}
TRANSPORT: ${committedEirMeta.transportMode} (${committedEirMeta.vehicleId})
DRIVER: ${committedEirMeta.driverName} (ID: ${committedEirMeta.driverId})
ALLOCATED SLOT: ${committedEirMeta.slotText}
STATUS: COMMITTED & STACKED
===========================================
`.trim();
    navigator.clipboard.writeText(text);
    setCopiedEir(true);
    setTimeout(() => setCopiedEir(false), 2500);
  };

  const cardBg = isDark ? '#101e28' : '#ffffff';
  const cardBorder = isDark ? '#243743' : '#e6edf0';
  const textPrimary = isDark ? '#eaf5f5' : '#17324a';
  const textMuted = isDark ? '#91a8b5' : '#7b8c9d';
  const innerBg = isDark ? '#0b1620' : '#f8faf9';

  return (
    <div className="space-y-4">
      {/* Station Navigation Header & Mode Selector */}
      <div 
        className="rounded-2xl p-4 sm:p-5 border transition-colors shadow-xs"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500 border border-teal-500/20">
                <Truck className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: textPrimary }}>
                {activeLane === 'IN' ? 'Receive & Interchange Gate Station' : 'Dispatch & Interchange Gate Station'}
              </h2>
            </div>
            <p className="text-xs mt-0.5" style={{ color: textMuted }}>
              {activeLane === 'IN'
                ? '3-stage container receipt intake, cumulative receipt numbering, equipment verification & gate in.'
                : '3-stage dispatch intake, equipment verification, driver details & gate-out release.'}
            </p>
          </div>

          {/* Lane Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: innerBg, borderColor: cardBorder }}>
            <button
              type="button"
              onClick={() => { setActiveLane('IN'); setCurrentStep(1); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeLane === 'IN'
                  ? 'bg-teal-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Receive (Gate In)</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveLane('OUT'); setCurrentStep(1); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeLane === 'OUT'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              <span>Gate Out (Dispatch)</span>
            </button>
          </div>
        </div>

        {/* Shared three-stage workflow for receipt and dispatch */}
        <div className="mt-5 pt-4 border-t" style={{ borderColor: cardBorder }}>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {/* Step 1 */}
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`text-left p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                  currentStep === 1
                    ? 'border-teal-500/50 bg-teal-500/10'
                    : currentStep > 1
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'opacity-60'
                }`}
                style={{ borderColor: currentStep === 1 ? undefined : cardBorder }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-400">
                    Step 1
                  </span>
                  {currentStep > 1 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-xs font-bold truncate" style={{ color: textPrimary }}>
                  {activeLane === 'IN' ? '1. Receipt Details' : '1. Dispatch Details'}
                </div>
                <div className="text-[11px] truncate mt-0.5" style={{ color: textMuted }}>
                  {activeLane === 'IN' ? `Line & Receipt # (${receiptMeta.receiptNumber})` : 'Container & release reference'}
                </div>
              </button>

              {/* Step 2 */}
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={`text-left p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                  currentStep === 2
                    ? 'border-teal-500/50 bg-teal-500/10'
                    : currentStep > 2
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'opacity-60'
                }`}
                style={{ borderColor: currentStep === 2 ? undefined : cardBorder }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-400">
                    Step 2
                  </span>
                  {currentStep > 2 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-xs font-bold truncate" style={{ color: textPrimary }}>
                  2. Equipment Details
                </div>
                <div className="text-[11px] truncate mt-0.5" style={{ color: textMuted }}>
                  {activeLane === 'IN' ? 'Size, Full/Empty, Move Type, Tare, DOM' : 'Container identity, condition & weights'}
                </div>
              </button>

              {/* Step 3 */}
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={`text-left p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                  currentStep === 3
                    ? 'border-teal-500/50 bg-teal-500/10'
                    : 'opacity-60'
                }`}
                style={{ borderColor: currentStep === 3 ? undefined : cardBorder }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-400">
                    Step 3
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <div className="text-xs font-bold truncate" style={{ color: textPrimary }}>
                  3. Driver & Transport
                </div>
                <div className="text-[11px] truncate mt-0.5" style={{ color: textMuted }}>
                  {activeLane === 'IN' ? 'Truck/Train, ID & Commit EIR' : 'Truck, driver ID & commit release'}
                </div>
              </button>
            </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RECEIVE LANE (GATE IN) - 3 STAGE FLOW                   */}
      {/* ======================================================== */}
      {activeLane === 'IN' && (
        <div 
          className="rounded-2xl p-4 sm:p-6 border transition-colors shadow-xs"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          {/* ---------------------------------------------------- */}
          {/* STEP 1: DETAILS SECTION (Shipping Line & Receipt #)  */}
          {/* ---------------------------------------------------- */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b gap-2" style={{ borderColor: cardBorder }}>
                <div>
                  <h3 className="text-sm font-bold tracking-tight uppercase font-mono text-teal-400 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-xs">1</span>
                    Stage 1: Receipt Details & Shipping Line Population
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                    System generates cumulative receipt number ({receiptMeta.receiptNumber}) and carrier system code.
                  </p>
                </div>

                {/* Prominent Cumulative Receipt Number Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-teal-500/10 border-teal-500/30">
                  <Hash className="w-4 h-4 text-teal-400" />
                  <div>
                    <span className="text-[10px] font-mono text-teal-300/80 block uppercase leading-none">Cumulative Receipt #</span>
                    <span className="text-sm font-mono font-bold text-teal-400 tracking-wider">
                      {receiptMeta.receiptNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Depot Select */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                    Depot / Facility *
                  </label>
                  <select
                    value={depotCode}
                    onChange={(e) => setDepotCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none transition-colors uppercase"
                    style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                    required
                  >
                    {DEPOT_OPTIONS.map((depot) => (
                      <option key={depot.code} value={depot.code}>{depot.label}</option>
                    ))}
                  </select>
                  <span className="text-[10px] mt-1 block" style={{ color: textMuted }}>
                    Select the receiving depot for this container.
                  </span>
                </div>

                {/* 2. Shipping Line Select */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                    Shipping Line / Carrier *
                  </label>
                  <select
                    value={selectedLine}
                    onChange={(e) => handleSelectLine(e.target.value as ShippingLine)}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl border focus:outline-none transition-colors"
                    style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                  >
                    {SHIPPING_LINE_PRESETS.map((p) => (
                      <option key={p.line} value={p.line}>{p.label}</option>
                    ))}
                  </select>
                  <span className="text-[10px] mt-1 block" style={{ color: textMuted }}>
                    Select carrier to automatically populate carrier interchange code.
                  </span>
                </div>

                {/* 3. System-Populated Shipping Line Code */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                    Carrier Interchange Code (System Populated) *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={shippingLineCode}
                      onChange={(e) => setShippingLineCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none transition-colors uppercase text-teal-400"
                      style={{ backgroundColor: innerBg, borderColor: cardBorder }}
                      placeholder="e.g. ONE1224, MSK1289, CMA1198, PIL1343"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      title="Regenerate carrier code"
                      className="px-2.5 py-2 rounded-xl border hover:bg-teal-500/10 text-teal-400 transition-colors cursor-pointer"
                      style={{ borderColor: cardBorder, backgroundColor: innerBg }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] mt-1 block text-teal-400/80 font-mono">
                    Auto-generated: {shippingLineCode} (e.g. ONE1224, MSK1289, CMA1198, PIL1343)
                  </span>
                </div>

                {/* 4. Cumulative Receipt Number (Explicit Field) */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                    System Generated Receipt Number *
                  </label>
                  <div className="px-3 py-2 rounded-xl border font-mono text-xs font-bold flex items-center justify-between" style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}>
                    <span className="text-teal-400">{receiptMeta.receiptNumber}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400">
                      Seq #{receiptMeta.count} ({receiptMeta.monthCode})
                    </span>
                  </div>
                  <span className="text-[10px] mt-1 block" style={{ color: textMuted }}>
                    Monthly sequence: advances cumulatively with every receipt commit.
                  </span>
                </div>

                {/* 5. Booking Reference */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                    Booking / Release Reference
                  </label>
                  <input
                    type="text"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none transition-colors"
                    style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                    required
                  />
                </div>

                {/* 6. Delivery Order (DO) */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                    Delivery Order (DO) / Waybill
                  </label>
                  <input
                    type="text"
                    value={deliveryOrder}
                    onChange={(e) => setDeliveryOrder(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none transition-colors"
                    style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                    required
                  />
                </div>

                {/* 7. Shipper / Account Holder */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                    Account / Consignee
                  </label>
                  <input
                    type="text"
                    value={consignee}
                    onChange={(e) => setConsignee(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none transition-colors"
                    style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                    required
                  />
                </div>
              </div>

              {/* Step 1 Footer & Next Button */}
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: cardBorder }}>
                <div className="text-xs font-mono" style={{ color: textMuted }}>
                  Date: <span className="font-bold text-teal-400">{receiptDateStr}</span> • Real-Time: <span className="font-bold">{receiptTimeStr}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Finish Step 1: Next (Equipment Details)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STEP 2: EQUIPMENT DETAILS                            */}
          {/* ---------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b gap-2" style={{ borderColor: cardBorder }}>
                <div>
                  <h3 className="text-sm font-bold tracking-tight uppercase font-mono text-teal-400 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-xs">2</span>
                    Stage 2: Equipment Details
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                    Populate physical specifications, tare weight, date of manufacture (DOM), and full/empty condition.
                  </p>
                </div>

                <div className="text-xs font-mono px-3 py-1 rounded-xl border" style={{ backgroundColor: innerBg, borderColor: cardBorder }}>
                  Receipt: <span className="font-bold text-teal-400">{receiptMeta.receiptNumber}</span> • Code: <span className="font-bold text-teal-400">{shippingLineCode}</span>
                </div>
              </div>

              {/* 1. Container Number & ISO Check Digit */}
              <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: innerBg, borderColor: cardBorder }}>
                <span className="text-xs font-mono font-bold uppercase tracking-wider block" style={{ color: textPrimary }}>
                  ISO 6346 Container Number Verification
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: textMuted }}>Owner Prefix (4 Letters)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={inPrefix}
                      onChange={(e) => setInPrefix(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none uppercase text-teal-400"
                      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: textMuted }}>Serial Number (6 Digits)</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={inSerial}
                      onChange={(e) => setInSerial(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none"
                      style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textPrimary }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: textMuted }}>Check Digit</label>
                    <div className="px-3 py-2 text-xs font-mono font-bold rounded-xl border flex items-center justify-between" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                      <span className="text-emerald-400">Digit: {inExpectedCheck}</span>
                      <span className="text-[10px] text-slate-400">ISO Validated</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs font-mono flex items-center gap-2 pt-1">
                  <span style={{ color: textMuted }}>Full ISO Identification:</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
                    {inFullId}
                  </span>
                </div>
              </div>

              {/* 2. Container Size & Full / Empty Switchers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Container Size Selector */}
                <div className="p-4 rounded-xl border space-y-2.5" style={{ backgroundColor: innerBg, borderColor: cardBorder }}>
                  <label className="block text-xs font-bold uppercase font-mono" style={{ color: textPrimary }}>
                    Container Size *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['20ft', '40ft', '45ft'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleSizeChange(sz)}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer text-center ${
                          containerSize === sz
                            ? 'bg-teal-500 text-slate-950 border-teal-500 shadow-xs'
                            : 'hover:bg-slate-500/10'
                        }`}
                        style={{ borderColor: containerSize === sz ? undefined : cardBorder, color: containerSize === sz ? undefined : textPrimary }}
                      >
                        {sz} {sz === '20ft' ? '(1 TEU)' : sz === '40ft' ? '(2 TEU)' : '(2.25 TEU)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Full or Empty Selector (Crucial Requirement) */}
                <div className="p-4 rounded-xl border space-y-2.5" style={{ backgroundColor: innerBg, borderColor: cardBorder }}>
                  <label className="block text-xs font-bold uppercase font-mono" style={{ color: textPrimary }}>
                    Status: Full or Empty *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFullEmptyToggle('EMPTY')}
                      className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isFullOrEmpty === 'EMPTY'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-xs'
                          : 'hover:bg-slate-500/10'
                      }`}
                      style={{ borderColor: isFullOrEmpty === 'EMPTY' ? undefined : cardBorder, color: isFullOrEmpty === 'EMPTY' ? undefined : textPrimary }}
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>EMPTY (MTY Return)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFullEmptyToggle('FULL')}
                      className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isFullOrEmpty === 'FULL'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-500 shadow-xs'
                          : 'hover:bg-slate-500/10'
                      }`}
                      style={{ borderColor: isFullOrEmpty === 'FULL' ? undefined : cardBorder, color: isFullOrEmpty === 'FULL' ? undefined : textPrimary }}
                    >
                      <Layers className="w-4 h-4" />
                      <span>FULL (Laden / FCL)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Tare Weight, Gross Weight & Container DOM */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Tare Weight (kg) */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                    Tare Weight (kg) *
                  </label>
                  <div className="relative">
                    <Scale className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      value={tareWeightKg}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTareWeightKg(val);
                        if (isFullOrEmpty === 'EMPTY') setGrossWeightKg(val);
                      }}
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none"
                      style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                      required
                    />
                  </div>
                  <span className="text-[10px] mt-1 block" style={{ color: textMuted }}>
                    Standard empty container unladen weight.
                  </span>
                </div>

                {/* Weighbridge Gross Weight (kg) */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                    Weighbridge Gross (kg) *
                  </label>
                  <div className="relative">
                    <Scale className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      value={grossWeightKg}
                      onChange={(e) => setGrossWeightKg(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none"
                      style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                      required
                    />
                  </div>
                  <span className="text-[10px] mt-1 block text-teal-400 font-mono">
                    Net Cargo: {(grossWeightKg - tareWeightKg).toLocaleString()} kg
                  </span>
                </div>

                {/* Container DOM (Date of Manufacture) */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                    Container DOM (Date of Manufacture) *
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="month"
                      value={containerDom}
                      onChange={(e) => setContainerDom(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none"
                      style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                      required
                    />
                  </div>
                  <span className="text-[10px] mt-1 block" style={{ color: textMuted }}>
                    CSC Safety Approval Plate Stamped Date.
                  </span>
                </div>
              </div>

              {/* 4. Equipment ISO Typology, Move Type & Inspection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                    ISO Typology
                  </label>
                  <select
                    value={inType}
                    onChange={(e) => setInType(e.target.value as IsoContainerType)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none"
                    style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                  >
                    <option value="40HC">40HC - 40ft High Cube (9ft 6in)</option>
                    <option value="40GP">40GP - 40ft General Purpose</option>
                    <option value="20GP">20GP - 20ft Standard General Purpose</option>
                    <option value="20RF">20RF - 20ft Reefer Cold Chain</option>
                    <option value="40RF">40RF - 40ft Reefer Cold Chain</option>
                    <option value="40FR">40FR - 40ft Flat Rack (OOG)</option>
                    <option value="20TK">20TK - 20ft ISO Liquid Tank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                    Move Type *
                  </label>
                  <select
                    value={moveType}
                    onChange={(e) => setMoveType(e.target.value as typeof moveType)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none"
                    style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                    required
                  >
                    <option value="Empty">Empty</option>
                    <option value="Full">Full</option>
                    <option value="Cabotage">Cabotage</option>
                    <option value="Relocation">Relocation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                    Visual Condition (CSC Inspection)
                  </label>
                  <select
                    value={conditionGrade}
                    onChange={(e) => setConditionGrade(e.target.value as 'Sound / CSC Valid' | 'Minor Dent' | 'Floor Scraping' | 'Requires Wash')}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none"
                    style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                  >
                    <option value="Sound / CSC Valid">Sound / CSC Valid</option>
                    <option value="Minor Dent">Minor Dent (Within IICL Tolerances)</option>
                    <option value="Floor Scraping">Floor Scraping / Interior Marks</option>
                    <option value="Requires Wash">Requires Wash / Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                    Bolt Seal Number {isFullOrEmpty === 'EMPTY' ? '(Not required for Empty)' : '*'}
                  </label>
                  <input
                    type="text"
                    value={sealNumber}
                    disabled={isFullOrEmpty === 'EMPTY'}
                    onChange={(e) => setSealNumber(e.target.value)}
                    placeholder={isFullOrEmpty === 'EMPTY' ? 'N/A - Empty container' : 'e.g. SL-ONE-992182'}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none"
                    style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                  />
                </div>
              </div>

              {/* Step 2 Footer & Navigation */}
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: cardBorder }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border hover:bg-slate-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                  style={{ borderColor: cardBorder, color: textPrimary }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Step 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Finish Step 2: Next (Driver & Transport)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STEP 3: DRIVER DETAILS, TRANSPORT (TRUCK/TRAIN), COMMIT */}
          {/* ---------------------------------------------------- */}
          {currentStep === 3 && (
            <form onSubmit={handleCommitReceipt} className="space-y-6">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b gap-2" style={{ borderColor: cardBorder }}>
                <div>
                  <h3 className="text-sm font-bold tracking-tight uppercase font-mono text-teal-400 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-xs">3</span>
                    Stage 3: Transport & Driver Details (Truck / Train) & Commit
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                    Verify transport mode, driver credentials, and commit receipt to generate EIR.
                  </p>
                </div>

                <div className="text-xs font-mono px-3 py-1 rounded-xl border" style={{ backgroundColor: innerBg, borderColor: cardBorder }}>
                  Equipment: <span className="font-bold text-teal-400">{inFullId}</span> • Tare: <span className="font-bold">{tareWeightKg}kg</span> • DOM: <span className="font-bold">{containerDom}</span>
                </div>
              </div>

              {/* 1. Transport Mode Selection (Truck vs Train) */}
              <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: innerBg, borderColor: cardBorder }}>
                <label className="block text-xs font-bold uppercase font-mono" style={{ color: textPrimary }}>
                  Transport Mode (Truck vs Train) *
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setTransportMode('TRUCK')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      transportMode === 'TRUCK'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'hover:bg-slate-500/10'
                    }`}
                    style={{ borderColor: transportMode === 'TRUCK' ? undefined : cardBorder, color: transportMode === 'TRUCK' ? undefined : textPrimary }}
                  >
                    <Truck className="w-4 h-4" />
                    <span>TRUCK (Road Haulage)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransportMode('TRAIN')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      transportMode === 'TRAIN'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-500 shadow-xs'
                        : 'hover:bg-slate-500/10'
                    }`}
                    style={{ borderColor: transportMode === 'TRAIN' ? undefined : cardBorder, color: transportMode === 'TRAIN' ? undefined : textPrimary }}
                  >
                    <Train className="w-4 h-4" />
                    <span>TRAIN (Rail Freight)</span>
                  </button>
                </div>
              </div>

              {/* 2. Vehicle / Carrier Information */}
              {transportMode === 'TRUCK' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                      Truck License Plate *
                    </label>
                    <input
                      type="text"
                      value={truckPlate}
                      onChange={(e) => setTruckPlate(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none uppercase"
                      style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                      placeholder="e.g. TX-8821-XX"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                      Chassis / Trailer Unit Number
                    </label>
                    <input
                      type="text"
                      value={chassisNumber}
                      onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none uppercase"
                      style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                      Haulage / Transport Company
                    </label>
                    <input
                      type="text"
                      value={haulageCompany}
                      onChange={(e) => setHaulageCompany(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                      style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                      Train Consist / Service ID *
                    </label>
                    <input
                      type="text"
                      value={trainConsistId}
                      onChange={(e) => setTrainConsistId(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none uppercase text-cyan-400"
                      style={{ backgroundColor: innerBg, borderColor: cardBorder }}
                      placeholder="e.g. TRAIN-RN-4401"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                      Rail Wagon Number / Position *
                    </label>
                    <input
                      type="text"
                      value={railWagonNumber}
                      onChange={(e) => setRailWagonNumber(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none uppercase"
                      style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                      Rail Freight Operator
                    </label>
                    <input
                      type="text"
                      value={railOperator}
                      onChange={(e) => setRailOperator(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                      style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                      required
                    />
                  </div>
                </div>
              )}

              {/* 3. Driver Details (Driver Name, ID, Phone) */}
              <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: innerBg, borderColor: cardBorder }}>
                <span className="text-xs font-mono font-bold uppercase tracking-wider block" style={{ color: textPrimary }}>
                  Driver & Identification Credentials
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                      Driver Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none"
                        style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textPrimary }}
                        placeholder="e.g. Carlos Mendez"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                      Driver National ID / CDL License Number *
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-teal-400" />
                      <input
                        type="text"
                        value={driverId}
                        onChange={(e) => setDriverId(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none text-teal-400"
                        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                        placeholder="e.g. ID-88492019"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>
                      Driver Mobile / Contact Phone
                    </label>
                    <input
                      type="text"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none"
                      style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textPrimary }}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Yard Slot & EIR Summary Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border space-y-2 text-xs" style={{ backgroundColor: innerBg, borderColor: cardBorder }}>
                  <span className="font-mono font-bold uppercase text-teal-400 block">
                    Recommended Depot Slot Allocation
                  </span>
                  <div className="flex items-center justify-between">
                    <span style={{ color: textMuted }}>Designated Yard Zone:</span>
                    <span className="font-mono font-bold" style={{ color: textPrimary }}>{targetZoneObj.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: textMuted }}>Storage Typology:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {isFullOrEmpty === 'EMPTY' ? 'EMPTY BUFFER RE-POSITIONING' : 'IMPORT LADEN BUFFER'}
                    </span>
                  </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: textMuted }}>Demurrage Free Days:</span>
                      <span className="font-mono">5 Free Days</span>
                    </div>
                </div>

                <div className="p-4 rounded-xl border space-y-1.5 font-mono text-[11px]" style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textMuted }}>
                  <span className="font-bold uppercase text-teal-400 block mb-1">EIR Interchange Summary</span>
                  <div>RECEIPT NO: <strong className="text-teal-400">{receiptMeta.receiptNumber}</strong></div>
                  <div>LINE & CODE: <strong style={{ color: textPrimary }}>{selectedLine} ({shippingLineCode})</strong></div>
                  <div>CONTAINER: <strong style={{ color: textPrimary }}>{inFullId} ({containerSize} {isFullOrEmpty})</strong></div>
                  <div>TARE: <strong style={{ color: textPrimary }}>{tareWeightKg}kg</strong> • DOM: <strong style={{ color: textPrimary }}>{containerDom}</strong></div>
                  <div>DRIVER: <strong style={{ color: textPrimary }}>{driverName} ({driverId})</strong></div>
                </div>
              </div>

              {/* Step 3 Action: Commit Receipt */}
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: cardBorder }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border hover:bg-slate-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                  style={{ borderColor: cardBorder, color: textPrimary }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Step 2</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  <span>COMMIT RECEIPT & FINALIZE EIR ({receiptMeta.receiptNumber})</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* LANE 2: GATE OUT FORM (DISPATCH RELEASE)                 */}
      {/* ======================================================== */}
      {activeLane === 'OUT' && (
        <div className="rounded-2xl p-4 sm:p-6 border transition-colors shadow-xs space-y-5" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="pb-3 border-b" style={{ borderColor: cardBorder }}>
            <h3 className="text-sm font-bold tracking-tight uppercase font-mono text-amber-400">
              {currentStep === 1 ? 'Stage 1: Dispatch Details' : currentStep === 2 ? 'Stage 2: Equipment Details' : 'Stage 3: Driver & Transport'}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: textMuted }}>
              {currentStep === 1
                ? 'Choose an active yard container and confirm its dispatch reference.'
                : currentStep === 2
                  ? 'Verify the selected container, cargo status, condition and yard position.'
                  : 'Enter outbound vehicle and driver credentials, then commit the gate-out release.'}
            </p>
          </div>

          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>Dispatch Reference *</label>
                <input
                  type="text"
                  value={dispatchReference}
                  onChange={(e) => setDispatchReference(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none uppercase"
                  style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>Select Container to Gate Out *</label>
                <select
                  value={selectedOutContainerId}
                  onChange={(e) => setSelectedOutContainerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none"
                  style={{ backgroundColor: innerBg, borderColor: cardBorder, color: textPrimary }}
                  required
                >
                  <option value="">-- Choose container from active yard inventory --</option>
                  {containers.filter((c) => c.status === 'In Yard').slice(0, 100).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.formattedId} — {c.shippingLine} — {c.isoType} — Dwell: {c.dwellDays}d — Slot: Z{c.location.zone}B{c.location.bay}R{c.location.row}T{c.location.tier}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            selectedOutContainer ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border font-mono text-xs space-y-3" style={{ backgroundColor: innerBg, borderColor: cardBorder }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold uppercase text-amber-400">Equipment verification</span>
                    <span className="font-bold text-teal-400">{selectedOutContainer.formattedId}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div><span className="text-[10px] block" style={{ color: textMuted }}>CARRIER</span><span className="font-bold" style={{ color: textPrimary }}>{selectedOutContainer.shippingLine}</span></div>
                    <div><span className="text-[10px] block" style={{ color: textMuted }}>ISO TYPE / SIZE</span><span className="font-bold" style={{ color: textPrimary }}>{selectedOutContainer.isoType} ({selectedOutContainer.teu} TEU)</span></div>
                    <div><span className="text-[10px] block" style={{ color: textMuted }}>MOVE TYPE</span><span className="font-bold" style={{ color: textPrimary }}>{selectedOutContainer.loadType || (selectedOutContainer.grossWeightKg > selectedOutContainer.tareWeightKg ? 'Full' : 'Empty')}</span></div>
                    <div><span className="text-[10px] block" style={{ color: textMuted }}>TARE / GROSS</span><span className="font-bold" style={{ color: textPrimary }}>{selectedOutContainer.tareWeightKg} / {selectedOutContainer.grossWeightKg} kg</span></div>
                    <div><span className="text-[10px] block" style={{ color: textMuted }}>SEAL NUMBER</span><span className="font-bold" style={{ color: textPrimary }}>{selectedOutContainer.sealNumber || 'N/A'}</span></div>
                    <div><span className="text-[10px] block" style={{ color: textMuted }}>DWELL</span><span className="font-bold text-teal-400">{selectedOutContainer.dwellDays} days</span></div>
                    <div className="col-span-2 sm:col-span-3"><span className="text-[10px] block" style={{ color: textMuted }}>YARD LOCATION</span><span className="font-bold text-amber-400">Z{selectedOutContainer.location.zone}-B{selectedOutContainer.location.bay}-R{selectedOutContainer.location.row}-T{selectedOutContainer.location.tier}</span></div>
                  </div>
                </div>
                <div className="p-3 rounded-xl border text-xs" style={{ backgroundColor: innerBg, borderColor: cardBorder }}>
                  Dispatch reference: <span className="font-mono font-bold text-amber-400">{dispatchReference}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-amber-400">Select a container in Stage 1 before continuing.</p>
            )
          )}

          {currentStep === 3 && (
            <form id="dispatch-release-form" onSubmit={handleGateOutSubmit} className="space-y-4">
              <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: innerBg, borderColor: cardBorder }}>
                <span className="text-xs font-mono font-bold uppercase tracking-wider block" style={{ color: textPrimary }}>Outbound truck & driver details</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>Outbound Truck Plate *</label>
                    <input type="text" value={outTruckPlate} onChange={(e) => setOutTruckPlate(e.target.value.toUpperCase())} className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none uppercase" style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textPrimary }} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>Driver Full Name *</label>
                    <input type="text" value={outDriverName} onChange={(e) => setOutDriverName(e.target.value)} className="w-full px-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none" style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textPrimary }} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: textMuted }}>Driver ID / CDL License Number *</label>
                    <input type="text" value={outDriverId} onChange={(e) => setOutDriverId(e.target.value)} className="w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none" style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textPrimary }} required />
                  </div>
                </div>
              </div>
              {selectedOutContainer && (
                <div className="p-4 rounded-xl border font-mono text-xs" style={{ backgroundColor: innerBg, borderColor: cardBorder }}>
                  <span className="font-bold uppercase text-amber-400">Dispatch summary</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <span>REFERENCE: <strong style={{ color: textPrimary }}>{dispatchReference}</strong></span>
                    <span>CONTAINER: <strong style={{ color: textPrimary }}>{selectedOutContainer.formattedId}</strong></span>
                    <span>DRIVER: <strong style={{ color: textPrimary }}>{outDriverName} ({outDriverId})</strong></span>
                    <span>TRUCK: <strong style={{ color: textPrimary }}>{outTruckPlate}</strong></span>
                  </div>
                </div>
              )}
            </form>
          )}

          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: cardBorder }}>
            <button
              type="button"
              onClick={() => setCurrentStep((currentStep === 3 ? 2 : 1) as 1 | 2 | 3)}
              disabled={currentStep === 1}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border hover:bg-slate-500/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              style={{ borderColor: cardBorder, color: textPrimary }}
            >
              <ChevronLeft className="w-4 h-4" /><span>{currentStep === 1 ? 'Stage 1' : `Back to Stage ${currentStep - 1}`}</span>
            </button>
            {currentStep < 3 ? (
              <button type="button" onClick={() => setCurrentStep((currentStep + 1) as 2 | 3)} disabled={currentStep === 1 && (!selectedOutContainerId || !dispatchReference.trim())} className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50">
                <span>Continue to Stage {currentStep + 1}</span><ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" form="dispatch-release-form" disabled={!selectedOutContainerId || !dispatchReference.trim()} className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50">
                <ArrowUpFromLine className="w-4 h-4" /><span>Commit Dispatch & Gate Out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW EIR CONFIRM & PRINT OPTIONS MODAL                   */}
      {/* ======================================================== */}
      {showEirModal && committedContainer && committedEirMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div 
            className="w-full max-w-2xl rounded-2xl border shadow-2xl p-5 sm:p-7 space-y-5 my-auto max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: cardBorder }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight" style={{ color: textPrimary }}>
                    Receipt Successfully Committed
                  </h3>
                  <p className="text-xs font-mono text-emerald-400">
                    Equipment Interchange Receipt #{committedEirMeta.receiptNumber} Generated
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEirModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-500/10 cursor-pointer"
                style={{ color: textMuted }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* EIR PRINTABLE DOCUMENT CONTAINER */}
            <div 
              id="printable-eir-document" 
              className="p-5 sm:p-6 rounded-xl border font-mono space-y-4 text-xs"
              style={{ backgroundColor: innerBg, borderColor: cardBorder }}
            >
              {/* Document Header */}
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: cardBorder }}>
                <div>
                  <h4 className="font-bold text-sm tracking-wider uppercase text-teal-400">
                    HYLIUM INTERMODAL CONTAINER DEPOT
                  </h4>
                  <div className="text-[11px]" style={{ color: textMuted }}>
                    EQUIPMENT INTERCHANGE RECEIPT (EIR) • INBOUND INTAKE
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-teal-400">
                    {committedEirMeta.receiptNumber}
                  </div>
                  <div className="text-[10px]" style={{ color: textMuted }}>
                    {receiptDateStr} • {receiptTimeStr}
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">1. DEPOT & CARRIER</span>
                  <div>DEPOT CODE: <strong className="text-teal-400">{committedEirMeta.depotCode}</strong></div>
                  <div>SHIPPING LINE: <strong style={{ color: textPrimary }}>{committedContainer.shippingLine}</strong></div>
                  <div>CARRIER CODE: <strong className="text-teal-400">{committedEirMeta.shippingLineCode}</strong></div>
                  <div>BOOKING REF: <strong style={{ color: textPrimary }}>{committedContainer.bookingReference}</strong></div>
                  <div>ACCOUNT: <strong style={{ color: textPrimary }}>{committedContainer.consignee}</strong></div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">2. EQUIPMENT DETAILS</span>
                  <div>CONTAINER NO: <strong className="text-teal-400">{committedContainer.formattedId}</strong></div>
                  <div>SIZE & TYPE: <strong style={{ color: textPrimary }}>{containerSize} ({committedContainer.isoType})</strong></div>
                  <div>STATUS: <strong className={committedEirMeta.isFullOrEmpty === 'EMPTY' ? 'text-emerald-400' : 'text-cyan-400'}>{committedEirMeta.isFullOrEmpty}</strong></div>
                  <div>MOVE TYPE: <strong style={{ color: textPrimary }}>{committedEirMeta.moveType}</strong></div>
                  <div>DOM (DATE MFD): <strong style={{ color: textPrimary }}>{committedEirMeta.containerDom}</strong></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] pt-2 border-t" style={{ borderColor: cardBorder }}>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">3. WEIGHTS & SEAL</span>
                  <div>TARE WEIGHT: <strong style={{ color: textPrimary }}>{committedContainer.tareWeightKg} KG</strong></div>
                  <div>GROSS WEIGHT: <strong style={{ color: textPrimary }}>{committedContainer.grossWeightKg} KG</strong></div>
                  <div>NET WEIGHT: <strong style={{ color: textPrimary }}>{(committedContainer.grossWeightKg - committedContainer.tareWeightKg)} KG</strong></div>
                  <div>SEAL NO: <strong style={{ color: textPrimary }}>{committedContainer.sealNumber}</strong></div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">4. TRANSPORT & DRIVER</span>
                  <div>MODE: <strong style={{ color: textPrimary }}>{committedEirMeta.transportMode}</strong></div>
                  <div>VEHICLE / WAGON: <strong style={{ color: textPrimary }}>{committedEirMeta.vehicleId}</strong></div>
                  <div>DRIVER NAME: <strong style={{ color: textPrimary }}>{committedEirMeta.driverName}</strong></div>
                  <div>DRIVER ID: <strong className="text-teal-400">{committedEirMeta.driverId}</strong></div>
                </div>
              </div>

              {/* Yard Slot & Condition */}
              <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-[11px]" style={{ borderColor: cardBorder }}>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">YARD STACK LOCATION</span>
                  <span className="font-bold text-amber-400">{committedEirMeta.slotText}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">INSPECTION CONDITION</span>
                  <span className="font-bold text-emerald-400">{conditionGrade}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t text-[10px]" style={{ borderColor: cardBorder }}>
                <div className="pt-6 border-t border-dashed" style={{ borderColor: cardBorder }}>
                  <span>DRIVER SIGNATURE ({committedEirMeta.driverName})</span>
                </div>
                <div className="pt-6 border-t border-dashed text-right" style={{ borderColor: cardBorder }}>
                  <span>GATE OFFICER / INSPECTOR SIGNATURE</span>
                </div>
              </div>
            </div>

            {/* EIR ACTIONS: PRINT, COPY, NEXT RECEIPT */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {/* Print EIR Button */}
                <button
                  type="button"
                  onClick={handlePrintEir}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print EIR</span>
                </button>

                {/* Copy Summary */}
                <button
                  type="button"
                  onClick={handleCopyEirSummary}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border hover:bg-slate-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                  style={{ borderColor: cardBorder, color: textPrimary }}
                >
                  {copiedEir ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEir ? 'Copied!' : 'Copy EIR'}</span>
                </button>

                {/* View in Inventory */}
                {onNavigateToInventory && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowEirModal(false);
                      onNavigateToInventory();
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold border hover:bg-slate-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                    style={{ borderColor: cardBorder, color: textPrimary }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View in Inventory</span>
                  </button>
                )}
              </div>

              {/* Start Next Receipt Button */}
              <button
                type="button"
                onClick={handleStartNextReceipt}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Receive Next Container (Cumulative #{MONTH_CODES[new Date().getMonth()]}{String(receiptMeta.count + 1).padStart(4, '0')})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
