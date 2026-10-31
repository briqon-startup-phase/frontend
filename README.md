# BRIQON frontend

A responsive, English-language equipment workspace built with **Next.js App Router, React, and TypeScript**. The framework was selected by the requester after confirming that the supplied PRD has not yet specified one.

## Run locally

Requires Node.js 20.9 or newer; Node.js 22.18 or newer is needed for the dependency-free TypeScript tests.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000.

```sh
npm run typecheck
npm test
npm run build
npm start
```

## Included workflows

- Overview with outlet scope, condition summary, historical temperature chart, notification feed, equipment table, and weekly consumption.
- Equipment search, condition/type filters, sorting, CSV export, and individual equipment routes.
- Equipment detail with temperature history, freshness, configured ranges, connection information, and relay controls.
- Confirmation before sending a simulated relay command; pending, device-confirmed, and timeout outcomes. Pending submission never changes the reported relay state. Offline equipment cannot receive commands. A response confirms the reported relay output, not independent physical equipment operation.
- Energy history, outlet breakdown, equipment ranking, and report export.
- Notification history, filters, single and scoped bulk acknowledgement. Acknowledgement never resolves an equipment condition.
- Control activity and CSV export, including failed commands.
- Browser-local workspace name, Celsius/Fahrenheit display, simulation interval, and default notification history view.
- Search dialog (Ctrl/Cmd+K), collapsible mobile navigation, visible keyboard focus, native dialogs, reduced-motion support, and expandable chart data.

## Data and state

All equipment names, outlets, thresholds, readings, historical consumption and initial notification/command records in `src/lib/sample-data.ts` are **sample data**. The interface labels the source as a sample workspace and simulated data. It does not connect to real hardware or an MQTT broker.

The sample inventory contains exactly three assets: one each in Depok, Menteng, and Cipinang. These three demo locations are shared by every page and filter. The sample day is 31 October 2026 in Asia/Jakarta. Historical charts are fixed sample snapshots; the refresh interval updates current simulated temperatures and freshness. Energy totals are calculated from the sample equipment rows, not independent counters. Daily/weekly views are sample history and do not imply verified deployment results or savings. Readings from the offline asset remain stale. Pausing playback stops automatic updates; manual refresh remains available.

`WorkspaceProvider` owns shared frontend state. Browser storage saves preferences, acknowledgement state, command history, and reported relay output. Telemetry is not persisted as real measurements. A pending command interrupted by a reload is shown as failed/unconfirmed on reload. Clearing this site's browser storage restores the reference workspace. This is local convenience state, not an audit database or an access-control boundary.

## Integration next steps

The current PRD has not defined sensors, thresholds, role permissions, API contracts, hosting, historical retention, or MQTT topics. Displayed thresholds and control semantics are proposed frontend behavior for review.

When those contracts are agreed:

1. Replace the sample loading, refresh, acknowledge, and command methods in `src/components/workspace-provider.tsx` with calls to an authenticated platform API. Keep components using the same typed workspace data in `src/lib/types.ts`.
2. Stream telemetry from the platform to the browser using its chosen WebSocket/SSE transport. Keep MQTT broker credentials and device authorization on the server.
3. Use server timestamps and equipment-scoped command correlation IDs. A submitted command stays pending until a correlated device response or a timeout. Retain the distinction between device-reported output and independently verified physical behavior.
4. Store notifications, acknowledgement identities, command evidence, and preferences on the server. Enforce outlet access and control permission on the server before enabling real relay actions.
5. Replace the fixed sample date and history with API-selected ranges, actual measurement units and confirmed sensor models. Define staleness using the agreed device reporting contract.

## Design

Framed sheet, seed **785228692**, from the requested `design-taste-frontend` skill. No redraws. White `#FFFFFF` surfaces, green `#277E0C` data/actions, and yellow `#B9AA00` attention markers. IBM Plex Sans is installed locally through Fontsource; no external font request is required. Lucide provides the outline icon set. A custom B mark and equipment-relative temperature range indicators give the interface its product identity. No photography is used because this is an operational dashboard.

The chart renderer in `public/vendor/charts.js` is copied from the user-selected taste skill. It draws data-driven SVG charts with measured labels, reference lines, tooltips and responsive scales. The React wrapper is in `src/components/charts.tsx`.

## Scope

Frontend only. Real authentication, backend persistence, device firmware, MQTT connectivity and external notification delivery remain to be integrated. No pricing, billing, AI, or independently verified hardware operation is represented as implemented.

## Verification

- Production build and TypeScript checks passed.
- Five domain tests passed: pending commands, confirmed responses, timeouts/offline protection, stale-data precedence, and energy/unit arithmetic.
- Fifty-three browser checks passed, covering interactions, downloaded CSV data, preference restoration, and eight route variants at 1440, 768 and 390px. No browser runtime errors or horizontal page overflow were observed.
- The requested taste-skill production inspector reported **0 FAIL** at all three widths, with one warning for compact secondary metadata. Visual review and its remaining limitations are recorded in `../.taste-skill/critique.md`; browser evidence is in `../.taste-skill/qa/`.
