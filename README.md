# MotorOS Dealer Operating System

MotorOS is a desktop-first dealer operating console for South African used-car groups. This repository contains the first sellable pilot surface: a production-oriented application shell and acquisition → inventory → recon → CRM → deals → finance workflow using fictional demo records.

## Current slice

- Executive command centre with branch selector, global search, trends, stock-age risk, branch performance, exceptions, and activity.
- Acquisition pipeline with seller leads, stage cards, response actions, and persisted quick-create flow.
- Inventory table with branch/search filters, stock-file drawer, operational status, cost, price, and margin.
- Reconditioning job cards, supplier performance, mandatory gates, and mark-complete action.
- Buyer CRM, deal desk, finance reconciliation, reports, settings, integrations, and governance exception views.
- Local browser repository seeded with fictional records. Creates/updates persist to `localStorage` under `motoros-demo-state-v1`.
- Domain calculation tests for landed cost, gross profit, margin, appraisal maximum offer, and stock age.

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5180`. Production preview runs at `http://127.0.0.1:4180`. Build and verify with:

```bash
npm run check
npm test
npm run build
```

## Architecture boundary

The current repository is intentionally a browser-persisted pilot because the supplied workspace was empty and no database credentials or API contract were available. The UI actions are real and durable in the local repository adapter, but PostgreSQL tenant isolation, server-side permissions, migrations, queues, authentication, and audit persistence are not yet implemented. The next production phase should replace `loadState`/`setState` with a typed API adapter, add Prisma migrations, and move all permission-sensitive transitions behind the API.

## Demo data and safety

All records are fictional. No secrets or external provider credentials are included. Integrations are labelled sandbox/disconnected/connected according to the mocked adapter status and do not claim external provider completion.
