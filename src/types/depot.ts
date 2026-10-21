export type IsoContainerType = 
  | '20GP' // General Purpose 20ft (1 TEU)
  | '20ST' // Standard Dry 20ft (1 TEU)
  | '40GP' // General Purpose 40ft (2 TEU)
  | '40HC' // High Cube 40ft (2 TEU, 9ft 6in)
  | '45HC' // High Cube 45ft (2.25 TEU)
  | '20RF' // Reefer Refrigerated 20ft
  | '40RF' // Reefer Refrigerated 40ft
  | '20OT' // Open Top 20ft
  | '40OT' // Open Top 40ft
  | '20FR' // Flat Rack 20ft
  | '40FR' // Flat Rack 40ft
  | '20TK'; // Tank Container 20ft

export type ContainerTypeCode = 
  | '40HC' 
  | '40GP' 
  | '20S' 
  | '45HC' 
  | '20RF' 
  | '40RF' 
  | '20OT' 
  | '40OT' 
  | '20FR' 
  | '40FR' 
  | '20TK';

// Default enabled container types: strictly 40HC, 40GP (GP), and 20S as requested
export const DEFAULT_ENABLED_CONTAINER_TYPES: ContainerTypeCode[] = ['40HC', '40GP', '20S'];

export interface TypologySpecification {
  code: ContainerTypeCode;
  isoMatches: IsoContainerType[];
  name: string;
  shortLabel: string;
  dimensions: string;
  teuFactor: number;
  tareWeightKg: number;
  category: 'Standard Dry' | 'Extended Dry' | 'Cold Chain' | 'Special Equipment';
  isCoreDefault: boolean;
  description: string;
}

export const CONTAINER_TYPOLOGY_SPECS: TypologySpecification[] = [
  {
    code: '40HC',
    isoMatches: ['40HC'],
    name: "40' High Cube Dry Container",
    shortLabel: '40HC',
    dimensions: "40' x 8' x 9'6\" (12.19m x 2.44m x 2.89m)",
    teuFactor: 2,
    tareWeightKg: 3850,
    category: 'Standard Dry',
    isCoreDefault: true,
    description: 'High Cube 40-foot dry steel van. 9ft 6in high for high-volume cargo.'
  },
  {
    code: '40GP',
    isoMatches: ['40GP'],
    name: "40' General Purpose Dry Container",
    shortLabel: 'GP (40GP)',
    dimensions: "40' x 8' x 8'6\" (12.19m x 2.44m x 2.59m)",
    teuFactor: 2,
    tareWeightKg: 3700,
    category: 'Standard Dry',
    isCoreDefault: true,
    description: 'Standard 40-foot general purpose dry van. 8ft 6in standard height.'
  },
  {
    code: '20S',
    isoMatches: ['20ST', '20GP'],
    name: "20' Standard Dry Container",
    shortLabel: '20S (20ST/GP)',
    dimensions: "20' x 8' x 8'6\" (6.06m x 2.44m x 2.59m)",
    teuFactor: 1,
    tareWeightKg: 2150,
    category: 'Standard Dry',
    isCoreDefault: true,
    description: 'Standard 20-foot dry container (1 TEU). Core baseline dry equipment.'
  },
  {
    code: '45HC',
    isoMatches: ['45HC'],
    name: "45' High Cube Pallet Wide",
    shortLabel: '45HC',
    dimensions: "45' x 8' x 9'6\" (13.71m x 2.44m x 2.89m)",
    teuFactor: 2.25,
    tareWeightKg: 4600,
    category: 'Extended Dry',
    isCoreDefault: false,
    description: 'Extended length 45-foot High Cube van for Euro/intermodal pallets.'
  },
  {
    code: '20RF',
    isoMatches: ['20RF'],
    name: "20' Reefer Refrigerated Container",
    shortLabel: '20RF',
    dimensions: "20' x 8' x 8'6\" Cold-Chain Unit",
    teuFactor: 1,
    tareWeightKg: 2950,
    category: 'Cold Chain',
    isCoreDefault: false,
    description: '20-foot refrigerated container with integral electric cooling unit.'
  },
  {
    code: '40RF',
    isoMatches: ['40RF'],
    name: "40' High Cube Reefer Container",
    shortLabel: '40RF',
    dimensions: "40' x 8' x 9'6\" Cold-Chain Unit",
    teuFactor: 2,
    tareWeightKg: 4400,
    category: 'Cold Chain',
    isCoreDefault: false,
    description: '40-foot High Cube refrigerated container for temperature-controlled freight.'
  },
  {
    code: '20OT',
    isoMatches: ['20OT'],
    name: "20' Open Top Container",
    shortLabel: '20OT',
    dimensions: "20' x 8' x 8'6\" Tarpaulin Roof",
    teuFactor: 1,
    tareWeightKg: 2350,
    category: 'Special Equipment',
    isCoreDefault: false,
    description: 'Removable top tarpaulin for top-loading heavy or awkward cargo.'
  },
  {
    code: '40OT',
    isoMatches: ['40OT'],
    name: "40' Open Top Container",
    shortLabel: '40OT',
    dimensions: "40' x 8' x 8'6\" Tarpaulin Roof",
    teuFactor: 2,
    tareWeightKg: 3950,
    category: 'Special Equipment',
    isCoreDefault: false,
    description: '40-foot open top with swinging header beam for oversized cargo.'
  },
  {
    code: '20FR',
    isoMatches: ['20FR'],
    name: "20' Flat Rack Container",
    shortLabel: '20FR',
    dimensions: "20' x 8' Collapsible End Walls",
    teuFactor: 1,
    tareWeightKg: 2750,
    category: 'Special Equipment',
    isCoreDefault: false,
    description: 'Flat rack platform for heavy machinery, pipes, and project cargo.'
  },
  {
    code: '40FR',
    isoMatches: ['40FR'],
    name: "40' Flat Rack Container",
    shortLabel: '40FR',
    dimensions: "40' x 8' Collapsible End Walls",
    teuFactor: 2,
    tareWeightKg: 4900,
    category: 'Special Equipment',
    isCoreDefault: false,
    description: '40-foot flat rack with lashing points for heavy over-dimensional cargo.'
  },
  {
    code: '20TK',
    isoMatches: ['20TK'],
    name: "20' ISO Tank Container",
    shortLabel: '20TK',
    dimensions: "20' x 8' x 8'6\" Stainless Steel Tank",
    teuFactor: 1,
    tareWeightKg: 3600,
    category: 'Special Equipment',
    isCoreDefault: false,
    description: 'ISO tank container framed for bulk liquids, food-grade or chemicals.'
  }
];

