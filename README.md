# Monthly Finance Manager System

> Fast, Excel-sheet-style desktop personal finance app for managing monthly salary and extra incomes across **Mandatory**, **Fun Spending**, and **Savings / Debt** — with instant tap-to-edit cells, immediate fee cuts, and deep analytics.

---

## Layout (3 Excel Sheets)

- **Sheet1: Monthly Budget**
  1. **Salary & Extra Income (Top-Left)** — Tap the highlighted green **Monthly Salary** cell to type or update your salary anytime, plus a `+` yellow row right underneath for extra incomes (freelance, bonuses, side cash).
  2. **Budget Split & Live Balances (Top-Right)** — Live Excel table dividing total income across **Mandatory (Red)**, **Fun Spending (Yellow)**, and **Savings / Debt (Green)**. Tap any split `%` cell to edit or click a preset (`50/30/20`, `50/20/30`, `60/20/20`, `50/10/40`).
  3. **Fees & Expenses Sheet (Main Grid)** — Full Excel-style grid (`A · Date`, `B · Fee`, `C · Bucket`, `D · Category`, `E · Status`, `F · Cut`, `G · %`). Type in the pinned yellow `+` row and press `Enter` to cut a fee immediately, or tap **any existing cell** to edit it directly in place.
- **Sheet2: Analytics**
  - Financial indicator strip, Budget vs. Fees Cut chart, Spending Breakdown donut (by Bucket or Category), Daily Remaining Cashflow burn-down, Multi-Month History chart, and sortable Category Breakdown Pivot Table.
- **Sheet3: Settings**
  - Currency picker, custom categories per bucket, CSV export, JSON backup/restore, and 1-click blank reset.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Alt + S` | Jump straight to the **Monthly Salary** cell |
| `Alt + E` | Jump straight to the **Quick-Add Fee** row |
| `/` | Focus sheet search |
| `1` / `2` / `3` | Switch between Sheet1, Sheet2, and Sheet3 |

---

## Run Locally

```bash
npm install
npm start       # Build and launch desktop app
npm run dev     # Launch desktop app with live hot-reload
npm test        # Run calculation unit tests
```

## License

MIT © Ahmad
