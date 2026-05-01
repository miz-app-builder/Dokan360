# Dokan360 — Bengali POS System

## Overview

Dokan360 is a full-featured Bengali-language Point of Sale (POS) web application. The backend is a Node.js/Express REST API connected to Supabase. The frontend is React + Vite with a complete glass morphism UI: gradient background, frosted-glass cards, left sidebar on desktop, and bottom tab bar on mobile.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (client/)
- **Framework**: React 19 with Vite (port 5000)
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios, base URL `/api`, proxied to backend
- **UI Design**: Light glass morphism — gradient BG, `rgba(255,255,255,0.72)` cards + `blur(20px)`, accent `#6366f1`/`#8b5cf6`
- **Layout**: `client/src/components/Navbar.jsx` — 240px collapsible sidebar (desktop) + bottom tab bar (mobile, <768px)
- **Theme**: `client/src/theme.js` — shared design tokens, glass() helper, button styles, table styles
- **Global CSS**: `client/src/index.css` — `.app-layout`, `.sidebar`, `.bottom-nav`, `.page-content`, `.glass-card`, responsive breakpoints

### Backend (server.js)
- **Framework**: Express 5 (Node.js), ES Modules
- **Port**: 3000
- **CORS**: Enabled globally
- **Database Client**: Supabase JS client

### Data Storage
- **Database**: Supabase (hosted Postgres)
- **Secrets**: `SUPABASE_URL`, `SUPABASE_ANON_KEY` environment variables

## Pages & Components

| File | Description |
|---|---|
| `client/src/App.jsx` | Layout wrapper + POS (sales) page |
| `client/src/pages/Login.jsx` | Login screen (glass card on gradient) |
| `client/src/pages/Products.jsx` | Product CRUD with barcode & image |
| `client/src/pages/Categories.jsx` | Category management |
| `client/src/pages/Customers.jsx` | Customer list + ledger navigation |
| `client/src/pages/CustomerLedger.jsx` | Per-customer transaction history + payment |
| `client/src/pages/Inventory.jsx` | Stock IN, adjustment, history, low-stock alert |
| `client/src/pages/Reports.jsx` | Daily, profit, product, user, outlet, due reports + PDF/Excel export |
| `client/src/pages/AdminPanel.jsx` | User management, profiles, role permissions |
| `client/src/pages/Settings.jsx` | Shop info, outlets, billing/tax, receipt, display prefs |
| `client/src/components/Navbar.jsx` | Sidebar + mobile bottom nav |
| `client/src/theme.js` | Design tokens, glass() helper, shared styles |

## Key API Endpoints

- `GET /products` — All products
- `POST /products`, `PUT /products/:id`, `DELETE /products/:id`
- `GET /categories`, `POST /categories`, etc.
- `GET /customers`, `POST /customers`, etc.
- `POST /sales` — Create a sale
- `GET /reports/daily`, `/reports/profit`, `/reports/products`, etc.
- `GET /stock/logs`, `POST /stock/in`, `POST /stock/adjust`
- `GET /users`, `POST /users`, `PUT /users/:id`, `DELETE /users/:id`
- `GET /permissions`, `PUT /permissions/:role/:module`
- `GET /settings`, `PUT /settings`
- `GET /outlets`, `POST /outlets`, `PUT /outlets/:id`

## Communication Flow
```
Browser → Vite Dev Server (port 5000)
         → proxies /api/* → Express Backend (port 3000)
                          → Supabase (cloud Postgres)
```

## NPM Packages (Backend)
| Package | Purpose |
|---|---|
| `express` v5 | HTTP server |
| `cors` | CORS handling |
| `@supabase/supabase-js` | Database client |

## NPM Packages (Frontend)
| Package | Purpose |
|---|---|
| `react` / `react-dom` | UI framework |
| `react-router-dom` | Routing |
| `axios` | HTTP client |
| `jspdf` + `jspdf-autotable` | PDF export in Reports |
| `xlsx` | Excel export in Reports |
| `vite` + `@vitejs/plugin-react` | Build & dev server |

## Language / i18n System

A full language-switching system is implemented with no third-party library.

### How it works
1. **`client/src/i18n.js`** — Translation dictionary with `bn` (Bengali) and `en` (English) keys for every UI string across all pages. Exports `createT(lang)` which returns a `t(key)` function.
2. **`client/src/context/SettingsContext.jsx`** — `useT()` hook exported alongside `useSettings()`. Reads `settings.language` ("bn" or "en", default "bn") and returns `createT(lang)`.
3. **All components** use `import { useT } from "../context/SettingsContext"` and call `const t = useT()` at the top. All user-visible strings are accessed via `t("key")`.

### Pattern used
```js
const t = useT();
// In JSX:
<button>{t("save")}</button>
<input placeholder={t("products_search_ph")} />
```

### Changing language
Go to Settings → Display tab → Language dropdown → select বাংলা or English. The change is stored in Supabase and takes effect immediately across the entire app.
