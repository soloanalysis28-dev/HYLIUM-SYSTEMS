# Hylium Systems

A clean, dark operations dashboard for warehouse and enterprise resource workflows.

## Current GUI slice

- Landscape-first dark dashboard layout
- Collapsible left navigation sidebar
- 8 primary functions: Home, Operations, Inventory, Dispatch, Stock Control, Insights, Reports, Settings
- Expandable Operations submenu
- Far-right global search with `⌘ K` / `Ctrl K` focus shortcut
- Receive, Dispatch, Stocks, and Reports KPI cards
- Operational activity line chart
- Order distribution donut chart
- Recent activity row
- Responsive mobile navigation and card layout
- Static route manifest at `/manus-routes.json`

## Run locally

```bash
npm start
```

Then open <http://localhost:4173>.

The current dashboard uses static demo data so the GUI can be reviewed before backend workflows and live data are connected.
