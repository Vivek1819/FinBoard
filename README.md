## FinBoard – Customizable Finance Dashboard

A customizable, real-time finance dashboard built with **Next.js App Router**, allowing users to create, configure, and manage finance widgets using live data from multiple financial APIs.

This project was developed as part of the **Groww Web Intern Assignment**.

---

## Live Demo

🔗 **Live Application:** https://fin-board-chi.vercel.app/ \
🔗 **GitHub Repository:** https://github.com/Vivek1819/FinBoard

---

## Assignment Overview

**Objective:**
Build a customizable finance dashboard where users can:

* Connect to financial APIs
* Select fields dynamically from API responses
* Display data using configurable widgets
* Persist dashboard state across sessions

**Developer:** Vivek Hipparkar

---

## UI Screenshots

<img width="1913" height="783" alt="image" src="https://github.com/user-attachments/assets/6396836f-2395-4bb6-8d5b-2befa3a4b11a" />

<img width="1819" height="793" alt="image" src="https://github.com/user-attachments/assets/395bc4f3-e5f4-4c21-8821-79011bc0fbbc" />

<img width="1889" height="797" alt="image" src="https://github.com/user-attachments/assets/55a67e75-d4b5-4a3a-95ea-40305c27f97d" />

<img width="1891" height="737" alt="image" src="https://github.com/user-attachments/assets/c80aaf82-5aba-4e36-a08c-de48e3705ecb" />

---

## Features Implemented

### 1. Widget Management

* Add / remove widgets
* Supported widget types:

  * **Card Widgets**

    * Watchlist
    * Market Gainers
    * Performance
    * Financial Data
  * **Table Widgets**

    * Search, filter, sort, pagination
  * **Chart Widgets**

    * Line chart
    * Candlestick chart
* Drag & drop widget reordering
* Individual widget configuration modals

---

### 1.5. Dashboard Templates (Bonus)

To improve onboarding and usability, the dashboard supports **pre-built templates** that allow users to instantly set up a complete dashboard layout.

Available templates include:
- **Stock Trader** – Live stock prices, charts, and performance widgets
- **Crypto Trader** – Cryptocurrency market overview and price tracking
- **Market Overview** – High-level market snapshot using mixed widgets

**How it works:**
- Users can open the Templates selector from the App Header
- Each template represents a predefined set of widget configurations
- Applying a template **replaces the current dashboard widgets**
- A confirmation dialog is shown before applying a template
- Applied templates remain fully editable (widgets can be reconfigured or removed)

This feature is built on top of the same widget configuration system and does not introduce any template-specific rendering logic.

---

### 2. API Integration

Integrated with multiple financial data sources:

* **Alpha Vantage** – Stock time series (charts)
* **Finnhub** – Stock quotes & performance
* **Indian Stock API** – Indian market data
* **CoinGecko** – Cryptocurrency market data

#### API Handling

* API response normalization
* Rate-limit aware error handling
* In-memory + TTL based caching to reduce redundant calls

---

### 3. Advanced Field Selection (Key Highlight)

* **Interactive JSON Field Selector**
* Automatically builds a hierarchical tree from API responses
* Supports:

  * Nested field grouping
  * Collapsible sections
  * Select entire sub-groups
  * Indeterminate checkbox states
* Used during:

  * Widget creation
  * Widget configuration (settings)

---

### 4. Dashboard Persistence

* Full dashboard state saved in `localStorage`
* Restores widgets, layout, and settings on refresh
* Export / import dashboard configuration as JSON

---

### 5. UI & UX

* Clean, responsive layout
* WidgetShell abstraction for consistent behavior
* Skeleton loaders and error states
* Empty, invalid and rate limit exceeded state handling
* **Theme toggle (light / dark)** with persisted user preference
* Respects system color scheme on first load
---

## Tech Stack

### Frontend

* **Next.js (App Router)**
* **React**
* **TypeScript**

### Styling & UI

* Tailwind CSS
* Lucide Icons
* Custom UI components

### State Management

* Zustand (lightweight and performant)

### Data Visualization

* Recharts

---

## Project Structure

```
finboard/
├── app/
│   ├── api/
│   │   ├── alpha-vantage/
│   │   ├── finnhub/
│   │   └── indian-stock/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── dashboard/
│   ├── field-selector/
│   ├── ui/
│   └── widgets/
│       ├── WidgetShell.tsx
│       ├── CardWidget.tsx
│       ├── TableWidget.tsx
│       ├── ChartWidget.tsx
│       └── config-modals/
│
├── lib/
│   ├── adapters/
│   ├── apiCache.ts
│   ├── dashboardTemplates.ts
│   ├── extractFields.ts
│   ├── normalizeApiResponse.ts
│   ├── dashboardExport.ts
│   └── dashboardImport.ts
│
├── store/
│   └── useDashboardStore.ts
│
├── types/
│   └── widget.ts
│
├── README.md
└── package.json
```

---

## Getting Started (Local Setup)

### Prerequisites

* Node.js 18+

### Installation

```bash
git clone https://github.com/Vivek1819/FinBoard.git
cd finboard
npm install
```

### Environment Variables

Create `.env.local`:

```env
INDIAN_API_KEY=your_key
ALPHAVANTAGE_API_KEY=your_key
FINNHUB_API_KEY=your_key
```

### Run Locally

```bash
npm run dev
```

Open: `http://localhost:3000`

---

## Design Decisions

* **WidgetShell abstraction** to standardize loading/error states
* **Normalized API layer** to decouple UI from API shapes
* **Field selection UI** built from API responses instead of hardcoded configs
* **Time-based caching** to avoid API rate-limit issues
* **Stateless widget rendering**, driven entirely by config
* **Template system built using reusable widget configurations**, ensuring templates remain fully editable and consistent with manually created dashboards


---

## Known Limitations

* Free-tier API rate limits
* Polling-based updates (no WebSockets)
* LocalStorage size limits for very large dashboards

---

## Submission Notes

* Assignment requirements fully implemented
* Focused on correctness, extensibility, and UX clarity
* Code structured for easy future enhancements
* Includes bonus Dashboard Templates to improve first-time user experience


---

## Contact

**Vivek Hipparkar** \
GitHub: https://github.com/Vivek1819 \
Email: vivekhipparkar@gmail.com
