# Monthly Finance Manager System

> Fast, Excel-sheet-style desktop personal finance app for managing monthly salary, extra incomes, and salary cuts across customizable budget splits — with individual color-coded expense tables, automatic currency conversion, and rich analytics.

---

## Core Tabs

- **Salary**
  1. **Salary, Extra Income & Cuts** — Tap Row 1 to edit your Monthly Salary directly. Add bonuses, freelance income, or salary deductions (just type a negative number like `-35` to deduct immediately).
  2. **Budget Splits & Live Balances** — Add, rename, recolor (8 high-visibility colors), adjust `%`, auto-balance to `100%`, or delete any budget split.
  3. **Per-Bucket Expense Tables (Max 3 Side-by-Side)** — Each split has its own color-coded Excel expense table with tap-to-edit cells and a pinned yellow `+` quick-add row.
- **Analytics**
  - Monthly indicators (Gross Income, Salary Cuts, Net Income, Total Cut, Remaining, Daily Burn, Projected Month-End), Budget vs. Cut chart, Breakdown Donut (by Bucket or Category), Daily Cashflow Burn-Down, Multi-Month History, and Category Pivot Table.
- **Settings**
  - **Personal Cloud Sync** — Connect your own **Google Drive** (OAuth 2.0 + PKCE), **Microsoft OneDrive** (OAuth 2.0 + PKCE), or any synced **Cloud Folder** (zero-setup) with automatic background sync, manual Push/Pull, and encrypted local token storage.
  - **Currency Converter & Exchange Rates** — Switching currencies automatically converts all salaries, cuts, and monthly fees across every month (with editable rates and optional online Live Rates refresh).
  - **Workflow Preferences** — Toggle next-month recurring rollover, default Paid/Scheduled status, max side-by-side tables (`1`–`3`), and save custom splits as your default template.
  - **Categories Manager & Backups** — Clean tabbed category editor, workbook stats, CSV export, and JSON backup/restore.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Alt + S` | Jump straight to the **Monthly Salary** cell |
| `Alt + E` | Jump straight to the first **Expense Quick-Add** row |
| `/` | Search across all expense tables |
| `1` / `2` / `3` | Switch between **Salary**, **Analytics**, and **Settings** |

---

## Run Locally

```bash
npm install
npm start       # Build and launch desktop app
npm run dev     # Launch desktop app with live hot-reload
npm test        # Run calculation & currency unit tests
```

## License

MIT © Ahmad
