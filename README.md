<div align="center">

# Monthly Finance Manager System

**Fast, Excel-sheet-style desktop application for managing your monthly salary, extra incomes, and salary cuts across customizable budget splits — with instant per-bucket expense tables, real-time currency conversion, personal cloud sync, and deep analytics.**

[![Release](https://img.shields.io/github/v/release/AhmadAlshrafe25/Monthy-Finance-Manager-System?style=for-the-badge&color=16a34a&label=Latest%20Release)](https://github.com/AhmadAlshrafe25/Monthy-Finance-Manager-System/releases/latest)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20Windows-15803d?style=for-the-badge&logo=linux&logoColor=white)](https://github.com/AhmadAlshrafe25/Monthy-Finance-Manager-System/releases/latest)
[![Electron](https://img.shields.io/badge/Electron-35-eab308?style=for-the-badge&logo=electron&logoColor=black)](https://github.com/AhmadAlshrafe25/Monthy-Finance-Manager-System)
[![React](https://img.shields.io/badge/React%2019-TypeScript-dc2626?style=for-the-badge&logo=react&logoColor=white)](https://github.com/AhmadAlshrafe25/Monthy-Finance-Manager-System)
[![License: MIT](https://img.shields.io/badge/License-MIT-16a34a?style=for-the-badge)](./LICENSE)

---

### One-Click Direct Downloads

| Operating System | Format | Direct Download Link (Click to Download) |
| :--- | :--- | :--- |
| **Windows (10 / 11)** | **1-Click Installer (`.exe`)** | [**⬇ Download Windows Setup (`.exe`)**](https://github.com/AhmadAlshrafe25/Monthy-Finance-Manager-System/releases/latest/download/Monthly-Finance-Manager-Windows-Setup.exe) |
| **Windows (10 / 11)** | **Portable No-Install (`.zip`)** | [**⬇ Download Windows Portable (`.zip`)**](https://github.com/AhmadAlshrafe25/Monthy-Finance-Manager-System/releases/latest/download/Monthly-Finance-Manager-Windows-x64.zip) |
| **All Linux Distros** *(Arch, Ubuntu, Debian, Fedora, Mint)* | **Universal `.AppImage`** | [**⬇ Download Linux Universal (`.AppImage`)**](https://github.com/AhmadAlshrafe25/Monthy-Finance-Manager-System/releases/latest/download/Monthly-Finance-Manager-Linux-x86_64.AppImage) |
| **All Linux Distros** *(Arch, Ubuntu, Debian, Fedora, Mint)* | **Portable Archive (`.tar.gz`)** | [**⬇ Download Linux Portable (`.tar.gz`)**](https://github.com/AhmadAlshrafe25/Monthy-Finance-Manager-System/releases/latest/download/Monthly-Finance-Manager-Linux-x64.tar.gz) |

</div>

---

## Quick Run After Downloading

- **Windows (`.exe`)**: Click [**Download Windows Setup (`.exe`)**](https://github.com/AhmadAlshrafe25/Monthy-Finance-Manager-System/releases/latest/download/Monthly-Finance-Manager-Windows-Setup.exe) and double-click to install and launch immediately.
- **Linux (`.AppImage` — works on Arch, Ubuntu, Fedora, Debian, Mint, Manjaro)**:
  ```bash
  chmod +x Monthly-Finance-Manager-Linux-x86_64.AppImage
  ./Monthly-Finance-Manager-Linux-x86_64.AppImage
  ```

---

## Key Features

### 1. Salary Tab (Excel-Style Live Sheet)
- **Auto-Starts on Your Current Month**: Automatically opens on your current calendar month and carries over recurring salary, cuts, and budget splits when advancing with `>`.
- **Salary, Extra Income & Natural `-` Salary Cuts**:
  - Edit your **Monthly Salary** directly in **Row 1**.
  - Add extra income (`+200`) or deduct a salary cut simply by typing a negative number (`-95`) and pressing `Enter` or clicking `+`.
- **Dynamic Budget Splits (Hard `100%` Cap)**:
  - Add, rename, recolor (**8 high-visibility colors**), or delete budget splits (`Mandatory`, `Fun Spending`, `Savings / Debt`, or custom splits).
  - Split percentages are strictly clamped so total allocation **never exceeds `100%`**.
  - The **`Used %`** indicator is the only percentage allowed to go above `100%` (turning bold red) to warn you when you overspend a category.
- **Dedicated Per-Bucket Expense Tables (Max 3 Side-by-Side)**:
  - Every budget split gets its own color-coded Excel expense table with live `Budget / Cut / Left`, a pinned yellow `+` quick-add row, and tap-to-edit cells.

### 2. Analytics Tab
- **Monthly Financial Indicators**: Gross Income, Salary Cuts (`-`), Net Income, Total Expenses Cut, Total Remaining, Daily Burn Rate, and Projected Month-End Balance.
- **4 Interactive Charts**:
  - Budget Allocated vs. Fees Cut per Split
  - Spending Distribution Donut (toggleable by **Bucket** or **Category**)
  - Daily Remaining Budget vs. Cumulative Fees Cut Burn-Down Curve
  - Multi-Month Net Income & Bucket History
- **Category Breakdown Pivot Table**: Sortable by Total Cut, Entries, Average, or `% of Net Income`.

### 3. Settings Tab & Personal Cloud Sync
- **Real Currency Conversion**: Switching currencies (`JOD`, `USD`, `SAR`, `AED`, `EUR`, `GBP`, `EGP`, `KWD`) automatically converts all salaries, negative cuts, and monthly fees across every month using customizable exchange rates (with online **Live Rates** refresh and 1-click Undo).
- **Personal Cloud Sync**:
  - **Google Drive** (Direct OAuth 2.0 + PKCE to your own Drive `appDataFolder`)
  - **Microsoft OneDrive** (Direct OAuth 2.0 + PKCE to your own OneDrive App Folder)
  - **Synced Cloud Folder** (Zero-setup instant sync with any local Google Drive, OneDrive, rclone, GVFS, Dropbox, or Nextcloud folder)
- **Workflow Controls & Portability**: Next-month rollover toggle, default expense status (`Paid` / `Scheduled`), max side-by-side tables (`1`–`3`), default splits template saver, CSV export, and JSON backup/restore.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Alt + S` | Jump straight to the **Monthly Salary** cell |
| `Alt + E` | Jump straight to the first **Expense Quick-Add** row |
| `/` | Search across all expense tables |
| `1` / `2` / `3` | Switch between **Salary**, **Analytics**, and **Settings** |

---

## Development & End-to-End Testing

```bash
# Install dependencies
npm install

# Run in development mode (hot-reload)
npm run dev

# Run unit tests + full Electron End-to-End (E2E) test suite
npm run test:all

# Run only the full Electron E2E test suite
npm run test:e2e

# Package desktop binaries for Linux (AppImage + tar.gz) and Windows (Setup.exe + zip)
npm run package:all
```

---

## License

MIT © Ahmad
