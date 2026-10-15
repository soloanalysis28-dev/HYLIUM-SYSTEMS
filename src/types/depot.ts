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

export interface OutboundWebhook {
  id: string;
  event: 'container.gate_in' | 'container.gate_out' | 'container.relocated' | 'customs.status_change' | 'reefer.temp_alarm';
  targetUrl: string;
  status: 'Delivered (200)' | 'Queued' | 'Retrying (503)';
  timestamp: string;
  responseMs: number;
  payloadSummary: string;
}
