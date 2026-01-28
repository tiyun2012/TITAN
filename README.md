# TI Workspace (UI Framework + Manager)

This workspace contains:
- `ui-framework`: your **UI framework package** (standalone console included)
- `apps/manager`: the manager app that hosts the framework and talks to modules via **ModuleId**

## Run
```bash
npm install
npm run dev
```

## Key idea
- **Modules** communicate only by `ModuleId` (RPC over bus).
- The **UI framework** is its own package.
- UI framework has its own console (standalone), and its logs can be forwarded into the manager's main console.


## Windows/npm note
This repo avoids the `workspace:*` protocol (some npm setups error on it). It uses a `file:` dependency instead.
