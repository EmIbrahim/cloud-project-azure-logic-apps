# Receipt Automation (React + Vite)

Lightweight front-end scaffold for a receipt automation workflow. Includes mocked authentication, uploads, and CFO dashboard with charts. Built for quick backend handoff and Logic Apps integration.

## Requirements
- Node.js 18+
- npm

## Quick start
```bash
npm install
npm run dev
```
Vite defaults to `http://localhost:5173`.

## Mock credentials
- CFO: `cfo@acme.com` / `password123`
- Employee: `employee@acme.com` / `password123`

## App flows
- Login at `/login`. Role-based redirect: CFO → `/dashboard`, Employee → `/upload`.
- Upload page: drag/drop or file input (camera capture on mobile). Mock upload simulates latency and returns a confirmation. Receipt list is sourced from the mock API.
- Dashboard: mocked Recharts visuals for vendor spend, daily trend, pending approvals, and monthly spend vs salary.
- Header + sidebar show after login with username and logout.

## Project structure
- `src/pages` — Login, Upload, Dashboard
- `src/components` — Layout (Header, Sidebar), common (Spinner, ErrorBanner), `ProtectedRoute`
- `src/context` — Auth context with localStorage session + AppDataContext for receipts/dashboard
- `src/api` — Mocked modules (`auth`, `uploads`, `dashboard`) with artificial delay and REST-like endpoints in `mockServer`
- `src/data` — Mock users, receipts, dashboard data
- `src/utils/delay.js` — Helper to simulate network
- `src/components/dashboard/PowerBIPlaceholder.jsx` — placeholder for Phase 2/3 embedding

## Testing the flows
1. Run `npm run dev` and open the app.
2. Log in with either mock user.
3. Try drag/drop or select a file on Upload; observe confirmation and mock list.
4. As CFO, view `/dashboard` to see charts; Employee will be redirected from that route.
5. Use the header logout to clear localStorage and return to login.

## Mock REST endpoints (client-side)
- `GET /receipts` → `getReceipts` in `src/api/mockServer.js`
- `POST /upload` → `postUpload` in `src/api/mockServer.js` (simulates failure 6% of the time)
- `GET /dashboard-data` → `getDashboardData` in `src/api/mockServer.js`
- Logic App trigger mock → `triggerLogicApp` in `src/api/mockServer.js` returns processed JSON

Swap these with real Azure Functions/SQL calls by replacing the implementations in `mockServer` and keeping the same function signatures.

## PowerBI and Logic Apps notes
- PowerBI placeholder shows where to embed a report; replace iframe src with your embed URL and pass tokens from a secure backend.
- Comments in `PowerBIPlaceholder` describe how to connect to Azure SQL and refresh datasets via Logic Apps or Gateway.
- Logic App simulation occurs after upload; hook real Logic App HTTP trigger in `triggerLogicApp` and secure with SAS tokens/keys.

## Notes for backend integration
- Replace `src/api/*` with real HTTP calls; keep the delay helper for optimistic UI.
- Auth token storage can reuse the `AuthContext` localStorage key: `receipt-app-user`.
- File upload handler currently accepts the first file and returns a mock payload.
- Charts consume the normalized objects in `src/data/mockDashboard.js`; adjust shape or wire to real endpoints.

