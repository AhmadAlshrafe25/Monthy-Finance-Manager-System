# Monthly Finance Manager System

> Fast, table-first desktop personal finance application for splitting monthly salary and extra incomes into **Mandatory**, **Fun Spending**, and **Savings / Debt** buckets — with instant real-time fee deductions and deep analytics.

![Electron](https://img.shields.io/badge/Desktop-Electron-47848F?style=flat-square&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/UI-React%2019-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-34D399?style=flat-square)

---

## Core Workflow

1. **Log Salary & Extra Incomes**
   - Add your monthly salary plus any side income, freelance payments, bonuses, or refunds.
   - Automatically split every inflow across **Mandatory**, **Fun Spending**, and **Savings / Debt** using your custom monthly ratio (default `50 / 30 / 20`, with one-click presets or custom percentages), or route a specific bonus 100% directly into a chosen bucket.
2. **Cut Fees Instantly in Spreadsheet-Style Tables**
   - Use the pinned inline quick-add row (`Alt+E`) to enter a fee, choose its bucket & category, and press `Enter`.
   - The fee is cut immediately from the assigned bucket's remaining balance, updating utilization bars, daily safe-to-spend, and overspend alerts in real time.
3. **Deep Analytics Lab**
   - **Bucket Allocation vs. Actual Cut** bar chart
   - **Spending Distribution Donut** (toggleable by Bucket or Category)
   - **Daily Cashflow Burn-Down Curve** (remaining budget vs. cumulative spending)
   - **Multi-Month Income & Bucket Trends**
   - **Bucket Variance Matrix** & sortable **Category Pivot Table**
   - **Live KPIs**: Savings Allocation Rate, Daily Burn Rate, Projected End-of-Month Balance, Safe Daily Fun Spend, Largest Fee, and Top Category.
4. **100% Local & Portable**
   - All data is saved atomically to your local machine (no cloud lock-in).
   - One-click **CSV export** (for Excel/Sheets) and **JSON backup/restore**.
   - Clone recurring salaries and bills into the next month with one click.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Alt + E` | Jump to Quick-Add Fee / Expense row |
| `Alt + I` | Jump to Quick-Add Income row |
| `/` | Focus instant table search/filter |
| `1` | Overview & Split view |
| `2` | Full Tables & Ledger view |
| `3` | Analytics Lab view |
| `4` | Settings & Data view |

---

## Getting Started

### Prerequisites
- Node.js 20+ and npm

### Install & Run Desktop App (Development)
```bash
npm install
npm run dev
```

### Build & Launch Production Desktop App
```bash
npm start
```

### Run Unit Tests
```bash
npm test
```

### Package Standalone Desktop Binary
```bash
# Linux AppImage
npm run package:linux

# Windows Installer
npm run package:win

# macOS DMG
npm run package:mac
```

---

## Project Structure

```text
Monthy-Finance-Manager-System/
├── electron/
│   ├── main.cjs              # Desktop window, atomic local JSON store, native file dialogs
│   └── preload.cjs           # Secure IPC bridge
├── src/
│   ├── types/finance.ts      # Strict financial domain models & bucket metadata
│   ├── lib/
│   │   ├── calculations.ts   # Pure split engine, fee deductions, burn-down & multi-month analytics
│   │   ├── calculations.test.ts
│   │   ├── format.ts         # Currency, date & CSV export helpers
│   │   ├── seed.ts           # Starter demo dataset & default categories
│   │   └── storage.ts        # Desktop IPC storage adapter (with web preview fallback)
│   ├── components/
│   │   ├── Sidebar.tsx       # Navigation, month switcher & shortcut guide
│   │   ├── TopSummaryBar.tsx # Global KPIs & clickable Mandatory / Fun / Savings cards
│   │   ├── BucketSplitBar.tsx# Live split ratio presets & custom editor
│   │   ├── IncomeTable.tsx   # Fast salary & extra income table with inline split breakdown
│   │   ├── ExpenseTable.tsx  # Fast fees ledger with inline quick-add, search, sort & edit
│   │   ├── AnalyticsView.tsx # 4 interactive charts + Bucket Variance & Category Pivot tables
│   │   └── SettingsView.tsx  # Currency, custom categories, JSON/CSV import-export
│   └── App.tsx
└── package.json
```

---

## License

MIT © Ahmad
