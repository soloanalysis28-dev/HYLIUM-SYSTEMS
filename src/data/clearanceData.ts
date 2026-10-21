import { ConsoleEdition, ConsoleEditionConfig, ClearanceLevelNumber } from '../types/depot';

export interface ClearanceMatrixItem {
  id: string;
  category: 'Operations' | 'Yard & Inventory' | 'Maintenance & Repairs' | 'Finance & Invoicing' | 'Administration & Security';
  featureName: string;
  description: string;
  adminAllowed: boolean;
  adminMinLevel: ClearanceLevelNumber;
  clientAllowed: boolean;
  clientMinLevel: ClearanceLevelNumber;
  restrictionReason?: string;
}

export const CONSOLE_EDITIONS: Record<ConsoleEdition, ConsoleEditionConfig> = {
  admin: {
    edition: 'admin',
    clearanceLevel: 5,
    title: 'Admin Console',
    badgeLabel: 'ADMIN CONSOLE · L5',
    description: 'Master administrative workstation for Yard Managers, Terminal Directors, and Financial Controllers.',
    targetRole: 'Yard Superintendent & Depot Administrator',
    features: {
      gateOperations: true,
      yardMovement: true,
      movementLedgerAudit: true,
      movementExport: true,
      damageInspection: true,
      repairJobsCreation: true,
      tariffEditing: true,
      invoiceGeneration: true,
      invoiceSettlement: true,
      depotCapacityConfig: true,
      typologyConfig: true,
      webhooksAndApiKeys: true,
      systemLogsPurge: true
    }
  },
  client: {
    edition: 'client',
    clearanceLevel: 2,
    title: 'Client Console',
    badgeLabel: 'CLIENT CONSOLE · L2',
    description: 'Streamlined field workstation for Gate Booths, Tally Clerks, Mobile Crane Operators, and Surveyors.',
    targetRole: 'Gate Inspector & Yard Tally Operator',
    features: {
      gateOperations: true,
      yardMovement: true,
      movementLedgerAudit: true,
      movementExport: true,
      damageInspection: true,
      repairJobsCreation: true,
      tariffEditing: false, // Locked to Admin
      invoiceGeneration: false, // Locked to Admin
      invoiceSettlement: false, // Locked to Admin
      depotCapacityConfig: false, // Locked to Admin
      typologyConfig: false, // Locked to Admin
      webhooksAndApiKeys: false, // Locked to Admin
      systemLogsPurge: false // Locked to Admin
    }
  }
};

export const CLEARANCE_LEVELS_HIERARCHY: { level: ClearanceLevelNumber; name: string; tag: string; description: string }[] = [
  {
    level: 1,
    name: 'Tally & Gate Security',
    tag: 'L1: READ-ONLY TALLY',
    description: 'Read-only container lookup, driver license verification, and physical seal tally verification.'
  },
  {
    level: 2,
    name: 'Client Console / Field Operator',
    tag: 'L2: CLIENT WORKSTATION',
    description: 'Default Client Console fork. Full Gate In/Out processing, EIR receipt generation, stack repositioning, and damage work order logging.'
  },
  {
    level: 3,
    name: 'Yard Shift Supervisor',
    tag: 'L3: SUPERVISOR',
    description: 'Dispute overrides, crane assignment priority, customs hold release verification, and demurrage grace waiver up to 24 hrs.'
  },
  {
    level: 4,
    name: 'Commercial & Financial Billing',
    tag: 'L4: FINANCE',
    description: 'Generate repair invoices, reconcile customer payment remittances, debit notes, and carrier rate reconciliation.'
  },
  {
    level: 5,
    name: 'Master Depot Administrator',
    tag: 'L5: ADMIN CONSOLE',
    description: 'Default Admin Console fork. Full root system access, depot physical capacity tuning, ISO typologies toggles, M&R standard tariffs editor, webhook secrets, and user clearance administration.'
  }
];