export function isContainerTypeEnabled(isoType: IsoContainerType, enabledTypes?: ContainerTypeCode[]): boolean {
  const activeTypes = enabledTypes && Array.isArray(enabledTypes) && enabledTypes.length > 0 
    ? enabledTypes 
    : DEFAULT_ENABLED_CONTAINER_TYPES;
  for (const code of activeTypes) {
    const spec = CONTAINER_TYPOLOGY_SPECS.find(s => s.code === code);
    if (spec && spec.isoMatches.includes(isoType)) {
      return true;
    }
  }
  return false;
}

export function getContainerTypeCode(isoType: IsoContainerType): ContainerTypeCode {
  for (const spec of CONTAINER_TYPOLOGY_SPECS) {
    if (spec.isoMatches.includes(isoType)) {
      return spec.code;
    }
  }
  return '40HC';
}

export type ShippingLine = 
  | 'Maersk'
  | 'MSC'
  | 'CMA CGM'
  | 'Hapag-Lloyd'
  | 'ONE'
  | 'Evergreen'
  | 'COSCO';

export type ContainerStatus = 
  | 'In Yard'
  | 'Gate In'
  | 'Gate Out'
  | 'Customs Hold'
  | 'Maintenance'
  | 'Awaiting Rail';

export type CustomsStatus = 
  | 'Cleared'
  | 'Pending Inspection'
  | 'Held - X-Ray Required'
  | 'Seized';

export interface ReeferTelemetry {
  targetTempC: number;
  actualTempC: number;
  humidityPercent: number;
  powerConnected: boolean;
  compressorState: 'Running' | 'Standby' | 'Defrost' | 'Fault';
  ventilationCmh: number;
  lastReadingTimestamp: string;
}

