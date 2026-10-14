import { ContainerItem, YardZone, YardCrane, LogisticsApiProvider, OutboundWebhook } from '../types/depot';
import { generateValidContainerNumber } from '../utils/iso6346';

export const INITIAL_YARD_ZONES: YardZone[] = [
  {
    id: 'A',
    name: 'Zone A - Inbound Import Stacks',
    type: 'General Import',
    baysCount: 8,
    rowsCount: 4,
    maxTier: 4,
    colorTheme: 'blue',
    totalSlots: 128
  },
  {
    id: 'B',
    name: 'Zone B - Outbound Export Stacks',
    type: 'General Export',
    baysCount: 8,
    rowsCount: 4,
    maxTier: 4,
    colorTheme: 'emerald',
    totalSlots: 128
  },
  {
    id: 'R',
    name: 'Zone R - Cold Chain Reefer Plugs',
    type: 'Reefer Yard',
    baysCount: 6,
    rowsCount: 3,
    maxTier: 3,
    colorTheme: 'cyan',
    totalSlots: 54
  },
  {
    id: 'H',
    name: 'Zone H - Hazardous (IMO Segregation)',
    type: 'Hazardous HazMat',
    baysCount: 4,
    rowsCount: 3,
    maxTier: 2,
    colorTheme: 'amber',
    totalSlots: 24
  },
  {
    id: 'E',
    name: 'Zone E - Empty Equipment Storage',
    type: 'Empty Storage',
    baysCount: 6,
    rowsCount: 4,
    maxTier: 5,
    colorTheme: 'slate',
    totalSlots: 120
  }
];

export const INITIAL_CRANES: YardCrane[] = [
  {
    id: 'RTG-01',
    name: 'Gantry Crane Alpha (RTG-01)',
    type: 'RTG (Rubber Tyred Gantry)',
    currentBay: 3,
    currentZone: 'A',
    status: 'Idle',
    operatorName: 'Marcus Vance',
    totalMovesToday: 42,
    fuelBatteryPercent: 88
  },
  {
    id: 'RTG-02',
    name: 'Gantry Crane Bravo (RTG-02)',
    type: 'RTG (Rubber Tyred Gantry)',
    currentBay: 5,
    currentZone: 'B',
    status: 'Lifting Container',
    operatorName: 'Elena Rostova',
    totalMovesToday: 57,
    fuelBatteryPercent: 74
  },
  {
    id: 'REACH-01',
    name: 'Kalmar Reach Stacker (RS-01)',
    type: 'Reach Stacker',
    currentBay: 2,
    currentZone: 'R',
    status: 'Idle',
    operatorName: 'David Chen',
    totalMovesToday: 31,
    fuelBatteryPercent: 92
  }
];

