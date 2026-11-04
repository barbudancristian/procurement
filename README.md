# Sourcing Hub

A procurement and strategic sourcing app for competitive sourcing, sole-source / incumbent negotiations and sourcing support.

**Status:** Phase 2, screen designs. The interface in `ui/` runs on sample data so the screens and workflows can be reviewed before the full build.

## Architecture (approved, Phase 1)

- Windows desktop app installed once in the VDI image (.NET 10 WPF shell with Microsoft Edge WebView2).
- The interface is the React + TypeScript app in `ui/`, shown inside WebView2.
- Data in SharePoint Lists and documents in a SharePoint library, in one site chosen by an administrator in the app's settings. No server.
- Sign-in with Microsoft Entra ID; MFA from your Conditional Access policies.
- Clients don't install the app. They open read-only client SharePoint sites as guests.

## Repository layout

| Path | What it is |
| --- | --- |
| `ui/` | React + TypeScript interface (Fluent UI v9, ECharts). Sample data lives in `ui/src/data/mock.ts`. |

## Run the screen designs locally

Requires Node.js 20 or later.

```bash
cd ui
npm install
npm run dev            # opens a local preview at http://localhost:5173
npm run build:preview  # builds a single self-contained HTML file in ui/dist-preview/
```

Use **Viewing as** in the top-right corner to switch between the five roles and see what each one can see and do.