export interface ContainerEvent {
  id: string;
  timestamp: string;
  action: string;
  locationText: string;
  operator: string;
  details: string;
}

export interface ContainerLocation {
  zone: string; // 'A', 'B', 'R', 'H', 'E'
  bay: number;  // 1 to 16
  row: number;  // 1 to 6
  tier: number; // 1 to 4
}

export interface ContainerItem {
  id: string; // ISO 6346 format e.g. MSKU7291834
  prefix: string; // MSKU
  serial: string; // 729183
  checkDigit: number; // 4
  formattedId: string; // MSKU 729183-4
  depotCode?: string; // Multi-depot code, e.g. BAKHRE30 or ALRHRE31
  isoType: IsoContainerType;
  teu: number; // 1 or 2
  shippingLine: ShippingLine;
  status: ContainerStatus;
  location: ContainerLocation;
  tareWeightKg: number;
  grossWeightKg: number;
  maxPayloadKg: number;
  sealNumber: string;
  bookingReference: string;
  billOfLading: string;
  cargoDescription: string;
  consignee: string;
  destinationPort: string;
  hazardousIMO?: number; // 1 to 9 (e.g. 3 = Flammable Liquids)
  unNumber?: string; // e.g. UN1993
  reefer?: ReeferTelemetry;
  dwellDays: number;
  freeDays: number;
  demurrageRatePerDayUsd: number;
  customsStatus: CustomsStatus;
  entryTimestamp: string;
  exitTimestamp?: string;
  truckPlateIn?: string;
  truckPlateOut?: string;
  events: ContainerEvent[];
  lastInspection: {
    date: string;
    inspector: string;
    condition: 'Sound / CSC Valid' | 'Minor Dent' | 'Floor Scraping' | 'Requires Wash';
  };
  inspectionRemarks?: string;
  loadType?: string;
}

export interface YardZone {
  id: string;
  name: string;
  type: 'General Import' | 'General Export' | 'Reefer Yard' | 'Hazardous HazMat' | 'Empty Storage';
  baysCount: number;
  rowsCount: number;
  maxTier: number;
  colorTheme: string;
  totalSlots: number;
}

export interface YardCrane {
  id: string;
  name: string;
  type: 'RTG (Rubber Tyred Gantry)' | 'Reach Stacker' | 'Rail Mounted Gantry';
  currentBay: number;
  currentZone: string;
  status: 'Idle' | 'Lifting Container' | 'Transit' | 'Maintenance';
  operatorName: string;
  totalMovesToday: number;
  fuelBatteryPercent: number;
}

export interface LogisticsApiProvider {
  id: string;
  name: string;
  category: 'Ocean Carrier' | 'Port Authority' | 'EDI Gateway';
  standard: 'DCSA v2.2 REST' | 'ANSI X12 315' | 'UN/EDIFACT COARRI/CODECO';
  baseUrl: string;
  authMethod: 'OAuth 2.0 Bearer Token' | 'API Key Header' | 'AS2 Digital Cert';
  status: 'Active' | 'Rate Limited' | 'Standby';
  latencyMs: number;
  lastSyncTimestamp: string;
  sampleEndpoints: {
    name: string;
    method: 'GET' | 'POST' | 'PUT';
    path: string;
    description: string;
  }[];
}

export interface MovementTransaction {
  id: string; // e.g. TRX-202610-001
  type: 'GATE_IN' | 'GATE_OUT';
  timestamp: string;
  monthKey: string; // e.g. "2026-10" or "OCT 2026"
  receiptOrBookingRef: string; // e.g. OCT0001 or DO-MSK-9921
  eirNumber: string; // e.g. EIR-IN-OCT0001
  containerId: string;
  formattedId: string;
  shippingLine: ShippingLine | string;
  isoType: IsoContainerType | string;
  containerSize: '20ft' | '40ft' | '45ft';
  loadStatus: 'Full' | 'Empty';
  depotCode: string; // BAKHRE30 or ALRHRE31
  transportMode: 'Truck' | 'Train';
  vehiclePlate: string; // e.g. ABG-8491 or WGN-4102
  driverName: string;
  driverId: string;
  transporterCompany: string;
  tareWeightKg: number;
  grossWeightKg?: number;
  sealNumber?: string;
  surveyCondition: string;
  yardLocation?: string;
  operator: string;
  notes?: string;
}