// Helper to assemble mock containers
function makeContainer(
  prefix: string,
  serial: number,
  isoType: any,
  shippingLine: any,
  status: any,
  zone: string,
  bay: number,
  row: number,
  tier: number,
  options: {
    tareWeightKg?: number;
    grossWeightKg?: number;
    cargo?: string;
    consignee?: string;
    destPort?: string;
    hazardousIMO?: number;
    unNumber?: string;
    reefer?: any;
    dwellDays?: number;
    customsStatus?: any;
    truckIn?: string;
  } = {}
): ContainerItem {
  const fullId = generateValidContainerNumber(prefix, serial);
  const checkDigit = parseInt(fullId.slice(10), 10);
  const tare = options.tareWeightKg || (isoType.startsWith('40') ? 3850 : 2250);
  const gross = options.grossWeightKg || tare + Math.floor(14000 + Math.random() * 12000);

  return {
    id: fullId,
    prefix,
    serial: fullId.slice(4, 10),
    checkDigit,
    formattedId: `${prefix} ${fullId.slice(4, 10)}-${checkDigit}`,
    isoType,
    teu: isoType.startsWith('40') ? 2 : 1,
    shippingLine,
    status,
    location: { zone, bay, row, tier },
    tareWeightKg: tare,
    grossWeightKg: gross,
    maxPayloadKg: 30480 - tare,
    sealNumber: `SL-${Math.floor(100000 + Math.random() * 900000)}`,
    bookingReference: `BK-${shippingLine.slice(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
    billOfLading: `BL-${shippingLine.slice(0, 3).toUpperCase()}${Math.floor(200000 + Math.random() * 800000)}`,
    cargoDescription: options.cargo || 'General Department Store Cargo / Textiles',
    consignee: options.consignee || 'Global Retail Distribution LLC',
    destinationPort: options.destPort || 'Rotterdam (NLRTM)',
    hazardousIMO: options.hazardousIMO,
    unNumber: options.unNumber,
    reefer: options.reefer,
    dwellDays: options.dwellDays || Math.floor(1 + Math.random() * 9),
    freeDays: 5,
    demurrageRatePerDayUsd: 115,
    customsStatus: options.customsStatus || 'Cleared',
    entryTimestamp: new Date(Date.now() - (options.dwellDays || 2) * 86400000).toISOString(),
    truckPlateIn: options.truckIn || 'TX-9402-LK',
    events: [
      {
        id: 'EV-01',
        timestamp: new Date(Date.now() - (options.dwellDays || 2) * 86400000).toISOString(),
        action: 'Gate In Check',
        locationText: 'Depot Gate Lane 02',
        operator: 'System OCR + Gate Officer 14',
        details: 'EIR generated. Seal intact SL verified. Tare weight verified.'
      },
      {
        id: 'EV-02',
        timestamp: new Date(Date.now() - ((options.dwellDays || 2) - 0.2) * 86400000).toISOString(),
        action: 'Stack Allocation Lift',
        locationText: `Zone ${zone} Bay ${String(bay).padStart(2, '0')}`,
        operator: 'RTG-01 Marcus Vance',
        details: `Lifted to Bay ${bay}, Row ${row}, Tier ${tier}.`
      }
    ],
    lastInspection: {
      date: '2026-10-12',
      inspector: 'T. Kowalski (Cert #8291)',
      condition: 'Sound / CSC Valid'
    }
  };
}

export const INITIAL_CONTAINERS: ContainerItem[] = [
  // Zone A - Import Stacks
  makeContainer('MSKU', 719284, '40HC', 'Maersk', 'In Yard', 'A', 1, 1, 1, {
    cargo: 'Consumer Electronics & Solid State Drives',
    consignee: 'Apex Micro Technologies Inc',
    destPort: 'Hamburg (DEHAM)',
    dwellDays: 2,
    truckIn: 'NY-8831-AB'
  }),
  makeContainer('MSKU', 839102, '40GP', 'Maersk', 'In Yard', 'A', 1, 1, 2, {
    cargo: 'Automotive Spares & Brake Calipers',
    consignee: 'Vanguard Motorworks Corp',
    destPort: 'Antwerp (BEANR)',
    dwellDays: 4,
    truckIn: 'NJ-4491-XC'
  }),
  makeContainer('MEDU', 482910, '20GP', 'MSC', 'In Yard', 'A', 1, 2, 1, {
    cargo: 'Industrial Machine Bearings & Shafts',
    consignee: 'Krupp Precision GmbH',
    destPort: 'Bremen (DEBRE)',
    dwellDays: 7, // demurrable!
    truckIn: 'PA-2018-ZT'
  }),
  makeContainer('CMAU', 928374, '40HC', 'CMA CGM', 'In Yard', 'A', 2, 1, 1, {
    cargo: 'Solar Inverters & High-Voltage Cables',
    consignee: 'Helios CleanEnergy Systems',
    destPort: 'Le Havre (FRLEH)',
    dwellDays: 1,
    truckIn: 'DE-9011-QQ'
  }),
  makeContainer('HLCU', 391820, '40HC', 'Hapag-Lloyd', 'Customs Hold', 'A', 2, 2, 1, {
    cargo: 'Raw Timber Veneer & Wooden Paneling',
    consignee: 'Nordic Interior Woods',
    destPort: 'Rotterdam (NLRTM)',
    dwellDays: 8,
    customsStatus: 'Held - X-Ray Required',
    truckIn: 'MD-5521-YY'
  }),
  makeContainer('ONEY', 884721, '20GP', 'ONE', 'In Yard', 'A', 3, 1, 1, {
    cargo: 'Precision Optical Glass & Lenses',
    consignee: 'OptoWorks Laboratories',
    destPort: 'Yokohama (JPYOK)',
    dwellDays: 3,
    truckIn: 'VA-1029-KP'
  }),
  makeContainer('EGLV', 501928, '40GP', 'Evergreen', 'In Yard', 'A', 3, 2, 1, {
    cargo: 'Polymer Extrusion Granules',
    consignee: 'Formosa Plastics Americas',
    destPort: 'Kaohsiung (TWKHH)',
    dwellDays: 3,
    truckIn: 'CT-7744-BB'
  }),

  // Zone B - Export Stacks
  makeContainer('MSKU', 620194, '40HC', 'Maersk', 'In Yard', 'B', 1, 1, 1, {
    cargo: 'Precision Agricultural Machinery Parts',
    consignee: 'Ceres Harvest AG',
    destPort: 'Singapore (SGSIN)',
    dwellDays: 2,
    truckIn: 'IL-3382-HH'
  }),
  makeContainer('MEDU', 910283, '40GP', 'MSC', 'In Yard', 'B', 1, 2, 1, {
    cargo: 'Refined Soybean Protein & Food Starch',
    consignee: 'Osaka Foods Consolidator',
    destPort: 'Tokyo (JPTYO)',
    dwellDays: 1,
    truckIn: 'OH-5512-JK'
  }),
  makeContainer('CMAU', 382910, '20GP', 'CMA CGM', 'In Yard', 'B', 2, 1, 1, {
    cargo: 'Aircraft Composite Fasteners',
    consignee: 'AeroStructure France SAS',
    destPort: 'Marseille (FRMRS)',
    dwellDays: 3,
    truckIn: 'NC-6601-TT'
  }),
  makeContainer('HLCU', 771920, '40HC', 'Hapag-Lloyd', 'In Yard', 'B', 2, 2, 1, {
    cargo: 'Medical Diagnostic Imaging Enclosures',
    consignee: 'Siemens Healthineers EU',
    destPort: 'Hamburg (DEHAM)',
    dwellDays: 2,
    truckIn: 'SC-8819-MM'
  }),
  makeContainer('COSU', 448291, '40GP', 'COSCO', 'In Yard', 'B', 3, 1, 1, {
    cargo: 'Automotive Lithium Pack Casings',
    consignee: 'Shanghai Battery Consortium',
    destPort: 'Shanghai (CNSHA)',
    dwellDays: 4,
    truckIn: 'MI-1102-LL'
  }),

  // Zone R - Reefer Yard (Cold Chain)
  makeContainer('MSKU', 991823, '40RF', 'Maersk', 'In Yard', 'R', 1, 1, 1, {
    cargo: 'Grade-A Fresh Norwegian Salmon Fillets',
    consignee: 'Nordic SeaFood Logistics',
    destPort: 'Oslo (NOOSL)',
    dwellDays: 2,
    reefer: {
      targetTempC: -20.0,
      actualTempC: -19.6,
      humidityPercent: 85,
      powerConnected: true,
      compressorState: 'Running',
      ventilationCmh: 0,
      lastReadingTimestamp: new Date().toISOString()
    }
  }),
  makeContainer('MEDU', 338192, '40RF', 'MSC', 'In Yard', 'R', 1, 2, 1, {
    cargo: 'Pharmaceutical Vaccines & Biologics (Cold Chain)',
    consignee: 'BioHealth Distro EU',
    destPort: 'Rotterdam (NLRTM)',
    dwellDays: 1,
    reefer: {
      targetTempC: 4.0,
      actualTempC: 4.2,
      humidityPercent: 60,
      powerConnected: true,
      compressorState: 'Running',
      ventilationCmh: 15,
      lastReadingTimestamp: new Date().toISOString()
    }
  }),
  makeContainer('CMAU', 552918, '20RF', 'CMA CGM', 'In Yard', 'R', 2, 1, 1, {
    cargo: 'Organic Hass Avocados & Papayas',
    consignee: 'FreshProduce Continental',
    destPort: 'Algeciras (ESALG)',
    dwellDays: 3,
    reefer: {
      targetTempC: 7.5,
      actualTempC: 7.8,
      humidityPercent: 90,
      powerConnected: true,
      compressorState: 'Running',
      ventilationCmh: 25,
      lastReadingTimestamp: new Date().toISOString()
    }
  }),

  // Zone H - HazMat
  makeContainer('HLCU', 992019, '20TK', 'Hapag-Lloyd', 'In Yard', 'H', 1, 1, 1, {
    cargo: 'Flammable Solvent (Iso-Propyl Alcohol)',
    consignee: 'PureChem Solutions Ltd',
    destPort: 'Felixstowe (GBFXT)',
    hazardousIMO: 3,
    unNumber: 'UN1219',
    dwellDays: 2
  }),
  makeContainer('CMAU', 119283, '20GP', 'CMA CGM', 'In Yard', 'H', 1, 2, 1, {
    cargo: 'Corrosive Phosphoric Acid Solution 85%',
    consignee: 'Apex Industrial Chemicals',
    destPort: 'Antwerp (BEANR)',
    hazardousIMO: 8,
    unNumber: 'UN1805',
    dwellDays: 4
  }),

  // Zone E - Empty Storage
  makeContainer('MSKU', 102938, '40HC', 'Maersk', 'In Yard', 'E', 1, 1, 1, {
    cargo: 'EMPTY CONTAINER (Swept Clean & Dry)',
    consignee: 'Maersk Equipment Pool',
    destPort: 'Newark (USNWK)',
    dwellDays: 5
  }),
  makeContainer('MEDU', 772918, '40GP', 'MSC', 'In Yard', 'E', 1, 1, 2, {
    cargo: 'EMPTY CONTAINER (Inspected Sound)',
    consignee: 'MSC Pool Services',
    destPort: 'Newark (USNWK)',
    dwellDays: 6
  }),
  makeContainer('ONEY', 228192, '20GP', 'ONE', 'In Yard', 'E', 1, 2, 1, {
    cargo: 'EMPTY CONTAINER (Awaiting Export Stuffing)',
    consignee: 'ONE Logistics Dispatch',
    destPort: 'Newark (USNWK)',
    dwellDays: 1
  })
];

export const INITIAL_LOGISTICS_PROVIDERS: LogisticsApiProvider[] = [
  {
    id: 'maersk-rest',
    name: 'A.P. Moller - Maersk Track & Trace API',
    category: 'Ocean Carrier',
    standard: 'DCSA v2.2 REST',
    baseUrl: 'https://api.maersk.com/track-and-trace/v2',
    authMethod: 'OAuth 2.0 Bearer Token',
    status: 'Active',
    latencyMs: 142,
    lastSyncTimestamp: new Date().toISOString(),
    sampleEndpoints: [
      { name: 'Get Container Status', method: 'GET', path: '/events?equipmentReference={id}', description: 'Retrieves live transport events and ETA milestone status.' },
      { name: 'Post Gate-In Event', method: 'POST', path: '/events/transport-call-events', description: 'Dispatches real-time Equipment Interchange receipt to ocean carrier.' }
    ]
  },
  {
    id: 'msc-dcsa',
    name: 'MSC Mediterranean Shipping Co. API',
    category: 'Ocean Carrier',
    standard: 'DCSA v2.2 REST',
    baseUrl: 'https://api.msc.com/dcsa/v2.2/events',
    authMethod: 'API Key Header',
    status: 'Active',
    latencyMs: 185,
    lastSyncTimestamp: new Date().toISOString(),
    sampleEndpoints: [
      { name: 'Query Container Journey', method: 'GET', path: '/transport-events?carrierBookingReference={ref}', description: 'Returns vessel name, voyage number, and customs hold status.' },
      { name: 'Push Depot Move', method: 'POST', path: '/equipment-events', description: 'Reports bay slot position updates and seal verification.' }
    ]
  },
  {
    id: 'cma-cgm-gateway',
    name: 'CMA CGM Shipping Services Gateway',
    category: 'Ocean Carrier',
    standard: 'DCSA v2.2 REST',
    baseUrl: 'https://apis.cma-cgm.com/logistics/v1',
    authMethod: 'OAuth 2.0 Bearer Token',
    status: 'Active',
    latencyMs: 164,
    lastSyncTimestamp: new Date().toISOString(),
    sampleEndpoints: [
      { name: 'Equipment Tracking', method: 'GET', path: '/shipments/{id}/containers', description: 'Live location, demurrage countdown, and terminal pickup appointments.' }
    ]
  },
  {
    id: 'edifact-port',
    name: 'UN/EDIFACT Port Authority Gateway',
    category: 'EDI Gateway',
    standard: 'UN/EDIFACT COARRI/CODECO',
    baseUrl: 'as2://edi.portauthority.gov:8443/inbound',
    authMethod: 'AS2 Digital Cert',
    status: 'Active',
    latencyMs: 98,
    lastSyncTimestamp: new Date().toISOString(),
    sampleEndpoints: [
      { name: 'Send CODECO Gate Report', method: 'POST', path: '/messages/codeco_d95b', description: 'Electronic Interchange of Container Gate-In/Out movements.' },
      { name: 'Send COARRI Loading Report', method: 'POST', path: '/messages/coarri_d95b', description: 'Vessel discharge/load container confirmation.' }
    ]
  }
];

export const INITIAL_WEBHOOKS: OutboundWebhook[] = [
  {
    id: 'WHK-9901',
    event: 'container.gate_in',
    targetUrl: 'https://logistics-hub.client.com/webhooks/inbound',
    status: 'Delivered (200)',
    timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
    responseMs: 82,
    payloadSummary: 'Container MSKU7192844 passed Gate 02. Tare verified 3,850 kg.'
  },
  {
    id: 'WHK-9902',
    event: 'customs.status_change',
    targetUrl: 'https://brokerage.customs-clear.com/api/v1/alerts',
    status: 'Delivered (200)',
    timestamp: new Date(Date.now() - 48 * 60000).toISOString(),
    responseMs: 114,
    payloadSummary: 'Container HLCU3918201 flagged for X-Ray inspection hold.'
  },
  {
    id: 'WHK-9903',
    event: 'reefer.temp_alarm',
    targetUrl: 'https://coldchain.monitoring-corp.com/v2/alarms',
    status: 'Delivered (200)',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    responseMs: 76,
    payloadSummary: 'Reefer MSKU9918239 nominal at -19.6°C (Target -20.0°C). Normal.'
  }
];
