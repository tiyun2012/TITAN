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


## Viewport extracted into a module
- `module.engine` owns the World + update loop.
- `module.viewport3d` builds draw commands (grid + entities) and supports `viewport.getFrame` + `viewport.pick`.
- UI panels call modules only via `api.call(moduleId, op, payload)`.


## UI
- Main Window (top bar + scene viewport + status bar)
- Scene viewport is the default and only panel (sidebar hidden automatically)


## Note
Root `index.html` is now the app shell (Main Window + Scene Viewport). Use Web Preview (Vite) in Google Studio Cloud.


## Scene Viewport (WebGL)
- The scene viewport is now rendered by `module.viewport3d` (WebGL2) and the UI only hosts the canvas.
- Drag to orbit, mouse wheel to zoom.


## WebGL viewport note
Fixed `Mat4Utils.lookAt` to be column-major (WebGL/OpenGL). Without this, the WebGL viewport may render a blank screen.


## Viewport module structure (long-term)
- `apps/manager/src/modules/viewport3d/` contains the viewport module split into renderer/instance/shaders/types.
- `apps/manager/src/modules/viewport3dModule.ts` is a deprecated re-export for compatibility.


## Viewport navigation
- Editor (Maya): Alt+LMB orbit, Alt+MMB pan, Alt+RMB dolly, Wheel zoom
- Game: RMB look (placeholder), Wheel zoom

## Math safety
Viewport uses `Mat4Utils.multiplyStd()` to avoid legacy multiply order confusion.
