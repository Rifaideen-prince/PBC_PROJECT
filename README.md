# THERMALAB — Smart Comparative Thermal Response Testing Platform

> **University Materials Science and Engineering Investigation**  
> *Comparative Cooling Response of Polymer-Based Packaging Insulation Configurations*

THERMALAB is a scientific experimental platform and instrumentation suite designed for precision comparative thermal analysis. The system records, visualizes, and evaluates the transient cooling response of warm water contained in two identical vessels: an uninsulated **Reference Container** and an insulated **Test Container** (fitted with **Bubble Wrap** or **Packaging Foam**).

Real-time telemetry is streamed from dual waterproof **DS18B20** digital temperature probes and a **DHT22** ambient sensor via an **ESP32** microcontroller over USB Web Serial (115200 baud).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Installation & Setup](#4-installation--setup)
5. [Local Development](#5-local-development)
6. [Testing Suite](#6-testing-suite)
7. [Production Build & Vercel Deployment](#7-production-build--vercel-deployment)
8. [USB Web Serial Connection Protocol](#8-usb-web-serial-connection-protocol)
9. [ESP32 Firmware Message Specification](#9-esp32-firmware-message-specification)
10. [Demo Mode & Benchmark Datasets](#10-demo-mode--benchmark-datasets)
11. [Scientific Experimental Methodology](#11-scientific-experimental-methodology)
12. [Calculations & Performance Equations](#12-calculations--performance-equations)
13. [Data Backup, Restoration, & Exports](#13-data-backup-restoration--exports)
14. [Known Scientific Limitations](#14-known-scientific-limitations)

---

## 1. Project Overview

THERMALAB provides a complete, modern scientific engineering interface across **five primary dashboards**:

- **Main Dashboard (`/`)**: Real-time telemetry overview for all probes, hardware health diagnostics, last valid reading timestamps, recent laboratory runs, and IndexedDB storage metrics.
- **Live Experiment (`/live`)**: Active recording console with apparatus pre-flight checklist, dynamic Newton cooling graph (1 Hz water temperature), pause/resume safeguards, and raw measurement exports.
- **Comparative Analysis (`/analysis`)**: Dedicated **3-Graph Layout** comparing Bubble Wrap and Packaging Foam against the normalized average reference cooling curve, complete with cooling rate reductions and material ranking.
- **3D Model Viewer (`/viewer`)**: CAD apparatus visualizer built on Three.js with OBJ/MTL loader, technical grid, XYZ axes, 7 standard viewpoints (ISO, FRONT, BACK, LEFT, RIGHT, TOP, BOTTOM), and multi-mode rendering (Solid, Wireframe, Solid + Wire).
- **Reports & Project Info (`/reports`)**: Academic report generator with print-to-PDF formatting, data-backed empirical conclusions, raw CSV / summary CSV downloads, and full JSON backup/restore.

---

## 2. Technology Stack

- **Core & Runtime**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (custom dark scientific engineering design system)
- **Routing**: React Router 7 (SPA client-side navigation)
- **Data Visualization**: Recharts (multi-curve time-series telemetry charts)
- **3D Graphics Engine**: Three.js, `OBJLoader`, `OrbitControls`
- **Hardware Interface**: Web Serial API (Chrome / Edge desktop native)
- **Local Persistence**: IndexedDB via Dexie.js (offline storage without server dependencies)
- **Icons**: Lucide React
- **Unit & Integration Testing**: Vitest, React Testing Library, `fake-indexeddb`
- **Target Deployment**: Vercel (`vercel.json` SPA rewrite configured)

---

## 3. System Architecture

```
PBC_PROJECT/
├── public/
│   ├── models/
│   │   └── apparatus.obj            # Bundled 3D apparatus model
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── charts/                  # Live, Comparison (3-graph), and Sample charts
│   │   ├── common/                  # Button, Card, Modal, Badge, EmptyState
│   │   ├── experiments/             # Setup forms, Checklists, Controls, Metadata modals
│   │   ├── layout/                  # Collapsible Sidebar, Topbar, DashboardLayout
│   │   ├── sensors/                 # SensorCard, ConnectionStatus, Diagnostics
│   │   └── viewer3d/                # Three.js Canvas, StandardViews, Controls, Info
│   ├── context/
│   │   ├── SerialContext.tsx        # Web Serial stream & sensor health provider
│   │   └── ExperimentContext.tsx    # Live recording, pause/resume, and storage state
│   ├── pages/                       # 5 Core Dashboard pages
│   ├── services/
│   │   ├── analysisService.ts       # Alignment & metric computation
│   │   ├── demoDataService.ts       # Deterministic Newton cooling model
│   │   ├── exportService.ts         # CSV & JSON export generation
│   │   ├── reportService.ts         # Empirical report compiler
│   │   ├── serialParser.ts          # Line buffering & JSON validation
│   │   ├── serialService.ts         # Web Serial port lifecycle manager
│   │   └── storageService.ts        # Dexie IndexedDB repository
│   ├── test/                        # Vitest test suites (42 unit tests)
│   ├── types/                       # TypeScript interfaces
│   ├── utils/                       # Calculations, time alignment, validation
│   ├── App.tsx                      # Root component
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Tailwind CSS & print media rules
│   └── routes.tsx                   # Route definitions
├── vercel.json                      # Vercel SPA rewrites
├── tailwind.config.js               # Engineering dark color tokens
├── vite.config.ts                   # Vite & Vitest configuration
└── package.json
```

---

## 4. Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **Browser**: Google Chrome or Microsoft Edge on desktop (required for Web Serial API hardware connectivity)

### Installation
Clone or navigate to the project directory and install dependencies:

```bash
npm install
```

---

## 5. Local Development

Start the Vite development server:

```bash
npm run dev
```

Open your browser to `http://localhost:5173/`.

---

## 6. Testing Suite

THERMALAB includes a test suite covering mathematical cooling calculations, non-extrapolating time alignment, serial line parsing, IndexedDB persistence, and UI integration.

Run all tests via Vitest:

```bash
npm run test
```

### Test Coverage Highlights
- **Calculations (`calculations.test.ts`)**: $\Delta T$, cooling rates (°C/min), zero-rate denominator protections, temperature differences, and material ranking.
- **Time Alignment (`timeAlignment.test.ts`)**: Bounded interpolation, tolerance gaps, non-extrapolation outside boundary points, and run compatibility validation.
- **Serial Parser (`serialParser.test.ts`)**: Chunked line buffering, DS18B20 disconnect sentinel detection (`-127.0 °C` and `+85.0 °C`), malformed JSON resilience, and status packet decoding.
- **Storage Service (`storage.test.ts`)**: IndexedDB CRUD operations, non-destructive metadata updates preserving immutable readings, and conflict-free JSON imports.
- **UI & Navigation (`ui.test.tsx`)**: Dashboard routing, status badges, empty states, and demo mode disclaimers.

---

## 7. Production Build & Vercel Deployment

### Build Locally
To compile the TypeScript project and generate the production bundle:

```bash
npm run build
```

The production output is placed into `dist/`.

### Vercel Deployment
The repository includes `vercel.json` configured with SPA rewrites:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

1. Push this repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com/), click **New Project** and import the repository.
3. Framework Preset: **Vite**.
4. Root Directory: `./`.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Click **Deploy**.

*Note: Web Serial API requires HTTPS in production, which Vercel provides by default.*

---

## 8. USB Web Serial Connection Protocol

1. Connect the ESP32 microcontroller to your computer via USB.
2. Ensure the **Arduino IDE Serial Monitor** or any other terminal accessing the port is **completely closed**.
3. In THERMALAB, click the **Connect ESP32** button located in the top navigation bar or the Main Dashboard.
4. When prompted by your browser, select the serial port (e.g., `Silicon Labs CP210x` or `CH340`) and click **Connect**.
5. The connection indicator will transition to `CONNECTED` (green pulse), and sensor values will update in real time.
6. To disconnect safely, click the **Disconnect** button.

---

## 9. ESP32 Firmware Message Specification

The ESP32 firmware must emit newline-delimited JSON strings (`\n`) at **115200 baud**:

### Live Measurement Object (`type: "reading"`)
```json
{
  "type": "reading",
  "sequence": 42,
  "elapsed_ms": 42000,
  "reference_temp": 58.42,
  "sample_temp": 57.91,
  "ambient_temp": 25.4,
  "humidity": 46.2
}
```

| Field | Type | Description |
|---|---|---|
| `type` | string | Constant `"reading"` |
| `sequence` | integer | Incrementing packet sequence counter |
| `elapsed_ms` | integer | Elapsed milliseconds since firmware start |
| `reference_temp` | float / null | Water temperature in Uninsulated Reference vessel (°C) |
| `sample_temp` | float / null | Water temperature in Insulated Test vessel (°C) |
| `ambient_temp` | float / null | Ambient air temperature from DHT22 (°C) |
| `humidity` | float / null | Relative air humidity from DHT22 (%) |

### Hardware Status Object (`type: "status"`)
```json
{
  "type": "status",
  "device": "THERMALAB-ESP32",
  "firmware_version": "1.0.0"
}
```

### Sentinel Value Filtering
THERMALAB automatically flags and rejects common digital hardware sentinels:
- **`-127.0 °C`**: DS18B20 wire disconnection sentinel.
- **`+85.0 °C`**: DS18B20 power-on reset state prior to conversion.
- Null or non-finite values are never converted to zero; they display as `--` to maintain scientific integrity.

---

## 10. Demo Mode & Benchmark Datasets

THERMALAB features a dedicated, deterministically synthesized **Demo Mode** for testing without physical hardware:

1. Click **Demo Mode** in the top navigation bar or **Load Demo Runs** on the Main Dashboard.
2. A prominent banner displays:  
   `DEMO DATA — NOT REAL SENSOR MEASUREMENTS | Synthetic Newton Cooling Model Active`
3. Two benchmark experimental datasets are automatically stored in IndexedDB:
   - **`[DEMO] Bubble Wrap Configuration Test`** (15-min run, $k_{sample} = 0.00108 \text{ s}^{-1}$)
   - **`[DEMO] Packaging Foam Configuration Test`** (15-min run, $k_{sample} = 0.00078 \text{ s}^{-1}$)
4. Users can inspect the full 3-graph comparative layout, test rankings, export CSVs, and preview printable reports.
5. Click **Exit Demo** to return to standard hardware mode.

---

## 11. Scientific Experimental Methodology

1. **Vessel Preparation**: Two identical glass or acrylic containers are cleaned and dried.
2. **Insulation Application**: The selected material (Bubble Wrap or Packaging Foam) is wrapped uniformly around the circumference and base of the Test Container. The Reference Container remains uninsulated.
3. **Probe Positioning**: DS18B20 temperature probes are mounted vertically so the probe tip resides at the geometric volumetric centroid of each container without touching the container walls.
4. **Water Dispensation**: 250 mL of warm water (target 75 °C) is poured simultaneously into both vessels to ensure equal starting thermal conditions.
5. **Pre-flight Checklist**: The operator reviews and confirms the 5-point verification checklist on the Live Experiment screen.
6. **Data Recording**: Telemetry is acquired at 1 Hz for the target duration (typically 15 to 30 minutes).

---

## 12. Calculations & Performance Equations

### 1. Total Temperature Drop ($\Delta T$)
$$\Delta T = T_{\text{initial}} - T_{\text{final}}$$

### 2. Average Cooling Rate ($R$)
$$R = \frac{T_{\text{initial}} - T_{\text{final}}}{t_{\text{elapsed}} \text{ (minutes)}} \quad [^\circ\text{C/min}]$$

### 3. Temperature Difference ($Diff(t)$)
$$\text{Difference}(t) = T_{\text{ref, avg}}(t) - T_{\text{sample}}(t)$$
*A positive difference indicates the uninsulated reference is warmer than the sample.*

### 4. Cooling-Rate Reduction Percentage
$$\text{Reduction (\%)} = \left( \frac{R_{\text{reference}} - R_{\text{sample}}}{R_{\text{reference}}} \right) \times 100$$
*Calculated strictly when $R_{\text{reference}} > 0.001 ^\circ\text{C/min}$.*

---

## 13. Data Backup, Restoration, & Exports

- **Raw Readings CSV**: Exports all sequence numbers, elapsed seconds, device timestamps, received timestamps, temperatures, and validity flags.
- **Summary CSV**: Exports comparative configuration metrics across all recorded laboratory sessions.
- **JSON Backup**: Full JSON export encapsulating complete experiment metadata and raw telemetry arrays.
- **JSON Restoration**: Uploading a backup validates schema integrity and re-indexes the run without overwriting existing data.
- **Printable Report**: Formatted according to academic publication standards (`@media print` strips interactive UI elements and prepares clean page breaks).

---

## 14. Known Scientific Limitations

1. **Transient Ambient Convection**: Natural room air drafts affect boundary layer heat loss unless an environmental chamber is used.
2. **Interfacial Thermal Resistance**: Wrapping tightness varies slightly between operators, introducing variable contact resistance.
3. **Container Thermal Mass**: Heat capacity of the container vessel slightly damps early transient rates.
4. **System Response vs. Material Property**: The platform evaluates total container-insulation assembly heat retention under tested ambient conditions, not the intrinsic material thermal conductivity ($k$-value).

---

## License

Developed for University Materials Science & Engineering Laboratory Investigations. MIT License.
