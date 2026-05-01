# POS (Point of Sale) System

## Overview

This is a Point of Sale (POS) web application with a clear client-server separation. The backend is a Node.js/Express REST API that connects to Supabase as the database layer. The frontend is a React application built with Vite that communicates with the backend via Axios. The system manages products and supports barcode scanning/searching functionality typical of a retail POS system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (client/)
- **Framework**: React 19 with Vite as the build tool
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios, configured with a base URL of `/api`
- **Dev Server**: Runs on port 5000, proxies `/api` requests to the backend at `http://localhost:3000`
- **Structure**: Single-page app with components in `client/src/`

### Backend (server.js)
- **Framework**: Express 5 (Node.js), using ES Modules (`type: "module"`)
- **Port**: 3000 (inferred from Vite proxy config)
- **CORS**: Enabled globally via the `cors` package
- **Database Client**: Supabase JS client (`@supabase/supabase-js`)
- **API Design**: RESTful routes for resources like `/products`

### Data Storage
- **Database**: Supabase (hosted Postgres via Supabase's cloud service)
- **Access**: Server-side only using `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables
- **Known Tables**: `products` (with fields including `name` and `barcode`)

### Key API Endpoints
- `GET /` — Health check
- `GET /products` — Fetch all products
- `GET /products/search?q=` — Search products by name (case-insensitive) or exact barcode match
- `POST /products` — Add a new product (implementation partially shown)

### Communication Flow
```
Browser → Vite Dev Server (port 5000)
         → proxies /api/* → Express Backend (port 3000)
                          → Supabase (cloud Postgres)
```

## External Dependencies

### Supabase
- **Purpose**: Hosted PostgreSQL database with a REST-like JS client
- **Configuration**: Requires two environment variables:
  - `SUPABASE_URL` — your Supabase project URL
  - `SUPABASE_ANON_KEY` — your Supabase anonymous/public API key
- **Usage**: All database reads and writes go through the Supabase JS client on the backend

### NPM Packages (Backend)
| Package | Purpose |
|---|---|
| `express` v5 | HTTP server and routing |
| `cors` | Cross-origin request handling |
| `body-parser` | Request body parsing (also handled by `express.json()`) |
| `@supabase/supabase-js` | Supabase database client |

### NPM Packages (Frontend)
| Package | Purpose |
|---|---|
| `react` / `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP requests to backend |
| `vite` | Build tool and dev server |
| `@vitejs/plugin-react` | React HMR support in Vite |