export const CLEARANCE_PERMISSIONS_MATRIX: ClearanceMatrixItem[] = [
  {
    id: 'gate-in',
    category: 'Operations',
    featureName: 'Gate-In Receipt & EIR Generation',
    description: 'Record inbound containers, sequence numbers, driver details, truck plates, and generate official EIR documents.',
    adminAllowed: true,
    adminMinLevel: 2,
    clientAllowed: true,
    clientMinLevel: 2
  },
  {
    id: 'gate-out',
    category: 'Operations',
    featureName: 'Gate-Out Dispatch & Delivery Order',
    description: 'Validate carrier booking DO, verify outbound seals, assess accrued demurrage, and clear gate exit.',
    adminAllowed: true,
    adminMinLevel: 2,
    clientAllowed: true,
    clientMinLevel: 2
  },
  {
    id: 'yard-moves',
    category: 'Yard & Inventory',
    featureName: 'Yard Stacking & Crane Shift Moves',
    description: 'Move containers between Bay/Row/Tier coordinates with real-time 3D collision prevention rules.',
    adminAllowed: true,
    adminMinLevel: 2,
    clientAllowed: true,
    clientMinLevel: 2
  },
  {
    id: 'movement-ledger',
    category: 'Yard & Inventory',
    featureName: 'Movement Ledger & Monthly Auditing',
    description: 'Search, filter, and audit all historical Gate-In and Gate-Out transactions by month and carrier.',
    adminAllowed: true,
    adminMinLevel: 2,
    clientAllowed: true,
    clientMinLevel: 2
  },
  {
    id: 'mnr-logging',
    category: 'Maintenance & Repairs',
    featureName: 'M&R Damage Inspection Work Orders',
    description: 'Log container structural damage (panels, floorboards, corner castings) and assign repair bays.',
    adminAllowed: true,
    adminMinLevel: 2,
    clientAllowed: true,
    clientMinLevel: 2
  },
  {
    id: 'mnr-tariffs',
    category: 'Maintenance & Repairs',
    featureName: 'IICL Standard Repair Tariff Rates Editor',
    description: 'Modify contracted repair parts pricing, labor hourly rates, and standard carrier allowances.',
    adminAllowed: true,
    adminMinLevel: 5,
    clientAllowed: false,
    clientMinLevel: 5,
    restrictionReason: 'Requires Level 5 Admin Console clearance. Prevents unauthorized rate tampering in field booths.'
  },
  {
    id: 'mnr-invoicing',
    category: 'Finance & Invoicing',
    featureName: 'Generate Official Repair Invoices & Debit Notes',
    description: 'Produce binding tax invoices, bill-to assignments, and carrier formal billing declarations.',
    adminAllowed: true,
    adminMinLevel: 4,
    clientAllowed: false,
    clientMinLevel: 4,
    restrictionReason: 'Financial authority reserved for Admin Console (Finance / Yard Superintendent).'
  },
  {
    id: 'mnr-settlement',
    category: 'Finance & Invoicing',
    featureName: 'Invoice Payment Reconciliations & Mark as Paid',
    description: 'Record bank transaction references, seal wire transfer proofs, and close accounting receivables.',
    adminAllowed: true,
    adminMinLevel: 4,
    clientAllowed: false,
    clientMinLevel: 4,
    restrictionReason: 'Requires Level 4/5 Admin Console clearance to prevent unreconciled invoice closures.'
  },
  {
    id: 'depot-capacity',
    category: 'Administration & Security',
    featureName: 'Depot Yard Physical Capacity (TEU) Configuration',
    description: 'Recalibrate total depot stacking capacity and spatial thresholds (e.g. 275 TEU).',
    adminAllowed: true,
    adminMinLevel: 5,
    clientAllowed: false,
    clientMinLevel: 5,
    restrictionReason: 'Core terminal engineering parameters are restricted to Admin Console.'
  },
  {
    id: 'iso-typologies',
    category: 'Administration & Security',
    featureName: 'ISO 6346 Container Typology Activation',
    description: 'Enable or disable accepted container types (40HC, 40GP, 20S, Reefer, Flat Rack, Open Top).',
    adminAllowed: true,
    adminMinLevel: 5,
    clientAllowed: false,
    clientMinLevel: 5,
    restrictionReason: 'Restricted to Admin Console to maintain standardized yard acceptance policy.'
  },
  {
    id: 'api-webhooks',
    category: 'Administration & Security',
    featureName: 'Outbound Logistics Webhooks & Secret Key Management',
    description: 'Configure real-time webhooks, API tokens for Maersk/MSC DCSA v2.2, and HMAC security secrets.',
    adminAllowed: true,
    adminMinLevel: 5,
    clientAllowed: false,
    clientMinLevel: 5,
    restrictionReason: 'Cryptographic API keys and external shipping line gateways require Admin Console.'
  },
  {
    id: 'system-purge',
    category: 'Administration & Security',
    featureName: 'System Audit Wipe & Master Factory Reset',
    description: 'Purge local SQLite database, clear transaction ledgers, or reset telemetry pipelines.',
    adminAllowed: true,
    adminMinLevel: 5,
    clientAllowed: false,
    clientMinLevel: 5,
    restrictionReason: 'Dangerous destructive commands require Level 5 elevated Admin Console.'
  }
];