export type RepairStatus = 
  | 'Damage Reported'
  | 'Estimate Pending Line Approval'
  | 'Approved by Line'
  | 'In Repair / Workshop'
  | 'Repaired & QC Passed'
  | 'Invoiced & Closed';

export type BillingStatus = 'Unbilled' | 'Estimate Sent' | 'Invoiced' | 'Paid';

export interface RepairDamageItem {
  id: string;
  component: string; // "Left Side Panel", "Floorboard Section", "Door Gasket", "Roof Panel", "Corner Casting", "Locking Rod"
  damageType: string; // "Hole / Puncture", "Dent > 50mm", "Cut / Tear", "Delaminated Wood", "Bent", "Corrosion / Rust"
  locationCode: string; // "L1", "R2", "F3", "D1", "T1"
  repairMethod: string; // "Insert patch & weld", "Straighten & repaint", "Section replacement", "Full board replacement"
  laborHours: number;
  laborRatePerHour: number; // e.g. $45/hr
  materialCost: number; // e.g. $120
  totalCost: number; // laborHours * laborRatePerHour + materialCost
}

export interface StandardRepairTariff {
  id: string;
  component: string;
  damageDescription: string;
  standardHours: number;
  standardMaterialUsd: number;
  standardLaborRateUsd: number;
  totalStandardUsd: number;
}

export interface RepairWorkOrder {
  id: string; // e.g. MNR-2026-OCT-0104
  containerId: string;
  formattedId: string;
  shippingLine: ShippingLine | string;
  isoType: IsoContainerType | string;
  containerSize: '20ft' | '40ft' | '45ft';
  depotCode: string; // BAKHRE30 or ALRHRE31
  reportedDate: string;
  reportedBy: string;
  status: RepairStatus;
  priority: 'Routine' | 'Urgent / Vessel Export' | 'Safety Critical';
  damageItems: RepairDamageItem[];
  totalLaborHours: number;
  totalLaborCost: number;
  totalMaterialCost: number;
  totalEstimateCost: number; // USD
  lineApprovalRef?: string;
  lineApprovedDate?: string;
  lineContactPerson?: string;
  agingDays: number;
  followUpHistory: {
    id: string;
    timestamp: string;
    action: string;
    user: string;
    notes: string;
  }[];
  billing: {
    billingStatus: BillingStatus;
    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;
    billTo: 'Shipping Line' | 'Cargo Owner' | 'Haulier / Transporter';
    payerName: string;
    taxPercent: number;
    subtotal: number;
    taxAmount: number;
    totalBilledAmount: number;
    paidDate?: string;
    paymentRef?: string;
    currency: string;
  };
  technicianAssigned?: string;
  repairBay?: string;
  completedDate?: string;
  qcInspector?: string;
}

export interface OutboundWebhook {
  id: string;
  event: 'container.gate_in' | 'container.gate_out' | 'container.relocated' | 'customs.status_change' | 'reefer.temp_alarm';
  targetUrl: string;
  status: 'Delivered (200)' | 'Queued' | 'Retrying (503)';
  timestamp: string;
  responseMs: number;
  payloadSummary: string;
}

export type ConsoleEdition = 'admin' | 'client';

export type ClearanceLevelNumber = 1 | 2 | 3 | 4 | 5;

export interface ConsoleEditionConfig {
  edition: ConsoleEdition;
  clearanceLevel: ClearanceLevelNumber;
  title: string;
  badgeLabel: string;
  description: string;
  targetRole: string;
  features: {
    gateOperations: boolean;
    yardMovement: boolean;
    movementLedgerAudit: boolean;
    movementExport: boolean;
    damageInspection: boolean;
    repairJobsCreation: boolean;
    tariffEditing: boolean;
    invoiceGeneration: boolean;
    invoiceSettlement: boolean;
    depotCapacityConfig: boolean;
    typologyConfig: boolean;
    webhooksAndApiKeys: boolean;
    systemLogsPurge: boolean;
  };
}


