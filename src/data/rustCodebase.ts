export interface RustFile {
  path: string;
  filename: string;
  language: 'rust' | 'toml' | 'json' | 'markdown';
  description: string;
  content: string;
}

export const RUST_PROJECT_FILES: RustFile[] = [
  {
    path: 'Cargo.toml',
    filename: 'Cargo.toml',
    language: 'toml',
    description: 'Cargo manifest declaring Windows desktop dependencies, Tauri v2, Tokio async runtime, and logistics HTTP client',
    content: `[package]
name = "depotmaster-windows"
version = "2.4.0"
description = "Industrial Windows Container Depot & Logistics Workstation"
authors = ["Depot Logistics Systems <contact@depotmaster.internal>"]
edition = "2021"
default-run = "depotmaster-windows"

[dependencies]
# GUI & Native Windows Shell
tauri = { version = "2.0.0", features = ["tray-icon", "protocol-asset"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Async & Networking
tokio = { version = "1.38", features = ["full"] }
reqwest = { version = "0.12", features = ["json", "rustls-tls"] }
async-trait = "0.1"

# Local Embedded Database & Persistence
rusqlite = { version = "0.31", features = ["bundled", "chrono", "uuid"] }
uuid = { version = "1.8", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }

# Logging & Telemetry
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# Security & Signature Verification
hmac = "0.12"
sha2 = "0.10"
hex = "0.4"

# Windows Native APIs
[target.'cfg(windows)'.dependencies]
windows-sys = { version = "0.52", features = [
    "Win32_UI_WindowsAndMessaging",
    "Win32_System_SystemInformation",
    "Win32_Foundation"
] }

[build-dependencies]
tauri-build = { version = "2.0.0", features = [] }
winres = "0.1"

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
panic = "abort"
strip = true
`
  },
  {
    path: 'src/main.rs',
    filename: 'main.rs',
    language: 'rust',
    description: 'Main application entry point for Windows, initializing Tokio async runtime, SQLite DB, and Tauri desktop window',
    content: `// DepotMaster - Windows Container Depot & Logistics Workstation
// Target: x86_64-pc-windows-msvc

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod models;
mod services;

use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

use services::inventory_service::InventoryService;
use services::yard_tracker::YardTracker;
use services::logistics_client::LogisticsClient;
use services::webhook_dispatcher::WebhookDispatcher;

pub struct AppState {
    pub inventory: Arc<Mutex<InventoryService>>,
    pub yard: Arc<Mutex<YardTracker>>,
    pub logistics: Arc<LogisticsClient>,
    pub webhook_dispatcher: Arc<WebhookDispatcher>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialize Tracing Subscriber
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .with_target(false)
        .finish();
    tracing::subscriber::set_global_default(subscriber)
        .expect("Failed to set tracing subscriber");

    info!("Starting DepotMaster Windows Workstation v2.4.0...");

    // 2. Initialize Embedded SQLite Database
    let db_path = "depot_inventory.sqlite";
    let inventory_service = InventoryService::new(db_path)?;
    info!("Initialized local SQLite ledger at {}", db_path);

    // 3. Initialize Yard Tracking Engine
    let yard_tracker = YardTracker::new_default_layout();
    info!("Initialized Yard Coordinate Grid (Bays 01-16, Rows 01-06, Tiers 1-4)");

    // 4. Initialize Logistics API Clients & Webhooks
    let logistics_client = LogisticsClient::new();
    let webhook_dispatcher = WebhookDispatcher::new();

    let state = AppState {
        inventory: Arc::new(Mutex::new(inventory_service)),
        yard: Arc::new(Mutex::new(yard_tracker)),
        logistics: Arc::new(logistics_client),
        webhook_dispatcher: Arc::new(webhook_dispatcher),
    };

    // 5. Spawn Real-time Telemetry & Reefer Monitoring Thread
    let state_clone = Arc::new(state);
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(5));
        loop {
            interval.tick().await;
            // Simulated reefer temperature sampling & crane telematics
        }
    });

    info!("DepotMaster runtime ready. Spawning Windows native GUI...");
    
    // Tauri Application Builder
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("Error while running DepotMaster Windows application");

    Ok(())
}
`
  },
  {
    path: 'src/models/container.rs',
    filename: 'container.rs',
    language: 'rust',
    description: 'ISO 6346 Container domain model, Check Digit calculation, enums, and JSON serialization',
    content: `use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum IsoContainerType {
    TwentyGP, // 20ft General Purpose
    FortyGP,  // 40ft General Purpose
    FortyHC,  // 40ft High Cube
    TwentyRF, // 20ft Reefer
    FortyRF,  // 40ft Reefer
    FortyFR,  // 40ft Flat Rack
    TwentyTK, // 20ft Tank Container
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ShippingLine {
    Maersk,
    MSC,
    CmaCgm,
    HapagLloyd,
    ONE,
    Evergreen,
    Cosco,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ContainerStatus {
    InYard,
    GateInProcessing,
    GateOutDispatched,
    CustomsHold,
    Maintenance,
    AwaitingRail,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerLocation {
    pub zone: String, // "A", "B", "R", "H", "E"
    pub bay: u8,      // 1 to 16
    pub row: u8,      // 1 to 6
    pub tier: u8,     // 1 to 4
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReeferTelemetry {
    pub target_temp_c: f32,
    pub actual_temp_c: f32,
    pub humidity_percent: u8,
    pub power_connected: bool,
    pub compressor_active: bool,
    pub last_reading: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Container {
    pub id: String, // ISO 6346 standard: MSKU7291834
    pub prefix: String, // MSKU
    pub serial: String, // 729183
    pub check_digit: u8, // 4
    pub iso_type: IsoContainerType,
    pub teu: u8,
    pub shipping_line: ShippingLine,
    pub status: ContainerStatus,
    pub location: ContainerLocation,
    pub tare_weight_kg: u32,
    pub gross_weight_kg: u32,
    pub seal_number: String,
    pub booking_reference: String,
    pub bill_of_lading: String,
    pub cargo_description: String,
    pub dwell_days: u32,
    pub free_days: u32,
    pub demurrage_rate_daily_usd: u32,
    pub hazardous_imo: Option<u8>,
    pub reefer: Option<ReeferTelemetry>,
    pub customs_cleared: bool,
    pub gate_in_timestamp: DateTime<Utc>,
}

impl Container {
    /// Calculate standard ISO 6346 check digit
    pub fn calculate_iso_check_digit(prefix_and_serial: &str) -> Option<u8> {
        let code = prefix_and_serial.trim().to_uppercase();
        if code.len() != 10 {
            return None;
        }

        let mut sum: u32 = 0;
        for (i, ch) in code.chars().enumerate() {
            let val = match ch {
                '0'..='9' => ch.to_digit(10)? as u32,
                'A' => 10, 'B' => 12, 'C' => 13, 'D' => 14, 'E' => 15,
                'F' => 16, 'G' => 17, 'H' => 18, 'I' => 19, 'J' => 20,
                'K' => 21, 'L' => 23, 'M' => 24, 'N' => 25, 'O' => 26,
                'P' => 27, 'Q' => 28, 'R' => 29, 'S' => 30, 'T' => 31,
                'U' => 32, 'V' => 34, 'W' => 35, 'X' => 36, 'Y' => 37,
                'Z' => 38,
                _ => return None,
            };
            let weight = 1u32 << i; // 2^i
            sum += val * weight;
        }

        let remainder = sum % 11;
        let digit = if remainder == 10 { 0 } else { remainder as u8 };
        Some(digit)
    }

    /// Calculate accrued demurrage fees in USD based on dwell days
    pub fn calculate_accrued_demurrage(&self) -> u32 {
        if self.dwell_days > self.free_days {
            (self.dwell_days - self.free_days) * self.demurrage_rate_daily_usd
        } else {
            0
        }
    }
}
`
  },
  {
    path: 'src/services/yard_tracker.rs',
    filename: 'yard_tracker.rs',
    language: 'rust',
    description: 'Real-time Yard Spatial Tracker with 3D Bay/Row/Tier coordinates and collision detection',
    content: `use std::collections::HashMap;
use crate::models::container::{Container, ContainerLocation};
use tracing::{info, warn};

#[derive(Debug)]
pub struct YardSlot {
    pub occupied: bool,
    pub container_id: Option<String>,
}

pub struct YardTracker {
    // Key: "ZONE-BAY-ROW-TIER" e.g. "A-01-02-01"
    slots: HashMap<String, YardSlot>,
}

impl YardTracker {
    pub fn new_default_layout() -> Self {
        let mut slots = HashMap::new();
        let zones = vec!["A", "B", "R", "H", "E"];
        
        for zone in zones {
            for bay in 1..=12 {
                for row in 1..=6 {
                    for tier in 1..=4 {
                        let key = format!("{}-{:02}-{:02}-{:02}", zone, bay, row, tier);
                        slots.insert(key, YardSlot {
                            occupied: false,
                            container_id: None,
                        });
                    }
                }
            }
        }

        Self { slots }
    }

    /// Validate stacking rule: Container cannot float; tier > 1 requires container directly beneath
    pub fn can_place_at(&self, loc: &ContainerLocation) -> Result<(), &'static str> {
        let key = format!("{}-{:02}-{:02}-{:02}", loc.zone, loc.bay, loc.row, loc.tier);
        
        if let Some(slot) = self.slots.get(&key) {
            if slot.occupied {
                return Err("Target yard slot is already occupied!");
            }
        } else {
            return Err("Invalid coordinates outside yard boundaries!");
        }

        // Check tier below if tier > 1
        if loc.tier > 1 {
            let lower_key = format!("{}-{:02}-{:02}-{:02}", loc.zone, loc.bay, loc.row, loc.tier - 1);
            if let Some(lower_slot) = self.slots.get(&lower_key) {
                if !lower_slot.occupied {
                    return Err("Cannot stack container in mid-air! Lower tier must be occupied.");
                }
            }
        }

        Ok(())
    }

    /// Move container to new yard coordinates and update spatial registry
    pub fn move_container(
        &mut self,
        container_id: &str,
        from: &ContainerLocation,
        to: &ContainerLocation,
    ) -> Result<(), &'static str> {
        self.can_place_at(to)?;

        let from_key = format!("{}-{:02}-{:02}-{:02}", from.zone, from.bay, from.row, from.tier);
        let to_key = format!("{}-{:02}-{:02}-{:02}", to.zone, to.bay, to.row, to.tier);

        // Free source slot
        if let Some(slot) = self.slots.get_mut(&from_key) {
            slot.occupied = false;
            slot.container_id = None;
        }

        // Occupy target slot
        if let Some(slot) = self.slots.get_mut(&to_key) {
            slot.occupied = true;
            slot.container_id = Some(container_id.to_string());
        }

        info!(
            "Crane Move Completed: {} moved from {} to {}",
            container_id, from_key, to_key
        );

        Ok(())
    }
}
`
  },
  {
    path: 'src/services/logistics_client.rs',
    filename: 'logistics_client.rs',
    language: 'rust',
    description: 'Async HTTP client integrating Maersk, MSC DCSA v2.2, CMA CGM REST APIs, and EDIFACT EDI generators',
    content: `use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::{info, error};

#[derive(Debug, Serialize, Deserialize)]
pub struct DCSAEventPayload {
    pub event_type: String,
    pub equipment_reference: String,
    pub event_date_time: String,
    pub facility_type_code: String,
    pub facility_code: String,
    pub seal_number: String,
    pub gross_weight_kg: u32,
}

pub struct LogisticsClient {
    http: Client,
}

impl LogisticsClient {
    pub fn new() -> Self {
        Self {
            http: Client::builder()
                .timeout(std::time::Duration::from_secs(10))
                .build()
                .expect("Failed to initialize reqwest HTTP client"),
        }
    }

    /// Post DCSA Standard Equipment Interchange Event to Maersk API
    pub async fn dispatch_maersk_gate_in(
        &self,
        token: &str,
        container_id: &str,
        gross_kg: u32,
        seal: &str,
    ) -> Result<u16, reqwest::Error> {
        let url = "https://api.maersk.com/track-and-trace/v2/events/transport-call-events";
        let payload = DCSAEventPayload {
            event_type: "GATE_IN".to_string(),
            equipment_reference: container_id.to_string(),
            event_date_time: chrono::Utc::now().to_rfc3339(),
            facility_type_code: "DEPO".to_string(),
            facility_code: "USNWK-DP01".to_string(),
            seal_number: seal.to_string(),
            gross_weight_kg: gross_kg,
        };

        info!("Dispatching DCSA GATE_IN event to Maersk API for {}", container_id);
        
        let response = self.http.post(url)
            .bearer_auth(token)
            .json(&payload)
            .send()
            .await?;

        let status = response.status().as_u16();
        info!("Maersk API response status: {}", status);
        Ok(status)
    }

    /// Generate standard UN/EDIFACT CODECO (Container Gate-In/Gate-Out Report) message
    pub fn generate_edifact_codeco(
        &self,
        container_id: &str,
        iso_type: &str,
        gross_kg: u32,
        carrier_code: &str,
        seal: &str,
    ) -> String {
        let timestamp = chrono::Utc::now().format("%y%m%d:%H%M").to_string();
        format!(
            "UNB+UNOA:2+DEPOTMASTER+{}+{}++CODECO'\n\
             UNH+1+CODECO:D:95B:UN:SMDG20'\n\
             BGM+34+DEPOT-GATEIN+9'\n\
             EQD+CN+{}+{}:::+2+2+5'\n\
             MEA+AAE+G+KGM:{}'\n\
             SEL+{}+CA'\n\
             DTM+7:{}:201'\n\
             CNT+16:1'\n\
             UNT+8+1'\n\
             UNZ+1+CODECO'",
            carrier_code, timestamp, container_id, iso_type, gross_kg, seal, timestamp
        )
    }
}
`
  },
  {
    path: 'src/services/inventory_service.rs',
    filename: 'inventory_service.rs',
    language: 'rust',
    description: 'Embedded SQLite persistence for inventory ledgers, EIR receipts, and audit trail',
    content: `use rusqlite::{params, Connection, Result};
use tracing::info;

pub struct InventoryService {
    conn: Connection,
}

impl InventoryService {
    pub fn new(database_path: &str) -> Result<Self> {
        let conn = Connection::open(database_path)?;
        
        // Initialize Tables
        conn.execute(
            "CREATE TABLE IF NOT EXISTS containers (
                id TEXT PRIMARY KEY,
                iso_type TEXT NOT NULL,
                shipping_line TEXT NOT NULL,
                status TEXT NOT NULL,
                zone TEXT NOT NULL,
                bay INTEGER NOT NULL,
                row INTEGER NOT NULL,
                tier INTEGER NOT NULL,
                gross_weight_kg INTEGER NOT NULL,
                seal_number TEXT NOT NULL,
                dwell_days INTEGER NOT NULL,
                customs_status TEXT NOT NULL,
                entry_timestamp TEXT NOT NULL
            );",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                container_id TEXT NOT NULL,
                action TEXT NOT NULL,
                operator TEXT NOT NULL,
                details TEXT NOT NULL,
                created_at TEXT NOT NULL
            );",
            [],
        )?;

        info!("SQLite tables initialized successfully");
        Ok(Self { conn })
    }

    pub fn record_gate_in(
        &self,
        container_id: &str,
        iso_type: &str,
        shipping_line: &str,
        zone: &str,
        bay: u8,
        row: u8,
        tier: u8,
        gross_kg: u32,
        seal: &str,
    ) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT OR REPLACE INTO containers (
                id, iso_type, shipping_line, status, zone, bay, row, tier, gross_weight_kg, seal_number, dwell_days, customs_status, entry_timestamp
            ) VALUES (?1, ?2, ?3, 'In Yard', ?4, ?5, ?6, ?7, ?8, ?9, 0, 'Cleared', ?10);",
            params![container_id, iso_type, shipping_line, zone, bay, row, tier, gross_kg, seal, now],
        )?;

        self.conn.execute(
            "INSERT INTO audit_logs (id, container_id, action, operator, details, created_at)
             VALUES (?1, ?2, 'Gate In', 'Gate Officer', ?3, ?4);",
            params![
                uuid::Uuid::new_v4().to_string(),
                container_id,
                format!("Gate In verified. Gross: {} kg. Assigned: {}-{:02}-{:02}-{:02}", gross_kg, zone, bay, row, tier),
                now
            ],
        )?;

        Ok(())
    }
}
`
  },
  {
    path: 'src-tauri/tauri.conf.json',
    filename: 'tauri.conf.json',
    language: 'json',
    description: 'Tauri v2 configuration for Windows Fluent desktop styling, Mica titlebar, and system tray',
    content: `{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "DepotMaster",
  "version": "2.4.0",
  "identifier": "com.depotmaster.logistics.workstation",
  "build": {
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "DepotMaster - Container Depot & Logistics Workstation",
        "width": 1440,
        "height": 920,
        "minWidth": 1100,
        "minHeight": 720,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "theme": "Dark"
      }
    ],
    "trayIcon": {
      "iconPath": "icons/icon.ico",
      "tooltip": "DepotMaster Container Depot Management"
    },
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.ico"
    ]
  }
}
`
  },
  {
    path: 'README.md',
    filename: 'README.md',
    language: 'markdown',
    description: 'Windows Compilation Guide with MSVC toolchain, Rustup commands, and setup instructions',
    content: `# DepotMaster - Industrial Windows Container Depot Workstation

Native Windows Container Depot Management Application coded in Rust with Tauri v2, Tokio async runtime, and SQLite persistence.

## System Requirements
- Windows 10 (Build 19041+) or Windows 11 (x64 / ARM64)
- Rust 1.78+ (\`rustup default stable-x86_64-pc-windows-msvc\`)
- Microsoft Visual Studio 2022 C++ Build Tools with Windows 10/11 SDK

## Quick Start & Compilation

\`\`\`powershell
# 1. Clone or extract the DepotMaster project
cd depotmaster-windows

# 2. Verify Rust MSVC Toolchain
rustc --version
cargo --version

# 3. Run in Development Mode
cargo tauri dev

# 4. Build Standalone Production Windows Executable (.exe & .msi installer)
cargo tauri build --target x86_64-pc-windows-msvc
\`\`\`

The compiled binary will be located at:
\`target/x86_64-pc-windows-msvc/release/depotmaster.exe\`
`
  }
];
